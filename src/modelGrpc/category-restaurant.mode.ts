import { ImageUrl, ISampleSchema } from 'src/utils/sample.schema'

export interface ICategoryRestaurantModel extends ISampleSchema {
  _id: string
  cat_res_id: string
  cat_res_name: string
  cat_res_slug: string
  cat_res_icon: ImageUrl
  cat_res_short_description: string
  cat_res_status: 'enable' | 'disable'
}
