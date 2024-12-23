export interface ILogSystem {
  error?: any
  function: string
  action: string
  time: Date
  message: string
  class: string
  type: 'infor' | 'success' | 'error' | 'warning'
}

export interface ILogApiSuccess {
  clientIp: string
  userAgent: string
  duration: number
  path: string
  method: string
  statusCode: number
  message: string
  id_user_guest: string
  time: Date
  params: string
  bodyRequest: string
  bodyResponse: string
}

export interface ILogApiError {
  clientIp: string
  userAgent: string
  duration: number
  path: string
  method: string
  statusCode: number
  id_user_guest: string
  time: Date
  params: string
  bodyRequest: string
  bodyResponse: string
  message: string
}
