-- =====================================================
-- Migration Script: Treatment Course System Enhancement
-- Mục đích: Tạo hệ thống liệu trình hoàn chỉnh
-- =====================================================

-- 1. Tạo bảng treatment_packages (Template liệu trình do Admin tạo)
CREATE TABLE IF NOT EXISTS treatment_packages (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Tên gói liệu trình (VD: Phục hồi da)',
    description TEXT COMMENT 'Mô tả chi tiết',
    price DECIMAL(10,2) NOT NULL COMMENT 'Giá gói',
    originalPrice DECIMAL(10,2) COMMENT 'Giá gốc (để hiển thị giảm giá)',
    totalSessions INT NOT NULL DEFAULT 5 COMMENT 'Tổng số buổi',
    duration INT COMMENT 'Thời hạn sử dụng (số ngày, VD: 180 = 6 tháng)',
    benefits TEXT COMMENT 'Lợi ích (JSON array)',
    imageUrl VARCHAR(500) COMMENT 'Hình ảnh gói liệu trình',
    isActive BOOLEAN DEFAULT TRUE COMMENT 'Đang hoạt động',
    isFeatured BOOLEAN DEFAULT FALSE COMMENT 'Nổi bật',
    displayOrder INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
    minSessionsPerWeek INT DEFAULT 1 COMMENT 'Số buổi/tuần tối thiểu',
    maxSessionsPerWeek INT DEFAULT 3 COMMENT 'Số buổi/tuần tối đa',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (isActive),
    INDEX idx_featured (isFeatured),
    INDEX idx_order (displayOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tạo bảng treatment_package_services (Dịch vụ cho từng buổi trong template)
CREATE TABLE IF NOT EXISTS treatment_package_services (
    id VARCHAR(255) PRIMARY KEY,
    packageId VARCHAR(255) NOT NULL COMMENT 'ID gói liệu trình',
    sessionNumber INT NOT NULL COMMENT 'Số thứ tự buổi (1, 2, 3...)',
    serviceId VARCHAR(255) NOT NULL COMMENT 'ID dịch vụ cho buổi này',
    serviceName VARCHAR(255) COMMENT 'Tên dịch vụ (để hiển thị nhanh)',
    duration INT DEFAULT 60 COMMENT 'Thời lượng buổi (phút)',
    notes TEXT COMMENT 'Ghi chú cho buổi này',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (packageId) REFERENCES treatment_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE RESTRICT,
    INDEX idx_package (packageId),
    INDEX idx_session (packageId, sessionNumber),
    UNIQUE KEY unique_package_session (packageId, sessionNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Cập nhật bảng treatment_courses (Liệu trình thực tế của khách hàng)
-- Đảm bảo có đầy đủ các cột cần thiết
ALTER TABLE treatment_courses 
ADD COLUMN IF NOT EXISTS packageId VARCHAR(255) COMMENT 'ID gói liệu trình mẫu' AFTER id,
ADD COLUMN IF NOT EXISTS expiryDate DATE COMMENT 'Hạn sử dụng' AFTER status,
ADD COLUMN IF NOT EXISTS purchaseDate DATE COMMENT 'Ngày mua' AFTER expiryDate,
ADD COLUMN IF NOT EXISTS completedSessions INT DEFAULT 0 COMMENT 'Số buổi đã hoàn thành' AFTER totalSessions,
ADD COLUMN IF NOT EXISTS progressPercentage INT DEFAULT 0 COMMENT 'Phần trăm hoàn thành (0-100)' AFTER completedSessions,
ADD COLUMN IF NOT EXISTS nextAppointmentDate DATE COMMENT 'Ngày hẹn buổi tiếp theo' AFTER progressPercentage,
ADD COLUMN IF NOT EXISTS lastCompletedDate TIMESTAMP COMMENT 'Ngày hoàn thành buổi cuối' AFTER nextAppointmentDate,
ADD COLUMN IF NOT EXISTS treatmentHistory JSON COMMENT 'Lịch sử trị liệu [{sessionNumber, date, notes, skinCondition}]' AFTER lastCompletedDate,
ADD COLUMN IF NOT EXISTS consultantNotes TEXT COMMENT 'Ghi chú tư vấn' AFTER treatmentHistory;

-- Thêm foreign key cho packageId
ALTER TABLE treatment_courses
ADD CONSTRAINT fk_treatment_course_package 
FOREIGN KEY (packageId) REFERENCES treatment_packages(id) ON DELETE SET NULL;

-- 4. Tạo bảng treatment_course_sessions (Chi tiết từng buổi của khách hàng)
CREATE TABLE IF NOT EXISTS treatment_course_sessions (
    id VARCHAR(255) PRIMARY KEY,
    courseId VARCHAR(255) NOT NULL COMMENT 'ID liệu trình của khách',
    sessionNumber INT NOT NULL COMMENT 'Số thứ tự buổi',
    serviceId VARCHAR(255) NOT NULL COMMENT 'Dịch vụ sử dụng cho buổi này',
    serviceName VARCHAR(255) COMMENT 'Tên dịch vụ',
    appointmentId VARCHAR(255) COMMENT 'ID lịch hẹn cho buổi này',
    status ENUM('pending', 'scheduled', 'completed', 'cancelled', 'no-show') DEFAULT 'pending' COMMENT 'Trạng thái buổi',
    scheduledDate DATE COMMENT 'Ngày đã đặt lịch',
    scheduledTime VARCHAR(10) COMMENT 'Giờ đã đặt lịch',
    completedDate TIMESTAMP COMMENT 'Ngày hoàn thành thực tế',
    therapistId VARCHAR(255) COMMENT 'ID kỹ thuật viên thực hiện',
    therapistName VARCHAR(255) COMMENT 'Tên kỹ thuật viên',
    skinConditionBefore TEXT COMMENT 'Tình trạng da trước buổi',
    skinConditionAfter TEXT COMMENT 'Tình trạng da sau buổi',
    treatmentNotes TEXT COMMENT 'Ghi chú trị liệu buổi này',
    photos JSON COMMENT 'Ảnh trước/sau [{type: "before"/"after", url}]',
    nextSessionAdvice TEXT COMMENT 'Tư vấn cho buổi tiếp theo',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES treatment_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE RESTRICT,
    FOREIGN KEY (appointmentId) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_course (courseId),
    INDEX idx_session (courseId, sessionNumber),
    INDEX idx_status (status),
    UNIQUE KEY unique_course_session (courseId, sessionNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tạo bảng treatment_reminders (Thông báo nhắc nhở)
CREATE TABLE IF NOT EXISTS treatment_reminders (
    id VARCHAR(255) PRIMARY KEY,
    courseId VARCHAR(255) NOT NULL COMMENT 'ID liệu trình',
    clientId VARCHAR(255) NOT NULL COMMENT 'ID khách hàng',
    sessionNumber INT COMMENT 'Buổi tiếp theo cần đặt',
    reminderType ENUM('next_session', 'expiry_warning', 'missed_appointment', 'completion') NOT NULL COMMENT 'Loại nhắc nhở',
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo',
    message TEXT NOT NULL COMMENT 'Nội dung thông báo',
    scheduledDate DATE COMMENT 'Ngày gợi ý đặt lịch',
    sentDate TIMESTAMP COMMENT 'Ngày gửi thông báo',
    isRead BOOLEAN DEFAULT FALSE COMMENT 'Đã đọc chưa',
    isSent BOOLEAN DEFAULT FALSE COMMENT 'Đã gửi chưa',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseId) REFERENCES treatment_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_client (clientId),
    INDEX idx_course (courseId),
    INDEX idx_sent (isSent, scheduledDate),
    INDEX idx_read (isRead)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Insert dữ liệu mẫu cho treatment_packages
INSERT INTO treatment_packages (id, name, description, price, originalPrice, totalSessions, duration, benefits, imageUrl, isActive, isFeatured, displayOrder) VALUES
('pkg-001', 'Phục Hồi Da Toàn Diện', 'Liệu trình 5 buổi giúp phục hồi da hư tổn, cải thiện độ đàn hồi và làm sáng da', 2500000, 3000000, 5, 180, 
 '["Làm sạch sâu và tái tạo da", "Cải thiện độ đàn hồi 80%", "Giảm thâm nám rõ rệt", "Làm sáng da tự nhiên", "Tư vấn chăm sóc da tận tình"]',
 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500', TRUE, TRUE, 1),

('pkg-002', 'Trị Mụn Chuyên Sâu', 'Liệu trình 7 buổi điều trị mụn hiệu quả, kiểm soát bã nhờn và se khít lỗ chân lông', 3200000, 3800000, 7, 180,
 '["Giảm mụn 90% sau liệu trình", "Kiểm soát bã nhờn hiệu quả", "Se khít lỗ chân lông", "Ngăn ngừa mụn tái phát", "Hỗ trợ làm mờ thâm"]',
 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500', TRUE, TRUE, 2),

('pkg-003', 'Chống Lão Hóa Căng Bóng', 'Liệu trình 6 buổi chống lão hóa, tăng collagen và làm căng bóng da', 4500000, 5500000, 6, 180,
 '["Tăng collagen tự nhiên", "Giảm nếp nhăn rõ rệt", "Nâng cơ mặt", "Làm căng bóng da", "Dưỡng ẩm sâu"]',
 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500', TRUE, FALSE, 3);

-- 7. Insert dịch vụ cho từng buổi của package 'Phục Hồi Da Toàn Diện'
INSERT INTO treatment_package_services (id, packageId, sessionNumber, serviceId, serviceName, duration, notes) VALUES
('pkg001-s1', 'pkg-001', 1, 'svc-facial-basic', 'Chăm sóc da mặt cơ bản', 60, 'Buổi 1: Làm sạch sâu, đánh giá tình trạng da'),
('pkg001-s2', 'pkg-001', 2, 'svc-facial-deep-cleanse', 'Chăm sóc da sâu', 90, 'Buổi 2: Tẩy da chết, điều trị chuyên sâu'),
('pkg001-s3', 'pkg-001', 3, 'svc-skin-rejuvenation', 'Trẻ hóa da', 75, 'Buổi 3: Tái tạo da, cấp ẩm'),
('pkg001-s4', 'pkg-001', 4, 'svc-facial-basic', 'Chăm sóc da mặt cơ bản', 60, 'Buổi 4: Dưỡng trắng, làm sáng da'),
('pkg001-s5', 'pkg-001', 5, 'svc-facial-deep-cleanse', 'Chăm sóc da sâu', 90, 'Buổi 5: Hoàn thiện, tư vấn chăm sóc sau liệu trình');

-- 8. Insert dịch vụ cho package 'Trị Mụn Chuyên Sâu'
INSERT INTO treatment_package_services (id, packageId, sessionNumber, serviceId, serviceName, duration, notes) VALUES
('pkg002-s1', 'pkg-002', 1, 'svc-acne-treatment', 'Điều trị mụn', 75, 'Buổi 1: Đánh giá mụn, làm sạch'),
('pkg002-s2', 'pkg-002', 2, 'svc-acne-treatment', 'Điều trị mụn', 75, 'Buổi 2: Nặn mụn, kháng khuẩn'),
('pkg002-s3', 'pkg-002', 3, 'svc-facial-deep-cleanse', 'Chăm sóc da sâu', 90, 'Buổi 3: Tái tạo da, giảm thâm'),
('pkg002-s4', 'pkg-002', 4, 'svc-acne-treatment', 'Điều trị mụn', 75, 'Buổi 4: Điều trị tiếp tục'),
('pkg002-s5', 'pkg-002', 5, 'svc-facial-deep-cleanse', 'Chăm sóc da sâu', 90, 'Buổi 5: Se khít lỗ chân lông'),
('pkg002-s6', 'pkg-002', 6, 'svc-acne-treatment', 'Điều trị mụn', 75, 'Buổi 6: Hoàn thiện điều trị'),
('pkg002-s7', 'pkg-002', 7, 'svc-facial-basic', 'Chăm sóc da mặt cơ bản', 60, 'Buổi 7: Tư vấn chăm sóc sau liệu trình');

-- =====================================================
-- DONE: Migration completed!
-- =====================================================
