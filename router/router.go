package router

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"vue-go-logs/api/v1"
)

func InitRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Api-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/ping", v1.Ping)

	apiV1 := r.Group("/api/v1")
	{
		apiV1.GET("/ping", v1.Ping)

		logs := apiV1.Group("/logs")
		{
			logs.POST("", v1.CreateLogs)
			logs.GET("", v1.GetLogs)
			logs.GET("/stats", v1.GetLogStats)
			logs.DELETE("/clear", v1.ClearLogs)
		}
	}

	return r
}