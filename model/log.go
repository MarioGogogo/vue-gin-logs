package model

import (
	"database/sql/driver"
	"encoding/json"

	"gorm.io/gorm"
)

type JSONB struct {
	Data interface{}
}

func (j JSONB) Value() (driver.Value, error) {
	if j.Data == nil {
		return "{}", nil
	}
	bytes, err := json.Marshal(j.Data)
	return string(bytes), err
}

func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		j.Data = map[string]interface{}{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case string:
		bytes = []byte(v)
	case []byte:
		bytes = v
	}
	return json.Unmarshal(bytes, &j.Data)
}

type LogEvent struct {
	gorm.Model
	EventID     string `gorm:"uniqueIndex;size:128;not null;comment:日志唯一ID"`
	Level       int    `gorm:"not null;index;comment:日志级别 0-Verbose 1-Debug 2-Info 3-Warn 4-Error 5-Fatal"`
	Message     string `gorm:"type:text;not null;comment:日志消息"`
	EventTs     int64  `gorm:"not null;index;comment:事件毫秒时间戳"`
	Data        JSONB  `gorm:"type:jsonb;default:'{}';comment:附加数据"`
	UserInfo    JSONB  `gorm:"type:jsonb;default:'{}';comment:用户信息"`
	Breadcrumbs JSONB  `gorm:"type:jsonb;default:'[]';comment:面包屑"`
	Tags        JSONB  `gorm:"type:jsonb;default:'{}';comment:自定义标签"`
	Context     JSONB  `gorm:"type:jsonb;default:'{}';comment:上下文信息"`
	SDK         string `gorm:"size:32;default:'rnlogs';comment:SDK标识"`
	SDKVersion  string `gorm:"size:32;default:'1.0.0';comment:SDK版本"`
}

func (LogEvent) TableName() string {
	return "log_events"
}

// --- 请求结构体 ---

type LogBatchRequest struct {
	SDK        string          `json:"sdk" binding:"required"`
	SDKVersion string          `json:"sdkVersion" binding:"required"`
	Timestamp  int64           `json:"timestamp" binding:"required"`
	BatchSize  int             `json:"batchSize" binding:"required"`
	Events     []LogEventItem  `json:"events" binding:"required"`
}

type LogEventItem struct {
	ID          string                 `json:"id" binding:"required"`
	Level       int                    `json:"level" binding:"required"`
	Message     string                 `json:"message" binding:"required"`
	Timestamp   int64                  `json:"timestamp" binding:"required"`
	Data        map[string]interface{} `json:"data"`
	User        map[string]interface{} `json:"user"`
	Breadcrumbs []BreadcrumbItem       `json:"breadcrumbs"`
	Tags        map[string]interface{} `json:"tags"`
	Context     map[string]interface{} `json:"context"`
}

type BreadcrumbItem struct {
	Message   string                 `json:"message"`
	Category  string                 `json:"category"`
	Timestamp int64                  `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

// --- 查询请求 ---

type LogQueryParams struct {
	Level    *int   `form:"level"`
	Keyword  string `form:"keyword"`
	Page     int    `form:"page"`
	PageSize int    `form:"pageSize"`
	StartTs  *int64 `form:"startTs"`
	EndTs    *int64 `form:"endTs"`
}
