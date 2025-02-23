import { ConfigService } from '@nestjs/config'
import { FOOD_RESTAURANT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { FoodRestaurantEntity } from './food-restaurant.entity'
import { Injectable } from '@nestjs/common'

@Injectable()
export class FoodRestaurantQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect
  constructor(private readonly configService: ConfigService) {}

  async findOneByName(food_name: string, account: IAccount): Promise<FoodRestaurantEntity> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_RESTAURANT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }

      const result = await this.elasticSearch.search({
        index: FOOD_RESTAURANT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    food_name: {
                      query: food_name.toLowerCase(),
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    food_res_id: {
                      query: account.account_restaurant_id,
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
        action: 'findOneByName',
        class: 'FoodRestaurantQuery',
        function: 'findOneByName',
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
      food_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { food_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<FoodRestaurantEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_RESTAURANT_ELASTICSEARCH_INDEX)

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

      if (food_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            food_name: {
              query: food_name,
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
            food_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: FOOD_RESTAURANT_ELASTICSEARCH_INDEX,
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
        class: 'FoodRestaurantQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findFoodName(account: IAccount): Promise<FoodRestaurantEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_RESTAURANT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }

      const query: any = {
        bool: {
          must: []
        }
      }

      query.bool.must.push(
        {
          match: {
            food_res_id: {
              query: account.account_restaurant_id,
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
      )

      const result = await this.elasticSearch.search({
        index: FOOD_RESTAURANT_ELASTICSEARCH_INDEX,
        body: {
          query,
          sort: [{ updatedAt: { order: 'desc' } }],
          _source: ['food_id', 'food_name']
        }
      })
      const hits = result.hits?.hits || []
      const results = hits.map((hit) => hit._source)

      return results
    } catch (error) {
      saveLogSystem({
        action: 'findAllPagination',
        class: 'FoodRestaurantQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOne(id: string, account: IAccount): Promise<FoodRestaurantEntity> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_RESTAURANT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: FOOD_RESTAURANT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    food_id: {
                      query: id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    food_res_id: {
                      query: account.account_restaurant_id,
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
        action: 'findOne',
        class: 'FoodRestaurantQuery',
        function: 'findOne',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findFoodRestaurants(food_res_id: string): Promise<FoodRestaurantEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_RESTAURANT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }

      const result = await this.elasticSearch.search({
        index: FOOD_RESTAURANT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            match: {
              food_res_id
            }
          }
        }
      })

      return result.hits?.hits.map((hit) => hit._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'findFoodRestaurants',
        class: 'FoodRestaurantQuery',
        function: 'findFoodRestaurants',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
