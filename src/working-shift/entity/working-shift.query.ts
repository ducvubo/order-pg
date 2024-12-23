import { ConfigService } from '@nestjs/config'
import { getOpenSearch } from 'src/config/open-search.config'
import { WorkingShiftEntity } from './working-shift.entity'
import { WORKING_SHIFT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { indexOpenSearchExists } from 'src/utils/open-search'

export class WorkingShiftQuery {
  private readonly openSearch = getOpenSearch().instanceConnect
  constructor(private readonly configService: ConfigService) {}

  async findOneByName(wks_name: string, account: IAccount): Promise<WorkingShiftEntity> {
    try {
      const indexExist = await indexOpenSearchExists(WORKING_SHIFT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }

      const { body } = await this.openSearch.search({
        index: WORKING_SHIFT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    wks_name: {
                      query: wks_name.toLowerCase(),
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    wks_res_id: {
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

      return body.hits.hits[0]?._source
    } catch (error) {
      saveLogSystem({
        action: 'findOneByName',
        class: 'WorkingShiftQuery',
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
      wks_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { wks_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<WorkingShiftEntity[]>> {
    try {
      const indexExist = await indexOpenSearchExists(WORKING_SHIFT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }

      const from = (pageIndex - 1) * pageSize
      const query: any = {
        bool: {
          must: []
        }
      }

      if (wks_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            wks_name: {
              query: wks_name,
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
            wks_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const { body } = await this.openSearch.search({
        index: WORKING_SHIFT_ELASTICSEARCH_INDEX,
        body: {
          query,
          from,
          size: pageSize,
          sort: [{ createdAt: { order: 'desc' } }]
        }
      })
      const totalRecords = body.hits.total.value
      const totalPages = Math.ceil(totalRecords / pageSize)
      const results = body.hits.hits.map((hit) => hit._source)

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
        class: 'WorkingShiftQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOne(id: string, account: IAccount): Promise<WorkingShiftEntity> {
    try {
      const indexExist = await indexOpenSearchExists(WORKING_SHIFT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const { body } = await this.openSearch.search({
        index: WORKING_SHIFT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    wks_id: {
                      query: id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    wks_res_id: {
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

      return body.hits.hits[0]?._source
    } catch (error) {
      saveLogSystem({
        action: 'findOne',
        class: 'WorkingShiftQuery',
        function: 'findOne',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
