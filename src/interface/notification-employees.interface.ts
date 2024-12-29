export interface INotificationEmployee {
  noti_id?: string
  noti_epl_id?: string
  noti_res_id?: string
  noti_epl_title?: string
  noti_epl_content?: string
  noti_epl_status?: 0 | 1
  noti_epl_type?: number
  noti_epl_metadata?: string
  noti_epl_send_email?: 0 | 1
  noti_epl_send_sms?: 0 | 1
}
