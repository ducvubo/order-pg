import { ConfigService } from '@nestjs/config'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { FOOD_COMBO_RES_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { FoodComboResEntity } from './combo-food-res.entity'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { IAccount } from 'src/guard/interface/account.interface'

export class FoodComboResQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect
  constructor(private readonly configService: ConfigService) {}

  async findOne(fcb_id: string, fcb_res_id: string): Promise<FoodComboResEntity> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_COMBO_RES_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: FOOD_COMBO_RES_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    fcb_id: {
                      query: fcb_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    fcb_res_id: {
                      query: fcb_res_id,
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })

      return result.hits?.hits[0]?._source || null
    } catch (error) {
      saveLogSystem({
        action: 'FindOne',
        class: 'FoodComboItemsQuery',
        function: 'FindOne',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllPagination(
    {
      fcb_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { fcb_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<FoodComboResEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_COMBO_RES_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return {
          meta: {
            current: pageIndex,
            pageSize,
            totalPage: 0,
            totalItem: 0
          },
          result: []
        }
      }

      const from = (pageIndex - 1) * pageSize
      const query: any = {
        bool: {
          must: []
        }
      }

      if (fcb_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            fcb_name: {
              query: fcb_name,
              operator: 'and'
            }
          }
        })
      }

      query.bool.must.push(
        {
          match: {
            isDeleted: {
              query: isDeleted,
              operator: 'and'
            }
          }
        },
        {
          match: {
            fcb_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: FOOD_COMBO_RES_ELASTICSEARCH_INDEX,
        body: {
          query,
          from,
          size: pageSize,
          sort: [{ updatedAt: { order: 'desc' } }]
        }
      })
      const hits = result.hits?.hits || []
      let totalRecords = 0
      if (typeof result.hits?.total === 'object') {
        totalRecords = result.hits.total.value
      } else if (typeof result.hits?.total === 'number') {
        totalRecords = result.hits.total
      }
      const totalPages = Math.ceil(totalRecords / pageSize)
      const results = hits.map((hit) => hit._source)

      return {
        meta: {
          current: pageIndex,
          pageSize,
          totalPage: totalPages,
          totalItem: totalRecords
        },
        result: results
      }
    } catch (error) {
      saveLogSystem({
        action: 'findAllPagination',
        class: 'FoodComboResQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findComboFoodRestaurants(combo_food_res_id: string): Promise<FoodComboResEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_COMBO_RES_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      //fcb_status: enable
      //isDeleted: 0

      const result = await this.elasticSearch.search({
        index: FOOD_COMBO_RES_ELASTICSEARCH_INDEX,
        body: {
          from: 0,
          size: 10000,
          query: {
            bool: {
              must: [
                {
                  match: {
                    fcb_res_id: {
                      query: combo_food_res_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    fcb_status: {
                      query: 'enable',
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    isDeleted: {
                      query: 0,
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          },
          _source: [
            'fcb_id',
            'fcb_name',
            'fcb_price',
            'fcb_note',
            'fcb_image',
            'fcb_slug',
            'fcb_open_time',
            'fcb_close_time',
            'fcb_state',
            'fcb_sort'
          ]
        }
      })

      return result.hits?.hits.map((hit) => hit._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'findComboFoodRestaurants',
        class: 'FoodComboResQuery',
        function: 'findComboFoodRestaurants',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getFoodComboResBySlug(fcb_slug: string): Promise<FoodComboResEntity> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_COMBO_RES_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }

      //fcb_status: enable
      //isDeleted: 0
      const result = (await this.elasticSearch.search({
        index: FOOD_COMBO_RES_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    fcb_slug: {
                      query: fcb_slug,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    fcb_status: {
                      query: 'enable',
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    isDeleted: {
                      query: 0,
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })) as any

      return result.hits?.hits[0]?._source || null
    } catch (error) {
      saveLogSystem({
        action: 'getFoodComboResBySlug',
        class: 'FoodComboResQuery',
        function: 'getFoodComboResBySlug',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllPaginationListFoodCombo({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }): Promise<{
    meta: {
      pageIndex: number
      pageSize: number
      totalPage: number
      totalItem: number
    }
    result: FoodComboResEntity[]
  }> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_COMBO_RES_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return {
          meta: {
            pageIndex,
            pageSize,
            totalPage: 0,
            totalItem: 0
          },
          result: []
        }
      }

      const from = (pageIndex - 1) * pageSize
      //isDeleted: 0
      //fcb_status: enable
      const result = await this.elasticSearch.search({
        index: FOOD_COMBO_RES_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    isDeleted: {
                      query: 0,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    fcb_status: {
                      query: 'enable',
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          },
          from,
          size: pageSize,
          sort: [{ updatedAt: { order: 'desc' } }]
        }
      })
      const hits = result.hits?.hits || []
      let totalRecords = 0
      if (typeof result.hits?.total === 'object') {
        totalRecords = result.hits.total.value
      } else if (typeof result.hits?.total === 'number') {
        totalRecords = result.hits.total
      }
      const totalPages = Math.ceil(totalRecords / pageSize)
      const results = hits.map((hit) => hit._source)

      return {
        meta: {
          pageIndex,
          pageSize,
          totalPage: totalPages,
          totalItem: totalRecords
        },
        result: results
      }
    } catch (error) {
      saveLogSystem({
        action: 'findAllPaginationListFoodCombo',
        class: 'FoodComboResQuery',
        function: 'findAllPaginationListFoodCombo',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getFoodComboResByIds(fcb_ids: string[]): Promise<FoodComboResEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_COMBO_RES_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: FOOD_COMBO_RES_ELASTICSEARCH_INDEX,
        body: {
          size: 10000,
          from: 0,
          query: {
            bool: {
              must: [
                {
                  terms: {
                    'fcb_id.keyword': fcb_ids
                  }
                },
                {
                  match: {
                    isDeleted: {
                      query: 0,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    fcb_status: {
                      query: 'enable',
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })

      return result.hits?.hits.map((hit) => hit._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'getFoodComboResByIds',
        class: 'FoodComboResQuery',
        function: 'getFoodComboResByIds',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
