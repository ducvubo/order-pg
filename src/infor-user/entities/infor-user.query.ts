import { getElasticsearch } from 'src/config/elasticsearch.config'
import { IAccount } from 'src/guard/interface/account.interface'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { Injectable } from '@nestjs/common'
import { InforUserEntity } from './infor-user.entity'
import { INFOR_USER_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'

@Injectable()
export class InforUserQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneById(ifuser_guest_id: string, ifuser_id: string): Promise<InforUserEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(INFOR_USER_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: INFOR_USER_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    ifuser_id: {
                      query: ifuser_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    ifuser_guest_id: {
                      query: ifuser_guest_id,
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
        action: 'findOneById',
        class: 'InforUserQuery',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }


  async findAll(ifuser_guest_id: string): Promise<InforUserEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(INFOR_USER_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: INFOR_USER_ELASTICSEARCH_INDEX,
        body: {
          _source: ['ifuser_name', 'ifuser_phone', "ifuser_email", "ifuser_address", "ifuser_province_id",
            "ifuser_district_id", "ifuser_ward_id", "ifuser_province_name", "ifuser_district_name", "ifuser_ward_name",
            "ifuser_longitude", "ifuser_latitude"],
          query: {
            bool: {
              must: [
                {
                  match: {
                    ifuser_guest_id: {
                      query: ifuser_guest_id,
                      operator: 'and'
                    }
                  }
                },
              ]
            }
          }
        }
      })

      return result.hits?.hits.map((hit) => hit._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'findAllCatName',
        class: 'InforUserQuery',
        function: 'findAllCatName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
