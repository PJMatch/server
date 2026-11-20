package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"

	"github.com/PJMatch/server/internal/models"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrUsernameTaken      = errors.New("username already taken")
	ErrRecoveryKeyInvalid = errors.New("recovery key is invalid or already used")
)

type CredentialsUpdate struct {
	Username     string
	PasswordHash string
}

type UserRepository interface {
	Create(ctx context.Context, user *models.User, recoveryKeyHashes []string) error
	FindByUsername(ctx context.Context, username string) (*models.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	RecoverCredentials(ctx context.Context, userID uuid.UUID, recoveryKeyHash string, update CredentialsUpdate) (*models.User, error)
	ReplaceRecoveryKeys(ctx context.Context, userID uuid.UUID, recoveryKeyHashes []string) error
	CountUnusedRecoveryKeys(ctx context.Context, userID uuid.UUID) (int, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User, recoveryKeyHashes []string) error {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return insertRecoveryKeys(tx, user.ID, recoveryKeyHashes)
	})
	if isUniqueViolation(err) {
		return ErrUsernameTaken
	}
	return err
}

func (r *userRepository) FindByUsername(ctx context.Context, username string) (*models.User, error) {
	return r.findOne(ctx, r.db, "username = ?", username)
}

func (r *userRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	return r.findOne(ctx, r.db, "id = ?", id)
}

func (r *userRepository) RecoverCredentials(ctx context.Context, userID uuid.UUID, recoveryKeyHash string, update CredentialsUpdate) (*models.User, error) {
	var user *models.User
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		res := tx.Model(&models.RecoveryKey{}).
			Where("user_id = ? AND key_hash = ? AND used_at IS NULL", userID, recoveryKeyHash).
			Update("used_at", now)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrRecoveryKeyInvalid
		}

		changes := map[string]any{"credentials_changed_at": now}
		if update.Username != "" {
			changes["username"] = update.Username
		}
		if update.PasswordHash != "" {
			changes["password_hash"] = update.PasswordHash
		}
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(changes).Error; err != nil {
			return err
		}

		var err error
		user, err = r.findOne(ctx, tx, "id = ?", userID)
		return err
	})
	if isUniqueViolation(err) {
		return nil, ErrUsernameTaken
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) ReplaceRecoveryKeys(ctx context.Context, userID uuid.UUID, recoveryKeyHashes []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&models.RecoveryKey{}).Error; err != nil {
			return err
		}
		return insertRecoveryKeys(tx, userID, recoveryKeyHashes)
	})
}

func (r *userRepository) CountUnusedRecoveryKeys(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.RecoveryKey{}).
		Where("user_id = ? AND used_at IS NULL", userID).
		Count(&count).Error
	return int(count), err
}

func (r *userRepository) findOne(ctx context.Context, db *gorm.DB, query string, arg any) (*models.User, error) {
	var user models.User
	err := db.WithContext(ctx).Where(query, arg).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func insertRecoveryKeys(tx *gorm.DB, userID uuid.UUID, hashes []string) error {
	if len(hashes) == 0 {
		return nil
	}
	keys := make([]models.RecoveryKey, len(hashes))
	for i, hash := range hashes {
		keys[i] = models.RecoveryKey{UserID: userID, KeyHash: hash}
	}
	return tx.Omit("User").Create(&keys).Error
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
