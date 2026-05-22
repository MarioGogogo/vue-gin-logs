# vue-gin-logs

一个基于 **Vue 3 + Gin + PostgreSQL** 的日志收集与可视化分析平台，专为 [rnlogs](./doc/log-api-spec.md) SDK 设计，支持日志批量上报、实时查询、统计分析与详情查看。

## 技术栈

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| Go | 1.26+ | 编程语言 |
| Gin | v1.12 | HTTP Web 框架 |
| GORM | v1.31 | ORM 数据库操作 |
| PostgreSQL | - | 数据存储（JSONB 支持灵活嵌套数据） |
| Sonic | v1.15 | 高性能 JSON 序列化 |

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5 | Composition API + `<script setup>` |
| TypeScript | 6.0 | 类型安全 |
| Vite | 8.0 | 构建工具（内置 API 代理） |
| Pinia | 3.0 | 状态管理 |
| Tailwind CSS | 4.3 | 原子化样式（v4 语法） |
| Axios | 1.16 | HTTP 客户端 |
| Lucide Icons | 1.0 | 图标库 |
| date-fns | 4.2 | 日期格式化 |

## 功能特性

- **日志批量上报** — 接收 rnlogs SDK 发送的批量日志事件，支持 6 个严重级别（Verbose / Debug / Info / Warn / Error / Fatal）
- **时间线视图** — 按时间倒序展示日志，不同级别使用颜色编码图标区分
- **关键字搜索** — 带 400ms 防抖的模糊搜索，实时过滤日志内容
- **级别筛选** — 按日志级别快速过滤，按钮上显示各级别数量统计
- **统计面板** — 展示日志总数、近 24 小时新增数量、各级别分布
- **详情侧边栏** — 点击任意日志展开 600px 滑入面板，查看完整结构化数据（标签、JSON 数据、用户信息、操作轨迹）
- **一键复制** — JSON 数据块支持点击复制到剪贴板
- **分页导航** — 智能页码显示，支持大跨度翻页
- **清空日志** — 带二次确认的危险操作保护

## 项目结构

```
vue-gin-logs/
├── main.go                  # Go 入口，启动配置与路由
├── go.mod / go.sum          # Go 依赖管理
├── config/
│   └── config.go            # 数据库初始化（PostgreSQL + GORM）
├── model/
│   └── log.go               # GORM 模型、请求/响应结构体
├── api/
│   └── v1/
│       └── log.go           # Gin HTTP Handler（日志 CRUD + 统计）
├── router/
│   └── router.go            # Gin 引擎、CORS 配置、路由注册
├── doc/
│   └── log-api-spec.md      # rnlogs SDK 接入规范文档
└── web/                     # Vue 3 前端 SPA
    ├── package.json
    ├── vite.config.ts        # Vite 配置（开发代理 → localhost:8080）
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.ts           # Vue 启动入口（Pinia + Router）
        ├── App.vue           # 根组件
        ├── api/
        │   └── logs.ts       # Axios API 客户端
        ├── stores/
        │   └── logs.ts       # Pinia 日志状态管理
        ├── views/
        │   └── HomeView.vue  # 主界面（日志查看器）
        └── router/
            └── index.ts      # 路由配置
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/ping` | 健康检查 |
| `GET` | `/api/v1/ping` | 健康检查 |
| `POST` | `/api/v1/logs` | 批量创建日志事件 |
| `GET` | `/api/v1/logs` | 分页查询日志（支持级别筛选、关键字搜索、时间范围） |
| `GET` | `/api/v1/logs/stats` | 获取日志统计数据（总数、近 24h、级别分布） |
| `DELETE` | `/api/v1/logs/clear` | 清空所有日志 |

详细的 SDK 接入规范请参考 [doc/log-api-spec.md](./doc/log-api-spec.md)。

## 快速开始

### 前置要求

- Go 1.26+
- Node.js >= 20.19 或 >= 22.12
- PostgreSQL 数据库

### 启动后端

```bash
# 在项目根目录
go run main.go
```

服务默认监听 `:8080`，启动时自动执行数据库迁移。

### 启动前端

```bash
cd web
npm install
npm run dev
```

前端开发服务器监听 `:5173`，API 请求自动代理到后端 `localhost:8080`。

### 构建生产版本

```bash
cd web
npm run build    # TypeScript 类型检查 + 生产构建
npm run preview  # 预览生产构建
```

## 日志级别

| 级别值 | 名称 | 颜色 | 说明 |
|--------|------|------|------|
| 0 | Verbose | 灰色 | 详细调试信息 |
| 1 | Debug | 蓝色 | 调试信息 |
| 2 | Info | 绿色 | 一般信息 |
| 3 | Warn | 琥珀色 | 警告信息 |
| 4 | Error | 红色 | 错误信息 |
| 5 | Fatal | 紫色 | 致命错误 |

## License

MIT
