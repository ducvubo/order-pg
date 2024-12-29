import { ImageUrl } from 'src/utils/sample.schema'

export interface Employee {
  epl_restaurant_id: string
  epl_name: string
  epl_email: string
  epl_phone: string
  epl_gender: 'Khác' | 'Nam' | 'Nữ'
  epl_address?: string
  epl_avatar?: ImageUrl
  epl_status: 'enable' | 'disable'
}
