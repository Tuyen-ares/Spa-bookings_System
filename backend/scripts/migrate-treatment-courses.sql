-- Migration script to upgrade treatment_courses table for Phase 1
-- Run this with: mysql -h 127.0.0.1 -P 3307 -u root -p anhthospa_db < migrate-treatment-courses.sql

-- 1. Update status ENUM to include new values
ALTER TABLE treatment_courses 
MODIFY COLUMN status ENUM('draft', 'active', 'paused', 'completed', 'expired', 'cancelled') 
NOT NULL DEFAULT 'active' 
COMMENT 'Trạng thái liệu trình';

-- 2. Add new tracking columns
ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS progressPercentage INT NOT NULL DEFAULT 0 
  COMMENT 'Phần trăm hoàn thành (0-100)';

ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS completedSessions INT NOT NULL DEFAULT 0 
  COMMENT 'Số buổi đã hoàn thành';

ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS lastCompletedDate DATETIME NULL 
  COMMENT 'Ngày hoàn thành buổi cuối cùng';

-- 3. Add treatment goals and initial condition
ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS treatmentGoals TEXT NULL 
  COMMENT 'Mục tiêu điều trị';

ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS initialSkinCondition TEXT NULL 
  COMMENT 'Tình trạng da ban đầu';

-- 4. Add consultant information
ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS consultantId VARCHAR(255) NULL 
  COMMENT 'ID chuyên viên tư vấn';

ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS consultantName VARCHAR(255) NULL 
  COMMENT 'Tên chuyên viên tư vấn';

-- 5. Add pause/resume tracking
ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS isPaused BOOLEAN NOT NULL DEFAULT FALSE 
  COMMENT 'Liệu trình có đang tạm dừng không';

ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS pauseReason TEXT NULL 
  COMMENT 'Lý do tạm dừng';

ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS pausedDate DATETIME NULL 
  COMMENT 'Ngày bắt đầu tạm dừng';

ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS resumedDate DATETIME NULL 
  COMMENT 'Ngày tiếp tục sau khi tạm dừng';

-- 6. Add date tracking
ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS startDate DATE NULL 
  COMMENT 'Ngày bắt đầu liệu trình';

ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS actualCompletionDate DATETIME NULL 
  COMMENT 'Ngày hoàn thành thực tế';

-- 7. Add reminders history
ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS remindersSent JSON NULL 
  COMMENT 'Lịch sử các reminder đã gửi';

-- 8. Add timestamps if not exists
ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 9. Update existing records to calculate progress
UPDATE treatment_courses tc
SET 
  completedSessions = (
    SELECT COUNT(*) 
    FROM treatment_sessions ts 
    WHERE ts.treatmentCourseId = tc.id 
    AND ts.status = 'completed'
  ),
  progressPercentage = CASE 
    WHEN tc.totalSessions > 0 THEN 
      ROUND((
        SELECT COUNT(*) 
        FROM treatment_sessions ts 
        WHERE ts.treatmentCourseId = tc.id 
        AND ts.status = 'completed'
      ) * 100.0 / tc.totalSessions)
    ELSE 0 
  END,
  lastCompletedDate = (
    SELECT MAX(completedDate)
    FROM treatment_sessions ts
    WHERE ts.treatmentCourseId = tc.id
    AND ts.status = 'completed'
  )
WHERE tc.id IS NOT NULL;

-- 10. Update status based on completion
UPDATE treatment_courses
SET status = 'completed'
WHERE completedSessions >= totalSessions
AND status = 'active';

-- 11. Update status to expired if past expiry date
UPDATE treatment_courses
SET status = 'expired'
WHERE expiryDate < CURDATE()
AND status = 'active'
AND completedSessions < totalSessions;

SELECT 'Migration completed successfully!' AS result;
