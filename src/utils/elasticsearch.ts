import { getElasticsearch } from '../config/elasticsearch.config'

const elasticsearch = getElasticsearch().instanceConnect

export const addDocToElasticsearch = async <T>(index: string, id: string, data: T) => {
  try {
    await elasticsearch.index({
      index: index,
      id: id,
      body: data
    })
  } catch (error) {
    throw new Error(error.message)
  }
}

export const updateDocByElasticsearch = async <T>(index: string, id: string, data: T) => {
  try {
    await elasticsearch.update({
      index: index,
      id: id,
      body: {
        doc: data,
        upsert: data
      },
      refresh: 'true'
    })
  } catch (error) {
    throw new Error(error.message)
  }
}

export const deleteDocByElasticsearch = async (index: string, id: string) => {
  try {
    await elasticsearch.delete({
      index: index,
      id: id
    })
  } catch (error) {
    throw new Error(error.message)
  }
}

export const deleteAllDocByElasticsearch = async (index: string) => {
  try {
    await elasticsearch.indices.delete({ index: index })
  } catch (error) {
    throw new Error(error.message)
  }
}

export const indexElasticsearchExists = async (index: string): Promise<boolean> => {
  try {
    const exists = await elasticsearch.indices.exists({ index: index })
    return exists
  } catch (error) {
    throw new Error(error.message)
  }
}
