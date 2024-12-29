// import { getOpenSearch } from 'src/config/open-search.config'

// const openSearch = getOpenSearch().instanceConnect

// export const addDocToElasticsearch = async <T>(index: string, id: string, data: T) => {
//   try {
//     await openSearch.index({
//       index: index,
//       id: id,
//       body: data
//     })
//   } catch (error) {
//     throw new Error(error.message)
//   }
// }

// export const updateDocByElasticsearch = async <T>(index: string, id: string, data: T) => {
//   try {
//     await openSearch.update({
//       index: index,
//       id: id,
//       body: {
//         doc: data,
//         upsert: data
//       }
//     })
//   } catch (error) {
//     throw new Error(error.message)
//   }
// }

// export const deleteDocByElasticsearch = async (index: string, id: string) => {
//   try {
//     await openSearch.delete({
//       index: index,
//       id: id
//     })
//   } catch (error) {
//     throw new Error(error.message)
//   }
// }

// export const deleteAllDocByElasticsearch = async (index: string) => {
//   try {
//     await openSearch.indices.delete({ index: index })
//   } catch (error) {
//     throw new Error(error.message)
//   }
// }

// export const indexElasticsearchExists = async (index: string): Promise<boolean> => {
//   try {
//     const { body } = await openSearch.indices.exists({ index: index })
//     return body
//   } catch (error) {
//     throw new Error(error.message)
//   }
// }
