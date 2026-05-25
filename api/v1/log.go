package v1

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"vue-go-logs/config"
	"vue-go-logs/model"
)

func Ping(c *gin.Context) {
	c.JSON(http.StatusOK, model.Response{
		Code:    0,
		Message: "pong",
		Data:    nil,
	})
}

func CreateLogs(c *gin.Context) {
	var req model.LogBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
			Data:    nil,
		})
		return
	}

	events := make([]model.LogEvent, 0, len(req.Events))
	for _, item := range req.Events {
		if item.Level < 0 || item.Level > 5 {
			c.JSON(http.StatusBadRequest, model.Response{
				Code:    400,
				Message: fmt.Sprintf("无效的日志级别: %d (合法范围 0-5)", item.Level),
				Data:    nil,
			})
			return
		}

		event := model.LogEvent{
			EventID:    item.ID,
			Level:      item.Level,
			Message:    item.Message,
			EventTs:    item.Timestamp,
			Data:       model.JSONB{Data: item.Data},
			UserInfo:   model.JSONB{Data: item.User},
			Breadcrumbs: model.JSONB{Data: item.Breadcrumbs},
			Tags:       model.JSONB{Data: item.Tags},
			Context:    model.JSONB{Data: item.Context},
			SDK:        req.SDK,
			SDKVersion: req.SDKVersion,
		}

		if event.Data.Data == nil {
			event.Data = model.JSONB{Data: map[string]interface{}{}}
		}
		if event.UserInfo.Data == nil {
			event.UserInfo = model.JSONB{Data: map[string]interface{}{}}
		}
		if event.Breadcrumbs.Data == nil {
			event.Breadcrumbs = model.JSONB{Data: []interface{}{}}
		}
		if event.Tags.Data == nil {
			event.Tags = model.JSONB{Data: map[string]interface{}{}}
		}
		if event.Context.Data == nil {
			event.Context = model.JSONB{Data: map[string]interface{}{}}
		}

		events = append(events, event)
	}

	if err := config.DB.Create(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, model.Response{
			Code:    500,
			Message: "保存日志失败: " + err.Error(),
			Data:    nil,
		})
		return
	}

	c.JSON(http.StatusOK, model.Response{
		Code:    0,
		Message: fmt.Sprintf("成功保存 %d 条日志", len(events)),
		Data:    gin.H{"savedCount": len(events)},
	})
}

func GetLogs(c *gin.Context) {
	var query model.LogQueryParams
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, model.Response{
			Code:    400,
			Message: "查询参数错误",
			Data:    nil,
		})
		return
	}

	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 || query.PageSize > 100 {
		query.PageSize = 20
	}

	db := config.DB.Model(&model.LogEvent{})

	if query.Level != nil {
		db = db.Where("level = ?", *query.Level)
	}
	if query.Keyword != "" {
		db = db.Where("message ILIKE ?", "%" + query.Keyword + "%")
	}
	if query.StartTs != nil {
		db = db.Where("event_ts >= ?", *query.StartTs)
	}
	if query.EndTs != nil {
		db = db.Where("event_ts <= ?", *query.EndTs)
	}

	var total int64
	db.Count(&total)

	var logs []model.LogEvent
	offset := (query.Page - 1) * query.PageSize
	db.Order("event_ts DESC").Offset(offset).Limit(query.PageSize).Find(&logs)

	items := make([]gin.H, 0, len(logs))
	for _, log := range logs {
		items = append(items, gin.H{
			"id":          log.EventID,
			"level":       log.Level,
			"message":     log.Message,
			"timestamp":   log.EventTs,
			"data":        log.Data.Data,
			"user":        log.UserInfo.Data,
			"breadcrumbs": log.Breadcrumbs.Data,
			"tags":        log.Tags.Data,
			"context":     log.Context.Data,
			"sdk":         log.SDK,
			"sdkVersion":  log.SDKVersion,
			"createdAt":   log.CreatedAt.UnixMilli(),
		})
	}

	c.JSON(http.StatusOK, model.Response{
		Code:    0,
		Message: "查询成功",
		Data: gin.H{
			"total":    total,
			"page":     query.Page,
			"pageSize": query.PageSize,
			"items":    items,
		},
	})
}

func GetLogStats(c *gin.Context) {
	stats := make([]gin.H, 0)

	type LevelCount struct {
		Level int
		Count int64
	}

	var levelCounts []LevelCount
	config.DB.Model(&model.LogEvent{}).Select("level, count(*) as count").Group("level").Scan(&levelCounts)

	levelNames := map[int]string{
		0: "Verbose",
		1: "Debug",
		2: "Info",
		3: "Warn",
		4: "Error",
		5: "Fatal",
	}

	for _, lc := range levelCounts {
		stats = append(stats, gin.H{
			"level": lc.Level,
			"name":  levelNames[lc.Level],
			"count": lc.Count,
		})
	}

	var total int64
	config.DB.Model(&model.LogEvent{}).Count(&total)

	var last24h int64
	yesterday := time.Now().Add(-24 * time.Hour).UnixMilli()
	config.DB.Model(&model.LogEvent{}).Where("event_ts >= ?", yesterday).Count(&last24h)

	c.JSON(http.StatusOK, model.Response{
		Code:    0,
		Message: "统计成功",
		Data: gin.H{
			"total":       total,
			"last24Hours": last24h,
			"byLevel":     stats,
		},
	})
}

func ClearLogs(c *gin.Context) {
	result := config.DB.Exec("DELETE FROM log_events")
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, model.Response{
			Code:    500,
			Message: "清空日志失败: " + result.Error.Error(),
			Data:    nil,
		})
		return
	}

	c.JSON(http.StatusOK, model.Response{
		Code:    0,
		Message: "日志已清空",
		Data:    gin.H{"deletedCount": result.RowsAffected},
	})
}