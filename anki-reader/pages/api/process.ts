import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from "formidable"
import extract from 'extract-zip'
import path from 'path'
import { nanoid } from 'nanoid'
import sqlite3 from 'sqlite3'
import fs from 'fs'
import https from 'https'
import os from 'os'
import { Readable } from 'stream'

// Disable body parsing so we can read the file data.
export const config = {
    api: {
        bodyParser: false,
    },
};

const tryParseBody = (body: any) => {
    try {
        return JSON.parse(body)
    } catch {
        return null
    }
}

async function buffer(readable: Readable) {
    const chunks = [];
    for await (const chunk of readable) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const uploadFileDir = path.resolve(os.tmpdir(), nanoid() + '.file');

        const buff = await buffer(req)
        const jsonbody = tryParseBody(buff.toString('utf-8'))

        if(jsonbody && jsonbody.url) {
            // Download file in URL to directory
            console.log(`Downloading ${jsonbody.url} to ${uploadFileDir}`)
            
            await new Promise((resolve: (val: any) => void, reject) => {
                https.get(jsonbody.url, (res) => {
                    const path = uploadFileDir;
                    const writeStream = fs.createWriteStream(path);
                  
                    res.pipe(writeStream);
                  
                    writeStream.on("finish", () => {
                      writeStream.close();
                      console.log("Download Completed");
                      resolve(true)
                    });
                });
            })
        } else {
            // Read file from form-data
            console.log(`Reading file from form-data to ${uploadFileDir}`)
            const form = formidable({ multiples: true });
    
            // Read files from post request.
            const files = await new Promise((resolve: (files: formidable.Files) => void, reject) => {
                form.parse(req, (err, fields, files) => {
                    if (err) {
                        reject(err)
                    }
                    resolve(files)
                });
            })

            const uploadedFile = files.file as formidable.File;

            // Copy file to upload file dir
            console.log(`Copying from ${uploadedFile.filepath} to ${uploadFileDir}`)
            fs.copyFileSync(uploadedFile.filepath, uploadFileDir)
        }
        

        // Unzip .apkg file to temporary upload dir
        const targetDir = path.resolve(os.tmpdir(), nanoid()) 
        console.log(`Extracting zip ${uploadFileDir} to temp dir ${targetDir}`)
        await extract(uploadFileDir, { dir: targetDir });

        // Read in as SQlite database
        const sqlitefile = path.join(targetDir, 'collection.anki2')
        const db = new sqlite3.Database(sqlitefile);

        // Read the data from the tables.
        const notedata = await new Promise((resolve: (rows: any[]) => void, reject) => {
            db.all("SELECT * FROM notes", (err, rows) => {
                if(err) reject(err)
                resolve(rows)
            });
        })

        // Parse the data
        const rowfields = notedata.map(row => row.flds.split("\x1f"))
        
        const original = rowfields.map(field => field[0])
        const translation = rowfields.map(field => field[1])

        const data = {
            original,
            translation
        }

        console.log("Success")
        return res.status(200).json(data)
    } catch (err: any) {
        console.log(err)
        return res.status(500).json("Error processing file")
    }
}