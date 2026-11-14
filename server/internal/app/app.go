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
	"github.com/PJMatch/server/internal/handlers"
	"github.com/PJMatch/server/internal/middleware"
	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/repositories"
	"github.com/PJMatch/server/internal/services"
	"github.com/PJMatch/server/internal/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const maxBodySize = 50 << 20

type App struct {
	Router *gin.Engine
	DB     *gorm.DB
	JWT    *utils.JWTManager
	port   string
}

func New() (*App, error) {
	if err := godotenv.Load(filepath.Join(serverRoot(), ".env")); err != nil {
		log.Println("no .env file found, using system environment")
	}

	accessSecret, refreshSecret := os.Getenv("JWT_ACCESS_SECRET"), os.Getenv("JWT_REFRESH_SECRET")
	if accessSecret == "" || refreshSecret == "" {
		return nil, fmt.Errorf("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set")
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

	refSeedPath := getEnv("REFERENCES_SEED_FILE", "internal/database/references.json")
	if _, err := os.Stat(refSeedPath); err != nil {
		if fallback := filepath.Join(serverRoot(), "internal", "database", "references.json"); fallback != refSeedPath {
			if _, err := os.Stat(fallback); err == nil {
				refSeedPath = fallback
			}
		}
	}
	if err := database.SeedReferences(db, refSeedPath); err != nil {
		log.Printf("[Seeder Warning] %v", err)
	}

	router, err := newRouter()
	if err != nil {
		return nil, err
	}

	a := &App{
		Router: router,
		DB:     db,
		JWT:    utils.NewJWTManager(accessSecret, refreshSecret),
		port:   getEnv("PORT", "8080"),
	}
	a.setupMiddleware()
	a.setupRoutes()

	return a, nil
}

func (a *App) Run() error {
	return a.Router.Run(":" + a.port)
}

func newRouter() (*gin.Engine, error) {
	gin.SetMode(getEnv("GIN_MODE", gin.DebugMode))

	router := gin.New()
	router.Use(middleware.Logger(), gin.Recovery())

	if err := router.SetTrustedProxies(splitList(os.Getenv("TRUSTED_PROXIES"))); err != nil {
		return nil, fmt.Errorf("trusted proxies: %w", err)
	}
	return router, nil
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
		&models.UserProgress{},
		&models.ReferenceVideo{},
	)
}

func (a *App) setupMiddleware() {
	a.Router.MaxMultipartMemory = maxBodySize

	a.Router.Use(func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBodySize)
		c.Next()
	})

	a.Router.Use(cors.New(cors.Config{
		AllowOrigins:     splitList(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
}

func (a *App) setupRoutes() {
	api := a.Router.Group("/api/v1")
	api.GET("/health", a.health)

	userRepo := repositories.NewUserRepository(a.DB)
	userService := services.NewUserService(userRepo, a.JWT)
	authLimiter := middleware.NewRateLimiter(6*time.Second, 10)
	requireAuth := middleware.AuthMiddleware(a.JWT)
	handlers.NewUserHandler(userService).RegisterRoutes(api, requireAuth, authLimiter.Middleware())

	signRepo := repositories.NewSignRepository(a.DB)
	skeletonRepo := repositories.NewSkeletonRepository(a.DB)
	progressRepo := repositories.NewProgressRepository(a.DB)
	referenceRepo := repositories.NewReferenceRepository(a.DB)
	storage := services.NewStorageService(getEnv("STORAGE_DIR", "storage"))

	handlers.NewSignHandler(services.NewSignService(signRepo)).RegisterRoutes(api)
	handlers.NewSkeletonHandler(services.NewSkeletonService(skeletonRepo, signRepo, storage)).RegisterRoutes(api, requireAuth)
	handlers.NewProgressHandler(services.NewProgressService(progressRepo, signRepo)).RegisterRoutes(api, requireAuth)
	handlers.NewReferenceHandler(services.NewReferenceService(referenceRepo, storage)).RegisterRoutes(api)
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

func splitList(value string) []string {
	var items []string
	for _, item := range strings.Split(value, ",") {
		if item = strings.TrimSpace(item); item != "" {
			items = append(items, item)
		}
	}
	return items
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
