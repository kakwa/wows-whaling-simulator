package main

import (
	"github.com/kakwa/wows-whaling-simulator/api"
	"github.com/kakwa/wows-whaling-simulator/config"
	"github.com/kakwa/wows-whaling-simulator/lootbox"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	// TODO properly set log level
	e.HideBanner = true

	cfg, err := config.ParseConfig("./config/example.yml")

	if err != nil {
		e.Logger.Fatalf("failed to parse configuration: %w", err)
	}
	logLevel, err := cfg.ConvertLogLevel()
	if err != nil {
		e.Logger.Fatalf("failed to parse LogLevel: %s", err)
	}

	e.Logger.SetLevel(logLevel)

	lootbox.InitStatsWorkers()
	apiv1, err := api.NewAPI(e, cfg)
	if err != nil {
		e.Logger.Fatalf("failed to init API: %s", err)
	}
	apiv1.RegisterRoutes()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:8080", "http://localhost:3000"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
	}))
	e.Use(middleware.GzipWithConfig(middleware.GzipConfig{
		Level: 5,
	}))

	e.Logger.Fatal(e.Start(cfg.Listen))
}
