# ✅ Migration Database - Hoàn Thành

## 📦 Những Gì Đã Làm

### 1. Tạo Lại Toàn Bộ Migrations

- ✅ Xóa các migration files cũ (đã lỗi thời)
- ✅ Tạo mới 12 migration files dựa trên models hiện tại
- ✅ Đảm bảo đúng thứ tự dependencies (users → rooms → services → appointments → payments...)

### 2. Cấu Trúc Database Mới

#### Bảng Chính

1. **users** - Tài khoản người dùng (Admin/Staff/Client)
2. **rooms** - Phòng điều trị
3. **service_categories** - Danh mục dịch vụ
4. **services** - Dịch vụ spa
5. **appointments** - Lịch hẹn (có roomId)
6. **payments** - Thanh toán (status: Pending/Completed)
7. **staff_shifts** - Ca làm việc (có roomId, không duplicate)
8. **promotions** - Khuyến mãi & voucher
9. **notifications** - Thông báo (có payment_received type)
10. **wallets** - Ví điểm & tier level
11. **reviews** - Đánh giá dịch vụ
12. **treatment_courses** - Liệu trình điều trị

#### Foreign Keys & Relationships

- Users → Appointments, Payments, Staff Shifts, Wallets
- Rooms → Appointments, Staff Shifts
- Services → Appointments, Reviews
- Appointments → Payments, Reviews

### 3. Sửa Payment Flow

- ✅ Backend: Cash payments tạo với status 'Pending'
- ✅ Backend: Appointment paymentStatus = 'Unpaid' khi chưa xác nhận
- ✅ Frontend: PaymentsPage hiển thị nút xác nhận cho status 'Pending'
- ✅ SQL Script: Cập nhật dữ liệu cũ từ 'Completed' → 'Pending'

### 4. Sửa Notification Type

- ✅ Thêm 'payment_received' vào ENUM type
- ✅ SQL script để ALTER TABLE

### 5. Tạo Scripts & Documentation

- ✅ `scripts/run-migrations.js` - Chạy migrations tự động
- ✅ `scripts/check-migration-status.js` - Kiểm tra trạng thái
- ✅ `scripts/update-database-after-migration.sql` - Update dữ liệu cũ
- ✅ `MIGRATION-INSTRUCTIONS.md` - Hướng dẫn đầy đủ
- ✅ `migrations/MIGRATION-GUIDE.md` - Tài liệu chi tiết

## 🚀 Cách Sử Dụng

### Bước 1: Backup Database (Khuyến nghị)

```bash
mysqldump -u root -p anhthospa_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Bước 2: Chạy Migrations

```bash
cd backend
node scripts/run-migrations.js
```

Hoặc:

```bash
npx sequelize-cli db:migrate
```

### Bước 3: Cập Nhật Dữ Liệu Cũ

Mở MySQL Workbench/phpMyAdmin và chạy:

```
backend/scripts/update-database-after-migration.sql
```

### Bước 4: Restart Server

```bash
npm start
```

### Bước 5: Kiểm Tra

- [ ] Vào `/admin/payments` - thấy các cash payment pending có nút xác nhận
- [ ] Tạo booking mới với Cash - payment phải là Pending
- [ ] Admin xác nhận payment - chuyển sang Completed
- [ ] Báo cáo chỉ tính payments Completed

## 📊 Kết Quả Mong Đợi

### Payment Flow

```
Khách đặt lịch (Cash)
    ↓
Payment: status = 'Pending'
Appointment: paymentStatus = 'Unpaid'
    ↓
Admin vào /admin/payments
Thấy badge vàng "Chờ xử lý (Tiền mặt)"
Có nút xác nhận màu xanh
    ↓
Admin click xác nhận
    ↓
Payment: status = 'Completed'
Appointment: paymentStatus = 'Paid'
    ↓
Tính vào doanh thu báo cáo
```

## 🐛 Xử Lý Vấn Đề

### Nếu migration bị lỗi

```bash
# Kiểm tra trạng thái
npx sequelize-cli db:migrate:status

# Undo migration cuối
npx sequelize-cli db:migrate:undo

# Sửa lỗi và chạy lại
npx sequelize-cli db:migrate
```

### Nếu vẫn gặp lỗi notification type

Chạy SQL này:

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

## 📁 Files Đã Tạo/Sửa

### Migrations (Mới)

- `migrations/20250113000001-create-users.js`
- `migrations/20250113000002-create-rooms.js`
- `migrations/20250113000003-create-service-categories.js`
- `migrations/20250113000004-create-services.js`
- `migrations/20250113000005-create-appointments.js`
- `migrations/20250113000006-create-payments.js`
- `migrations/20250113000007-create-staff-shifts.js`
- `migrations/20250113000008-create-promotions.js`
- `migrations/20250113000009-create-notifications.js`
- `migrations/20250113000010-create-wallets.js`
- `migrations/20250113000011-create-reviews.js`
- `migrations/20250113000012-create-treatment-courses.js`

### Scripts (Mới)

- `scripts/run-migrations.js`
- `scripts/check-migration-status.js`
- `scripts/update-database-after-migration.sql`
- `scripts/fix-cash-payment-status.js` (đã tạo trước)
- `scripts/fix-cash-payments.sql` (đã tạo trước)

### Documentation (Mới)

- `MIGRATION-INSTRUCTIONS.md` - Hướng dẫn chính
- `migrations/MIGRATION-GUIDE.md` - Hướng dẫn chi tiết

### Backend Code (Đã sửa trước đó)

- `services/paymentService.js` - Payment status = 'Pending'
- `routes/payments.js` - Cash payment flow

## ✨ Tính Năng Mới

1. **Payment Confirmation Flow**

   - Cash payments cần admin xác nhận
   - Hiển thị thông báo vàng khi có pending payments
   - Nút xác nhận màu xanh nổi bật

2. **Room Management**

   - Appointments có roomId
   - Staff shifts có roomId (bắt buộc)
   - Không cho duplicate shifts

3. **Notification System**

   - Type 'payment_received' cho cash payments
   - Thông báo realtime cho admin

4. **Accurate Revenue Reporting**
   - Chỉ tính payments có status 'Completed'
   - Phân biệt rõ paid vs pending

## 🎯 Next Steps

Sau khi chạy migrations thành công:

1. ✅ Test tạo booking với Cash payment
2. ✅ Test admin xác nhận payment
3. ✅ Test báo cáo doanh thu
4. ✅ Test staff shift management với room
5. ✅ Test booking flow với staff filtering

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Check `MIGRATION-INSTRUCTIONS.md` - Troubleshooting section
2. Check server logs: `backend/` khi chạy `npm start`
3. Check MySQL error logs

---

**✅ Tất cả migrations đã sẵn sàng. Hãy backup database rồi chạy migrations!**
