# 日志上报接口文档

## 1. 接口基本信息

| 项目 | 说明 |
|------|------|
| 请求方法 | `POST` |
| 请求地址 | 由客户端配置传入（如 `https://your-domain.com/api/logs`） |
| Content-Type | `application/json` |
| 自定义请求头 | `X-Api-Key`: API 密钥（如有配置） |

---

## 2. 请求体 Payload

```json
{
  "sdk": "rnlogs",
  "sdkVersion": "1.0.0",
  "timestamp": 1715923200000,
  "batchSize": 10,
  "events": [ /* LogEvent 数组 */ ]
}
```

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `sdk` | `string` | 是 | SDK 标识，固定值 `rnlogs` |
| `sdkVersion` | `string` | 是 | SDK 版本，当前 `1.0.0` |
| `timestamp` | `number` | 是 | 上报时毫秒级时间戳 |
| `batchSize` | `number` | 是 | 本批次日志事件数量 |
| `events` | `LogEvent[]` | 是 | 日志事件数组 |

---

## 3. 单条日志事件 `LogEvent`

```json
{
  "id": "1715923200000-abc123",
  "level": 2,
  "message": "用户点击登录按钮",
  "timestamp": 1715923199000,
  "data": {},
  "user": { "id": "user_001" },
  "breadcrumbs": [],
  "tags": { "page": "login" },
  "context": { "environment": "production", "release": "1.2.0" }
}
```

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `id` | `string` | 是 | 日志唯一 ID，格式 `${timestamp}-${random}` |
| `level` | `number` | 是 | 日志级别：`0`-VERBOSE, `1`-DEBUG, `2`-INFO, `3`-WARN, `4`-ERROR, `5`-FATAL |
| `message` | `string` | 是 | 日志消息内容 |
| `timestamp` | `number` | 是 | 日志产生时的毫秒级时间戳 |
| `data` | `object` / `any` | 否 | 附加业务数据，结构因日志类型而异 |
| `user` | `UserInfo` | 否 | 用户信息 |
| `breadcrumbs` | `Breadcrumb[]` | 否 | 操作轨迹/面包屑 |
| `tags` | `object` | 否 | 自定义标签键值对 |
| `context` | `object` | 否 | 上下文信息（如环境、版本号） |

---

## 4. 子结构定义

### 4.1 `UserInfo` 用户信息

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `id` | `string` | 是 | 用户唯一标识 |
| `name` | `string` | 否 | 用户名称 |
| `email` | `string` | 否 | 用户邮箱 |
| 其他字段 | `any` | 否 | 允许扩展任意自定义属性 |

### 4.2 `Breadcrumb` 面包屑

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `message` | `string` | 是 | 描述文本 |
| `category` | `string` | 否 | 分类，如 `action`、`navigation` |
| `timestamp` | `number` | 是 | 产生时间戳 |
| `data` | `object` | 否 | 附加数据 |

---

## 5. `data` 字段实际类型（按采集器分类）

| 日志类型 | `level` | `data` 结构 |
|----------|---------|-------------|
| 普通日志 | 任意 | 用户传入的任意对象 |
| API 监控 | `2`(INFO) / `4`(ERROR) | `ApiLogData` |
| 性能指标 | `1`(DEBUG) | `PerformanceMetrics` |
| 异常捕获 | `4`(ERROR) / `5`(FATAL) | `{ name, stack, isFatal }` |

### 5.1 `ApiLogData` API 监控数据

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `url` | `string` | 是 | 请求 URL |
| `method` | `string` | 是 | HTTP 方法 |
| `statusCode` | `number` | 否 | 响应状态码 |
| `durationMs` | `number` | 是 | 请求耗时（毫秒） |
| `requestHeaders` | `object` | 否 | 请求头（预留） |
| `responseHeaders` | `object` | 否 | 响应头（预留） |
| `errorMessage` | `string` | 否 | 请求异常时的错误信息 |

### 5.2 `PerformanceMetrics` 性能指标

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `memory` | `object` | 否 | JS 堆内存：`{ used: number, total: number }`（MB） |
| `jsHeapSize` | `number` | 否 | JS 堆大小（MB） |
| `fps` | `number` | 否 | 帧率（预留） |

---

## 6. 服务端响应约定

| 状态码 | 处理方式 |
|--------|----------|
| `2xx` | SDK 视为成功，清空已发送批次 |
| `4xx` | SDK 直接丢弃该批次，不再重试 |
| `5xx` / 网络异常 | SDK 指数退避重试，默认最多 3 次 |
