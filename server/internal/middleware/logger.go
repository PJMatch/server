package middleware

import (
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(p gin.LogFormatterParams) string {
		line := fmt.Sprintf("%s | %3d | %10v | %15s | %-7s %s",
			p.TimeStamp.Format(time.RFC3339),
			p.StatusCode,
			p.Latency.Round(time.Microsecond),
			p.ClientIP,
			p.Method,
			p.Path,
		)
		if p.ErrorMessage != "" {
			line += " | " + strings.TrimSpace(p.ErrorMessage)
		}
		return line + "\n"
	})
}
