package main

import (
	"vue-go-logs/config"
	"vue-go-logs/router"
)

func main() {
	config.Init()
	r := router.InitRouter()
	r.Run(":8080")
}
