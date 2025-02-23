import { ConfigService } from '@nestjs/config'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { FoodComboItemsEntity } from './food-combo-items.entity'
import { Injectable } from '@nestjs/common'

@Injectable()
export class FoodComboItemsQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect
  constructor(private readonly configService: ConfigService) {}

  async findOne(fcbi_id: string, fcbi_res_id: string): Promise<FoodComboItemsEntity> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    fcbi_id: {
                      query: fcbi_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    fcbi_res_id: {
                      query: fcbi_res_id,
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

  async findByComboId(fcbi_combo_id: string, fcbi_res_id: string): Promise<FoodComboItemsEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }
      const result = await this.elasticSearch.search({
        index: FOOD_COMBO_ITEM_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    fcbi_combo_id: {
                      query: fcbi_combo_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    fcbi_res_id: {
                      query: fcbi_res_id,
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })

      return result.hits?.hits.map((item: any) => item._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'FindByComboId',
        class: 'FoodComboItemsQuery',
        function: 'FindByComboId',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
