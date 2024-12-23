// import { getElasticsearch } from '../config/elasticsearch.config'
import { getOpenSearch } from 'src/config/open-search.config'
import { ILogApiError, ILogApiSuccess, ILogSystem } from './log.interface'
import { v4 as uuidv4 } from 'uuid'
// const elasticsearch = getElasticsearch().instanceConnect

const openSearch = getOpenSearch().instanceConnect

const INDEX_SYSTEM_LOG = 'system-log-order-pg'
const INDEX_LOG_API_SUCCESS = 'log-api-success-order-pg'
const INDEX_LOG_API_ERROR = 'log-api-error-order-pg'

export const saveLogSystem = (data: ILogSystem) => {
  try {
    openSearch.index({
      index: INDEX_SYSTEM_LOG,
      id: uuidv4(),
      body: { ...data, time: formatDate(data.time) }
    })
  } catch (error) {
    throw new Error(error.message)
  }
}

export const saveLogApiSuccess = (data: ILogApiSuccess) => {
  try {
    openSearch.index({
      index: INDEX_LOG_API_SUCCESS,
      id: uuidv4(),
      body: data
    })
  } catch (error) {
    throw new Error(error.message)
  }
}

export const saveLogApiError = (data: ILogApiError) => {
  try {
    openSearch.index({
      index: INDEX_LOG_API_ERROR,
      id: uuidv4(),
      body: data
    })
  } catch (error) {
    throw new Error(error.message)
  }
}

function formatDate(now: Date) {
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0') // Tháng trong JavaScript bắt đầu từ 0
  const year = now.getFullYear()

  return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`
}
