<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLogsStore } from '@/stores/logs'

const store = useLogsStore()
const searchInput = ref('')
const isDark = ref(false)
const showClearModal = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  store.loadLogs()
  store.loadStats()
  isDark.value = localStorage.getItem('theme') === 'dark'
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.setKeyword(searchInput.value)
  }, 400)
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatRelative(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return formatTime(ts)
}

const levelConfig: Record<number, { label: string; color: string; bg: string; icon: string }> = {
  0: { label: 'Verbose', color: '#9E9E9E', bg: 'rgba(158,158,158,0.12)', icon: '💬' },
  1: { label: 'Debug', color: '#42A5F5', bg: 'rgba(66,165,245,0.12)', icon: '🔍' },
  2: { label: 'Info', color: '#66BB6A', bg: 'rgba(102,187,106,0.12)', icon: 'ℹ️' },
  3: { label: 'Warn', color: '#FFA726', bg: 'rgba(255,167,38,0.12)', icon: '⚠️' },
  4: { label: 'Error', color: '#EF5350', bg: 'rgba(239,83,80,0.12)', icon: '🔴' },
  5: { label: 'Fatal', color: '#AB47BC', bg: 'rgba(171,71,188,0.12)', icon: '💀' },
}

function getLevel(lvl: number) {
  return levelConfig[lvl] || levelConfig[0]
}

function calcTotalPages() {
  return Math.max(1, Math.ceil(store.total / store.pageSize))
}

function expandItem(index: number) {
  const el = document.querySelector(`[data-log-index="${index}"] .log-detail`)
  if (el) el.classList.toggle('expanded')
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
  <div class="logs-page">
    <!-- 顶部导航栏 -->
    <header class="top-bar">
      <div class="brand">
        <span class="brand-icon">◈</span>
        <span class="brand-text">LogViewer</span>
        <span class="brand-badge">LIVE</span>
      </div>
      <div class="search-box">
        <span class="search-icon">⌕</span>
        <input
          v-model="searchInput"
          type="text"
          placeholder="搜索日志..."
          class="search-input"
          @input="onSearchInput"
        />
      </div>
      <button class="icon-btn" @click="store.refresh()" title="刷新">↻</button>
      <button class="icon-btn clear-btn" @click="handleClearLogs" title="清空日志" :disabled="store.loading">✕</button>
      <button class="icon-btn theme-btn" @click="toggleTheme" title="切换主题">
        <span v-if="isDark">☀️</span>
        <span v-else>🌙</span>
      </button>
    </header>

    <!-- 统计概览 -->
    <section class="stats-bar" v-if="store.stats">
      <div class="stat-card">
        <div class="stat-number accent">{{ store.stats.total }}</div>
        <div class="stat-label">总日志</div>
      </div>
      <div class="stat-card accent-card">
        <div class="stat-number secondary">{{ store.stats.recent24h }}</div>
        <div class="stat-label">近 24h</div>
      </div>
      <div
        v-for="item in store.stats.byLevel"
        :key="item.level"
        class="stat-card"
      >
        <div class="stat-number" :style="{ color: getLevel(item.level).color }">
          {{ item.count }}
        </div>
        <div class="stat-label">{{ item.name }}</div>
      </div>
    </section>

    <!-- 级别筛选 -->
    <div class="filter-bar">
      <button
        v-for="opt in store.levelOptions"
        :key="opt.label"
        :class="['filter-chip', { active: store.level === opt.value }]"
        :style="store.level === opt.value && opt.value !== undefined
          ? { background: (levelConfig[opt.value ?? 0] || levelConfig[0]).color, color: '#fff' }
          : {}"
        @click="store.setLevel(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="store.loading" class="loading">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 错误提示 -->
    <div v-if="store.error" class="error-msg">
      ⚠ {{ store.error }}
    </div>

    <!-- 时间线日志列表 -->
    <section class="timeline" v-if="!store.loading">
      <div v-if="store.currentPageLogs.length === 0" class="empty">
        <div class="empty-icon">📭</div>
        <p>暂无日志数据</p>
      </div>

      <div
        v-for="(log, index) in store.currentPageLogs"
        :key="log.id"
        class="timeline-item"
        :data-log-index="index"
        @click="expandItem(index)"
      >
        <!-- 时间线竖线和节点 -->
        <div class="timeline-track">
          <div
            class="timeline-dot"
            :style="{ background: getLevel(log.level).color, boxShadow: `0 0 8px ${getLevel(log.level).color}55` }"
          ></div>
          <div class="timeline-line" v-if="index < store.currentPageLogs.length - 1"></div>
        </div>

        <!-- 日志卡片 -->
        <div class="log-card" :style="{ borderLeft: `3px solid ${getLevel(log.level).color}` }">
          <div class="log-header">
            <span class="log-level-badge" :style="{ background: getLevel(log.level).bg, color: getLevel(log.level).color }">
              {{ getLevel(log.level).icon }} {{ getLevel(log.level).label }}
            </span>
            <span class="log-time">{{ formatRelative(log.timestamp) }}</span>
            <span class="log-sdk" v-if="log.sdk">{{ log.sdk }}@{{ log.sdkVersion }}</span>
          </div>

          <div class="log-message">{{ log.message }}</div>

          <div class="log-meta">
            <span class="log-full-time" :title="formatTime(log.timestamp)">{{ formatTime(log.timestamp) }}</span>
            <span v-if="log.user && log.user.id" class="log-user">👤 {{ log.user.id }}</span>
            <span v-if="log.tags && Object.keys(log.tags).length" class="log-tags">
              <span v-for="(v, k) in log.tags" :key="String(k)" class="tag-chip">{{ k }}: {{ v }}</span>
            </span>
          </div>

          <!-- 展开详情 -->
          <div class="log-detail">
            <div v-if="log.data && Object.keys(log.data).length" class="detail-section">
              <div class="detail-title">附加数据</div>
              <pre class="detail-json">{{ JSON.stringify(log.data, null, 2) }}</pre>
            </div>
            <div v-if="log.context && Object.keys(log.context).length" class="detail-section">
              <div class="detail-title">上下文</div>
              <pre class="detail-json">{{ JSON.stringify(log.context, null, 2) }}</pre>
            </div>
            <div v-if="log.breadcrumbs && log.breadcrumbs.length" class="detail-section">
              <div class="detail-title">面包屑 ({{ log.breadcrumbs.length }})</div>
              <div v-for="(bc, i) in log.breadcrumbs" :key="i" class="breadcrumb-item">
                <span class="bc-category" v-if="bc.category">[{{ bc.category }}]</span>
                <span class="bc-msg">{{ bc.message }}</span>
                <span class="bc-time">{{ formatRelative(bc.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 分页 -->
    <div class="pagination" v-if="store.total > store.pageSize">
      <button
        class="page-btn"
        :disabled="store.page <= 1"
        @click="onPageChange(store.page - 1)"
      >‹</button>
      <template v-for="p in calcTotalPages()" :key="p">
        <button
          v-if="p === 1 || p === calcTotalPages() || Math.abs(p - store.page) <= 2"
          :class="['page-btn', { active: p === store.page }]"
          @click="onPageChange(p)"
        >{{ p }}</button>
        <span v-else-if="Math.abs(p - store.page) === 3" class="page-ellipsis">…</span>
      </template>
      <button
        class="page-btn"
        :disabled="store.page >= calcTotalPages()"
        @click="onPageChange(store.page + 1)"
      >›</button>
    </div>

    <!-- 清空确认弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showClearModal" class="modal-overlay" @click.self="showClearModal = false">
          <div class="modal-box">
            <div class="modal-icon-wrap">
              <span class="modal-icon">⚠️</span>
            </div>
            <h3 class="modal-title">确认清空日志</h3>
            <p class="modal-desc">此操作将清空 <strong>pg_rnlogs</strong> 数据库中的所有日志数据，且不可撤销。</p>
            <div class="modal-actions">
              <button class="modal-btn cancel-btn" @click="showClearModal = false">取消</button>
              <button class="modal-btn danger-btn" @click="confirmClear">确认清空</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ===== 全局布局 ===== */
.logs-page {
  min-height: 100vh;
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  transition: background 0.3s, color 0.3s;
}

/* ===== 顶部导航栏 ===== */
.top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--bg-bar);
  border-bottom: 1px solid var(--border-main);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-card);
  transition: background 0.3s, border-color 0.3s;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.brand-icon {
  font-size: 1.5rem;
  color: var(--accent);
}

.brand-text {
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-badge {
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.5px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.search-box {
  flex: 1;
  max-width: 480px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 1.1rem;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 36px;
  border-radius: 10px;
  border: 1px solid var(--border-main);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.search-input:focus {
  border-color: var(--accent);
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.clear-btn {
  color: #EF5350;
}

.clear-btn:hover:not(:disabled) {
  border-color: #EF5350;
  color: #EF5350;
  background: rgba(239, 83, 80, 0.08);
}

.clear-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.theme-btn span {
  font-size: 1rem;
  line-height: 1;
}

/* ===== 统计概览 ===== */
.stats-bar {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  overflow-x: auto;
}

.stat-card {
  flex-shrink: 0;
  padding: 12px 18px;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  text-align: center;
  min-width: 80px;
  box-shadow: var(--shadow-card);
  transition: background 0.3s, border-color 0.3s;
}

.stat-card.accent-card {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
}

.stat-number {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent);
}

.stat-number.accent {
  color: var(--accent);
}

.stat-number.secondary {
  color: var(--accent-secondary);
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== 级别筛选 ===== */
.filter-bar {
  display: flex;
  gap: 8px;
  padding: 0 24px 16px;
  overflow-x: auto;
}

.filter-chip {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.filter-chip.active {
  border-color: transparent;
  font-weight: 600;
}

/* ===== 加载 ===== */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: var(--text-muted);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-main);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-msg {
  margin: 16px 24px;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(239, 83, 80, 0.1);
  color: #EF5350;
  font-size: 0.9rem;
}

/* ===== 时间线 ===== */
.timeline {
  padding: 8px 24px 40px;
}

.empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
  cursor: pointer;
}

.timeline-item:not(:last-child) {
  padding-bottom: 4px;
}

.timeline-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
  padding-top: 20px;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  z-index: 1;
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: var(--timeline-line);
  margin-top: 4px;
}

/* ===== 日志卡片 ===== */
.log-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 8px;
  transition: all 0.2s;
  border: 1px solid transparent;
  box-shadow: var(--shadow-card);
}

.log-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-main);
}

.log-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.log-level-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.log-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.log-sdk {
  font-size: 0.7rem;
  color: var(--text-muted);
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-sdk);
}

.log-message {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-primary);
  word-break: break-word;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.log-full-time {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.log-user {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.log-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-chip {
  font-size: 0.68rem;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--bg-badge);
  color: var(--accent-light);
}

/* ===== 展开详情 ===== */
.log-detail {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.log-detail.expanded {
  max-height: 800px;
  margin-top: 12px;
}

.detail-section {
  margin-bottom: 10px;
}

.detail-title {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.detail-json {
  font-size: 0.8rem;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--bg-code);
  color: var(--text-secondary);
  overflow-x: auto;
  margin: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
  border: 1px solid var(--border-main);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 0.8rem;
}

.bc-category {
  color: var(--accent);
  font-size: 0.75rem;
}

.bc-msg {
  color: var(--text-secondary);
}

.bc-time {
  color: var(--text-muted);
  font-size: 0.72rem;
  margin-left: auto;
}

/* ===== 分页 ===== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 24px 40px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.page-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-ellipsis {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .top-bar {
    padding: 12px 16px;
  }
  .stats-bar, .filter-bar, .timeline {
    padding-left: 16px;
    padding-right: 16px;
  }
  .log-card {
    padding: 10px 14px;
  }
}

/* ===== 清空确认弹窗 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}

.modal-box {
  background: var(--bg-bar);
  border: 1px solid var(--border-main);
  border-radius: 16px;
  padding: 32px 28px 24px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.modal-icon-wrap {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(239, 83, 80, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-icon {
  font-size: 1.6rem;
  line-height: 1;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}

.modal-desc strong {
  color: var(--accent);
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-btn {
  background: var(--bg-input);
  color: var(--text-secondary);
  border: 1px solid var(--border-main);
}

.cancel-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.danger-btn {
  background: #EF5350;
  color: #fff;
}

.danger-btn:hover {
  background: #e53935;
}

/* ===== 弹窗动画 ===== */
.modal-enter-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal-box {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-leave-active .modal-box {
  transition: transform 0.15s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .modal-box {
  transform: scale(0.9) translateY(10px);
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to .modal-box {
  transform: scale(0.95) translateY(5px);
}
</style>
