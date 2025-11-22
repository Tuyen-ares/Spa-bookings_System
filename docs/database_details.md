# DATABASE DETAILED ANALYSIS / PHÂN TÍCH CHI TIẾT DATABASE

## Overview / Tổng Quan

| English | Tiếng Việt |
|---------|------------|
| This document provides a comprehensive analysis of the database schema for Anh Thơ Spa Management System. The database uses MySQL with InnoDB engine, supporting foreign keys, transactions, and referential integrity. | Tài liệu này cung cấp phân tích toàn diện về schema database cho Hệ thống Quản lý Spa Anh Thơ. Database sử dụng MySQL với engine InnoDB, hỗ trợ foreign keys, transactions và tính toàn vẹn tham chiếu. |

---

## Database Configuration / Cấu Hình Database

| English | Tiếng Việt |
|---------|------------|
| **Database Name**: `anhthospa_db` | **Tên Database**: `anhthospa_db` |
| **Character Set**: `utf8mb4` - Supports emoji and special characters | **Bộ Ký Tự**: `utf8mb4` - Hỗ trợ emoji và ký tự đặc biệt |
| **Collation**: `utf8mb4_unicode_ci` - Case-insensitive Unicode collation | **Collation**: `utf8mb4_unicode_ci` - So sánh Unicode không phân biệt hoa thường |
| **Engine**: `InnoDB` - Supports foreign keys, transactions, row-level locking | **Engine**: `InnoDB` - Hỗ trợ foreign keys, transactions, khóa mức hàng |

---

## Table Analysis / Phân Tích Bảng

### 1. Users Table / Bảng Người Dùng

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Stores all user accounts (Admin, Staff, Clients) | **Mục Đích**: Lưu trữ tất cả tài khoản người dùng (Admin, Staff, Clients) |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| **Unique Constraints**: `email` must be unique | **Ràng Buộc Duy Nhất**: `email` phải duy nhất |
| | |
| `id` | ID duy nhất của người dùng |
| `name` | Tên người dùng |
| `email` | Email đăng nhập (phải duy nhất) |
| `password` | Mật khẩu đã hash bằng bcrypt (KHÔNG phải plain text) |
| `phone` | Số điện thoại |
| `profilePictureUrl` | URL ảnh đại diện |
| `joinDate` | Ngày tham gia |
| `birthday` | Ngày sinh |
| `gender` | Giới tính |
| `role` (ENUM: 'Admin', 'Staff', 'Client') | Vai trò người dùng trong hệ thống |
| `status` (ENUM: 'Active', 'Inactive', 'Locked') | Trạng thái tài khoản (Hoạt động, Không hoạt động, Bị khóa) |
| `lastLogin` | Lần đăng nhập cuối cùng |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_users_email` on `email` | - `idx_users_email` trên `email` (tra cứu email nhanh) |
| - `idx_users_role` on `role` | - `idx_users_role` trên `role` (lọc theo vai trò) |

---

### 2. Service Categories Table / Bảng Danh Mục Dịch Vụ

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Categorizes spa services | **Mục Đích**: Phân loại các dịch vụ spa |
| **Primary Key**: `id` (INT AUTO_INCREMENT) | **Khóa Chính**: `id` (INT AUTO_INCREMENT) |
| | |
| `id` | ID tự tăng của danh mục |
| `name` (UNIQUE) | Tên danh mục (phải duy nhất, VD: "Massage", "Skincare") |
| `description` | Mô tả danh mục |
| `displayOrder` (INT) | Thứ tự hiển thị trong giao diện (số nhỏ hiển thị trước) |
| | |
| **Relationships**: | **Quan Hệ**: |
| - One-to-Many with `services` (one category has many services) | - One-to-Many với `services` (một danh mục có nhiều dịch vụ) |

---

### 3. Services Table / Bảng Dịch Vụ

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Stores all spa services offered | **Mục Đích**: Lưu trữ tất cả dịch vụ spa được cung cấp |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| | |
| `id` | ID duy nhất của dịch vụ |
| `name` | Tên dịch vụ |
| `description` | Mô tả về dịch vụ |
| `price` (DECIMAL(10,2)) | Giá gốc của dịch vụ (VND) |
| `discountPercent` (INT) | Phần trăm giảm giá (0-100) |
| `duration` (INT) | Thời gian dịch vụ tính bằng phút |
| `categoryId` → `service_categories.id` (FK, ON DELETE SET NULL) | ID danh mục dịch vụ (khóa ngoại) |
| `imageUrl` (VARCHAR(500)) | URL hình ảnh dịch vụ |
| `rating` (FLOAT) | Điểm đánh giá trung bình (tính từ reviews, 0-5) |
| `reviewCount` (INT) | Số lượng đánh giá đã nhận |
| `isActive` (BOOLEAN) | Dịch vụ có đang hoạt động không |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_services_category` on `categoryId` | - `idx_services_category` trên `categoryId` (lọc theo danh mục) |
| - `idx_services_name` on `name` | - `idx_services_name` trên `name` (tìm kiếm theo tên) |

---

### 4. Appointments Table / Bảng Lịch Hẹn

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Manages customer appointments/bookings | **Mục Đích**: Quản lý lịch hẹn/đặt chỗ của khách hàng |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| | |
| `id` | ID duy nhất của lịch hẹn |
| `serviceId` → `services.id` (FK, ON DELETE CASCADE) | ID dịch vụ được đặt (khóa ngoại) |
| `serviceName` | Tên dịch vụ (denormalized để hiển thị nhanh) |
| `userId` → `users.id` (FK, ON DELETE CASCADE) | ID khách hàng đặt lịch (khóa ngoại) |
| `date` (DATE) | Ngày lịch hẹn (YYYY-MM-DD) |
| `time` (VARCHAR(10)) | Giờ lịch hẹn (HH:MM) |
| `status` (ENUM: 'upcoming', 'completed', 'cancelled', 'pending', 'in-progress', 'scheduled') | Trạng thái lịch hẹn (sắp tới, đã hoàn thành, đã hủy, chờ xử lý, đang thực hiện, đã lên lịch) |
| `paymentStatus` (ENUM: 'Paid', 'Unpaid') | Trạng thái thanh toán (Đã thanh toán, Chưa thanh toán) |
| `therapistId` → `users.id` (FK, ON DELETE SET NULL) | ID nhân viên được gán (khóa ngoại) |
| `notesForTherapist` (TEXT) | Ghi chú cho nhân viên trước buổi điều trị |
| `staffNotesAfterSession` (TEXT) | Ghi chú của nhân viên sau buổi điều trị |
| `rejectionReason` (TEXT) | Lý do từ chối/hủy lịch hẹn |
| `bookingGroupId` (VARCHAR(255)) | ID nhóm booking (nếu đặt nhiều dịch vụ cùng lúc) |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_app_user_date` on `(userId, date)` | - `idx_app_user_date` trên `(userId, date)` (truy vấn lịch hẹn theo user và ngày) |
| - `idx_app_therapist_date` on `(therapistId, date)` | - `idx_app_therapist_date` trên `(therapistId, date)` (truy vấn lịch hẹn theo nhân viên và ngày) |
| - `idx_app_status` on `status` | - `idx_app_status` trên `status` (lọc theo trạng thái) |

---

### 5. Treatment Courses Table / Bảng Liệu Trình Điều Trị

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Active treatment courses enrolled by customers (gắn liền với dịch vụ) | **Mục Đích**: Liệu trình điều trị đang hoạt động được khách hàng đăng ký (gắn liền với dịch vụ) |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| | |
| `id` | ID duy nhất của liệu trình |
| `serviceId` → `services.id` (FK, ON DELETE CASCADE) | ID dịch vụ (liệu trình gắn liền với dịch vụ) |
| `serviceName` | Tên dịch vụ (denormalized) |
| `clientId` → `users.id` (FK, ON DELETE CASCADE) | ID khách hàng (BẮT BUỘC, không còn NULL) |
| `totalSessions` (INT) | Tổng số buổi (dựa trên số lượng khách chọn khi đặt lịch) |
| `completedSessions` (INT) | Số buổi đã hoàn thành (mặc định: 0) |
| `startDate` (DATE) | Ngày bắt đầu (từ ngày đặt lịch) |
| `durationWeeks` (INT) | Số tuần (mặc định: số dịch vụ + 1, admin có thể chỉnh) |
| `expiryDate` (DATE) | Hạn sử dụng (startDate + durationWeeks) |
| `frequencyType` (ENUM: 'weeks_per_session', 'sessions_per_week') | Loại tần suất: weeks_per_session = mấy tuần 1 lần, sessions_per_week = mấy lần 1 tuần |
| `frequencyValue` (INT) | Giá trị tần suất (ví dụ: 2 tuần 1 lần hoặc 2 lần/tuần) |
| `therapistId` → `users.id` (FK, ON DELETE SET NULL) | ID nhân viên phụ trách (khóa ngoại) |
| `status` (ENUM: 'active', 'completed', 'expired', 'cancelled') | Trạng thái liệu trình (Hoạt động, Hoàn thành, Hết hạn, Đã hủy) |
| `notes` (TEXT) | Ghi chú tổng quan |
| `createdAt` (DATETIME) | Ngày tạo liệu trình |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_tc_service` on `serviceId` | - `idx_tc_service` trên `serviceId` (lọc theo dịch vụ) |
| - `idx_tc_client` on `clientId` | - `idx_tc_client` trên `clientId` (lấy liệu trình của khách hàng) |
| - `idx_tc_status` on `status` | - `idx_tc_status` trên `status` (lọc theo trạng thái) |
| - `idx_tc_expiry` on `expiryDate` | - `idx_tc_expiry` trên `expiryDate` (kiểm tra liệu trình hết hạn) |
| **Note**: Liệu trình gắn liền với dịch vụ. Admin quy định tần suất và thời gian. | **Lưu Ý**: Liệu trình gắn liền với dịch vụ. Admin quy định tần suất và thời gian. |

---

### 6. Treatment Sessions Table / Bảng Các Buổi Điều Trị

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Individual treatment sessions within a treatment course | **Mục Đích**: Các buổi điều trị riêng lẻ trong một liệu trình |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| | |
| `id` | ID duy nhất của buổi điều trị |
| `treatmentCourseId` → `treatment_courses.id` (FK, ON DELETE CASCADE) | ID liệu trình (khóa ngoại) |
| `appointmentId` → `appointments.id` (FK, ON DELETE SET NULL) | ID lịch hẹn (liên kết với appointments) |
| `sessionNumber` (INT) | Số thứ tự buổi (1, 2, 3, ...) |
| `status` (ENUM: 'scheduled', 'completed', 'cancelled', 'missed') | Trạng thái buổi điều trị (Đã lên lịch, Đã hoàn thành, Đã hủy, Đã bỏ lỡ) |
| `sessionDate` (DATE) | Ngày thực hiện |
| `sessionTime` (VARCHAR(10)) | Giờ thực hiện (HH:MM) |
| `staffId` → `users.id` (FK, ON DELETE SET NULL) | ID nhân viên thực hiện (khóa ngoại) |
| `customerStatusNotes` (TEXT) | Ghi chú tình trạng khách (TEXT, không phải ENUM) - Ví dụ: "Khách ổn, da sáng hơn, không có kích ứng" |
| `adminNotes` (TEXT) | Ghi chú của admin sau buổi |
| `completedAt` (DATETIME) | Ngày hoàn thành |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_ts_course` on `treatmentCourseId` | - `idx_ts_course` trên `treatmentCourseId` (lấy tất cả buổi của liệu trình) |
| - `idx_ts_appointment` on `appointmentId` | - `idx_ts_appointment` trên `appointmentId` (liên kết với appointment) |
| - `idx_ts_date` on `sessionDate` | - `idx_ts_date` trên `sessionDate` (lọc theo ngày) |
| - `idx_ts_status` on `status` | - `idx_ts_status` trên `status` (lọc theo trạng thái) |
| **Note**: Mỗi buổi điều trị = 1 appointment. Ghi chú tình trạng khách dùng TEXT, không dùng ENUM. | **Lưu Ý**: Mỗi buổi điều trị = 1 appointment. Ghi chú tình trạng khách dùng TEXT, không dùng ENUM. |

---

### 7. Payments Table / Bảng Thanh Toán

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Records all payment transactions | **Mục Đích**: Ghi lại tất cả giao dịch thanh toán |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| | |
| `id` | ID duy nhất của thanh toán |
| `transactionId` | ID giao dịch từ payment gateway (VNPay, Momo, etc.) |
| `userId` → `users.id` (FK, ON DELETE CASCADE) | ID khách hàng thanh toán (khóa ngoại) |
| `appointmentId` → `appointments.id` (FK, ON DELETE SET NULL) | ID lịch hẹn liên quan (khóa ngoại) |
| `serviceName` | Tên dịch vụ (denormalized) |
| `amount` (DECIMAL(10,2)) | Số tiền thanh toán (VND) |
| `method` (ENUM: 'Cash', 'Card', 'Momo', 'VNPay', 'ZaloPay') | Phương thức thanh toán (Tiền mặt, Thẻ, Momo, VNPay, ZaloPay) |
| `status` (ENUM: 'Completed', 'Pending', 'Refunded', 'Failed') | Trạng thái thanh toán (Đã hoàn thành, Đang chờ, Đã hoàn tiền, Thất bại) |
| `date` (DATETIME) | Ngày giờ thanh toán |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_pay_date` on `date` | - `idx_pay_date` trên `date` (truy vấn theo ngày) |
| - `idx_pay_user` on `userId` | - `idx_pay_user` trên `userId` (truy vấn theo khách hàng) |

---

### 8. Wallets Table / Bảng Ví Điện Tử

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Manages customer loyalty points and spending | **Mục Đích**: Quản lý điểm tích lũy và chi tiêu của khách hàng |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| **Unique Constraint**: `userId` must be unique (One-to-One with users) | **Ràng Buộc Duy Nhất**: `userId` phải duy nhất (One-to-One với users) |
| | |
| `id` | ID duy nhất của ví |
| `userId` → `users.id` (FK, UNIQUE, ON DELETE CASCADE) | ID khách hàng sở hữu ví (khóa ngoại, duy nhất - mỗi user 1 ví) |
| `points` (INT) | Điểm tích lũy hiện tại |
| `totalSpent` (DECIMAL(10,2)) | Tổng số tiền đã chi tiêu (VND) |
| `lastUpdated` (DATETIME) | Lần cập nhật cuối cùng |
| | |
| **Note**: Migration uses `id` as primary key, but model uses `userId` as primary key. Schema follows migration structure. | **Lưu Ý**: Migration dùng `id` làm primary key, nhưng model dùng `userId` làm primary key. Schema theo cấu trúc migration. |

---

### 9. Promotions Table / Bảng Khuyến Mãi

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Stores discount codes and promotional offers | **Mục Đích**: Lưu trữ mã giảm giá và ưu đãi khuyến mãi |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| **Unique Constraint**: `code` must be unique | **Ràng Buộc Duy Nhất**: `code` phải duy nhất |
| | |
| `id` | ID duy nhất của khuyến mãi |
| `title` | Tiêu đề khuyến mãi |
| `description` | Mô tả khuyến mãi |
| `code` (UNIQUE) | Mã khuyến mãi (phải duy nhất, VD: "FACIAL20") |
| `expiryDate` (DATE) | Ngày hết hạn khuyến mãi |
| `imageUrl` (VARCHAR(500)) | URL hình ảnh khuyến mãi |
| `discountType` (ENUM: 'percentage', 'fixed') | Loại giảm giá (Phần trăm hoặc Số tiền cố định) |
| `discountValue` (DECIMAL(10,2)) | Giá trị giảm giá (phần trăm hoặc số tiền) |
| `termsAndConditions` (TEXT) | Điều khoản và điều kiện |
| `targetAudience` (ENUM: 'All', 'New Clients', 'Birthday') | Đối tượng áp dụng (Tất cả, Khách hàng mới, Sinh nhật, Nhóm, VIP, Cấp độ 1-3) |
| `applicableServiceIds` (JSON) | Mảng JSON các ID dịch vụ áp dụng (rỗng = tất cả dịch vụ) |
| `minOrderValue` (DECIMAL(10,2)) | Giá trị đơn hàng tối thiểu để áp dụng |
| `usageCount` (INT) | Số lần đã sử dụng |
| `usageLimit` (INT, NULL = unlimited) | Số lần sử dụng tối đa (NULL = không giới hạn) |
| `stock` (INT, NULL = unlimited) | Số lượng voucher còn lại (NULL = không giới hạn) |
| `isActive` (BOOLEAN) | Khuyến mãi có đang hoạt động không |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_promo_code` on `code` | - `idx_promo_code` trên `code` (tìm kiếm mã nhanh) |
| - `idx_promo_active` on `isActive` | - `idx_promo_active` trên `isActive` (lọc khuyến mãi đang hoạt động) |

---

### 10. Notifications Table / Bảng Thông Báo

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Stores user notifications (appointments, promotions, treatment reminders) | **Mục Đích**: Lưu trữ thông báo cho người dùng (lịch hẹn, khuyến mãi, nhắc nhở liệu trình) |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| | |
| `id` | ID duy nhất của thông báo |
| `userId` → `users.id` (FK, ON DELETE CASCADE) | ID người dùng nhận thông báo (khóa ngoại) |
| `type` (ENUM: 'new_appointment', 'appointment_confirmed', 'appointment_cancelled', 'appointment_reminder', 'treatment_course_reminder', 'promotion', 'payment_success', 'payment_received', 'system') | Loại thông báo |
| `title` | Tiêu đề thông báo |
| `message` (TEXT) | Nội dung thông báo |
| `relatedId` (VARCHAR(255)) | ID liên quan (appointment, treatment course, etc.) |
| `isRead` (BOOLEAN) | Đã đọc chưa |
| `emailSent` (BOOLEAN) | Đã gửi email chưa |
| `createdAt` (DATETIME) | Ngày tạo thông báo |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_notif_user` on `userId` | - `idx_notif_user` trên `userId` (lấy thông báo của user) |
| - `idx_notif_read` on `isRead` | - `idx_notif_read` trên `isRead` (lọc thông báo chưa đọc) |
| **Note**: Supports treatment course reminders via `type = 'treatment_course_reminder'` | **Lưu Ý**: Hỗ trợ nhắc nhở liệu trình qua `type = 'treatment_course_reminder'` |

---

### 11. Reviews Table / Bảng Đánh Giá

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Stores customer reviews and ratings for services | **Mục Đích**: Lưu trữ đánh giá và điểm số của khách hàng cho dịch vụ |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| **Unique Constraint**: `appointmentId` must be unique (one review per appointment) | **Ràng Buộc Duy Nhất**: `appointmentId` phải duy nhất (một đánh giá mỗi lịch hẹn) |
| | |
| `id` | ID duy nhất của đánh giá |
| `userId` → `users.id` (FK, ON DELETE CASCADE) | ID khách hàng đánh giá (khóa ngoại) |
| `serviceId` → `services.id` (FK, ON DELETE CASCADE) | ID dịch vụ được đánh giá (khóa ngoại) |
| `appointmentId` → `appointments.id` (FK, UNIQUE, ON DELETE SET NULL) | ID lịch hẹn liên quan (khóa ngoại, duy nhất - mỗi appointment 1 review) |
| `rating` (INT, CHECK: 1-5) | Điểm đánh giá từ 1 đến 5 sao |
| `comment` (TEXT) | Nội dung đánh giá (bình luận của khách hàng) |
| `date` (DATETIME) | Ngày giờ đánh giá (mặc định: CURRENT_TIMESTAMP) |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_review_service` on `serviceId` | - `idx_review_service` trên `serviceId` (lấy tất cả đánh giá của dịch vụ) |
| - `idx_review_user` on `userId` | - `idx_review_user` trên `userId` (lấy tất cả đánh giá của user) |

---

### 12. Staff Shifts Table / Bảng Ca Làm Việc

| Field Name / Tên Trường | Description / Mô Tả |
|-------------------------|---------------------|
| **Purpose**: Manages staff work shifts and schedules | **Mục Đích**: Quản lý ca làm việc và lịch trình của nhân viên |
| **Primary Key**: `id` (VARCHAR(255)) | **Khóa Chính**: `id` (VARCHAR(255)) |
| | |
| `id` | ID duy nhất của ca làm việc |
| `staffId` → `users.id` (FK, ON DELETE CASCADE) | ID nhân viên (khóa ngoại) |
| `date` (DATE) | Ngày ca làm việc |
| `shiftType` (ENUM: 'morning', 'afternoon', 'evening', 'leave', 'custom') | Loại ca (Sáng, Chiều, Tối, Nghỉ phép, Tùy chỉnh) |
| `status` (ENUM: 'approved', 'pending', 'rejected') | Trạng thái (Đã duyệt, Chờ duyệt, Từ chối) |
| `requestedBy` (VARCHAR(255)) | ID nhân viên yêu cầu đổi ca |
| `notes` (TEXT) | Ghi chú |
| `assignedManagerId` → `users.id` (FK, ON DELETE SET NULL) | ID quản lý được gán (khóa ngoại) |
| `shiftHours` (JSON) | Đối tượng JSON với giờ bắt đầu/kết thúc {start: "09:00", end: "17:00"} |
| `isUpForSwap` (BOOLEAN) | Ca có sẵn để đổi không |
| `swapClaimedBy` (VARCHAR(255)) | ID người đã nhận đổi ca |
| `managerApprovalStatus` (ENUM: 'pending_approval', 'approved', 'rejected') | Trạng thái duyệt của quản lý |
| | |
| **Indexes**: | **Chỉ Mục**: |
| - `idx_shift_staff_date` on `(staffId, date)` | - `idx_shift_staff_date` trên `(staffId, date)` (truy vấn ca làm việc theo nhân viên và ngày) |

---

## Foreign Key Relationships / Quan Hệ Khóa Ngoại

| English | Tiếng Việt |
|---------|------------|
| **CASCADE**: When parent record is deleted, child records are also deleted | **CASCADE**: Khi bản ghi cha bị xóa, bản ghi con cũng bị xóa |
| **SET NULL**: When parent record is deleted, foreign key in child is set to NULL | **SET NULL**: Khi bản ghi cha bị xóa, khóa ngoại trong bản ghi con được đặt thành NULL |
| **Key Relationships**: | **Quan Hệ Chính**: |
| - `users` → `wallets` (1:1, CASCADE) | - `users` → `wallets` (1:1, CASCADE) |
| - `users` → `appointments` (1:N as client, CASCADE) | - `users` → `appointments` (1:N as client, CASCADE) |
| - `users` → `appointments` (1:N as therapist, SET NULL) | - `users` → `appointments` (1:N as therapist, SET NULL) |
| - `services` → `appointments` (1:N, CASCADE) | - `services` → `appointments` (1:N, CASCADE) |
| - `services` → `treatment_courses` (1:N, CASCADE) | - `services` → `treatment_courses` (1:N, CASCADE) |
| - `treatment_courses` → `treatment_sessions` (1:N, CASCADE) | - `treatment_courses` → `treatment_sessions` (1:N, CASCADE) |
| - `appointments` → `treatment_sessions` (1:1, SET NULL) | - `appointments` → `treatment_sessions` (1:1, SET NULL) |
| - `appointments` → `payments` (1:1, SET NULL) | - `appointments` → `payments` (1:1, SET NULL) |
| - `appointments` → `reviews` (1:1, SET NULL) | - `appointments` → `reviews` (1:1, SET NULL) |
| - `users` → `notifications` (1:N, CASCADE) | - `users` → `notifications` (1:N, CASCADE) |

---

## Data Types / Kiểu Dữ Liệu

| English | Tiếng Việt |
|---------|------------|
| **VARCHAR(255)**: Variable-length string, max 255 characters | **VARCHAR(255)**: Chuỗi độ dài biến đổi, tối đa 255 ký tự |
| **TEXT**: Variable-length string, up to 65,535 characters | **TEXT**: Chuỗi độ dài biến đổi, lên đến 65,535 ký tự |
| **DECIMAL(10,2)**: Fixed-point number with 10 digits total, 2 decimal places | **DECIMAL(10,2)**: Số thập phân cố định với 10 chữ số tổng cộng, 2 chữ số thập phân |
| **INT**: 32-bit integer | **INT**: Số nguyên 32-bit |
| **BOOLEAN**: TRUE or FALSE (stored as TINYINT(1)) | **BOOLEAN**: TRUE hoặc FALSE (lưu dạng TINYINT(1)) |
| **DATE**: Date only (YYYY-MM-DD) | **DATE**: Chỉ ngày (YYYY-MM-DD) |
| **DATETIME**: Date and time (YYYY-MM-DD HH:MM:SS) | **DATETIME**: Ngày và giờ (YYYY-MM-DD HH:MM:SS) |
| **JSON**: JSON data type (MySQL 5.7+) | **JSON**: Kiểu dữ liệu JSON (MySQL 5.7+) |
| **ENUM**: Enumeration of predefined values | **ENUM**: Liệt kê các giá trị được định nghĩa trước |

---

## Indexes / Chỉ Mục

| English | Tiếng Việt |
|---------|------------|
| **Purpose**: Improve query performance by creating indexes on frequently queried columns | **Mục Đích**: Cải thiện hiệu suất truy vấn bằng cách tạo chỉ mục trên các cột thường được truy vấn |
| **Primary Indexes**: Automatically created on PRIMARY KEY columns | **Chỉ Mục Chính**: Tự động tạo trên các cột PRIMARY KEY |
| **Unique Indexes**: Automatically created on UNIQUE constraint columns | **Chỉ Mục Duy Nhất**: Tự động tạo trên các cột có ràng buộc UNIQUE |
| **Composite Indexes**: Created on multiple columns (e.g., `(userId, date)`) | **Chỉ Mục Tổng Hợp**: Tạo trên nhiều cột (VD: `(userId, date)`) |
| **Key Indexes**: | **Chỉ Mục Quan Trọng**: |
| - `idx_users_email`: Fast email lookups | - `idx_users_email`: Tra cứu email nhanh |
| - `idx_app_user_date`: Fast appointment queries by user and date | - `idx_app_user_date`: Truy vấn lịch hẹn nhanh theo user và ngày |
| - `idx_tc_client`: Fast treatment course queries by client | - `idx_tc_client`: Truy vấn liệu trình nhanh theo khách hàng |
| - `idx_ts_course`: Fast treatment session queries by course | - `idx_ts_course`: Truy vấn buổi điều trị nhanh theo liệu trình |

---

## Important Notes / Lưu Ý Quan Trọng

| English | Tiếng Việt |
|---------|------------|
| **1. Password Security**: Passwords in `users` table must be hashed using bcrypt before insertion. | **1. Bảo Mật Mật Khẩu**: Mật khẩu trong bảng `users` phải được hash bằng bcrypt trước khi chèn. |
| **2. Denormalization**: Some fields are denormalized (e.g., `appointments.serviceName`) to improve query performance and reduce JOIN operations. | **2. Denormalization**: Một số trường được denormalize (VD: `appointments.serviceName`) để cải thiện hiệu suất truy vấn và giảm thao tác JOIN. |
| **3. JSON Fields**: Some fields use JSON data type for flexible data storage (e.g., `shiftHours` in staff_shifts). | **3. Trường JSON**: Một số trường sử dụng kiểu dữ liệu JSON để lưu trữ dữ liệu linh hoạt (VD: `shiftHours` trong staff_shifts). |
| **4. Treatment Courses**: | **4. Liệu Trình**: |
| - Treatment courses are linked to services (one service per course) | - Liệu trình gắn liền với dịch vụ (một dịch vụ mỗi liệu trình) |
| - Admin can set frequency: "weeks_per_session" or "sessions_per_week" | - Admin có thể quy định tần suất: "mấy tuần 1 lần" hoặc "mấy lần 1 tuần" |
| - Duration: default = number of services + 1 week (admin can adjust) | - Thời gian: mặc định = số dịch vụ + 1 tuần (admin có thể chỉnh) |
| - Customer status notes use TEXT field (not ENUM) for flexibility | - Ghi chú tình trạng khách dùng TEXT field (không dùng ENUM) để linh hoạt |
| **5. Treatment Sessions**: | **5. Các Buổi Điều Trị**: |
| - Each session links to one appointment | - Mỗi buổi liên kết với một appointment |
| - Customer status notes are stored as TEXT (not ENUM) | - Ghi chú tình trạng khách lưu dạng TEXT (không phải ENUM) |
| - Admin/Staff can add notes after each session | - Admin/Staff có thể thêm ghi chú sau mỗi buổi |
| **6. Foreign Key Actions**: | **6. Hành Động Khóa Ngoại**: |
| - **CASCADE**: Used when child records should be deleted with parent (e.g., user → appointments) | - **CASCADE**: Dùng khi bản ghi con nên bị xóa cùng cha (VD: user → appointments) |
| - **SET NULL**: Used when child records should remain but FK set to NULL (e.g., appointment → therapist) | - **SET NULL**: Dùng khi bản ghi con nên giữ lại nhưng FK đặt thành NULL (VD: appointment → therapist) |

---

## Summary / Tóm Tắt

| English | Tiếng Việt |
|---------|------------|
| This database schema supports a comprehensive spa management system with: | Schema database này hỗ trợ hệ thống quản lý spa toàn diện với: |
| - **User Management**: Admin, Staff, and Client accounts | - **Quản Lý Người Dùng**: Tài khoản Admin, Staff và Client |
| - **Service Management**: Services and categories | - **Quản Lý Dịch Vụ**: Dịch vụ và danh mục |
| - **Booking System**: Appointments with staff assignment | - **Hệ Thống Đặt Lịch**: Lịch hẹn với gán nhân viên |
| - **Treatment Courses**: Multi-session treatment tracking (linked to services) | - **Liệu Trình Điều Trị**: Theo dõi liệu trình nhiều buổi (gắn liền với dịch vụ) |
| - **Treatment Sessions**: Individual session tracking with customer status notes | - **Các Buổi Điều Trị**: Theo dõi từng buổi với ghi chú tình trạng khách |
| - **Payment Processing**: Multiple payment methods with transaction tracking | - **Xử Lý Thanh Toán**: Nhiều phương thức thanh toán với theo dõi giao dịch |
| - **Loyalty Program**: Points system with spending tracking | - **Chương Trình Tích Điểm**: Hệ thống điểm với theo dõi chi tiêu |
| - **Notifications**: User notifications for appointments, promotions, and treatment reminders | - **Thông Báo**: Thông báo cho người dùng về lịch hẹn, khuyến mãi và nhắc nhở liệu trình |
| - **Reviews & Ratings**: Customer feedback system | - **Đánh Giá & Xếp Hạng**: Hệ thống phản hồi khách hàng |
| - **Staff Management**: Work shifts and schedules | - **Quản Lý Nhân Viên**: Ca làm việc và lịch trình |

The schema is designed for scalability, maintainability, and performance optimization. | Schema được thiết kế cho khả năng mở rộng, dễ bảo trì và tối ưu hiệu suất.
