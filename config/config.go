package config

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"vue-go-logs/model"
)

var DB *gorm.DB

const dsn = "host=43.134.31.40 port=5432 user=postgres password=7758258a dbname=pg_rnlogs sslmode=disable"

func Init() {
	fmt.Println("[Config] 初始化配置...")
	initDB()
}

func initDB() {
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("[DB] 连接失败: %v", err)
	}
	fmt.Println("[DB] 连接成功")

	if err := DB.AutoMigrate(&model.LogEvent{}); err != nil {
		log.Fatalf("[DB] 自动迁移失败: %v", err)
	}
	fmt.Println("[DB] 表迁移完成")
}
