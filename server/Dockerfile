# Stage 1: Build static Go binary
FROM golang:alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Cache go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy backend source
COPY . .

# Build static binary stripped of symbols
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /app/bin/server \
    ./cmd/main.go

# Stage 2: Minimal runtime image
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

# Create directory structure for storage volume and seed files
RUN mkdir -p /app/storage /app/internal/database

# Copy compiled binary from builder
COPY --from=builder /app/bin/server /app/server

# Copy seed signs dataset
COPY --from=builder /app/internal/database/signs.json /app/internal/database/signs.json

ENV PORT=8080
ENV GIN_MODE=release
ENV SIGNS_SEED_FILE=/app/internal/database/signs.json

EXPOSE 8080

CMD ["/app/server"]

