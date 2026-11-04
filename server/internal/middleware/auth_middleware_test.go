package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/utils"
)

func newTestRouter(jm *utils.JWTManager) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/protected", AuthMiddleware(jm), func(c *gin.Context) {
		id, _ := GetUserID(c)
		username, _ := GetUsername(c)
		c.JSON(http.StatusOK, gin.H{"user_id": id, "username": username})
	})
	return r
}

func doRequest(r *gin.Engine, authHeader string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestAuthMiddlewareValidToken(t *testing.T) {
	jm := utils.NewJWTManager("access-secret", "refresh-secret")
	userID := uuid.New()
	token, _ := jm.GenerateAccessToken(userID, "jan", utils.ClientWeb)

	w := doRequest(newTestRouter(jm), "Bearer "+token)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	want := `{"user_id":"` + userID.String() + `","username":"jan"}`
	if w.Body.String() != want {
		t.Errorf("expected %s, got %s", want, w.Body.String())
	}
}

func TestAuthMiddlewareRejects(t *testing.T) {
	jm := utils.NewJWTManager("access-secret", "refresh-secret")
	refresh, _ := jm.GenerateRefreshToken(uuid.New(), "jan", utils.ClientWeb)
	foreign, _ := utils.NewJWTManager("other-secret", "refresh-secret").GenerateAccessToken(uuid.New(), "jan", utils.ClientWeb)
	access, _ := jm.GenerateAccessToken(uuid.New(), "jan", utils.ClientWeb)

	cases := map[string]string{
		"missing header":  "",
		"wrong scheme":    "Basic " + access,
		"empty token":     "Bearer ",
		"malformed token": "Bearer not.a.token",
		"refresh token":   "Bearer " + refresh,
		"wrong signature": "Bearer " + foreign,
	}

	r := newTestRouter(jm)
	for name, header := range cases {
		t.Run(name, func(t *testing.T) {
			if w := doRequest(r, header); w.Code != http.StatusUnauthorized {
				t.Errorf("expected 401, got %d", w.Code)
			}
		})
	}
}
