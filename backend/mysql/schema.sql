-- Streamline video platform schema (MySQL 8.0+)
-- Run: mysql -u <user> -p < mysql/schema.sql

CREATE DATABASE IF NOT EXISTS streamline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE streamline;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  fullname VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(2048) NOT NULL,
  cover_image_url VARCHAR(2048) NULL,
  refresh_token VARCHAR(1024) NULL,
  subscribers_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_created_at (created_at DESC)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS videos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  video_url VARCHAR(2048) NOT NULL,
  thumbnail_url VARCHAR(2048) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL,
  views BIGINT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_videos_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_videos_owner_created (owner_id, created_at DESC),
  KEY idx_videos_published_created (is_published, created_at DESC)
) ENGINE=InnoDB;

-- A subscriber may subscribe to a channel once. This replaces the MongoDB
-- `subscriptions` array and the unused Subscription model with one source of truth.
CREATE TABLE IF NOT EXISTS subscriptions (
  subscriber_id BIGINT UNSIGNED NOT NULL,
  channel_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscriber_id, channel_id),
  CONSTRAINT chk_subscription_not_self CHECK (subscriber_id <> channel_id),
  CONSTRAINT fk_subscriptions_subscriber FOREIGN KEY (subscriber_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_channel FOREIGN KEY (channel_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_subscriptions_channel (channel_id, created_at DESC)
) ENGINE=InnoDB;

-- `watched_at` supports a useful, correctly ordered watch-history screen.
CREATE TABLE IF NOT EXISTS watch_history (
  user_id BIGINT UNSIGNED NOT NULL,
  video_id BIGINT UNSIGNED NOT NULL,
  watched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, video_id),
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  KEY idx_history_user_watched (user_id, watched_at DESC)
) ENGINE=InnoDB;

-- Stored procedures make subscription counts safe under concurrent requests.
DELIMITER //
DROP PROCEDURE IF EXISTS subscribe_to_channel//
DROP PROCEDURE IF EXISTS unsubscribe_from_channel//
CREATE PROCEDURE subscribe_to_channel(IN p_subscriber_id BIGINT UNSIGNED, IN p_channel_id BIGINT UNSIGNED)
BEGIN
  IF p_subscriber_id = p_channel_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You cannot subscribe to your own channel';
  END IF;
  INSERT IGNORE INTO subscriptions (subscriber_id, channel_id) VALUES (p_subscriber_id, p_channel_id);
  UPDATE users SET subscribers_count = (SELECT COUNT(*) FROM subscriptions WHERE channel_id = p_channel_id) WHERE id = p_channel_id;
END//
CREATE PROCEDURE unsubscribe_from_channel(IN p_subscriber_id BIGINT UNSIGNED, IN p_channel_id BIGINT UNSIGNED)
BEGIN
  DELETE FROM subscriptions WHERE subscriber_id = p_subscriber_id AND channel_id = p_channel_id;
  UPDATE users SET subscribers_count = (SELECT COUNT(*) FROM subscriptions WHERE channel_id = p_channel_id) WHERE id = p_channel_id;
END//
DELIMITER ;
