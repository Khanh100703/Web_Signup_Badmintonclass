-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 04, 2025 lúc 03:34 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `badminton_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `attendance`
--

CREATE TABLE `attendance` (
  `enrollment_id` int(11) NOT NULL,
  `status` enum('PRESENT','ABSENT','EXCUSED') NOT NULL,
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `attendance`
--

INSERT INTO `attendance` (`enrollment_id`, `status`, `note`) VALUES
(2, 'PRESENT', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `blackout_dates`
--

CREATE TABLE `blackout_dates` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `coach_id` int(11) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `coach_id` int(11) NOT NULL,
  `location_id` int(11) DEFAULT NULL,
  `level_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `capacity` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `classes`
--

INSERT INTO `classes` (`id`, `title`, `coach_id`, `location_id`, `level_id`, `category_id`, `capacity`, `description`, `image_url`, `start_date`, `end_date`, `created_at`) VALUES
(19, 'Lớp cơ bản (đơn)', 3, 2, 1, 4, 14, 'Lớp học cầu lông cho người mới bắt đầu', NULL, NULL, NULL, '2025-10-21 16:41:19'),
(20, 'Lớp trung bình (đơn)', 2, 3, 2, 4, 15, 'Lớp học cầu lông cho người đã chơi cầu lông từ 6 tháng đã nắm vững được kiến thức cơ bản', NULL, NULL, NULL, '2025-10-25 15:48:29');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `class_categories`
--

CREATE TABLE `class_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `class_categories`
--

INSERT INTO `class_categories` (`id`, `name`, `description`) VALUES
(1, 'Technique', 'Kỹ thuật'),
(2, 'Fitness', 'Thể lực'),
(3, 'Competition', 'Thi đấu'),
(4, 'Singles', '1 vs 1'),
(5, 'Doubles', '2 vs 2');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `class_levels`
--

CREATE TABLE `class_levels` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `class_levels`
--

INSERT INTO `class_levels` (`id`, `name`, `description`) VALUES
(1, 'Beginner', 'For newcomers'),
(2, 'Intermediate', 'Trình độ trung bình'),
(3, 'Advanced', 'Trình độ nâng cao');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `coaches`
--

CREATE TABLE `coaches` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `experience` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `coaches`
--

INSERT INTO `coaches` (`id`, `name`, `email`, `photo_url`, `phone`, `experience`, `created_at`) VALUES
(2, 'THẦY THÀNH​', 'coachA@ex.com', '/images/coaches/thay-thanh-1024x683.jpg', '0987654321', 'Huấn luyện viên cầu lông cấp quốc gia.\r\nNhiều năm kinh nghiệm trong huấn luyện. \r\nCó khả năng huấn luyện bằng tiếng anh.\r\nĐam mê cầu lông, nhiệt tình và tâm huyết trong huấn luyện.', '2025-10-13 15:36:11'),
(3, 'TEAM TRỢ GIẢNG', '', '/images/coaches/tro-giang.jpg', '', 'Sinh viên các trường TDTT, Sư Phạm TPHCM\r\nCó kinh nghiệm trong thi đấu và huấn luyện cầu lông. \r\nĐam mê và nhiệt tình trong công tác huấn luyện.\r\nTác phong, nghiệp vụ sư phạm chuyên nghiệp.', '2025-10-13 15:36:11');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `coach_availabilities`
--

CREATE TABLE `coach_availabilities` (
  `id` int(11) NOT NULL,
  `coach_id` int(11) NOT NULL,
  `weekday` tinyint(4) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `coach_availabilities`
--

INSERT INTO `coach_availabilities` (`id`, `coach_id`, `weekday`, `start_time`, `end_time`, `created_at`) VALUES
(3, 2, 1, '18:00:00', '20:00:00', '2025-10-21 16:35:22');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `contacts`
--

CREATE TABLE `contacts` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('NEW','SEEN','DONE') NOT NULL DEFAULT 'NEW',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `handled_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `email_verifications`
--

CREATE TABLE `email_verifications` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `email_verifications`
--

INSERT INTO `email_verifications` (`id`, `user_id`, `otp_hash`, `expires_at`, `used`, `created_at`) VALUES
(5, 21, '$2b$10$0DBy6zovEPhadoBokum5ReGXnmAnnmw5dfRWtWhsmyiW56wqSLs1C', '2025-11-01 16:09:10', 1, '2025-11-01 15:54:10'),
(6, 22, '$2b$10$tM3cPs56i3iS0atHKiULSOD0/ABi4eqHYS2enOBuBO8xmYwT5fzOq', '2025-11-01 16:12:12', 0, '2025-11-01 15:57:12'),
(7, 23, '$2b$10$V8.6agsmClQHomc62h79neQ/.sbbd0dTs4P4lHQLogd6e4bnqwgfq', '2025-11-01 16:17:57', 1, '2025-11-01 16:02:57');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('ENROLLED','CANCELLED','WAITLIST') NOT NULL DEFAULT 'ENROLLED',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `enrollments`
--

INSERT INTO `enrollments` (`id`, `session_id`, `user_id`, `status`, `created_at`) VALUES
(2, 8, 14, 'CANCELLED', '2025-10-21 16:43:11');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `capacity` int(11) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `locations`
--

INSERT INTO `locations` (`id`, `name`, `address`, `photo_url`, `capacity`, `notes`, `created_at`) VALUES
(2, 'VHU Gym', 'Văn Hiến University Gym', NULL, 40, 'Main court', '2025-10-13 15:36:19'),
(3, 'San 1', '123 ABC', NULL, 12, 'Sàn gỗ', '2025-10-21 16:25:16');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(160) NOT NULL,
  `body` text DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `password_resets`
--

CREATE TABLE `password_resets` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `otp_hash`, `expires_at`, `used`, `created_at`) VALUES
(1, 15, '$2b$10$RaQikJmHj8WcnvoT5I5R9OYI4/E74Ud/eiJAETN4cmro9SAX8UwLO', '2025-10-22 11:50:24', 0, '2025-10-22 11:40:24'),
(2, 15, '$2b$10$2HtRWj3SzdGKcb3LgtK.A.19vx5FRWr9VS85.TUTEm6Rj3KdScYaa', '2025-10-22 11:50:47', 0, '2025-10-22 11:40:47'),
(3, 1, '$2b$10$USJ3o85JK8Teetv8C0sjtOPz.c9UWJG99J1yhQD10o3gyo/6H8gw.', '2025-10-22 11:51:05', 0, '2025-10-22 11:41:05'),
(4, 1, '$2b$10$PGDoSHBRHTuzjXlL9l5K9O2jqPXTn.vo7iZdP2YJrs6l5tDVcaGw2', '2025-10-22 11:51:09', 0, '2025-10-22 11:41:09'),
(5, 1, '$2b$10$O67rwzs6wE4bBAwgbL5nouYt5YwAksNBfog6PAhQjG/8MbDq2n/pO', '2025-10-24 19:44:09', 1, '2025-10-24 19:34:09'),
(6, 1, '$2b$10$AJQazHcKRBLhH0I6YqcGy.erlQ5LLTqz3j6eGfdXs5mZuL5ZKRBd2', '2025-10-26 17:31:35', 1, '2025-10-26 17:21:35'),
(7, 5, '$2b$10$EWAf7jqKvr7ac91pjzQ6puDhodztU3lx.3VBhbsw6fUFV57UcY.du', '2025-10-29 15:27:45', 0, '2025-10-29 15:17:45'),
(8, 5, '$2b$10$xFn2ZHoOdETc.Jw8.DjG2ejK5Fkbt4/i.lXk/yXWvFfqh3fSsILue', '2025-10-29 15:27:47', 0, '2025-10-29 15:17:47');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `capacity` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `sessions`
--

INSERT INTO `sessions` (`id`, `class_id`, `start_time`, `end_time`, `capacity`, `created_at`) VALUES
(8, 19, '2025-11-05 18:00:00', '2025-11-05 20:00:00', 12, '2025-10-21 16:42:25'),
(9, 19, '2025-11-03 18:00:00', '2025-11-03 20:00:00', 14, '2025-10-21 16:43:03'),
(10, 19, '2025-11-07 18:00:00', '2025-11-07 20:00:00', 14, '2025-10-21 16:43:03'),
(11, 19, '2025-11-10 18:00:00', '2025-11-10 20:00:00', 14, '2025-10-21 16:43:03'),
(12, 19, '2025-11-12 18:00:00', '2025-11-12 20:00:00', 14, '2025-10-21 16:43:03'),
(13, 19, '2025-11-14 18:00:00', '2025-11-14 20:00:00', 14, '2025-10-21 16:43:03'),
(14, 19, '2025-11-17 18:00:00', '2025-11-17 20:00:00', 14, '2025-10-21 16:43:03'),
(15, 19, '2025-11-19 18:00:00', '2025-11-19 20:00:00', 14, '2025-10-21 16:43:03'),
(16, 19, '2025-11-21 18:00:00', '2025-11-21 20:00:00', 14, '2025-10-21 16:43:03'),
(17, 19, '2025-11-24 18:00:00', '2025-11-24 20:00:00', 14, '2025-10-21 16:43:03'),
(18, 19, '2025-11-26 18:00:00', '2025-11-26 20:00:00', 14, '2025-10-21 16:43:03'),
(19, 19, '2025-11-28 18:00:00', '2025-11-28 20:00:00', 14, '2025-10-21 16:43:03');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('USER','ADMIN','COACH') NOT NULL DEFAULT 'USER',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `avatar_url`, `password_hash`, `role`, `created_at`, `is_locked`, `is_verified`) VALUES
(1, 'Khanh', 'test1@gmail.com', NULL, '$2b$10$zSZ1o8W3/tRnXBdAt144uOgOTO9uNM6BZ5w1YJ5Gafk6wJEIfJYu6', 'USER', '2025-10-11 15:06:16', 0, 0),
(2, 'Admin', 'admin@gmail.com', NULL, 'y', 'ADMIN', '2025-10-11 15:06:16', 0, 0),
(5, 'Dup', 'dup@gmail.com', NULL, 'x', 'USER', '2025-10-11 15:13:45', 0, 0),
(8, 'User Demo', 'user_demo@example.com', NULL, '$2b$10$oerDFmPaM40n0mdVug7wTu4HU4my0qMXkT/F3YjeEIF6u2XC4jST.', 'USER', '2025-10-17 14:47:22', 0, 0),
(10, 'User Demo', 'user_demo1@example.com', NULL, '$2b$10$lztwC/4tDeV4w5woJefNt.oFEF2rzpiW5ZNd9P3HwcNl6sdnT1Ge6', 'USER', '2025-10-17 15:09:16', 0, 0),
(11, 'Demo User', 'demo+1761035895687@ex.com', NULL, '$2b$10$NYeCtq3uk3mocm5pVvs0HOtZC8wJA4jEyLO..NWR7A3AinvLlixd6', 'USER', '2025-10-21 15:38:16', 0, 0),
(12, 'Demo', 'demo@ex.com', NULL, '$2b$10$qZyJy6o8dwqPfWtzAH29seeanKY5OVL7PB6jcIMFnhMdf4bt41ZUm', 'USER', '2025-10-21 15:40:43', 0, 0),
(13, 'Admin', 'admin@example.com', NULL, '$2b$10$KBaE0nfo8IYsYDeLpHDlFuVN14RNZNRvWdXWF9pD/6Cjz/zwyJPoi', 'COACH', '2025-10-21 15:50:56', 0, 0),
(14, 'Admin', 'admin1@example.com', NULL, '$2b$10$GK1tKKHFTSuS.8p/2dyv9eL3ZOijNROKHecYWb0tu8zg6C.fNVdsS', 'ADMIN', '2025-10-21 16:09:26', 0, 0),
(21, 'khanh', 'khanhcr479@gmail.com', NULL, '$2b$10$9GKN9C0iGpmWwVhGgUxLfO9Eb8cUTpRR.K2dB1HOidWuHH/v1q4gi', 'USER', '2025-11-01 15:54:10', 0, 1),
(22, 'khanh', 'khanhcr3000@gmail.com', NULL, '$2b$10$23W1dzwhhjAQxrR9xNTo0OPL7l.9aVt49NrOS7fKWKiH89B7GEuOy', 'USER', '2025-11-01 15:57:12', 0, 0),
(23, 'khanh', 'khanhcr1007@gmail.com', NULL, '$2b$10$rtTraCh.rgQOKpC4sZVvK.40EQ1zfGBgX/7aPGxsPHvY8ElIVGNKG', 'USER', '2025-11-01 16:02:57', 0, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_tokens`
--

CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `user_tokens`
--

INSERT INTO `user_tokens` (`id`, `user_id`, `refresh_token`, `revoked`, `created_at`) VALUES
(1, 13, 'cb579495656a099391ecbb3ae294766607fed013a785712b32d561d0ec1b8794', 0, '2025-10-21 16:05:37'),
(2, 14, 'c1db465415d06da4d89fb16ffdc9f79133b82cf506e6a0202bbab5f84eaba8ff', 1, '2025-10-21 16:09:32'),
(3, 14, 'f8169e2805ad99ae6be76576e1a000cb22544a64d5305772a543adceed3c8e67', 0, '2025-10-21 16:16:21');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`enrollment_id`);

--
-- Chỉ mục cho bảng `blackout_dates`
--
ALTER TABLE `blackout_dates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_blackout_coach` (`coach_id`),
  ADD KEY `fk_blackout_location` (`location_id`);

--
-- Chỉ mục cho bảng `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_classes_coach` (`coach_id`),
  ADD KEY `idx_classes_level` (`level_id`),
  ADD KEY `idx_classes_category` (`category_id`),
  ADD KEY `idx_classes_location` (`location_id`);

--
-- Chỉ mục cho bảng `class_categories`
--
ALTER TABLE `class_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `class_levels`
--
ALTER TABLE `class_levels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `coaches`
--
ALTER TABLE `coaches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `coach_availabilities`
--
ALTER TABLE `coach_availabilities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_avail` (`coach_id`,`weekday`,`start_time`,`end_time`);

--
-- Chỉ mục cho bảng `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contacts_status` (`status`),
  ADD KEY `fk_contacts_handled_by` (`handled_by`);

--
-- Chỉ mục cho bảng `email_verifications`
--
ALTER TABLE `email_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ev_user` (`user_id`);

--
-- Chỉ mục cho bảng `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_enroll` (`session_id`,`user_id`),
  ADD KEY `idx_enroll_status` (`status`),
  ADD KEY `idx_enroll_user` (`user_id`,`status`,`created_at`),
  ADD KEY `idx_enroll_session` (`session_id`,`status`,`created_at`);

--
-- Chỉ mục cho bảng `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`,`is_read`,`created_at`);

--
-- Chỉ mục cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_resets_user` (`user_id`);

--
-- Chỉ mục cho bảng `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sessions_time` (`start_time`,`end_time`),
  ADD KEY `idx_sessions_class` (`class_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uniq_users_email` (`email`);

--
-- Chỉ mục cho bảng `user_tokens`
--
ALTER TABLE `user_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_tokens_user` (`user_id`),
  ADD KEY `idx_user_tokens_token` (`refresh_token`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `blackout_dates`
--
ALTER TABLE `blackout_dates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `class_categories`
--
ALTER TABLE `class_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `class_levels`
--
ALTER TABLE `class_levels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `coaches`
--
ALTER TABLE `coaches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `coach_availabilities`
--
ALTER TABLE `coach_availabilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `email_verifications`
--
ALTER TABLE `email_verifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT cho bảng `user_tokens`
--
ALTER TABLE `user_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `fk_attendance_enroll` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `blackout_dates`
--
ALTER TABLE `blackout_dates`
  ADD CONSTRAINT `fk_blackout_coach` FOREIGN KEY (`coach_id`) REFERENCES `coaches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_blackout_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `fk_classes_category` FOREIGN KEY (`category_id`) REFERENCES `class_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_classes_coach` FOREIGN KEY (`coach_id`) REFERENCES `coaches` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_classes_level` FOREIGN KEY (`level_id`) REFERENCES `class_levels` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_classes_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `coach_availabilities`
--
ALTER TABLE `coach_availabilities`
  ADD CONSTRAINT `fk_avail_coach` FOREIGN KEY (`coach_id`) REFERENCES `coaches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `fk_contacts_handled_by` FOREIGN KEY (`handled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `email_verifications`
--
ALTER TABLE `email_verifications`
  ADD CONSTRAINT `fk_ev_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `fk_enroll_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_enroll_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `fk_sessions_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `user_tokens`
--
ALTER TABLE `user_tokens`
  ADD CONSTRAINT `fk_user_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
