import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from "formidable"
import extract from 'extract-zip'
import path from 'path'
import { nanoid } from 'nanoid'
import sqlite3 from 'sqlite3'

// Disable body parsing so we can read the file data.
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
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

        // Unzip .apkg file to temporary upload dir
        const targetDir = path.resolve('/tmp/' + nanoid())
        await extract(uploadedFile.filepath, { dir: targetDir });

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

        return res.status(200).json(data)
    } catch (err: any) {
        console.log(err)
        return res.status(500).json("Error processing file")
    }
}