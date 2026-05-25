import type { AxiosInstance } from 'axios'
import axios from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface LogItem {
  id: string
  level: number
  message: string
  timestamp: number
  data: Record<string, unknown>
  user: Record<string, unknown>
  breadcrumbs: Array<{
    message: string
    category?: string
    timestamp: number
    data?: Record<string, unknown>
  }>
  tags: Record<string, unknown>
  context: Record<string, unknown>
  sdk: string
  sdkVersion: string
  createdAt: number
}

export interface LogQueryParams {
  level?: number
  keyword?: string
  page?: number
  pageSize?: number
  startTs?: number
  endTs?: number
}

export interface LogListResponse {
  total: number
  page: number
  pageSize: number
  items: LogItem[]
}

export interface LogStatsResponse {
  total: number
  last24Hours: number
  byLevel: Array<{ level: number; name: string; count: number }>
}

export async function fetchLogs(params: LogQueryParams): Promise<LogListResponse> {
  const res = await api.get('/logs', { params })
  return res.data.data
}

export async function fetchLogStats(): Promise<LogStatsResponse> {
  const res = await api.get('/logs/stats')
  return res.data.data
}

export async function createLogs(batch: {
  sdk: string
  sdkVersion: string
  timestamp: number
  batchSize: number
  events: Array<{
    id: string
    level: number
    message: string
    timestamp: number
    data?: Record<string, unknown>
    user?: Record<string, unknown>
    breadcrumbs?: Array<{
      message: string
      category?: string
      timestamp: number
      data?: Record<string, unknown>
    }>
    tags?: Record<string, unknown>
    context?: Record<string, unknown>
  }>
}): Promise<void> {
  await api.post('/logs', batch)
}

export async function clearLogs(): Promise<{ deletedCount: number }> {
  const res = await api.delete('/logs/clear')
  return res.data.data
}

export default api