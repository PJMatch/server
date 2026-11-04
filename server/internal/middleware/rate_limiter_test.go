package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestRateLimiterBlocksAfterBurst(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/login", NewRateLimiter(time.Minute, 3).Middleware(), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	send := func(ip string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodPost, "/login", nil)
		req.RemoteAddr = ip + ":12345"
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w
	}

	for i := 0; i < 3; i++ {
		if w := send("10.0.0.1"); w.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, w.Code)
		}
	}

	w := send("10.0.0.1")
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", w.Code)
	}
	if w.Header().Get("Retry-After") != "60" {
		t.Errorf("expected Retry-After 60, got %q", w.Header().Get("Retry-After"))
	}

	if w := send("10.0.0.2"); w.Code != http.StatusOK {
		t.Errorf("other IP should not be limited, got %d", w.Code)
	}
}

func TestRateLimiterRemovesIdleVisitors(t *testing.T) {
	rl := NewRateLimiter(time.Minute, 1)
	rl.Allow("10.0.0.1")

	rl.visitors["10.0.0.1"].lastSeen = time.Now().Add(-time.Hour)
	rl.lastSweep = time.Now().Add(-time.Hour)
	rl.Allow("10.0.0.2")

	if _, ok := rl.visitors["10.0.0.1"]; ok {
		t.Error("idle visitor should be removed")
	}
}
