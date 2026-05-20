import { useState, useMemo } from "react";
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
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";

type LogLevel = "info" | "warning" | "error" | "debug";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: string;
  projectId: string;
  details?: string;
  requestData?: any;
  responseData?: any;
  metadata?: Record<string, any>;
}

const projects: Project[] = [
  {
    id: "all",
    name: "全部项目",
    description: "显示所有项目的日志",
    color: "bg-gray-500",
  },
  {
    id: "ecommerce",
    name: "电商平台",
    description: "在线购物系统",
    color: "bg-blue-500",
  },
  {
    id: "payment",
    name: "支付系统",
    description: "支付处理服务",
    color: "bg-green-500",
  },
  {
    id: "crm",
    name: "CRM系统",
    description: "客户关系管理",
    color: "bg-purple-500",
  },
  {
    id: "analytics",
    name: "数据分析",
    description: "数据分析平台",
    color: "bg-orange-500",
  },
];

const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date("2026-05-20T09:15:23"),
    level: "info",
    message: "用户登录成功",
    source: "auth-service",
    projectId: "ecommerce",
    details: "User ID: 12345, IP: 192.168.1.100",
    requestData: {
      username: "user@example.com",
      timestamp: "2026-05-20T09:15:23Z",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    responseData: {
      userId: 12345,
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresIn: 3600,
      refreshToken: "ref_token_xyz123",
    },
    metadata: {
      requestId: "req_a1b2c3d4",
      duration: "125ms",
      ipAddress: "192.168.1.100",
      location: "Beijing, China",
    },
  },
  {
    id: "2",
    timestamp: new Date("2026-05-20T09:16:45"),
    level: "debug",
    message: "API请求处理完成",
    source: "api-gateway",
    projectId: "ecommerce",
    details: "Endpoint: /api/users, Duration: 45ms",
    requestData: {
      method: "GET",
      endpoint: "/api/users",
      query: { page: 1, limit: 20 },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer eyJhbGci...",
      },
    },
    responseData: {
      data: [
        { id: 1, name: "张三", email: "zhang@example.com" },
        { id: 2, name: "李四", email: "li@example.com" },
      ],
      pagination: {
        total: 150,
        page: 1,
        limit: 20,
      },
    },
    metadata: {
      requestId: "req_b2c3d4e5",
      duration: "45ms",
      statusCode: 200,
    },
  },
  {
    id: "3",
    timestamp: new Date("2026-05-20T09:18:12"),
    level: "warning",
    message: "数据库连接池接近上限",
    source: "database",
    projectId: "crm",
    details: "Current: 85/100 connections",
    metadata: {
      poolSize: 100,
      activeConnections: 85,
      idleConnections: 15,
      waitingRequests: 3,
      avgResponseTime: "250ms",
    },
  },
  {
    id: "4",
    timestamp: new Date("2026-05-20T09:20:33"),
    level: "error",
    message: "支付接口调用失败",
    source: "payment-service",
    projectId: "payment",
    details: "Error: Connection timeout after 30s",
    requestData: {
      orderId: "ORD20260520001",
      amount: 299.99,
      currency: "CNY",
      method: "wechat_pay",
      userId: 12345,
    },
    responseData: {
      error: "TIMEOUT_ERROR",
      message: "Connection timeout after 30s",
      code: "ERR_TIMEOUT",
      retryable: true,
    },
    metadata: {
      requestId: "req_c3d4e5f6",
      duration: "30001ms",
      retryCount: 2,
      lastRetryAt: "2026-05-20T09:20:03Z",
    },
  },
  {
    id: "5",
    timestamp: new Date("2026-05-20T09:22:56"),
    level: "info",
    message: "缓存更新成功",
    source: "cache-service",
    projectId: "ecommerce",
    details: "Cache key: user_session_12345",
    metadata: {
      cacheKey: "user_session_12345",
      operation: "SET",
      ttl: 3600,
      size: "2.3KB",
    },
  },
  {
    id: "6",
    timestamp: new Date("2026-05-20T09:25:11"),
    level: "error",
    message: "文件上传失败",
    source: "storage-service",
    projectId: "crm",
    details: "File size exceeds limit: 15MB > 10MB",
    requestData: {
      fileName: "document.pdf",
      fileSize: 15728640,
      mimeType: "application/pdf",
      userId: 12345,
    },
    responseData: {
      error: "FILE_TOO_LARGE",
      message: "File size exceeds limit",
      maxSize: 10485760,
      actualSize: 15728640,
    },
    metadata: {
      requestId: "req_d4e5f6g7",
      uploadId: "upload_xyz789",
    },
  },
  {
    id: "7",
    timestamp: new Date("2026-05-20T09:28:44"),
    level: "warning",
    message: "CPU使用率超过80%",
    source: "monitoring",
    projectId: "analytics",
    details: "Current CPU: 82%, Memory: 65%",
    metadata: {
      cpu: {
        usage: 82,
        threshold: 80,
        cores: 8,
      },
      memory: {
        used: "6.5GB",
        total: "10GB",
        percentage: 65,
      },
      disk: {
        used: "450GB",
        total: "500GB",
        percentage: 90,
      },
    },
  },
  {
    id: "8",
    timestamp: new Date("2026-05-20T09:30:15"),
    level: "debug",
    message: "定时任务开始执行",
    source: "scheduler",
    projectId: "analytics",
    details:
      "Task: daily-backup, Next run: 2026-05-21T09:30:00",
    metadata: {
      taskName: "daily-backup",
      taskId: "task_backup_001",
      schedule: "0 30 9 * * *",
      nextRun: "2026-05-21T09:30:00Z",
      lastRun: "2026-05-19T09:30:00Z",
    },
  },
  {
    id: "9",
    timestamp: new Date("2026-05-20T09:32:22"),
    level: "info",
    message: "邮件发送成功",
    source: "notification-service",
    projectId: "crm",
    details: "To: user@example.com, Subject: Welcome",
    requestData: {
      to: "user@example.com",
      subject: "Welcome to Our Service",
      template: "welcome_email",
      variables: {
        userName: "张三",
        activationLink: "https://example.com/activate/abc123",
      },
    },
    responseData: {
      messageId: "msg_123456789",
      status: "sent",
      provider: "sendgrid",
    },
    metadata: {
      requestId: "req_e5f6g7h8",
      duration: "1250ms",
    },
  },
  {
    id: "10",
    timestamp: new Date("2026-05-20T09:35:18"),
    level: "error",
    message: "第三方API调用失败",
    source: "external-api",
    projectId: "payment",
    details: "API: weather-service, Status: 503",
    requestData: {
      url: "https://api.weather.com/v1/current",
      method: "GET",
      params: {
        city: "Beijing",
        units: "metric",
      },
    },
    responseData: {
      error: "SERVICE_UNAVAILABLE",
      statusCode: 503,
      message: "Service temporarily unavailable",
    },
    metadata: {
      requestId: "req_f6g7h8i9",
      duration: "5000ms",
      provider: "weather-service",
    },
  },
];

const levelConfig: Record<
  LogLevel,
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "信息",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "警告",
  },
  error: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "错误",
  },
  debug: {
    icon: Bug,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    label: "调试",
  },
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<
    Set<LogLevel>
  >(new Set(["info", "warning", "error", "debug"]));
  const [selectedLog, setSelectedLog] =
    useState<LogEntry | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(
    null,
  );
  const [selectedProjectId, setSelectedProjectId] =
    useState("all");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] =
    useState(false);

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ||
    projects[0];

  const filteredLogs = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchesSearch =
        searchTerm === "" ||
        log.message
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        log.source
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesLevel = selectedLevels.has(log.level);
      const matchesProject =
        selectedProjectId === "all" ||
        log.projectId === selectedProjectId;
      return matchesSearch && matchesLevel && matchesProject;
    });
  }, [searchTerm, selectedLevels, selectedProjectId]);

  const toggleLevel = (level: LogLevel) => {
    const newLevels = new Set(selectedLevels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    setSelectedLevels(newLevels);
  };

  const stats = useMemo(() => {
    return {
      total: filteredLogs.length,
      info: filteredLogs.filter((l) => l.level === "info")
        .length,
      warning: filteredLogs.filter((l) => l.level === "warning")
        .length,
      error: filteredLogs.filter((l) => l.level === "error")
        .length,
      debug: filteredLogs.filter((l) => l.level === "debug")
        .length,
    };
  }, [filteredLogs]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="size-full bg-gray-50 overflow-hidden">
      <div className="h-full flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h1 className="text-foreground">
                  日志分析系统
                </h1>

                {/* Project Selector */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsProjectDropdownOpen(
                        !isProjectDropdownOpen,
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${selectedProject.color}`}
                    />
                    <span className="text-sm">
                      {selectedProject.name}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${isProjectDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isProjectDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() =>
                          setIsProjectDropdownOpen(false)
                        }
                      />
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setIsProjectDropdownOpen(false);
                            }}
                            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                              selectedProjectId === project.id
                                ? "bg-blue-50"
                                : ""
                            }`}
                          >
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${project.color} mt-1.5 shrink-0`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-sm text-gray-900">
                                  {project.name}
                                </span>
                                {selectedProjectId ===
                                  project.id && (
                                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {project.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <Download className="w-4 h-4" />
                导出日志
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索日志消息或来源..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  过滤器
                </span>
              </div>
            </div>
          </header>

          {/* Stats Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  总计:
                </span>
                <span className="font-medium">
                  {stats.total}
                </span>
              </div>
              {(
                [
                  "info",
                  "warning",
                  "error",
                  "debug",
                ] as LogLevel[]
              ).map((level) => {
                const config = levelConfig[level];
                const Icon = config.icon;
                const isActive = selectedLevels.has(level);

                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md transition-all ${
                      isActive
                        ? `${config.bgColor} ${config.color}`
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">
                      {config.label}
                    </span>
                    <span className="text-xs font-medium ml-1">
                      {stats[level]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline and Logs */}
          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="max-w-5xl mx-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    没有找到匹配的日志
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredLogs.map((log, index) => {
                    const config = levelConfig[log.level];
                    const Icon = config.icon;
                    const isLast =
                      index === filteredLogs.length - 1;

                    return (
                      <div
                        key={log.id}
                        className="relative flex gap-4"
                      >
                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center shrink-0 relative z-10`}
                          >
                            <Icon
                              className={`w-5 h-5 ${config.color}`}
                            />
                          </div>
                          {!isLast && (
                            <div className="w-0.5 bg-gray-200 flex-1 min-h-[40px]" />
                          )}
                        </div>

                        {/* Log Content */}
                        <div
                          className={`flex-1 ${!isLast ? "pb-4" : ""}`}
                        >
                          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs ${config.bgColor} ${config.color}`}
                                  >
                                    {config.label}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(
                                      log.timestamp,
                                      "HH:mm:ss",
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    •
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {log.source}
                                  </span>
                                </div>
                                <p className="text-gray-900">
                                  {log.message}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-xs text-gray-400 shrink-0">
                                  {format(
                                    log.timestamp,
                                    "yyyy-MM-dd",
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    setSelectedLog(log)
                                  }
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-primary/5 rounded-md transition-colors"
                                >
                                  详情
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail Sidebar */}
        {selectedLog && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setSelectedLog(null)}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col">
              {/* Sidebar Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const config =
                          levelConfig[selectedLog.level];
                        const Icon = config.icon;
                        return (
                          <span
                            className={`px-2 py-1 rounded text-xs ${config.bgColor} ${config.color} flex items-center gap-1.5`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        );
                      })()}
                      <span className="text-sm text-gray-500">
                        {format(
                          selectedLog.timestamp,
                          "yyyy-MM-dd HH:mm:ss",
                        )}
                      </span>
                    </div>
                    <h2 className="text-gray-900 mb-1">
                      {selectedLog.message}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedLog.source}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-auto px-6 py-4">
                <div className="space-y-6">
                  {/* Basic Details */}
                  <div>
                    <h3 className="text-gray-700 mb-3">
                      基本信息
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          日志ID:
                        </span>
                        <span className="text-gray-900 font-mono">
                          {selectedLog.id}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          时间戳:
                        </span>
                        <span className="text-gray-900">
                          {format(
                            selectedLog.timestamp,
                            "yyyy-MM-dd HH:mm:ss.SSS",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          来源:
                        </span>
                        <span className="text-gray-900">
                          {selectedLog.source}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          所属项目:
                        </span>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${projects.find((p) => p.id === selectedLog.projectId)?.color || "bg-gray-500"}`}
                          />
                          <span className="text-gray-900">
                            {projects.find(
                              (p) =>
                                p.id === selectedLog.projectId,
                            )?.name || "未知"}
                          </span>
                        </div>
                      </div>
                      {selectedLog.details && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            {selectedLog.details}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  {selectedLog.metadata && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-700">
                          元数据
                        </h3>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(
                                selectedLog.metadata,
                                null,
                                2,
                              ),
                              "metadata",
                            )
                          }
                          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {copiedField === "metadata" ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              复制
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                        <pre className="text-xs text-green-400 font-mono">
                          {JSON.stringify(
                            selectedLog.metadata,
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Request Data */}
                  {selectedLog.requestData && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-700">
                          请求数据
                        </h3>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(
                                selectedLog.requestData,
                                null,
                                2,
                              ),
                              "request",
                            )
                          }
                          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {copiedField === "request" ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              复制
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                        <pre className="text-xs text-blue-400 font-mono">
                          {JSON.stringify(
                            selectedLog.requestData,
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Response Data */}
                  {selectedLog.responseData && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-700">
                          响应数据
                        </h3>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              JSON.stringify(
                                selectedLog.responseData,
                                null,
                                2,
                              ),
                              "response",
                            )
                          }
                          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {copiedField === "response" ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              复制
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                        <pre className="text-xs text-yellow-400 font-mono">
                          {JSON.stringify(
                            selectedLog.responseData,
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}