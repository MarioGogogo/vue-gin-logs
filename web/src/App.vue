<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ref, onMounted } from 'vue'

const isDark = ref(false)

function applyTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

function toggleTheme() {
  applyTheme(!isDark.value)
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  applyTheme(saved === 'dark')
})

defineExpose({ isDark, toggleTheme })
</script>

<template>
  <RouterView />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ===== 亮色主题（默认） ===== */
:root,
[data-theme="light"] {
  --bg-page: #f5f5f9;
  --bg-bar: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f8f8fc;
  --bg-input: #f0f0f5;
  --bg-code: #f3f3f8;
  --bg-badge: rgba(124, 106, 239, 0.08);
  --bg-sdk: #f0f0f5;

  --border-main: #e8e8ef;
  --border-hover: #d0d0dc;

  --text-primary: #1a1a2e;
  --text-secondary: #555568;
  --text-muted: #8888a0;
  --text-placeholder: #b0b0c0;
  --text-inverse: #ffffff;

  --accent: #7c6aef;
  --accent-light: #9c8aef;
  --accent-secondary: #e06aef;

  --scrollbar-thumb: #c8c8d4;
  --scrollbar-thumb-hover: #a8a8b8;

  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06);
  --timeline-line: #e0e0ea;
}

/* ===== 暗色主题 ===== */
[data-theme="dark"] {
  --bg-page: #0f0f13;
  --bg-bar: #16161c;
  --bg-card: #1a1a24;
  --bg-card-hover: #1e1e2a;
  --bg-input: #1c1c26;
  --bg-code: #14141c;
  --bg-badge: rgba(124, 106, 239, 0.1);
  --bg-sdk: #14141c;

  --border-main: #2a2a35;
  --border-hover: #3a3a48;

  --text-primary: #e0e0e6;
  --text-secondary: #b0b0bc;
  --text-muted: #888;
  --text-placeholder: #555;
  --text-inverse: #ffffff;

  --accent: #7c6aef;
  --accent-light: #9c8aef;
  --accent-secondary: #e06aef;

  --scrollbar-thumb: #333;
  --scrollbar-thumb-hover: #555;

  --shadow-card: none;
  --timeline-line: #2a2a35;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background 0.3s, color 0.3s;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
</style>
