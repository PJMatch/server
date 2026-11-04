package middleware

import (
	"math"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type RateLimiter struct {
	mu        sync.Mutex
	visitors  map[string]*visitor
	limit     rate.Limit
	burst     int
	idleTTL   time.Duration
	lastSweep time.Time
}

func NewRateLimiter(every time.Duration, burst int) *RateLimiter {
	return &RateLimiter{
		visitors:  map[string]*visitor{},
		limit:     rate.Every(every),
		burst:     burst,
		idleTTL:   10 * time.Minute,
		lastSweep: time.Now(),
	}
}

func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	if now.Sub(rl.lastSweep) > rl.idleTTL {
		for k, v := range rl.visitors {
			if now.Sub(v.lastSeen) > rl.idleTTL {
				delete(rl.visitors, k)
			}
		}
		rl.lastSweep = now
	}

	v, ok := rl.visitors[key]
	if !ok {
		v = &visitor{limiter: rate.NewLimiter(rl.limit, rl.burst)}
		rl.visitors[key] = v
	}
	v.lastSeen = now
	return v.limiter.Allow()
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	retryAfter := strconv.Itoa(int(math.Ceil(1 / float64(rl.limit))))

	return func(c *gin.Context) {
		if !rl.Allow(c.ClientIP()) {
			c.Header("Retry-After", retryAfter)
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "too many requests, try again later"})
			return
		}
		c.Next()
	}
}
