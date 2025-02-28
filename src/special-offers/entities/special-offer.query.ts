import { ConfigService } from '@nestjs/config'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { Injectable } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { SPECIAL_OFFER_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { SpecialOfferEntity } from './special-offer.entity'

@Injectable()
export class SpecialOfferQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect
  constructor(private readonly configService: ConfigService) {}

  async findAllPagination(
    {
      spo_title,
      pageSize,
      pageIndex,
      isDeleted
    }: { spo_title: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<SpecialOfferEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(SPECIAL_OFFER_ELASTICSEARCH_INDEX)

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

      if (spo_title?.trim() !== '') {
        query.bool.must.push({
          match: {
            spo_title: {
              query: spo_title,
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
            spo_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: SPECIAL_OFFER_ELASTICSEARCH_INDEX,
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
        class: 'SpecialOfferQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOne(id: string, account: IAccount): Promise<SpecialOfferEntity> {
    try {
      const indexExist = await indexElasticsearchExists(SPECIAL_OFFER_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: SPECIAL_OFFER_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    spo_id: {
                      query: id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    spo_res_id: {
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
        class: 'SpecialOfferQuery',
        function: 'findOne',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findSpecialOffers(spo_res_id: string): Promise<SpecialOfferEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(SPECIAL_OFFER_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }
      //spo_res_id: spo_res_id
      // spo_status: 'enable'
      // isDeleted: 0
      const result = await this.elasticSearch.search({
        index: SPECIAL_OFFER_ELASTICSEARCH_INDEX,
        body: {
          from: 0,
          size: 10000,
          query: {
            bool: {
              must: [
                {
                  match: {
                    spo_res_id: {
                      query: spo_res_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    spo_status: {
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
          _source: ['spo_title', 'spo_description', 'spo_id']
        }
      })

      return result.hits?.hits.map((hit) => hit._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'findSpecialOffers',
        class: 'SpecialOfferQuery',
        function: 'findSpecialOffers',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
