import type { NextPage } from 'next'
import Head from 'next/head'
import Upload from 'rc-upload'
import { useState } from 'react'
import DataColumn from '../components/DataColumn'
import styles from '../styles/Home.module.css'

interface QueryStatus {
  error?: any
  data?: any
  loading: boolean
}

const Home: NextPage = () => {
  const [query, setQuery] = useState<QueryStatus>({ loading: false })
  const { loading, error, data } = query;

  const uploadProps = {
    action: '/api/process',
    accept: '.apkg',
    onStart: () => setQuery({ loading: true }),
    onSuccess: (data: any) => setQuery({ loading: false, data }),
    onError: (error: any) => setQuery({ loading: false, error })
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Ulangi Anki reader</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1> Anki .apkg reader for Ulangi </h1>
        <b> Instructions </b>
        <ol>
          <li> Upload your deck using the button below </li>
          <li> Click the original / translation text to copy to clipboard </li>
          <li> Paste into Google sheets in the respective columns </li> 
        </ol>

        <Upload {...uploadProps}>
          <button> Click here to upload your Anki deck </button>
        </Upload>

        {loading && <p> Loading... </p>}
        {error && <p>Error! {error} </p>}
        {data && <DataDisplay data={data} />}
      </main>
    </div>
  )
}

const DataDisplay = ({ data }: { data: any }) => (
  <div>
    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
      <div>
        <h1> Originals </h1>
        <DataColumn id='original' data={data.original} />
      </div>

      <div>
        <h1> Translations </h1>
        <DataColumn id='translation' data={data.translation} />
      </div>
    </div>
  </div>
)

export default Home
