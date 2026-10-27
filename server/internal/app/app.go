package app

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/PJMatch/server/internal/database"
	"github.com/PJMatch/server/internal/models"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Skeleton packages sent from the browser can be large (many frames x 75 landmarks).
const maxBodySize = 50 << 20

type App struct {
	Router *gin.Engine
	DB     *gorm.DB
	port   string
}

func New() (*App, error) {
	if err := godotenv.Load(filepath.Join(serverRoot(), ".env")); err != nil {
		log.Println("no .env file found, using system environment")
	}

	db, err := connectDB()
	if err != nil {
		return nil, err
	}

	if err := migrate(db); err != nil {
		return nil, fmt.Errorf("auto-migrate: %w", err)
	}

	seedPath := getEnv("SIGNS_SEED_FILE", "internal/database/signs.json")
	if _, err := os.Stat(seedPath); err != nil {
		if fallback := filepath.Join(serverRoot(), "internal", "database", "signs.json"); fallback != seedPath {
			if _, err := os.Stat(fallback); err == nil {
				seedPath = fallback
			}
		}
	}
	if err := database.SeedSigns(db, seedPath); err != nil {
		log.Printf("[Seeder Warning] %v", err)
	}

	a := &App{
		Router: gin.Default(),
		DB:     db,
		port:   getEnv("PORT", "8080"),
	}
	a.setupMiddleware()
	a.setupRoutes()

	return a, nil
}

func (a *App) Run() error {
	return a.Router.Run(":" + a.port)
}

func connectDB() (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=UTC",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "pjmatch_user"),
		getEnv("DB_PASSWORD", "pjmatch_password"),
		getEnv("DB_NAME", "pjmatch_local"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("connect to database: %w", err)
	}
	return db, nil
}

func migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Sign{},
		&models.Skeleton{},
	)
}

func (a *App) setupMiddleware() {
	a.Router.MaxMultipartMemory = maxBodySize

	a.Router.Use(func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBodySize)
		c.Next()
	})

	a.Router.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"), ","),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
}

func (a *App) setupRoutes() {
	api := a.Router.Group("/api/v1")
	api.GET("/health", a.health)
}

func (a *App) health(c *gin.Context) {
	sqlDB, err := a.DB.DB()
	if err == nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		err = sqlDB.PingContext(ctx)
	}

	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "database": "down"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "database": "up"})
}

func serverRoot() string {
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		return "."
	}
	return filepath.Dir(filepath.Dir(filepath.Dir(file)))
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
