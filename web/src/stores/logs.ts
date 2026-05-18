import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchLogs, fetchLogStats, clearLogs as clearLogsApi, type LogItem, type LogQueryParams, type LogStatsResponse } from '@/api/logs'

export const useLogsStore = defineStore('logs', () => {
  const logs = ref<LogItem[]>([])
  const stats = ref<LogStatsResponse | null>(null)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const level = ref<number | undefined>(undefined)
  const keyword = ref('')
  const startTs = ref<number | undefined>(undefined)
  const endTs = ref<number | undefined>(undefined)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const levelOptions = [
    { value: undefined, label: '全部' },
    { value: 0, label: 'Verbose', color: '#9E9E9E' },
    { value: 1, label: 'Debug', color: '#2196F3' },
    { value: 2, label: 'Info', color: '#4CAF50' },
    { value: 3, label: 'Warn', color: '#FF9800' },
    { value: 4, label: 'Error', color: '#F44336' },
    { value: 5, label: 'Fatal', color: '#9C27B0' },
  ]

  const currentPageLogs = computed(() => logs.value)

  async function loadLogs() {
    loading.value = true
    error.value = null
    try {
      const params: LogQueryParams = {
        level: level.value,
        keyword: keyword.value,
        page: page.value,
        pageSize: pageSize.value,
        startTs: startTs.value,
        endTs: endTs.value,
      }
      const result = await fetchLogs(params)
      logs.value = result.items
      total.value = result.total
      pageSize.value = result.pageSize
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '加载日志失败'
    } finally {
      loading.value = false
    }
  }

  async function loadStats() {
    try {
      stats.value = await fetchLogStats()
    } catch (e: unknown) {
      console.error('加载统计失败:', e)
    }
  }

  function setPage(newPage: number) {
    page.value = newPage
    loadLogs()
  }

  function setLevel(newLevel: number | undefined) {
    level.value = newLevel
    page.value = 1
    loadLogs()
  }

  function setKeyword(newKeyword: string) {
    keyword.value = newKeyword
    page.value = 1
    loadLogs()
  }

  function setDateRange(start: number | undefined, end: number | undefined) {
    startTs.value = start
    endTs.value = end
    page.value = 1
    loadLogs()
  }

  function refresh() {
    loadLogs()
    loadStats()
  }

  async function clearLogs() {
    loading.value = true
    error.value = null
    try {
      await clearLogsApi()
      logs.value = []
      total.value = 0
      page.value = 1
      await loadStats()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '清空日志失败'
    } finally {
      loading.value = false
    }
  }

  return {
    logs,
    stats,
    total,
    page,
    pageSize,
    level,
    keyword,
    levelOptions,
    loading,
    error,
    currentPageLogs,
    loadLogs,
    loadStats,
    setPage,
    setLevel,
    setKeyword,
    setDateRange,
    refresh,
    clearLogs,
  }
})