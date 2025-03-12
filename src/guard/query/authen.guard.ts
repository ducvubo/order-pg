// import { getElasticsearch } from "src/config/elasticsearch.config";
// import {
//   ACCOUNT_ELASTICSEARCH_INDEX,
//   EMPLOYEE_ELASTICSEARCH_INDEX,
//   REFRESH_TOKEN_ACCOUNT_ELASTICSEARCH_INDEX,
//   RESTAURANT_ELASTICSEARCH_INDEX,
// } from "src/constants/index.elasticsearch";
// import { saveLogSystem } from "src/log/sendLog.els";
// import { indexElasticsearchExists } from "src/utils/elasticsearch";
// import { UnauthorizedError } from "src/utils/errorResponse";
// import { JwtService } from '@nestjs/jwt'
// import { Global } from "@nestjs/common";

// export class AuthenGuardQuery {
//   private readonly elasticSearch = getElasticsearch().instanceConnect

//   constructor(
//     private jwtService: JwtService,
//   ) { }

//   async findRefreshToken({ rf_refresh_token }: { rf_refresh_token: string }): Promise<{
//     rf_public_key_refresh_token: string, rf_public_key_access_token: string
//   }> {
//     try {
//       const indexExist = await indexElasticsearchExists(REFRESH_TOKEN_ACCOUNT_ELASTICSEARCH_INDEX)

//       if (!indexExist) {
//         throw new UnauthorizedError('Token không hợp lệ')
//       }

//       const result = await this.elasticSearch.search({
//         index: REFRESH_TOKEN_ACCOUNT_ELASTICSEARCH_INDEX,
//         body: {
//           query: {
//             match: {
//               rf_refresh_token
//             }
//           }
//         }
//       }) as any

//       if (!result.hits?.hits[0]?._source) {
//         return null
//       }
//       return result.hits?.hits[0]?._source
//     } catch (error) {
//       saveLogSystem({
//         action: 'findRefreshToken',
//         class: 'AuthenGuardQuery',
//         function: 'findRefreshToken',
//         message: error.message,
//         time: new Date(),
//         type: 'error',
//         error: error
//       })
//       throw new UnauthorizedError('Token không hợp lệ')
//     }
//   }

//   verifyToken(
//     token: string,
//     publicKey: string
//   ): {
//     _id: string
//   } {
//     try {
//       const decoded = this.jwtService.verify(token, {
//         secret: publicKey
//       })
//       return decoded
//     } catch (error) {
//       saveLogSystem({
//         type: 'error',
//         message: error.message,
//         action: 'verifyToken',
//         function: 'verifyToken',
//         time: new Date(),
//         class: 'AuthenGuardQuery',
//       })
//       throw new UnauthorizedError('Token không hợp lệ')
//     }
//   }

//   async findAccoutById({ _id }: { _id: string }): Promise<any> {
//     try {
//       const indexExist = await indexElasticsearchExists(ACCOUNT_ELASTICSEARCH_INDEX)

//       if (!indexExist) {
//         throw new UnauthorizedError('Token không hợp lệ')
//       }

//       const result = await this.elasticSearch.search({
//         index: ACCOUNT_ELASTICSEARCH_INDEX,
//         body: {
//           query: {
//             match: {
//               _id
//             }
//           }
//         }
//       }) as any

//       if (!result.hits?.hits[0]?._source) {
//         throw new UnauthorizedError('Token không hợp lệ')
//       }

//       return result.hits?.hits[0]?._source
//     } catch (error) {
//       saveLogSystem({
//         action: 'findAccoutById',
//         class: 'AuthenGuardQuery',
//         function: 'findAccoutById',
//         message: error.message,
//         time: new Date(),
//         type: 'error',
//         error: error
//       })
//       throw new UnauthorizedError('Token không hợp lệ')
//     }
//   }

//   async findRestaurantByIdOfToken({ _id }: { _id: string }): Promise<any> {
//     try {
//       const indexExist = await indexElasticsearchExists(RESTAURANT_ELASTICSEARCH_INDEX)

//       if (!indexExist) {
//         throw new UnauthorizedError('Token không hợp lệ')
//       }
//       const result = await this.elasticSearch.search({
//         index: RESTAURANT_ELASTICSEARCH_INDEX,
//         body: {
//           query: {
//             bool: {
//               must: [
//                 {
//                   match: {
//                     _id
//                   }
//                 },
//                 {
//                   match: {
//                     isDeleted: false
//                   }
//                 },
//                 {
//                   match: {
//                     restaurant_status: 'inactive'
//                   }
//                 }
//               ]
//             }
//           }
//         }
//       }) as any

//       if (!result.hits?.hits[0]?._source) {
//         throw new UnauthorizedError('Token không hợp lệ')
//       }

//       return result.hits?.hits[0]?._source

//     } catch (error) {
//       saveLogSystem({
//         action: 'findRestaurantByIdOfToken',
//         class: 'AuthenGuardQuery',
//         function: 'findRestaurantByIdOfToken',
//         message: error.message,
//         time: new Date(),
//         type: 'error',
//         error: error
//       })
//       throw new UnauthorizedError('Token không hợp lệ')
//     }
//   }

//   async findEmployeeByIdOfToken({ _id }: { _id: string }): Promise<any> {
//     try {
//       const indexExist = await indexElasticsearchExists(EMPLOYEE_ELASTICSEARCH_INDEX)

//       if (!indexExist) {
//         throw new UnauthorizedError('Token không hợp lệ')
//       }

//       const result = await this.elasticSearch.search({
//         index: EMPLOYEE_ELASTICSEARCH_INDEX,
//         body: {
//           query: {
//             bool: {
//               must: [
//                 {
//                   match: {
//                     _id
//                   }
//                 },
//                 {
//                   match: {
//                     isDeleted: false
//                   }
//                 },
//                 {
//                   match: {
//                     epl_status: 'enable'
//                   }
//                 }
//               ]
//             }
//           }
//         }
//       }) as any

//       if (!result.hits?.hits[0]?._source) {
//         throw new UnauthorizedError('Token không hợp lệ')
//       }
//       return result.hits?.hits[0]?._source

//     } catch (error) {
//       saveLogSystem({
//         action: 'findEmployeeByIdOfToken',
//         class: 'AuthenGuardQuery',
//         function: 'findEmployeeByIdOfToken',
//         message: error.message,
//         time: new Date(),
//         type: 'error',
//         error: error
//       })
//       throw new UnauthorizedError('Token không hợp lệ')
//     }
//   }
// }

import { getElasticsearch } from "src/config/elasticsearch.config";
import { ACCOUNT_ELASTICSEARCH_INDEX, EMPLOYEE_ELASTICSEARCH_INDEX, REFRESH_TOKEN_ACCOUNT_ELASTICSEARCH_INDEX, RESTAURANT_ELASTICSEARCH_INDEX } from "src/constants/index.elasticsearch";
import { saveLogSystem } from "src/log/sendLog.els";
import { indexElasticsearchExists } from "src/utils/elasticsearch";
import { UnauthorizedError } from "src/utils/errorResponse";
import * as jwt from 'jsonwebtoken';


const elasticSearch = getElasticsearch().instanceConnect

export const findRefreshToken = async ({ rf_refresh_token }: { rf_refresh_token: string }): Promise<{
  rf_public_key_refresh_token: string, rf_public_key_access_token: string
}> => {
  try {
    const indexExist = await indexElasticsearchExists(REFRESH_TOKEN_ACCOUNT_ELASTICSEARCH_INDEX)

    if (!indexExist) {
      throw new UnauthorizedError('Token không hợp lệ')
    }

    const result = await elasticSearch.search({
      index: REFRESH_TOKEN_ACCOUNT_ELASTICSEARCH_INDEX,
      body: {
        query: {
          match: {
            rf_refresh_token
          }
        }
      }
    }) as any

    if (!result.hits?.hits[0]?._source) {
      return null
    }
    return result.hits?.hits[0]?._source
  } catch (error) {
    saveLogSystem({
      action: 'findRefreshToken',
      class: 'refresh-token-account.query',
      function: 'findRefreshToken',
      message: error.message,
      time: new Date(),
      type: 'error',
      error: error
    })
  }



}

export const verifyToken = (
  token: string,
  publicKey: string
): {
  _id: string
} => {
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { _id: string };
    return decoded
  } catch (error) {
    saveLogSystem({
      type: 'error',
      message: error.message,
      action: 'verifyToken',
      function: 'verifyToken',
      time: new Date(),
      class: 'refresh-token-account.query',
    })
    throw new UnauthorizedError('Token không hợp lệ')
  }
}

export const findAccoutById = async ({ _id }: { _id: string }): Promise<any> => {
  try {
    const indexExist = await indexElasticsearchExists(ACCOUNT_ELASTICSEARCH_INDEX)

    if (!indexExist) {
      throw new UnauthorizedError('Token không hợp lệ')
    }

    const result = await elasticSearch.search({
      index: ACCOUNT_ELASTICSEARCH_INDEX,
      body: {
        query: {
          match: {
            _id
          }
        }
      }
    }) as any

    if (!result.hits?.hits[0]?._source) {
      throw new UnauthorizedError('Token không hợp lệ')
    }

    return result.hits?.hits[0]?._source
  } catch (error) {
    saveLogSystem({
      action: 'findAccoutById',
      class: 'accounts.query',
      function: 'findAccoutById',
      message: error.message,
      time: new Date(),
      type: 'error',
      error: error
    })
    throw new UnauthorizedError('Token không hợp lệ')
  }


}


export const findRestaurantByIdOfToken = async ({ _id }: { _id: string }): Promise<any> => {
  try {
    const indexExist = await indexElasticsearchExists(RESTAURANT_ELASTICSEARCH_INDEX)

    if (!indexExist) {
      throw new UnauthorizedError('Token không hợp lệ')
    }
    const result = await elasticSearch.search({
      index: RESTAURANT_ELASTICSEARCH_INDEX,
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  _id
                }
              },
              {
                match: {
                  isDeleted: false
                }
              },
              {
                match: {
                  restaurant_status: 'inactive'
                }
              }
            ]
          }
        }
      }
    }) as any

    if (!result.hits?.hits[0]?._source) {
      throw new UnauthorizedError('Token không hợp lệ')
    }

    return result.hits?.hits[0]?._source

  } catch (error) {
    saveLogSystem({
      action: 'findRestaurantByIdOfToken',
      class: 'accounts.query',
      function: 'findRestaurantByIdOfToken',
      message: error.message,
      time: new Date(),
      type: 'error',
      error: error
    })
    throw new UnauthorizedError('Token không hợp lệ')
  }
}

export const findEmployeeByIdOfToken = async ({ _id }: { _id: string }): Promise<any> => {
  try {
    const indexExist = await indexElasticsearchExists(EMPLOYEE_ELASTICSEARCH_INDEX)

    if (!indexExist) {
      throw new UnauthorizedError('Token không hợp lệ')
    }
    // _id,
    //   isDeleted: false,
    //     epl_status: 'enable'

    const result = await elasticSearch.search({
      index: EMPLOYEE_ELASTICSEARCH_INDEX,
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  _id
                }
              },
              {
                match: {
                  isDeleted: false
                }
              },
              {
                match: {
                  epl_status: 'enable'
                }
              }
            ]
          }
        }
      }
    }) as any

    if (!result.hits?.hits[0]?._source) {
      throw new UnauthorizedError('Token không hợp lệ')
    }
    return result.hits?.hits[0]?._source

  } catch (error) {
    saveLogSystem({
      action: 'findEmployeeByIdOfToken',
      class: 'accounts.query',
      function: 'findEmployeeByIdOfToken',
      message: error.message,
      time: new Date(),
      type: 'error',
      error: error
    })
    throw new UnauthorizedError('Token không hợp lệ')
  }
}