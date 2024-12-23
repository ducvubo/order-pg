export {}
declare global {
  interface IRequest {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: { [key: string]: any }
    queryParams?: any
    useCredentials?: boolean
    headers?: any
    nextOption?: any
  }

  interface IBackendRes<T> {
    status: boolean
    error?: string | string[]
    message: string
    statusCode?: number | string
    data?: T
    code?: number
  }

  interface IModelPaginate<T> {
    meta: {
      current: number
      pageSize: number
      totalPage: number
      totalItem: number
    }
    result: T[]
  }
}
