import { ConfigService } from '@nestjs/config'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { FOOD_OPTIONS_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { FoodOptionsEntity } from './food-options.entity'

export class FoodOptionsQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect
  constructor(private readonly configService: ConfigService) {}

  async findOptionByIdFood(fopt_food_id: string, fopt_res_id: string): Promise<FoodOptionsEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(FOOD_OPTIONS_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }
      const result = await this.elasticSearch.search({
        index: FOOD_OPTIONS_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    fopt_food_id: {
                      query: fopt_food_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    fopt_res_id: {
                      query: fopt_res_id,
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
