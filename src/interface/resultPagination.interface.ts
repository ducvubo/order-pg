export interface ResultPagination<T> {
  meta: {
    current: number
    pageSize: number
    totalPage: number
    totalItem: number
  }
  result?: T
}
