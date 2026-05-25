<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLogsStore } from '@/stores/logs'
import type { LogItem } from '@/api/logs'
import {
  Search,
  Filter,
  Info,
  AlertTriangle,
  XCircle,
  Bug,
  Clock,
  Download,
  ChevronRight,
  X,
  Copy,
  Check,
  MessageSquare,
  RefreshCw,
  Trash2,
} from 'lucide-vue-next'
import { format } from 'date-fns'

const store = useLogsStore()

interface LevelStyle {
  icon: any
  color: string
  bgColor: string
  label: string
}

const defaultLevel: LevelStyle = { icon: MessageSquare, color: 'text-gray-600', bgColor: 'bg-gray-50', label: '详细' }

const levelConfig: Record<number, LevelStyle> = {
  0: { icon: MessageSquare, color: 'text-gray-600', bgColor: 'bg-gray-50', label: '详细' },
  1: { icon: Bug, color: 'text-blue-600', bgColor: 'bg-blue-50', label: '调试' },
  2: { icon: Info, color: 'text-green-600', bgColor: 'bg-green-50', label: '信息' },
  3: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-50', label: '警告' },
  4: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: '错误' },
  5: { icon: XCircle, color: 'text-purple-600', bgColor: 'bg-purple-50', label: '严重' },
}

const searchInput = ref('')
const selectedLog = ref<LogItem | null>(null)
const copiedField = ref<string | null>(null)
const showClearModal = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  store.loadLogs()
  store.loadStats()
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

function getLevel(lvl: number): LevelStyle {
  return levelConfig[lvl] ?? defaultLevel
}

function getLevelCount(level: number | undefined): number {
  if (level === undefined) return 0
  return store.stats?.byLevel.find((l) => l.level === level)?.count ?? 0
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.setKeyword(searchInput.value)
  }, 400)
}

function toggleLevel(level: number | undefined) {
  store.setLevel(level)
}

function openDetail(log: LogItem) {
  selectedLog.value = log
}

function closeDetail() {
  selectedLog.value = null
}

function copyToClipboard(text: string, field: string) {
  navigator.clipboard.writeText(text)
  copiedField.value = field
  setTimeout(() => (copiedField.value = null), 2000)
}

function hasKeys(obj: Record<string, unknown> | undefined | null): boolean {
  return !!obj && Object.keys(obj).length > 0
}

function calcTotalPages() {
  return Math.max(1, Math.ceil(store.total / store.pageSize))
}

function onPageChange(p: number) {
  store.setPage(p)
}

function handleClearLogs() {
  showClearModal.value = true
}

function confirmClear() {
  showClearModal.value = false
  store.clearLogs()
}
</script>

<template>
  <div class="size-full bg-gray-50 overflow-hidden">
    <div class="h-full flex">
      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="bg-white border-b border-gray-200 px-6 py-4">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-foreground text-xl font-semibold">日志分析系统</h1>
            <div class="flex items-center gap-2">
              <button
                @click="store.refresh()"
                class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                title="刷新"
              >
                <RefreshCw :size="16" />
              </button>
              <button
                @click="handleClearLogs"
                :disabled="store.loading"
                class="flex items-center gap-2 px-3 py-2 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="清空日志"
              >
                <Trash2 :size="16" />
              </button>
              <button class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <Download :size="16" />
                导出日志
              </button>
            </div>
          </div>

          <!-- Search and Filters -->
          <div class="flex gap-4">
            <div class="flex-1 relative">
              <Search :size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                v-model="searchInput"
                type="text"
                placeholder="搜索日志消息..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                @input="onSearchInput"
              />
            </div>
            <div class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
              <Filter :size="16" class="text-gray-500" />
              <span class="text-sm text-gray-600">过滤器</span>
            </div>
          </div>
        </header>

        <!-- Stats Bar -->
        <div class="bg-white border-b border-gray-200 px-6 py-3">
          <div class="flex gap-4 items-center">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">总计:</span>
              <span class="font-medium">{{ store.total }}</span>
            </div>
            <div v-if="store.stats" class="flex items-center gap-2">
              <span class="text-sm text-gray-400">|</span>
              <span class="text-sm text-gray-600">近 24h:</span>
              <span class="font-medium text-primary">{{ store.stats.last24Hours }}</span>
            </div>
            <span class="text-gray-300">|</span>
            <button
              v-for="opt in store.levelOptions.filter((o) => o.value !== 0)"
              :key="opt.label"
              @click="toggleLevel(opt.value)"
              :class="[
                'flex items-center gap-2 px-3 py-1 rounded-md transition-all',
                store.level === opt.value
                  ? opt.value !== undefined
                    ? `${getLevel(opt.value ?? 0).bgColor} ${getLevel(opt.value ?? 0).color}`
                    : 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200',
              ]"
            >
              <component v-if="opt.value !== undefined" :is="getLevel(opt.value ?? 0).icon" :size="16" />
              <span class="text-sm">{{ opt.label }}</span>
              <span v-if="opt.value !== undefined" class="text-xs font-medium ml-1">{{ getLevelCount(opt.value) }}</span>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="store.loading && store.currentPageLogs.length === 0" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="inline-block w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin mb-3" />
            <p class="text-gray-500 text-sm">加载中...</p>
          </div>
        </div>

        <!-- Error -->
        <div v-if="store.error" class="px-6 py-3">
          <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
            {{ store.error }}
          </div>
        </div>

        <!-- Timeline and Logs -->
        <div v-if="!store.loading || store.currentPageLogs.length > 0" class="flex-1 overflow-auto px-6 py-4">
          <div class="max-w-5xl mx-auto">
            <div v-if="store.currentPageLogs.length === 0" class="text-center py-12">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search :size="32" class="text-gray-400" />
              </div>
              <p class="text-gray-500">没有找到匹配的日志</p>
            </div>

            <div v-else class="space-y-0">
              <div
                v-for="(log, index) in store.currentPageLogs"
                :key="log.id"
                class="relative flex gap-4"
              >
                <!-- Timeline -->
                <div class="flex flex-col items-center">
                  <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10', getLevel(log.level).bgColor]">
                    <component :is="getLevel(log.level).icon" :size="20" :class="getLevel(log.level).color" />
                  </div>
                  <div v-if="index < store.currentPageLogs.length - 1" class="w-0.5 bg-gray-200 flex-1 min-h-[40px]" />
                </div>

                <!-- Log Content -->
                <div :class="['flex-1', index < store.currentPageLogs.length - 1 ? 'pb-4' : '']">
                  <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-3 mb-2 flex-wrap">
                          <span :class="['px-2 py-0.5 rounded text-xs', getLevel(log.level).bgColor, getLevel(log.level).color]">
                            {{ getLevel(log.level).label }}
                          </span>
                          <span class="text-xs text-gray-500 flex items-center gap-1">
                            <Clock :size="12" />
                            {{ format(new Date(log.timestamp), 'HH:mm:ss') }}
                          </span>
                          <span class="text-xs text-gray-400">•</span>
                          <span class="text-xs text-gray-500">{{ log.sdk }}@{{ log.sdkVersion }}</span>
                          <span v-if="hasKeys(log.tags)" class="flex items-center gap-1">
                            <span
                              v-for="(_, k) in log.tags"
                              :key="String(k)"
                              class="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-600"
                            >
                              {{ k }}
                            </span>
                          </span>
                        </div>
                        <p class="text-gray-900">{{ log.message }}</p>
                      </div>
                      <div class="flex items-center gap-3">
                        <div class="text-xs text-gray-400 shrink-0">
                          {{ format(new Date(log.timestamp), 'yyyy-MM-dd') }}
                        </div>
                        <button
                          @click="openDetail(log)"
                          class="flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-primary/5 rounded-md transition-colors"
                        >
                          详情
                          <ChevronRight :size="16" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="store.total > store.pageSize" class="bg-white border-t border-gray-200 px-6 py-3">
          <div class="flex items-center justify-center gap-1">
            <button
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              :disabled="store.page <= 1"
              @click="onPageChange(store.page - 1)"
            >
              ‹
            </button>
            <template v-for="p in calcTotalPages()" :key="p">
              <button
                v-if="p === 1 || p === calcTotalPages() || Math.abs(p - store.page) <= 2"
                :class="[
                  'px-3 py-1.5 text-sm border rounded-md transition-colors',
                  p === store.page
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 hover:bg-gray-50',
                ]"
                @click="onPageChange(p)"
              >
                {{ p }}
              </button>
              <span v-else-if="Math.abs(p - store.page) === 3" class="text-gray-400 text-sm px-1">…</span>
            </template>
            <button
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              :disabled="store.page >= calcTotalPages()"
              @click="onPageChange(store.page + 1)"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Sidebar Overlay -->
      <Transition name="sidebar-overlay">
        <div v-if="selectedLog" class="fixed inset-0 bg-black/20 z-40" @click="closeDetail" />
      </Transition>

      <!-- Detail Sidebar -->
      <Transition name="sidebar">
        <div
          v-if="selectedLog"
          class="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col"
        >
        <!-- Sidebar Header -->
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span :class="['px-2 py-1 rounded text-xs flex items-center gap-1.5', getLevel(selectedLog.level).bgColor, getLevel(selectedLog.level).color]">
                  <component :is="getLevel(selectedLog.level).icon" :size="14" />
                  {{ getLevel(selectedLog.level).label }}
                </span>
                <span class="text-sm text-gray-500">
                  {{ format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss') }}
                </span>
              </div>
              <h2 class="text-gray-900 mb-1">{{ selectedLog.message }}</h2>
              <p class="text-sm text-gray-500">{{ selectedLog.sdk }}@{{ selectedLog.sdkVersion }}</p>
            </div>
            <button @click="closeDetail" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X :size="20" class="text-gray-500" />
            </button>
          </div>
        </div>

        <!-- Sidebar Content -->
        <div class="flex-1 overflow-auto px-6 py-4">
          <div class="space-y-6">
            <!-- Basic Details -->
            <div>
              <h3 class="text-gray-700 mb-3">基本信息</h3>
              <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">日志ID:</span>
                  <span class="text-gray-900 font-mono">{{ selectedLog.id }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">时间戳:</span>
                  <span class="text-gray-900">{{ format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS') }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">级别:</span>
                  <span :class="getLevel(selectedLog.level).color">{{ getLevel(selectedLog.level).label }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">SDK:</span>
                  <span class="text-gray-900">{{ selectedLog.sdk }}@{{ selectedLog.sdkVersion }}</span>
                </div>
                <div v-if="selectedLog.user && Object.keys(selectedLog.user).length" class="pt-2 border-t border-gray-200">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">用户ID:</span>
                    <span class="text-gray-900">{{ selectedLog.user.id ?? '-' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="hasKeys(selectedLog.tags)">
              <h3 class="text-gray-700 mb-3">标签</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(v, k) in selectedLog.tags"
                  :key="String(k)"
                  class="px-2.5 py-1 rounded-md text-xs bg-purple-50 text-purple-600 border border-purple-100"
                >
                  {{ k }}: {{ v }}
                </span>
              </div>
            </div>

            <!-- Data -->
            <div v-if="hasKeys(selectedLog.data)">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-gray-700">附加数据</h3>
                <button
                  @click="copyToClipboard(JSON.stringify(selectedLog.data, null, 2), 'data')"
                  class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <template v-if="copiedField === 'data'">
                    <Check :size="14" />
                    已复制
                  </template>
                  <template v-else>
                    <Copy :size="14" />
                    复制
                  </template>
                </button>
              </div>
              <div class="bg-gray-900 rounded-lg p-4 overflow-auto">
                <pre class="text-xs text-blue-400 font-mono">{{ JSON.stringify(selectedLog.data, null, 2) }}</pre>
              </div>
            </div>

            <!-- Context -->
            <div v-if="hasKeys(selectedLog.context)">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-gray-700">上下文</h3>
                <button
                  @click="copyToClipboard(JSON.stringify(selectedLog.context, null, 2), 'context')"
                  class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <template v-if="copiedField === 'context'">
                    <Check :size="14" />
                    已复制
                  </template>
                  <template v-else>
                    <Copy :size="14" />
                    复制
                  </template>
                </button>
              </div>
              <div class="bg-gray-900 rounded-lg p-4 overflow-auto">
                <pre class="text-xs text-green-400 font-mono">{{ JSON.stringify(selectedLog.context, null, 2) }}</pre>
              </div>
            </div>

            <!-- User -->
            <div v-if="hasKeys(selectedLog.user)">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-gray-700">用户信息</h3>
                <button
                  @click="copyToClipboard(JSON.stringify(selectedLog.user, null, 2), 'user')"
                  class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <template v-if="copiedField === 'user'">
                    <Check :size="14" />
                    已复制
                  </template>
                  <template v-else>
                    <Copy :size="14" />
                    复制
                  </template>
                </button>
              </div>
              <div class="bg-gray-900 rounded-lg p-4 overflow-auto">
                <pre class="text-xs text-yellow-400 font-mono">{{ JSON.stringify(selectedLog.user, null, 2) }}</pre>
              </div>
            </div>

            <!-- Breadcrumbs -->
            <div v-if="selectedLog.breadcrumbs && selectedLog.breadcrumbs.length">
              <h3 class="text-gray-700 mb-3">面包屑 ({{ selectedLog.breadcrumbs.length }})</h3>
              <div class="space-y-2">
                <div
                  v-for="(bc, i) in selectedLog.breadcrumbs"
                  :key="i"
                  class="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg text-sm"
                >
                  <span v-if="bc.category" class="text-xs text-primary shrink-0">[{{ bc.category }}]</span>
                  <span class="text-gray-700 flex-1">{{ bc.message }}</span>
                  <span class="text-xs text-gray-400 shrink-0">{{ format(new Date(bc.timestamp), 'HH:mm:ss') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </Transition>
    </div>
  </div>

  <!-- Clear Confirmation Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showClearModal" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 backdrop-blur-sm" @click.self="showClearModal = false">
        <div class="bg-white rounded-2xl p-8 w-[90%] max-w-[400px] text-center shadow-2xl">
          <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle :size="24" class="text-red-500" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">确认清空日志</h3>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            此操作将清空 <strong class="text-primary">pg_rnlogs</strong> 数据库中的所有日志数据，且不可撤销。
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              @click="showClearModal = false"
            >
              取消
            </button>
            <button
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              @click="confirmClear"
            >
              确认清空
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Sidebar overlay fade */
.sidebar-overlay-enter-active {
  transition: opacity 0.25s ease;
}
.sidebar-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.sidebar-overlay-enter-from,
.sidebar-overlay-leave-to {
  opacity: 0;
}

/* Sidebar slide */
.sidebar-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.sidebar-leave-active {
  transition: transform 0.2s ease-in;
}
.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(100%);
}

.modal-enter-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-leave-active > div {
  transition: transform 0.15s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from > div {
  transform: scale(0.9) translateY(10px);
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to > div {
  transform: scale(0.95) translateY(5px);
}
</style>
