import { pool } from "../db.js";

const ensured = {
  userProfiles: false,
  passwordOtps: false,
  payments: false,
};

export async function ensureUserProfilesTable() {
  if (ensured.userProfiles) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id INT PRIMARY KEY,
      phone VARCHAR(30) NULL,
      address VARCHAR(255) NULL,
      date_of_birth DATE NULL,
      gender ENUM('MALE','FEMALE','OTHER','UNSPECIFIED') DEFAULT 'UNSPECIFIED',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);
  ensured.userProfiles = true;
}

export async function ensurePasswordOtpTable() {
  if (ensured.passwordOtps) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_password_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_pw_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_pw_otp_user (user_id),
      INDEX idx_pw_otp_exp (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);
  ensured.passwordOtps = true;
}

export async function ensurePaymentsTable() {
  if (ensured.payments) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      enrollment_id INT NOT NULL,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
      status ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
      transaction_code VARCHAR(100) NULL,
      note VARCHAR(255) NULL,
      paid_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_pay_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
      INDEX idx_pay_enrollment (enrollment_id),
      INDEX idx_pay_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);
  ensured.payments = true;
}
