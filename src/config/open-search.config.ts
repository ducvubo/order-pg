// import { Client } from '@elastic/OpenSearch'

// const clientOpenSearch = new Client({
//   node: 'http://localhost:9200'
// })

// export default clientOpenSearch

import 'dotenv/config'
import { Client } from '@opensearch-project/opensearch'

const handleEventConnection = async ({ connectionOpenSearch }: { connectionOpenSearch: any }) => {
  try {
    const response = await connectionOpenSearch.ping()
    if (response) {
      console.log('connection OpenSearch - Connection status: connected')
    }
  } catch (error) {
    console.log('Error connecting to OpenSearch:', error)
  }
}
export const initOpenSearch = () => {
  const instanceOpenSearch = new Client({
    // node: process.env.OpenSearch_NODE
    node: process.env.OPENSEARCH_NODE
  })

  const client = { instanceConnect: instanceOpenSearch }
  handleEventConnection({ connectionOpenSearch: instanceOpenSearch })
  return client
}

const client = initOpenSearch()
export const getOpenSearch = () => client
