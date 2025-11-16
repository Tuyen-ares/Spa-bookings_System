# 🔄 Hướng Dẫn Migration Database Mới

## 📋 Tổng Quan

Đã tạo lại toàn bộ migrations để phù hợp với cấu trúc database hiện tại, bao gồm:

- ✅ 12 migration files cho tất cả các bảng
- ✅ Cấu trúc đầy đủ với foreign keys và constraints
- ✅ Hỗ trợ payment flow mới (Cash = Pending → Admin confirm → Completed)
- ✅ Notification type đã thêm 'payment_received'

## 🗂️ Danh Sách Migrations

```
20250113000001-create-users.js           → Bảng users (Admin, Staff, Client)
20250113000002-create-rooms.js           → Bảng rooms (phòng điều trị)
20250113000003-create-service-categories.js → Danh mục dịch vụ
20250113000004-create-services.js        → Dịch vụ spa
20250113000005-create-appointments.js    → Lịch hẹn
20250113000006-create-payments.js        → Thanh toán (Pending/Completed flow)
20250113000007-create-staff-shifts.js    → Ca làm việc nhân viên
20250113000008-create-promotions.js      → Khuyến mãi & voucher
20250113000009-create-notifications.js   → Thông báo (có payment_received)
20250113000010-create-wallets.js         → Ví điểm & hạng thành viên
20250113000011-create-reviews.js         → Đánh giá dịch vụ
20250113000012-create-treatment-courses.js → Liệu trình điều trị
```

## 🚀 Cách Chạy Migrations

### Phương án 1: Chạy script tự động (Khuyến nghị)

```bash
cd backend
node scripts/run-migrations.js
```

### Phương án 2: Chạy trực tiếp bằng Sequelize CLI

```bash
cd backend
npx sequelize-cli db:migrate
```

### Kiểm tra trạng thái migration

```bash
# Dùng script
node scripts/check-migration-status.js

# Hoặc dùng CLI
npx sequelize-cli db:migrate:status
```

## 🔧 Xử Lý Dữ Liệu Cũ

Sau khi chạy migrations, cần cập nhật dữ liệu cũ:

### 1. Sửa lỗi Notification Type

Chạy SQL script để thêm 'payment_received' vào ENUM:

```bash
# Mở MySQL Workbench hoặc phpMyAdmin
# Chạy file: backend/scripts/update-database-after-migration.sql
```

### 2. Cập nhật Cash Payments

Script SQL trên cũng sẽ:

- ✅ Đổi Cash payments cũ từ 'Completed' → 'Pending'
- ✅ Cập nhật appointment paymentStatus từ 'Paid' → 'Unpaid'

## 📊 Kiểm Tra Kết Quả

### Trong MySQL Workbench

```sql
-- Kiểm tra tất cả bảng đã được tạo
SHOW TABLES;

-- Kiểm tra cấu trúc bảng payments
DESCRIBE payments;

-- Kiểm tra ENUM của notifications
SHOW COLUMNS FROM notifications WHERE Field = 'type';

-- Xem các payment cần admin xác nhận
SELECT * FROM payments
WHERE method = 'Cash' AND status = 'Pending'
ORDER BY date DESC;
```

### Trong ứng dụng

1. **Đăng nhập admin** → `/admin/payments`
2. Kiểm tra xem có thông báo vàng "Có X giao dịch tiền mặt cần xác nhận"
3. Các thanh toán tiền mặt cũ phải hiển thị nút xác nhận màu xanh ✅

## 🔄 Reset Database Hoàn Toàn (Nếu Cần)

Nếu muốn tạo lại database từ đầu:

### Bước 1: Drop và tạo lại database

```sql
DROP DATABASE IF EXISTS anhthospa_db;
CREATE DATABASE anhthospa_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Chạy migrations

```bash
cd backend
npx sequelize-cli db:migrate
```

### Bước 3: Cập nhật notification ENUM

```bash
# Chạy file: backend/scripts/update-database-after-migration.sql
# (Chỉ phần ALTER TABLE notifications)
```

### Bước 4: Khởi động server

```bash
npm start
```

## ⚠️ Lưu Ý Quan Trọng

### 1. Backup trước khi chạy

```bash
# Backup database
mysqldump -u root -p anhthospa_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Kiểm tra .env

Đảm bảo file `.env` có đúng cấu hình:

```
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=anhthospa_db
DB_USER=root
DB_PASSWORD=your_password
```

### 3. MySQL phải đang chạy

```bash
# Windows: Kiểm tra MySQL service
services.msc

# Hoặc kiểm tra kết nối
mysql -u root -p -h 127.0.0.1 -P 3307
```

## 🐛 Troubleshooting

### Lỗi: "Cannot find module 'sequelize-cli'"

```bash
npm install -g sequelize-cli
# Hoặc dùng npx (không cần install global)
```

### Lỗi: "Database does not exist"

```bash
# Tạo database thủ công
mysql -u root -p
CREATE DATABASE anhthospa_db;
exit
```

### Lỗi: "Data truncated for column 'type'"

Chạy SQL script để cập nhật ENUM:

```sql
ALTER TABLE notifications
MODIFY COLUMN type ENUM(
  'new_appointment',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_reminder',
  'treatment_course_reminder',
  'promotion',
  'payment_success',
  'payment_received',
  'system'
) NOT NULL DEFAULT 'system';
```

### Migration bị stuck ở giữa chừng

```bash
# Kiểm tra xem migration nào đã chạy
npx sequelize-cli db:migrate:status

# Undo migration cuối cùng
npx sequelize-cli db:migrate:undo

# Fix lỗi trong file migration

# Chạy lại
npx sequelize-cli db:migrate
```

## 📚 Tài Liệu Tham Khảo

- [Sequelize Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)
- [Sequelize CLI](https://github.com/sequelize/cli)
- [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Hướng dẫn chi tiết

## ✅ Checklist Hoàn Thành

Sau khi chạy migrations, đảm bảo:

- [ ] Tất cả 12 bảng đã được tạo
- [ ] Foreign keys hoạt động đúng
- [ ] Notification type có 'payment_received'
- [ ] Payment status flow đúng (Cash = Pending)
- [ ] Server khởi động không lỗi
- [ ] Có thể tạo booking mới
- [ ] Admin thấy nút xác nhận payment
- [ ] Báo cáo tính doanh thu chính xác

---

**🎉 Chúc may mắn! Nếu có vấn đề, check troubleshooting section hoặc xem logs.**
