# PHÂN TÍCH DATABASE - ANH THƠ SPA MANAGEMENT SYSTEM

## 📊 TỔNG QUAN DATABASE

**Database Engine**: MySQL  
**ORM**: Sequelize  
**Migration System**: Sequelize CLI Migrations  
**Naming Convention**: snake_case cho tables, camelCase cho columns

---

## 🗄️ CẤU TRÚC DATABASE

### 1. 📁 `/backend/models/` - Sequelize Models

**Chức năng**: Định nghĩa cấu trúc dữ liệu và schema cho từng bảng trong database.

#### 1.1. **`User.js`** - Bảng Users
**Bảng**: `users`  
**Mục đích**: Lưu trữ thông tin tất cả người dùng (Admin, Staff, Client)

**Các trường quan trọng**:
- `id` (STRING, PK): UUID hoặc custom ID
- `name` (STRING): Tên người dùng
- `email` (STRING, UNIQUE): Email đăng nhập
- `password` (STRING): Mật khẩu đã hash (bcrypt)
- `phone` (STRING): Số điện thoại
- `role` (ENUM): 'Admin', 'Staff', 'Client'
- `status` (ENUM): 'Active', 'Inactive', 'Locked'
- `lastLogin` (DATE): Lần đăng nhập cuối
- `loginHistory` (JSON): Lịch sử đăng nhập
- `roomId` (STRING, FK → rooms.id): Phòng được gán (cho staff)

**Quan hệ**:
- One-to-One với `wallets`
- One-to-Many với `appointments` (as Client)
- One-to-Many với `appointments` (as Therapist)
- One-to-Many với `payments`
- One-to-Many với `treatment_courses` (as Client)
- One-to-Many với `treatment_courses` (as Therapist)
- One-to-Many với `reviews`
- One-to-Many với `staff_shifts`
- One-to-Many với `staff_tasks`

**Quan trọng**: Đây là bảng cốt lõi, liên kết với hầu hết các bảng khác.

---

#### 1.2. **`Service.js`** - Bảng Services
**Bảng**: `services`  
**Mục đích**: Lưu trữ thông tin dịch vụ spa

**Các trường quan trọng**:
- `id` (STRING, PK): ID dịch vụ
- `name` (STRING): Tên dịch vụ
- `description` (TEXT): Mô tả ngắn
- `longDescription` (TEXT): Mô tả chi tiết
- `price` (DECIMAL(10,2)): Giá gốc
- `discountPercent` (INTEGER): Phần trăm giảm giá (0-100)
- `discountPrice` (VIRTUAL): Giá sau giảm (tự động tính)
- `duration` (INTEGER): Thời gian dịch vụ (phút)
- `categoryId` (INTEGER, FK → service_categories.id): Danh mục
- `category` (STRING): Tên danh mục (denormalized)
- `imageUrl` (TEXT): URL hình ảnh
- `rating` (FLOAT): Điểm đánh giá trung bình
- `reviewCount` (INTEGER): Số lượng đánh giá
- `isActive` (BOOLEAN): Trạng thái hoạt động

**Quan hệ**:
- Many-to-One với `service_categories`
- One-to-Many với `appointments`
- One-to-Many với `reviews`
- Many-to-Many với `treatment_courses` (through `treatment_course_services`)
- Many-to-Many với `treatment_packages` (through `treatment_package_services`)

**Quan trọng**: Quản lý tất cả dịch vụ spa, có virtual field `discountPrice` tự động tính toán.

---

#### 1.3. **`Appointment.js`** - Bảng Appointments
**Bảng**: `appointments`  
**Mục đích**: Lưu trữ lịch hẹn của khách hàng

**Các trường quan trọng**:
- `id` (STRING, PK): ID lịch hẹn
- `serviceId` (STRING, FK → services.id): Dịch vụ được đặt
- `serviceName` (STRING): Tên dịch vụ (denormalized)
- `userId` (STRING, FK → users.id): Khách hàng
- `userName` (STRING): Tên khách hàng (denormalized)
- `date` (DATEONLY): Ngày hẹn
- `time` (STRING): Giờ hẹn (HH:MM)
- `status` (ENUM): 'upcoming', 'completed', 'cancelled', 'pending', 'in-progress', 'scheduled'
- `paymentStatus` (ENUM): 'Paid', 'Unpaid'
- `therapistId` (STRING, FK → users.id): Nhân viên được gán
- `therapist` (STRING): Tên nhân viên (denormalized)
- `roomId` (STRING, FK → rooms.id): Phòng điều trị
- `notesForTherapist` (TEXT): Ghi chú cho nhân viên
- `staffNotesAfterSession` (TEXT): Ghi chú sau buổi điều trị
- `isStarted` (BOOLEAN): Đã bắt đầu chưa
- `isCompleted` (BOOLEAN): Đã hoàn thành chưa
- `reviewRating` (INTEGER): Điểm đánh giá
- `rejectionReason` (TEXT): Lý do từ chối
- `bookingGroupId` (STRING): Nhóm booking (nếu đặt nhiều dịch vụ)
- `treatmentCourseId` (STRING): Liên kết với liệu trình
- `treatmentSessionId` (STRING): Liên kết với session cụ thể

**Quan hệ**:
- Many-to-One với `users` (as Client)
- Many-to-One với `users` (as Therapist)
- Many-to-One với `services`
- Many-to-One với `rooms`
- One-to-One với `payments`
- One-to-One với `reviews`
- Many-to-One với `treatment_courses`

**Quan trọng**: Bảng trung tâm quản lý toàn bộ lịch hẹn, liên kết User (client), User (therapist), Service, Room.

---

#### 1.4. **`Payment.js`** - Bảng Payments
**Bảng**: `payments`  
**Mục đích**: Lưu trữ thông tin thanh toán

**Các trường quan trọng**:
- `id` (STRING, PK): ID thanh toán
- `transactionId` (STRING): ID giao dịch từ payment gateway
- `bookingId` (STRING, FK → appointments.id): ID booking (deprecated, dùng appointmentId)
- `userId` (STRING, FK → users.id): Khách hàng thanh toán
- `appointmentId` (STRING, FK → appointments.id): Lịch hẹn liên quan
- `serviceName` (STRING): Tên dịch vụ (denormalized)
- `amount` (DECIMAL(10,2)): Số tiền
- `method` (ENUM): 'Cash', 'Card', 'Momo', 'VNPay', 'ZaloPay'
- `status` (ENUM): 'Completed', 'Pending', 'Refunded', 'Failed'
- `date` (DATE): Ngày thanh toán
- `therapistId` (STRING, FK → users.id): Nhân viên thực hiện (để tính commission)

**Quan hệ**:
- Many-to-One với `users` (as Client)
- Many-to-One với `users` (as Therapist)
- One-to-One với `appointments`

**Quan trọng**: Quản lý tất cả giao dịch thanh toán, tích hợp với VNPay.

---

#### 1.5. **`Wallet.js`** - Bảng Wallets
**Bảng**: `wallets`  
**Mục đích**: Lưu trữ ví điện tử và điểm thưởng của khách hàng

**Các trường quan trọng**:
- `userId` (STRING, PK, FK → users.id): ID khách hàng
- `balance` (DECIMAL(10,2)): Số dư tiền
- `points` (INTEGER): Điểm tích lũy hiện tại
- `totalEarned` (INTEGER): Tổng điểm đã tích được
- `totalSpent` (INTEGER): Tổng điểm đã sử dụng
- `pointsHistory` (JSON): Lịch sử điểm dạng JSON array
  - Format: `[{date, pointsChange, type, source, description}]`

**Quan hệ**:
- One-to-One với `users`

**Quan trọng**: Quản lý số dư và điểm tích lũy, lịch sử được lưu dạng JSON trong cùng bảng.

---

#### 1.6. **`TreatmentCourse.js`** - Bảng Treatment Courses
**Bảng**: `treatment_courses`  
**Mục đích**: Lưu trữ liệu trình điều trị (gói nhiều buổi)

**Các trường quan trọng**:
- `id` (STRING, PK): ID liệu trình
- `templateId` (STRING): ID template (nếu tạo từ template)
- `name` (STRING): Tên liệu trình
- `price` (DECIMAL(10,2)): Giá gói
- `packageId` (STRING, FK → treatment_packages.id): Gói mẫu (nếu đăng ký từ package)
- `serviceId` (STRING, FK → services.id): DEPRECATED - dùng `treatment_course_services` thay thế
- `serviceName` (STRING): DEPRECATED
- `totalSessions` (INTEGER): Tổng số buổi
- `sessionsPerWeek` (INTEGER): Số buổi mỗi tuần
- `weekDays` (JSON): Mảng các thứ trong tuần [1,3,5]
- `sessionDuration` (INTEGER): Thời gian mỗi buổi (phút)
- `sessionTime` (STRING): Giờ cố định (VD: "18:00")
- `description` (TEXT): Mô tả
- `imageUrl` (STRING): URL hình ảnh
- `sessions` (JSON): Mảng các session dạng JSON
- `initialAppointmentId` (STRING, FK → appointments.id): Appointment đầu tiên
- `clientId` (STRING, FK → users.id): Khách hàng
- `therapistId` (STRING, FK → users.id): Nhân viên phụ trách
- `status` (ENUM): 'draft', 'active', 'paused', 'completed', 'expired', 'cancelled'
- `expiryDate` (DATEONLY): Hạn sử dụng
- `nextAppointmentDate` (DATEONLY): Ngày hẹn tiếp theo
- `progressPercentage` (INTEGER): Phần trăm hoàn thành (0-100)
- `completedSessions` (INTEGER): Số buổi đã hoàn thành
- `lastCompletedDate` (DATE): Ngày hoàn thành buổi cuối
- `treatmentGoals` (TEXT): Mục tiêu điều trị
- `initialSkinCondition` (TEXT): Tình trạng da ban đầu
- `consultantId` (STRING): ID chuyên viên tư vấn
- `consultantName` (STRING): Tên chuyên viên tư vấn
- `isPaused` (BOOLEAN): Đang tạm dừng
- `pauseReason` (TEXT): Lý do tạm dừng
- `pausedDate` (DATE): Ngày bắt đầu tạm dừng
- `resumedDate` (DATE): Ngày tiếp tục
- `startDate` (DATEONLY): Ngày bắt đầu
- `actualCompletionDate` (DATE): Ngày hoàn thành thực tế
- `remindersSent` (JSON): Lịch sử reminder đã gửi
- `createdAt` (DATE): Ngày tạo
- `updatedAt` (DATE): Ngày cập nhật

**Quan hệ**:
- Many-to-One với `users` (as Client)
- Many-to-One với `users` (as Therapist)
- Many-to-One với `treatment_packages`
- Many-to-One với `appointments` (initialAppointmentId)
- Many-to-Many với `services` (through `treatment_course_services`)

**Quan trọng**: Quản lý các gói liệu trình nhiều buổi, có nhiều trường để track progress và status.

---

#### 1.7. **`ServiceCategory.js`** - Bảng Service Categories
**Bảng**: `service_categories`  
**Mục đích**: Phân loại dịch vụ

**Các trường**:
- `id` (INTEGER, PK, AUTO_INCREMENT)
- `name` (STRING, UNIQUE): Tên danh mục

**Quan hệ**:
- One-to-Many với `services`

---

#### 1.8. **`Room.js`** - Bảng Rooms
**Bảng**: `rooms`  
**Mục đích**: Quản lý phòng điều trị

**Các trường**:
- `id` (STRING, PK)
- `name` (STRING): Tên phòng
- `description` (TEXT): Mô tả
- `capacity` (INTEGER): Sức chứa
- `isActive` (BOOLEAN): Trạng thái hoạt động

**Quan hệ**:
- One-to-Many với `users` (staff được gán phòng)
- One-to-Many với `appointments`

---

#### 1.9. **`Promotion.js`** - Bảng Promotions
**Bảng**: `promotions`  
**Mục đích**: Lưu trữ mã khuyến mãi

**Các trường quan trọng**:
- `id` (STRING, PK)
- `code` (STRING, UNIQUE): Mã khuyến mãi
- `title` (STRING): Tiêu đề
- `description` (TEXT): Mô tả
- `discountType` (ENUM): 'percentage', 'fixed'
- `discountValue` (DECIMAL): Giá trị giảm giá
- `expiryDate` (DATE): Ngày hết hạn
- `isActive` (BOOLEAN): Trạng thái hoạt động

---

#### 1.10. **`Review.js`** - Bảng Reviews
**Bảng**: `reviews`  
**Mục đích**: Lưu trữ đánh giá dịch vụ

**Các trường**:
- `id` (STRING, PK)
- `userId` (STRING, FK → users.id)
- `serviceId` (STRING, FK → services.id)
- `appointmentId` (STRING, FK → appointments.id, UNIQUE)
- `rating` (INTEGER): Điểm đánh giá (1-5)
- `comment` (TEXT): Bình luận
- `date` (DATE): Ngày đánh giá
- `managerReply` (TEXT): Phản hồi của quản lý

**Quan hệ**:
- Many-to-One với `users`
- Many-to-One với `services`
- One-to-One với `appointments`

---

#### 1.11. **`TreatmentPackage.js`** - Bảng Treatment Packages
**Bảng**: `treatment_packages`  
**Mục đích**: Template gói điều trị (mẫu)

**Các trường**:
- `id` (STRING, PK)
- `name` (STRING): Tên gói
- `description` (TEXT): Mô tả
- `price` (DECIMAL): Giá gói
- `totalSessions` (INTEGER): Tổng số buổi
- `isActive` (BOOLEAN): Trạng thái hoạt động

**Quan hệ**:
- One-to-Many với `treatment_courses`
- Many-to-Many với `services` (through `treatment_package_services`)

---

#### 1.12. **`Notification.js`** - Bảng Notifications
**Bảng**: `notifications`  
**Mục đích**: Thông báo nội bộ

**Các trường**:
- `id` (STRING, PK)
- `userId` (STRING, FK → users.id): Người nhận
- `type` (ENUM): Loại thông báo
- `message` (TEXT): Nội dung
- `isRead` (BOOLEAN): Đã đọc chưa
- `date` (DATE): Ngày gửi

---

#### 1.13. **`StaffShift.js`** - Bảng Staff Shifts
**Bảng**: `staff_shifts`  
**Mục đích**: Ca làm việc của nhân viên

**Các trường**:
- `id` (STRING, PK)
- `staffId` (STRING, FK → users.id)
- `date` (DATEONLY): Ngày làm việc
- `shiftType` (ENUM): 'morning', 'afternoon', 'evening', 'leave', 'custom'
- `status` (ENUM): 'approved', 'pending', 'rejected'

---

#### 1.14. **`StaffTask.js`** - Bảng Staff Tasks
**Bảng**: `staff_tasks`  
**Mục đích**: Công việc được giao cho nhân viên

**Các trường**:
- `id` (STRING, PK)
- `assignedToId` (STRING, FK → users.id): Người được giao
- `assignedById` (STRING, FK → users.id): Người giao việc
- `title` (STRING): Tiêu đề
- `description` (TEXT): Mô tả
- `dueDate` (DATE): Hạn chót
- `status` (ENUM): 'pending', 'in-progress', 'completed', 'overdue'
- `priority` (ENUM): 'low', 'medium', 'high'

---

### 2. 📁 `/backend/migrations/` - Database Migrations

**Chức năng**: Quản lý thay đổi schema database theo version control.

**Các migration quan trọng**:

#### 2.1. **`20250113000001-create-users.js`**
- Tạo bảng `users`
- Định nghĩa ENUM cho `role` và `status`
- Index trên `email` (unique)

#### 2.2. **`20250113000002-create-rooms.js`**
- Tạo bảng `rooms`

#### 2.3. **`20250113000003-create-service-categories.js`**
- Tạo bảng `service_categories`

#### 2.4. **`20250113000004-create-services.js`**
- Tạo bảng `services`
- Foreign key đến `service_categories`
- Index trên các trường thường query

#### 2.5. **`20250113000005-create-appointments.js`**
- Tạo bảng `appointments`
- Foreign keys đến `users` (client), `users` (therapist), `services`, `rooms`
- Index trên `userId`, `therapistId`, `date`, `status`

#### 2.6. **`20250113000006-create-payments.js`**
- Tạo bảng `payments`
- Foreign keys đến `users`, `appointments`
- ENUM cho `method` và `status`

#### 2.7. **`20250113000010-create-wallets.js`**
- Tạo bảng `wallets`
- Foreign key đến `users` (One-to-One)
- Unique constraint trên `userId`

#### 2.8. **`20250113000012-create-treatment-courses.js`**
- Tạo bảng `treatment_courses`
- Foreign keys đến `users`, `services`, `treatment_packages`

#### 2.9. **`20250114000002-create-treatment-packages.js`**
- Tạo bảng `treatment_packages`
- Tạo bảng `treatment_package_services` (junction table)

#### 2.10. **`20250114000001-update-treatment-courses-structure.js`**
- Cập nhật cấu trúc `treatment_courses`
- Thêm các trường mới: `progressPercentage`, `completedSessions`, etc.

#### 2.11. **`20250115000001-add-scheduled-status-to-appointments.js`**
- Thêm status 'scheduled' vào ENUM của `appointments.status`

#### 2.12. **`20250115000002-add-templateId-to-treatment-courses.js`**
- Thêm trường `templateId` vào `treatment_courses`

**Quan trọng**: Migrations đảm bảo database schema được version control và có thể rollback.

---

### 3. 📁 `/backend/seeders/` - Database Seeders

**Chức năng**: Tạo dữ liệu mẫu cho development và testing.

**Các seeder**:
- **`20250109100001-seed-users.js`**: Seed users (Admin, Staff, Clients)
- **`20250109100002-seed-wallets.js`**: Seed wallets
- **`20250109100003-seed-service-categories.js`**: Seed service categories
- **`20250109100004-seed-services.js`**: Seed services
- **`20250109100005-seed-appointments.js`**: Seed appointments
- **`20250109100006-seed-payments.js`**: Seed payments
- **`20250109100007-seed-promotions.js`**: Seed promotions
- **`20250109100008-seed-reviews.js`**: Seed reviews

**Quan trọng**: Giúp setup database nhanh chóng với dữ liệu test.

---

### 4. 📁 `/backend/config/database.js` - Database Configuration

**Chức năng**: Cấu hình kết nối Sequelize và định nghĩa associations.

**Nhiệm vụ chính**:
1. **Khởi tạo Sequelize connection**:
   - Load environment variables từ `.env`
   - Kết nối MySQL với credentials
   
2. **Import và định nghĩa Models**:
   - Import tất cả models từ `/backend/models/`
   - Đăng ký với Sequelize instance

3. **Thiết lập Associations**:
   - **One-to-One**: User ↔ Wallet
   - **One-to-Many**: 
     - User → Appointments (as Client)
     - User → Appointments (as Therapist)
     - Service → Appointments
     - ServiceCategory → Services
   - **Many-to-Many**:
     - TreatmentCourse ↔ Services (through TreatmentCourseService)
     - TreatmentPackage ↔ Services (through TreatmentPackageService)

4. **Helper Functions**:
   - `calculateUserTotalSpending()`: Tính tổng chi tiêu của user
   - `checkAndUpgradeTier()`: Kiểm tra và nâng cấp tier (disabled)

**Quan trọng**: File này là trung tâm của database layer, quản lý tất cả relationships.

---

## 🔗 QUAN HỆ GIỮA CÁC BẢNG (ERD Summary)

### Core Entities:
1. **Users** (trung tâm)
   - → Wallets (1:1)
   - → Appointments (1:N as Client)
   - → Appointments (1:N as Therapist)
   - → Payments (1:N)
   - → TreatmentCourses (1:N as Client)
   - → TreatmentCourses (1:N as Therapist)
   - → Reviews (1:N)
   - → StaffShifts (1:N)
   - → StaffTasks (1:N as AssignedTo/AssignedBy)

2. **Services**
   - → ServiceCategories (N:1)
   - → Appointments (1:N)
   - → Reviews (1:N)
   - → TreatmentCourses (N:M through TreatmentCourseService)
   - → TreatmentPackages (N:M through TreatmentPackageService)

3. **Appointments**
   - → Users (N:1 as Client)
   - → Users (N:1 as Therapist)
   - → Services (N:1)
   - → Rooms (N:1)
   - → Payments (1:1)
   - → Reviews (1:1)
   - → TreatmentCourses (1:N)

4. **Payments**
   - → Users (N:1 as Client)
   - → Users (N:1 as Therapist)
   - → Appointments (N:1)

5. **TreatmentCourses**
   - → Users (N:1 as Client)
   - → Users (N:1 as Therapist)
   - → TreatmentPackages (N:1)
   - → Appointments (1:N)
   - → Services (N:M through TreatmentCourseService)

---

## 📝 LƯU Ý QUAN TRỌNG

1. **Foreign Key Constraints**:
   - `ON DELETE CASCADE`: Khi xóa parent, xóa luôn children
   - `ON DELETE SET NULL`: Khi xóa parent, set children FK = NULL
   - `ON UPDATE CASCADE`: Khi update parent PK, update children FK

2. **Denormalization**:
   - Một số trường được denormalize để tăng performance:
     - `appointments.serviceName` (từ `services.name`)
     - `appointments.userName` (từ `users.name`)
     - `appointments.therapist` (từ `users.name`)
     - `services.category` (từ `service_categories.name`)

3. **JSON Fields**:
   - `users.loginHistory`: Lịch sử đăng nhập dạng JSON
   - `wallets.pointsHistory`: Lịch sử điểm dạng JSON
   - `treatment_courses.sessions`: Danh sách sessions dạng JSON
   - `treatment_courses.weekDays`: Mảng các thứ trong tuần

4. **Virtual Fields**:
   - `Service.discountPrice`: Tự động tính từ `price` và `discountPercent`

5. **Timestamps**:
   - Hầu hết models có `timestamps: false` (không dùng createdAt/updatedAt tự động)
   - Chỉ `TreatmentCourse` có `timestamps: true`

6. **ENUM Values**:
   - `users.role`: 'Admin', 'Staff', 'Client'
   - `users.status`: 'Active', 'Inactive', 'Locked'
   - `appointments.status`: 'upcoming', 'completed', 'cancelled', 'pending', 'in-progress', 'scheduled'
   - `payments.status`: 'Completed', 'Pending', 'Refunded', 'Failed'
   - `payments.method`: 'Cash', 'Card', 'Momo', 'VNPay', 'ZaloPay'

---

## 🎯 KẾT LUẬN

Database được thiết kế với:
- **Normalization**: Tách biệt rõ ràng các entities
- **Denormalization**: Một số trường được denormalize để tăng performance
- **Flexibility**: Sử dụng JSON fields cho dữ liệu linh hoạt
- **Integrity**: Foreign key constraints đảm bảo data integrity
- **Scalability**: Indexes trên các trường thường query

Hệ thống migration và seeder giúp quản lý database schema và dữ liệu mẫu một cách có tổ chức.

