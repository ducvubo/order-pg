// import { Client } from '@elastic/elasticsearch'

// const clientElasticsearch = new Client({
//   node: 'http://localhost:9200'
// })

// export default clientElasticsearch

import 'dotenv/config'
import { Client } from '@elastic/elasticsearch'
// import { Client } from '@opensearch-project/opensearch'

const handleEventConnection = async ({ connectionElasticsearch }: { connectionElasticsearch: any }) => {
  try {
    const response = await connectionElasticsearch.ping()
    if (response) {
      console.log('connection Elasticsearch - Connection status: connected')
    }
  } catch (error) {
    console.log('Error connecting to Elasticsearch:', error)
  }
}
export const initElasticsearch = () => {
  const instanceElasticsearch = new Client({
    node: process.env.ELASTICSEARCH_NODE,
    auth: {
      username: process.env.ELASTICSEARCH_USER_NAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  const client = { instanceConnect: instanceElasticsearch }
  handleEventConnection({ connectionElasticsearch: instanceElasticsearch })
  return client
}

const client = initElasticsearch()
export const getElasticsearch = () => client
