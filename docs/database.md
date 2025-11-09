# Phân Tích Database Schema - Anh Thơ Spa

## 📋 Tổng Quan

File `db.txt` chứa script SQL để khởi tạo database cho hệ thống Anh Thơ Spa. Script này tạo database, các bảng, và insert dữ liệu mẫu.

**Thống kê**:

- **12 bảng** tổng cộng
- **Database**: `anhthospa_db`
- **Character Set**: `utf8mb4` (hỗ trợ tiếng Việt và emoji)
- **Engine**: InnoDB

**Tối ưu hóa**:

- Chỉ sử dụng bảng `users` cơ bản (không tách `customers` và `staff`)
- Gộp `points_history` vào `wallets` (dùng JSON)
- Gộp `redeemable_vouchers` và `redeemed_rewards` vào `promotions`
- Bỏ các bảng AI (sẽ tích hợp API AI bên ngoài)
- Thêm các bảng quản lý lịch làm việc: `staff_availability`, `staff_shifts`, `staff_tasks`

---

## 📊 Danh Sách Tất Cả Các Bảng

### Nhóm 1: CORE TABLES (Bảng cốt lõi)

1. `users` - Người dùng (Admin, Staff, Client) - **Bảng cơ bản, không tách customers và staff**
2. `service_categories` - Danh mục dịch vụ
3. `services` - Dịch vụ spa
4. `wallets` - Ví điểm khách hàng - **Gộp points_history**

### Nhóm 2: BOOKING & APPOINTMENT TABLES (Bảng đặt lịch)

5. `appointments` - Đặt lịch (Admin phê duyệt, Admin/Staff xem lịch)
6. `treatment_courses` - Liệu trình

### Nhóm 3: PAYMENT & PROMOTION TABLES (Bảng thanh toán & khuyến mãi)

7. `payments` - Thanh toán
8. `promotions` - Khuyến mãi & Voucher - **Gộp redeemable_vouchers và redeemed_rewards**

### Nhóm 4: REVIEW & FEEDBACK TABLES (Bảng đánh giá)

9. `reviews` - Đánh giá dịch vụ

### Nhóm 5: STAFF MANAGEMENT TABLES (Bảng quản lý nhân viên)

10. `staff_availability` - Lịch khả dụng nhân viên
11. `staff_shifts` - Ca làm việc nhân viên
12. `staff_tasks` - Công việc nhân viên

---

## 📊 Bảng Phân Tích Chi Tiết

### 1. Tạo Database

| Văn Bản Gốc | Tiếng Việt | Ý Nghĩa |
|------------|-----------|---------|
| `CREATE DATABASE IF NOT EXISTS 'anhthospa_db' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` | Tạo database tên `anhthospa_db` nếu chưa tồn tại, sử dụng bảng mã UTF-8 để hỗ trợ tiếng Việt | Tạo database với encoding UTF-8 để lưu trữ tiếng Việt và các ký tự đặc biệt |
| `USE 'anhthospa_db';` | Sử dụng database `anhthospa_db` | Chuyển sang database vừa tạo để thực hiện các lệnh tiếp theo |

---

### 2. Bảng `users` - Người Dùng

**Vai trò**: Bảng trung tâm lưu thông tin cơ bản của tất cả người dùng (Admin, Staff, Client). Chỉ lưu thông tin cơ bản, không tách riêng `customers` và `staff`.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID người dùng (Khóa chính) |
| `name` | varchar(255) NOT NULL | Tên đầy đủ |
| `email` | varchar(255) NOT NULL | Email (DUY NHẤT) |
| `password` | varchar(255) NOT NULL | Mật khẩu đã mã hóa (bcrypt) |
| `phone` | varchar(255) DEFAULT NULL | Số điện thoại |
| `profilePictureUrl` | varchar(255) DEFAULT NULL | URL ảnh đại diện |
| `joinDate` | date NOT NULL | Ngày đăng ký |
| `birthday` | date DEFAULT NULL | Ngày sinh |
| `gender` | varchar(50) DEFAULT NULL | Giới tính |
| `role` | enum('Admin','Staff','Client') DEFAULT 'Client' | Vai trò: Quản trị viên, Nhân viên, Khách hàng |
| `status` | enum('Active','Inactive','Locked') DEFAULT 'Active' | Trạng thái tài khoản: Hoạt động, Không hoạt động, Khóa |
| `lastLogin` | datetime DEFAULT NULL | Lần đăng nhập cuối cùng |
| `loginHistory` | json DEFAULT NULL | Lịch sử đăng nhập |

**Foreign Keys**: Không có

**Lưu ý**:

- Bảng `users` chỉ lưu thông tin cơ bản, không tách riêng `customers` và `staff`
- Phân biệt Admin/Staff/Client qua trường `role`
- Thông tin chi tiết của staff (lịch làm việc, ca làm việc, công việc) được lưu trong các bảng `staff_availability`, `staff_shifts`, `staff_tasks`

---

### 3. Bảng `service_categories` - Danh Mục Dịch Vụ

**Vai trò**: Phân loại các dịch vụ spa thành các nhóm.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | int NOT NULL AUTO_INCREMENT | ID danh mục (Khóa chính, Tự động tăng) |
| `name` | varchar(255) NOT NULL | Tên danh mục (DUY NHẤT) |
| `description` | text DEFAULT NULL | Mô tả danh mục |
| `iconUrl` | varchar(500) DEFAULT NULL | URL icon danh mục |
| `order` | int DEFAULT 0 | Thứ tự hiển thị (số càng nhỏ hiển thị càng trước) |

**Foreign Keys**: Không có

---

### 4. Bảng `services` - Dịch Vụ

**Vai trò**: Lưu trữ thông tin tất cả dịch vụ mà spa cung cấp.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID dịch vụ (Khóa chính) |
| `name` | varchar(255) NOT NULL | Tên dịch vụ |
| `description` | text | Mô tả ngắn |
| `longDescription` | text | Mô tả chi tiết |
| `duration` | int NOT NULL | Thời lượng (phút) |
| `price` | decimal(10,2) NOT NULL | Giá dịch vụ (VNĐ) |
| `discountPrice` | decimal(10,2) DEFAULT NULL | Giá giảm (VNĐ, NULL nếu không có giảm giá) |
| `imageUrl` | varchar(500) DEFAULT NULL | URL ảnh dịch vụ |
| `category` | varchar(255) DEFAULT NULL | Tên danh mục (để hiển thị, không bắt buộc) |
| `categoryId` | int DEFAULT NULL | ID danh mục (Khóa ngoại → service_categories.id) |
| `rating` | decimal(3,2) DEFAULT 0.00 | Đánh giá trung bình (0-5) |
| `reviewCount` | int DEFAULT 0 | Số lượng đánh giá |
| `isHot` | tinyint(1) DEFAULT 0 | Dịch vụ hot (1 = có, 0 = không) |
| `isNew` | tinyint(1) DEFAULT 0 | Dịch vụ mới (1 = có, 0 = không) |
| `promoExpiryDate` | date DEFAULT NULL | Ngày hết hạn khuyến mãi |
| `isActive` | tinyint(1) DEFAULT 1 | Trạng thái hoạt động (1 = hoạt động, 0 = không hoạt động) |

**Foreign Keys**:

- `categoryId` → `service_categories.id` (SET NULL - Nếu xóa danh mục, categoryId sẽ thành NULL)

---

### 5. Bảng `wallets` - Ví Điểm

**Vai trò**: Quản lý điểm tích lũy và số dư của khách hàng. Đã gộp lịch sử điểm vào đây để tối ưu.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `userId` | varchar(255) NOT NULL | ID người dùng (Khóa chính, Khóa ngoại → users.id) |
| `balance` | decimal(10,2) DEFAULT 0.00 | Số dư tiền mặt (VNĐ, nếu có) |
| `points` | int DEFAULT 0 | Điểm tích lũy hiện tại |
| `totalEarned` | int DEFAULT 0 | Tổng điểm đã tích được |
| `totalSpent` | int DEFAULT 0 | Tổng điểm đã sử dụng |
| `pointsHistory` | json DEFAULT NULL | Lịch sử điểm dưới dạng JSON: [{"date": "2024-01-01", "pointsChange": 100, "type": "earned", "source": "purchase", "description": "Tích điểm từ đơn hàng"}] |

**Foreign Keys**:

- `userId` → `users.id` (CASCADE - Nếu xóa user, ví cũng bị xóa)

**Lưu ý**:

- Trường `pointsHistory` lưu toàn bộ lịch sử tích/tiêu điểm dưới dạng mảng JSON
- `type`: 'earned' (tích), 'spent' (tiêu), 'expired' (hết hạn)
- `source`: 'purchase' (mua hàng), 'review' (đánh giá), 'voucher' (đổi voucher), 'mission' (nhiệm vụ)

---

### 6. Bảng `appointments` - Đặt Lịch

**Vai trò**: Bảng chính để Admin phê duyệt lịch hẹn và Admin/Staff xem lịch. Liên kết khách hàng, nhân viên và dịch vụ trong một đặt lịch.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID đặt lịch (Khóa chính) |
| `serviceId` | varchar(255) NOT NULL | ID dịch vụ (Khóa ngoại → services.id) |
| `serviceName` | varchar(255) NOT NULL | Tên dịch vụ (để hiển thị, tránh join) |
| `userId` | varchar(255) NOT NULL | ID khách hàng (Khóa ngoại → users.id) |
| `userName` | varchar(255) DEFAULT NULL | Tên khách hàng (để hiển thị trên lịch) |
| `date` | date NOT NULL | Ngày đặt lịch (YYYY-MM-DD) |
| `time` | varchar(10) NOT NULL | Giờ đặt lịch (HH:MM) |
| `status` | enum('upcoming','completed','cancelled','pending','in-progress') DEFAULT 'pending' | Trạng thái: pending=chờ duyệt, upcoming=đã duyệt, in-progress=đang thực hiện, completed=hoàn thành, cancelled=đã hủy |
| `paymentStatus` | enum('Paid','Unpaid') DEFAULT 'Unpaid' | Trạng thái thanh toán: Đã thanh toán, Chưa thanh toán |
| `therapist` | varchar(255) DEFAULT NULL | Tên nhân viên (để hiển thị trên lịch) |
| `therapistId` | varchar(255) DEFAULT NULL | ID nhân viên (Khóa ngoại → users.id) |
| `room` | varchar(100) DEFAULT NULL | Phòng thực hiện dịch vụ (để hiển thị trên lịch) |
| `notesForTherapist` | text | Ghi chú cho nhân viên (từ khách hàng) |
| `staffNotesAfterSession` | text | Ghi chú sau buổi (từ nhân viên) |
| `isStarted` | tinyint(1) DEFAULT 0 | Đã bắt đầu chưa (1 = có, 0 = chưa) |
| `isCompleted` | tinyint(1) DEFAULT 0 | Đã hoàn thành chưa (1 = có, 0 = chưa) |
| `reviewRating` | int DEFAULT NULL | Đánh giá sau khi hoàn thành (1-5, NULL nếu chưa đánh giá) |
| `rejectionReason` | text | Lý do từ chối/hủy (Admin từ chối) |
| `bookingGroupId` | varchar(255) DEFAULT NULL | ID nhóm booking (để nhóm các dịch vụ đặt cùng lúc) |

**Foreign Keys**:

- `serviceId` → `services.id` (CASCADE - Nếu xóa dịch vụ, đặt lịch cũng bị xóa)
- `userId` → `users.id` (CASCADE - Nếu xóa user, đặt lịch cũng bị xóa)
- `therapistId` → `users.id` (SET NULL - Nếu xóa nhân viên, therapistId sẽ thành NULL)

**Lưu ý**:

- Admin phê duyệt lịch hẹn: Khi khách đặt lịch, `status = 'pending'`. Admin có thể: approve (`status = 'upcoming'`) hoặc reject (`status = 'cancelled'`, điền `rejectionReason`)
- Admin và Staff xem lịch: Query từ `appointments` với `status IN ('upcoming', 'in-progress')`
- Staff xem lịch của mình: Filter theo `therapistId = staffId`
- Admin xem tất cả lịch: Không cần filter theo `therapistId`

---

### 7. Bảng `treatment_courses` - Liệu Trình

**Vai trò**: Quản lý liệu trình điều trị với số buổi, trạng thái, hạn sử dụng và nhắc nhở.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID liệu trình (Khóa chính) |
| `serviceId` | varchar(255) NOT NULL | ID dịch vụ (Khóa ngoại → services.id) |
| `serviceName` | varchar(255) NOT NULL | Tên dịch vụ |
| `totalSessions` | int NOT NULL | Tổng số buổi trong liệu trình |
| `sessionsPerWeek` | int DEFAULT 1 | Số buổi mỗi tuần |
| `weekDays` | json DEFAULT NULL | Mảng các thứ trong tuần: [1,3,5] = Thứ 2, Thứ 4, Thứ 6 (0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7) |
| `sessionDuration` | int DEFAULT 60 | Thời gian mỗi buổi (phút) |
| `sessionTime` | varchar(10) DEFAULT NULL | Giờ cố định cho các buổi (ví dụ: "18:00") |
| `description` | text DEFAULT NULL | Mô tả liệu trình |
| `imageUrl` | varchar(500) DEFAULT NULL | URL hình ảnh liệu trình |
| `sessions` | json DEFAULT NULL | Mảng các buổi điều trị: [{"date": "2024-01-01", "therapist": "Nguyễn Văn A", "notes": "...", "status": "completed"}] |
| `initialAppointmentId` | varchar(255) DEFAULT NULL | ID appointment đầu tiên (Khóa ngoại → appointments.id, để lấy userId từ appointments) |
| `clientId` | varchar(255) DEFAULT NULL | ID khách hàng (Khóa ngoại → users.id, NULL cho template, lấy từ appointments nếu cần) |
| `therapistId` | varchar(255) DEFAULT NULL | ID nhân viên (Khóa ngoại → users.id) |
| `status` | enum('active','completed','paused') DEFAULT 'active' | Trạng thái: Đang hoạt động, Hoàn thành, Tạm dừng |
| `expiryDate` | date DEFAULT NULL | Hạn sử dụng liệu trình |
| `nextAppointmentDate` | date DEFAULT NULL | Ngày hẹn tiếp theo (để nhắc nhở khách hàng) |

**Foreign Keys**:

- `serviceId` → `services.id` (CASCADE - Nếu xóa dịch vụ, liệu trình cũng bị xóa)
- `initialAppointmentId` → `appointments.id` (SET NULL - Nếu xóa appointment, initialAppointmentId sẽ thành NULL)
- `clientId` → `users.id` (CASCADE - Nếu xóa user, liệu trình cũng bị xóa)
- `therapistId` → `users.id` (SET NULL - Nếu xóa nhân viên, therapistId sẽ thành NULL)

**Lưu ý**:

- Liệu trình có thể là template (clientId và initialAppointmentId = NULL) hoặc liệu trình thực tế (có clientId)
- Template được sử dụng để khách hàng xem và đăng ký
- Liệu trình thực tế được tạo khi khách hàng đăng ký và có appointment đầu tiên

---

### 8. Bảng `payments` - Thanh Toán

**Vai trò**: Lưu trữ lịch sử thanh toán cho các đặt lịch và dịch vụ.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID thanh toán (Khóa chính) |
| `bookingId` | varchar(255) DEFAULT NULL | ID đặt lịch (Khóa ngoại → appointments.id) |
| `userId` | varchar(255) NOT NULL | ID người dùng (Khóa ngoại → users.id) |
| `appointmentId` | varchar(255) DEFAULT NULL | ID appointment (Khóa ngoại → appointments.id) |
| `serviceName` | varchar(255) DEFAULT NULL | Tên dịch vụ (để hiển thị) |
| `amount` | decimal(10,2) NOT NULL | Số tiền thanh toán (VNĐ) |
| `method` | enum('Cash','Card','Momo','VNPay','ZaloPay') DEFAULT NULL | Phương thức thanh toán: Tiền mặt, Thẻ, Momo, VNPay, ZaloPay |
| `status` | enum('Completed','Pending','Refunded','Failed') DEFAULT 'Pending' | Trạng thái: Hoàn thành, Chờ xử lý, Đã hoàn tiền, Thất bại |
| `date` | datetime NOT NULL | Thời điểm thanh toán |
| `transactionId` | varchar(255) DEFAULT NULL | Mã giao dịch từ hệ thống thanh toán (VNPay, Momo, ...) |
| `therapistId` | varchar(255) DEFAULT NULL | ID nhân viên (Khóa ngoại → users.id, để tính hoa hồng) |

**Foreign Keys**:

- `bookingId` → `appointments.id` (SET NULL - Nếu xóa appointment, bookingId sẽ thành NULL)
- `userId` → `users.id` (CASCADE - Nếu xóa user, thanh toán cũng bị xóa)
- `appointmentId` → `appointments.id` (SET NULL - Nếu xóa appointment, appointmentId sẽ thành NULL)

---

### 9. Bảng `promotions` - Khuyến Mãi & Voucher

**Vai trò**: Quản lý các chương trình khuyến mãi và voucher đổi điểm. Đã gộp `redeemable_vouchers` và `redeemed_rewards` vào đây để tối ưu.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID khuyến mãi/voucher (Khóa chính) |
| `title` | varchar(255) NOT NULL | Tiêu đề |
| `description` | text NOT NULL | Mô tả |
| `code` | varchar(100) NOT NULL | Mã code (DUY NHẤT) |
| `expiryDate` | date NOT NULL | Ngày hết hạn |
| `imageUrl` | varchar(500) DEFAULT NULL | URL ảnh |
| `discountType` | enum('percentage','fixed') NOT NULL | Loại giảm giá: Phần trăm (%) hoặc số tiền cố định (VNĐ) |
| `discountValue` | decimal(10,2) NOT NULL | Giá trị giảm (VNĐ hoặc %) |
| `termsAndConditions` | text | Điều khoản và điều kiện |
| `targetAudience` | enum('All','New Clients','Birthday','Group','VIP','Tier Level 1',...,'Tier Level 8') DEFAULT 'All' | Đối tượng áp dụng: Tất cả, Khách hàng mới, Sinh nhật, Nhóm, VIP, Cấp độ 1-8 |
| `applicableServiceIds` | json DEFAULT NULL | Mảng ID dịch vụ áp dụng (rỗng = tất cả): ["sv-1", "sv-2"] |
| `minOrderValue` | decimal(10,2) DEFAULT 0.00 | Giá trị đơn hàng tối thiểu (VNĐ) |
| `usageCount` | int DEFAULT 0 | Số lần đã sử dụng |
| `usageLimit` | int DEFAULT NULL | Giới hạn sử dụng (NULL = không giới hạn) |
| `pointsRequired` | int DEFAULT 0 | Điểm cần để đổi (0 = không cần, >0 = voucher đổi điểm) |
| `isVoucher` | tinyint(1) DEFAULT 0 | Loại: 1 = voucher đổi điểm, 0 = khuyến mãi thông thường |
| `stock` | int DEFAULT NULL | Số lượng voucher còn lại (NULL = không giới hạn, chỉ cho voucher) |
| `isActive` | tinyint(1) DEFAULT 1 | Trạng thái hoạt động (1 = hoạt động, 0 = không hoạt động) |

**Foreign Keys**: Không có

**Lưu ý**:

- Nếu `isVoucher = 1` và `pointsRequired > 0`: Đây là voucher đổi điểm
- Nếu `isVoucher = 0` và `pointsRequired = 0`: Đây là khuyến mãi thông thường
- Lịch sử đổi voucher có thể lưu trong `wallets.pointsHistory` hoặc tạo bảng riêng nếu cần

---

### 10. Bảng `reviews` - Đánh Giá

**Vai trò**: Lưu trữ đánh giá và phản hồi của khách hàng về dịch vụ.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID đánh giá (Khóa chính) |
| `userId` | varchar(255) NOT NULL | ID người dùng (Khóa ngoại → users.id) |
| `serviceId` | varchar(255) NOT NULL | ID dịch vụ (Khóa ngoại → services.id) |
| `serviceName` | varchar(255) DEFAULT NULL | Tên dịch vụ (để hiển thị) |
| `appointmentId` | varchar(255) DEFAULT NULL | ID appointment (Khóa ngoại → appointments.id, DUY NHẤT) |
| `userName` | varchar(255) NOT NULL | Tên người đánh giá |
| `userImageUrl` | varchar(255) DEFAULT NULL | URL ảnh người đánh giá |
| `rating` | int NOT NULL | Điểm đánh giá (1-5) |
| `comment` | text | Bình luận |
| `images` | json DEFAULT NULL | Mảng URL ảnh đánh giá: ["url1", "url2"] |
| `date` | datetime NOT NULL | Thời điểm đánh giá |
| `managerReply` | text | Phản hồi từ quản lý |
| `isHidden` | tinyint(1) DEFAULT 0 | Ẩn đánh giá (1 = ẩn, 0 = hiển thị) |

**Foreign Keys**:

- `userId` → `users.id` (CASCADE - Nếu xóa user, đánh giá cũng bị xóa)
- `serviceId` → `services.id` (CASCADE - Nếu xóa dịch vụ, đánh giá cũng bị xóa)
- `appointmentId` → `appointments.id` (SET NULL, UNIQUE - Một appointment chỉ có một đánh giá)

---

### 11. Bảng `staff_availability` - Lịch Khả Dụng Nhân Viên

**Vai trò**: Quản lý lịch khả dụng của nhân viên (để staff xem lịch). Lưu lịch định kỳ (theo thứ trong tuần) hoặc lịch cụ thể (theo ngày).

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID lịch khả dụng (Khóa chính) |
| `staffId` | varchar(255) NOT NULL | ID nhân viên (Khóa ngoại → users.id) |
| `date` | date DEFAULT NULL | Ngày cụ thể (NULL nếu là lịch định kỳ) |
| `dayOfWeek` | int DEFAULT NULL | Thứ trong tuần: 0=CN, 1=T2, ..., 6=T7 (NULL nếu là lịch cụ thể) |
| `startTime` | varchar(10) DEFAULT NULL | Giờ bắt đầu (HH:MM) cho lịch định kỳ |
| `endTime` | varchar(10) DEFAULT NULL | Giờ kết thúc (HH:MM) cho lịch định kỳ |
| `isAvailable` | tinyint(1) DEFAULT 1 | Có sẵn sàng không (cho lịch định kỳ) |
| `timeSlots` | json DEFAULT NULL | Mảng: [{time: "09:00", availableServiceIds: ["sv1", "sv2"]}] (cho lịch cụ thể) |

**Foreign Keys**:

- `staffId` → `users.id` (CASCADE - Nếu xóa user, lịch khả dụng cũng bị xóa)

**Lưu ý**:

- Staff có thể xem lịch khả dụng của mình qua `staffId`
- Admin quản lý và cập nhật lịch khả dụng
- Hỗ trợ cả lịch định kỳ (theo thứ trong tuần) và lịch cụ thể (theo ngày)

---

### 12. Bảng `staff_shifts` - Ca Làm Việc Nhân Viên

**Vai trò**: Quản lý ca làm việc của nhân viên (để admin quản lý, staff xem). Lưu ca làm việc đã được phân công.

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID ca làm việc (Khóa chính) |
| `staffId` | varchar(255) NOT NULL | ID nhân viên (Khóa ngoại → users.id) |
| `date` | date NOT NULL | Ngày làm việc |
| `shiftType` | enum('morning','afternoon','evening','leave','custom') NOT NULL | Loại ca: Sáng, Chiều, Tối, Nghỉ, Tùy chỉnh |
| `status` | enum('approved','pending','rejected') DEFAULT 'pending' | Trạng thái: Đã duyệt, Chờ duyệt, Từ chối |
| `requestedBy` | varchar(255) DEFAULT NULL | ID nhân viên yêu cầu đổi ca |
| `notes` | text | Ghi chú |
| `assignedManagerId` | varchar(255) DEFAULT NULL | ID quản lý được phân công (Khóa ngoại → users.id) |
| `shiftHours` | json DEFAULT NULL | Giờ làm việc: {start: "09:00", end: "17:00"} |
| `isUpForSwap` | tinyint(1) DEFAULT 0 | Có sẵn sàng để đổi ca không |
| `swapClaimedBy` | varchar(255) DEFAULT NULL | ID nhân viên nhận đổi ca |
| `managerApprovalStatus` | enum('pending_approval','approved','rejected') DEFAULT NULL | Trạng thái phê duyệt của quản lý |
| `room` | varchar(100) DEFAULT NULL | Phòng làm việc |

**Foreign Keys**:

- `staffId` → `users.id` (CASCADE - Nếu xóa user, ca làm việc cũng bị xóa)
- `assignedManagerId` → `users.id` (SET NULL - Nếu xóa quản lý, assignedManagerId sẽ thành NULL)

**Lưu ý**:

- Admin quản lý: tạo, phê duyệt, từ chối ca làm việc
- Staff xem lịch ca làm việc của mình
- Hỗ trợ đổi ca (swap shifts) với phê duyệt của manager

---

### 13. Bảng `staff_tasks` - Công Việc Nhân Viên

**Vai trò**: Quản lý công việc được giao cho nhân viên (để admin giao việc, staff xem và cập nhật trạng thái).

| Trường | Kiểu Dữ Liệu | Mô Tả |
|--------|-------------|-------|
| `id` | varchar(255) NOT NULL | ID công việc (Khóa chính) |
| `title` | varchar(255) NOT NULL | Tiêu đề công việc |
| `description` | text | Mô tả công việc |
| `assignedToId` | varchar(255) NOT NULL | ID nhân viên được giao (Khóa ngoại → users.id) |
| `assignedById` | varchar(255) NOT NULL | ID admin/manager giao việc (Khóa ngoại → users.id) |
| `dueDate` | date NOT NULL | Ngày hết hạn |
| `status` | enum('pending','in-progress','completed','overdue') DEFAULT 'pending' | Trạng thái: Chờ xử lý, Đang thực hiện, Hoàn thành, Quá hạn |
| `createdAt` | datetime NOT NULL | Thời điểm tạo |
| `completedAt` | datetime DEFAULT NULL | Thời điểm hoàn thành |

**Foreign Keys**:

- `assignedToId` → `users.id` (CASCADE - Nếu xóa user, công việc cũng bị xóa)
- `assignedById` → `users.id` (CASCADE - Nếu xóa user, công việc cũng bị xóa)

**Lưu ý**:

- Admin/Manager giao việc cho nhân viên
- Staff xem và cập nhật trạng thái công việc

---

## 🔗 Quan Hệ Giữa Các Bảng

### Sơ Đồ Quan Hệ

```
users (1) ──< (N) appointments (N) >── (1) services
    │                │                      │
    │                │                      ├──< (N) treatment_courses
    │                │                      └──< (N) reviews
    │                │
    │                └──< (N) payments
    │
    ├──< (1) wallets
    │
    ├──< (N) staff_availability
    ├──< (N) staff_shifts
    ├──< (N) staff_tasks (assignedToId)
    └──< (N) staff_tasks (assignedById)

service_categories (1) ──< (N) services

appointments (1) ──< (N) treatment_courses (initialAppointmentId)
appointments (1) ──< (1) reviews (appointmentId, UNIQUE)
appointments (1) ──< (N) payments (appointmentId)
```

**Giải thích**:

- Một `user` (khách hàng) có thể có nhiều `appointments`
- Một `user` (nhân viên) có thể có nhiều `appointments` (với vai trò therapist)
- Một `service` có thể có nhiều `appointments`
- Một `appointment` có thể có một `payment` (hoặc chưa có)
- Một `appointment` có thể có một `review` (DUY NHẤT)
- Một `user` có một `wallet`
- Một `service` có thể có nhiều `treatment_courses`
- Một `appointment` đầu tiên tạo ra một `treatment_course` (qua initialAppointmentId)
- Một `user` (staff) có thể có nhiều `staff_availability`, `staff_shifts`, `staff_tasks`

---

## 📝 Dữ Liệu Mẫu

### Service Categories (Danh Mục Dịch Vụ)

| ID | Tên |
|----|-----|
| 1 | Chăm sóc da |
| 2 | Massage |
| 3 | Triệt lông |
| 4 | Tắm trắng |
| 5 | Thư giãn |
| 6 | Nail |

### Users (Người Dùng)

| ID | Tên | Email | Vai Trò | Trạng Thái |
|----|-----|-------|---------|------------|
| user-1 | Thanh Hằng | <admin@anhtho.com> | Admin | Active |
| user-2 | Trần Minh Anh | <staff@anhtho.com> | Staff | Active |
| user-3 | Trần Thị Ngọc Ánh | <customer@anhtho.com> | Client | Active |
| user-4 | Nguyễn Thuỳ Linh | <staff1@anhtho.com> | Staff | Active |

### Services (Dịch Vụ)

| ID | Tên | Thời Lượng | Giá | Danh Mục | Rating | Review Count |
|----|-----|------------|-----|----------|--------|--------------|
| sv-1 | Chăm sóc da mặt chuyên sâu | 60 phút | 500,000 VNĐ | Chăm sóc da | 4.50 | 12 |
| sv-2 | Massage body thảo dược | 90 phút | 750,000 VNĐ | Massage | 4.80 | 25 |

### Appointments (Đặt Lịch)

| ID | Khách Hàng | Nhân Viên | Dịch Vụ | Thời Gian | Trạng Thái | Thanh Toán |
|----|------------|-----------|---------|-----------|------------|------------|
| apt-1 | user-3 | user-2 | sv-1 | 2024-07-29 09:00 | upcoming | Unpaid |

### Treatment Courses (Liệu Trình) - Templates

| ID | Dịch Vụ | Tổng Buổi | Buổi/Tuần | Thứ | Thời Gian/Buổi | Trạng Thái |
|----|---------|-----------|-----------|-----|----------------|------------|
| tc-template-1 | sv-1 | 8 | 2 | Thứ 2, Thứ 5 | 60 phút (10:00) | active |

---

## 🔍 Các Trường Quan Trọng

### Enum Values (Giá Trị Liệt Kê)

**`users.role`**:

- `'Admin'` - Quản trị viên
- `'Staff'` - Nhân viên
- `'Client'` - Khách hàng

**`users.status`**:

- `'Active'` - Hoạt động
- `'Inactive'` - Không hoạt động
- `'Locked'` - Khóa

**`appointments.status`**:

- `'upcoming'` - Sắp tới
- `'completed'` - Đã hoàn thành
- `'cancelled'` - Đã hủy
- `'pending'` - Đang chờ xác nhận
- `'in-progress'` - Đang thực hiện

**`appointments.paymentStatus`**:

- `'Paid'` - Đã thanh toán
- `'Unpaid'` - Chưa thanh toán

**`payments.method`**:

- `'Cash'` - Thanh toán tiền mặt
- `'Card'` - Thanh toán bằng thẻ
- `'Momo'` - Thanh toán qua Momo
- `'VNPay'` - Thanh toán qua VNPay
- `'ZaloPay'` - Thanh toán qua ZaloPay

**`payments.status`**:

- `'Completed'` - Hoàn thành
- `'Pending'` - Đang chờ
- `'Refunded'` - Đã hoàn tiền
- `'Failed'` - Thất bại

**`treatment_courses.status`**:

- `'active'` - Đang hoạt động
- `'completed'` - Hoàn thành
- `'paused'` - Tạm dừng

**`staff_shifts.shiftType`**:

- `'morning'` - Ca sáng
- `'afternoon'` - Ca chiều
- `'evening'` - Ca tối
- `'leave'` - Nghỉ
- `'custom'` - Tùy chỉnh

**`staff_shifts.status`**:

- `'approved'` - Đã duyệt
- `'pending'` - Chờ duyệt
- `'rejected'` - Từ chối

**`staff_tasks.status`**:

- `'pending'` - Chờ xử lý
- `'in-progress'` - Đang thực hiện
- `'completed'` - Hoàn thành
- `'overdue'` - Quá hạn

---

## ⚠️ Lưu Ý Quan Trọng

1. **Foreign Key Constraints**:
   - Khi xóa một user, tất cả appointments, wallets, reviews, ai_conversations liên quan sẽ bị xóa (CASCADE)
   - Khi xóa một service, tất cả appointments, treatment_courses, reviews, ai_recommendations liên quan sẽ bị xóa (CASCADE)
   - Khi xóa một appointment, payment, review, treatment_course liên quan sẽ được set NULL (SET NULL)

2. **Unique Constraints**:
   - Email trong bảng `users` phải duy nhất
   - Code trong bảng `promotions` phải duy nhất
   - Name trong bảng `service_categories` phải duy nhất
   - appointmentId trong bảng `reviews` phải duy nhất (một appointment chỉ có một review)

3. **ID Format**:
   - Tất cả các bảng (trừ `service_categories`) sử dụng `varchar(255)` cho ID (không phải AUTO_INCREMENT)
   - Format: `user-1`, `sv-1`, `apt-1`, `tc-template-1`, etc.
   - `service_categories.id` sử dụng `int AUTO_INCREMENT`

4. **Character Set**:
   - Database sử dụng `utf8mb4` để hỗ trợ tiếng Việt và emoji

5. **JSON Fields**:
   - Các trường JSON: `loginHistory`, `specialty`, `sessions`, `weekDays`, `availability`, `applicableServiceIds`, `preferences`, `messages`, `context`, `recommendedServices`, `images`, `pointsHistory`

6. **Treatment Courses**:
   - Có thể là template (clientId và initialAppointmentId = NULL) hoặc liệu trình thực tế (có clientId)
   - Template được sử dụng để khách hàng xem và đăng ký
   - Liệu trình thực tế được tạo khi khách hàng đăng ký và có appointment đầu tiên

7. **Points System**:
   - `wallets.pointsHistory` lưu lịch sử tích/tiêu điểm dưới dạng JSON
   - `wallets` lưu số điểm hiện tại và tổng điểm đã tích/tiêu
   - `promotions.isVoucher = 1` và `pointsRequired > 0`: Đây là voucher đổi điểm

8. **Staff Management**:
   - `staff_availability`: Lịch khả dụng của nhân viên (để staff xem lịch)
   - `staff_shifts`: Ca làm việc đã được phân công (admin quản lý, staff xem)
   - `staff_tasks`: Công việc được giao (admin giao việc, staff xem và cập nhật)
   - Staff xem lịch của mình qua `staffId` trong các bảng này

9. **Users Table**:
   - Bảng `users` chỉ lưu thông tin cơ bản, không tách riêng `customers` và `staff`
   - Phân biệt Admin/Staff/Client qua trường `role`
   - Thông tin chi tiết của staff được lưu trong các bảng `staff_availability`, `staff_shifts`, `staff_tasks`

10. **AI System**:
    - Không có bảng AI trong database (sẽ tích hợp API AI bên ngoài)

---

## 🚀 Cách Sử Dụng Script

1. **Mở MySQL Workbench hoặc phpMyAdmin**
2. **Chạy toàn bộ script** `db.txt`
3. **Kiểm tra**:
   - Database `anhthospa_db` đã được tạo
   - 12 bảng đã được tạo
   - Dữ liệu mẫu đã được insert

---

## 📊 Tóm Tắt Cấu Trúc

| Bảng | Số Cột | Khóa Chính | Foreign Keys | Mục Đích |
|------|--------|------------|--------------|----------|
| `users` | 13 | `id` | 0 | Lưu thông tin người dùng cơ bản (Admin, Staff, Client) |
| `service_categories` | 5 | `id` | 0 | Phân loại dịch vụ |
| `services` | 16 | `id` | 1 (categoryId) | Lưu thông tin dịch vụ |
| `wallets` | 6 | `userId` | 1 (userId) | Ví điểm khách hàng (gộp points_history) |
| `appointments` | 19 | `id` | 3 (serviceId, userId, therapistId) | Lưu thông tin đặt lịch (Admin phê duyệt, Admin/Staff xem lịch) |
| `treatment_courses` | 17 | `id` | 4 (serviceId, initialAppointmentId, clientId, therapistId) | Quản lý liệu trình |
| `payments` | 11 | `id` | 3 (bookingId, userId, appointmentId) | Lưu thông tin thanh toán |
| `promotions` | 18 | `id` | 0 | Quản lý khuyến mãi & voucher (gộp redeemable_vouchers, redeemed_rewards) |
| `reviews` | 12 | `id` | 3 (userId, serviceId, appointmentId) | Đánh giá dịch vụ |
| `staff_availability` | 8 | `id` | 1 (staffId) | Lịch khả dụng nhân viên (để staff xem lịch) |
| `staff_shifts` | 13 | `id` | 2 (staffId, assignedManagerId) | Ca làm việc nhân viên (admin quản lý, staff xem) |
| `staff_tasks` | 9 | `id` | 2 (assignedToId, assignedById) | Công việc nhân viên (admin giao việc, staff xem) |

**Tổng cộng**: 12 bảng, nhiều foreign key relationships.

---

## 💡 Kết Luận

File `db.txt` là script SQL hoàn chỉnh để khởi tạo database cho hệ thống Anh Thơ Spa. Script này:

- Tạo database với encoding UTF-8
- Tạo 12 bảng với đầy đủ ràng buộc
- Insert dữ liệu mẫu để test
- Thiết lập quan hệ giữa các bảng qua foreign keys
- Hỗ trợ đầy đủ các chức năng: đặt lịch, thanh toán, ưu đãi, đánh giá, quản lý nhân viên, liệu trình

**Đặc điểm của cấu trúc**:

- Sử dụng bảng `users` cơ bản (không tách `customers` và `staff`)
- Có đầy đủ bảng quản lý lịch làm việc: `staff_availability`, `staff_shifts`, `staff_tasks`
- Không có bảng AI (sẽ tích hợp API AI bên ngoài)
- Admin phê duyệt lịch hẹn, Admin/Staff xem lịch từ `appointments`
- Dễ bảo trì và phát triển
- Đảm bảo đầy đủ chức năng

Đây là nền tảng database cho toàn bộ hệ thống quản lý spa.
