# So Sánh Chi Tiết Database Schema

## Tổng Quan

File này so sánh sự khác biệt giữa schema database trong `db.txt` (phiên bản cũ) và schema thực tế từ các migration files (phiên bản mới).

---

## 1. Tổng Số Bảng

| Phiên bản | Số bảng | Ghi chú |
|-----------|---------|---------|
| **Cũ (db.txt)** | 12 bảng | Không có bảng `promotion_usage` |
| **Mới (Migration)** | 13 bảng | Thêm bảng `promotion_usage` |

---

## 2. Bảng `services`

### Thay đổi

| Trường | Phiên bản cũ | Phiên bản mới | Ghi chú |
|--------|--------------|---------------|---------|
| `imageUrl` | `varchar(500)` | `LONGTEXT` | ✅ **Đã thay đổi** - Hỗ trợ base64 hoặc URL dài hơn |

**Migration liên quan:**

- `20250116000001-alter-services-imageurl-to-longtext.js`

---

## 3. Bảng `wallets`

### Thay đổi

| Trường | Phiên bản cũ | Phiên bản mới | Ghi chú |
|--------|--------------|---------------|---------|
| `tierLevel` | ❌ Không có | `int NOT NULL DEFAULT 1` | ✅ **Đã thêm** - Hạng thành viên (1-8) |

**Migration liên quan:**

- Được tạo trong migration ban đầu `20250113000010-create-wallets.js`

---

## 4. Bảng `appointments`

### Thay đổi

| Trường | Phiên bản cũ | Phiên bản mới | Ghi chú |
|--------|--------------|---------------|---------|
| `promotionId` | ❌ Không có | `varchar(255) DEFAULT NULL` | ✅ **Đã thêm** - ID mã khuyến mãi/voucher được áp dụng |

**Foreign Key:**

- Thêm constraint: `appointments_fk_promotion` → `promotions(id)`
- Thêm index: `KEY promotionId (promotionId)`

**Migration liên quan:**

- `20250120000001-add-promotion-id-to-appointments.js`

---

## 5. Bảng `treatment_courses`

### Thay đổi

| Trường | Phiên bản cũ | Phiên bản mới | Ghi chú |
|--------|--------------|---------------|---------|
| `paymentStatus` | ❌ Không có | `enum('Paid','Unpaid') NOT NULL DEFAULT 'Unpaid'` | ✅ **Đã thêm** - Trạng thái thanh toán |

**Migration liên quan:**

- `20250117000001-add-payment-status-to-treatment-courses.js`

---

## 6. Bảng `promotions`

### Thay đổi

| Trường | Phiên bản cũ | Phiên bản mới | Ghi chú |
|--------|--------------|---------------|---------|
| `isPublic` | ❌ Không có | `tinyint(1) DEFAULT 1` | ✅ **Đã thêm** - true = public, false = private |
| `pointsRequired` | ❌ Không có | `int DEFAULT NULL` | ✅ **Đã thêm** - Số điểm cần để đổi voucher (cho private) |

**Ghi chú:**

- `isPublic = true`: Voucher hiển thị trên trang khách hàng
- `isPublic = false` và `pointsRequired > 0`: Voucher có thể đổi bằng điểm

**Migrations liên quan:**

- `20250120000003-add-is-public-to-promotions.js`
- `20250116000004-add-points-required-to-promotions.js`

---

## 7. Bảng `promotion_usage` (BẢNG MỚI)

### ✅ Bảng hoàn toàn mới - Không có trong phiên bản cũ

**Mục đích:** Theo dõi việc đổi và sử dụng voucher/khuyến mãi

**Cấu trúc:**

| Trường | Kiểu dữ liệu | Ghi chú |
|--------|--------------|---------|
| `id` | `varchar(255) NOT NULL` | Primary Key |
| `userId` | `varchar(255) NOT NULL` | ID người dùng |
| `promotionId` | `varchar(255) NOT NULL` | ID mã khuyến mãi/voucher |
| `appointmentId` | `varchar(255) DEFAULT NULL` | ID lịch hẹn (NULL = chưa sử dụng) |
| `serviceId` | `varchar(255) DEFAULT NULL` | ID dịch vụ (tracking New Clients) |
| `usedAt` | `datetime NOT NULL DEFAULT CURRENT_TIMESTAMP` | Thời gian đổi/sử dụng |

**Indexes:**

- `promotion_usage_user_promo_idx` (`userId`, `promotionId`)
- `promotion_usage_user_service_idx` (`userId`, `serviceId`)

**Foreign Keys:**

- `promotion_usage_fk_user` → `users(id)`
- `promotion_usage_fk_promotion` → `promotions(id)`
- `promotion_usage_fk_appointment` → `appointments(id)`
- `promotion_usage_fk_service` → `services(id)`

**Logic nghiệp vụ:**

- `appointmentId = NULL`: Voucher đã đổi nhưng chưa sử dụng (còn trong ví)
- `appointmentId != NULL`: Voucher đã được sử dụng cho appointment đó
- `serviceId`: Dùng để tracking "New Clients" promotion

**Migration liên quan:**

- `20250120000002-create-promotion-usage.js`

---

## 8. Tóm Tắt Thay Đổi

### Bảng mới

1. ✅ `promotion_usage` - Theo dõi việc sử dụng voucher

### Trường mới

1. ✅ `wallets.tierLevel` - Hạng thành viên
2. ✅ `appointments.promotionId` - ID voucher được áp dụng
3. ✅ `treatment_courses.paymentStatus` - Trạng thái thanh toán
4. ✅ `promotions.isPublic` - Public/Private voucher
5. ✅ `promotions.pointsRequired` - Số điểm cần để đổi voucher

### Thay đổi kiểu dữ liệu

1. ✅ `services.imageUrl`: `varchar(500)` → `LONGTEXT`

---

## 9. Sample Data Updates

### Bảng `wallets`

```sql
-- Cũ
INSERT INTO `wallets` (`id`, `userId`, `points`, `totalSpent`) VALUES
('wallet-1', 'user-3', 250, 0.00);

-- Mới (thêm tierLevel)
INSERT INTO `wallets` (`id`, `userId`, `points`, `tierLevel`, `totalSpent`) VALUES
('wallet-1', 'user-3', 250, 1, 0.00);
```

### Bảng `appointments`

```sql
-- Cũ
INSERT INTO `appointments` (..., `bookingGroupId`) VALUES
(..., NULL);

-- Mới (thêm promotionId)
INSERT INTO `appointments` (..., `bookingGroupId`, `promotionId`) VALUES
(..., NULL, NULL);
```

### Bảng `treatment_courses`

```sql
-- Cũ
INSERT INTO `treatment_courses` (..., `status`, `notes`) VALUES
(..., 'active', '...');

-- Mới (thêm paymentStatus)
INSERT INTO `treatment_courses` (..., `status`, `paymentStatus`, `notes`) VALUES
(..., 'active', 'Unpaid', '...');
```

---

## 10. Lưu Ý Khi Migrate

### Nếu đang sử dụng database cũ

1. **Chạy các migration theo thứ tự:**

   ```bash
   # 1. Thêm tierLevel vào wallets (nếu chưa có)
   # 2. Thêm promotionId vào appointments
   # 3. Thêm paymentStatus vào treatment_courses
   # 4. Thêm isPublic và pointsRequired vào promotions
   # 5. Tạo bảng promotion_usage
   # 6. Thay đổi imageUrl từ varchar(500) sang LONGTEXT
   ```

2. **Dữ liệu mặc định:**
   - `wallets.tierLevel`: Set mặc định = 1 cho các record cũ
   - `appointments.promotionId`: NULL (không ảnh hưởng dữ liệu cũ)
   - `treatment_courses.paymentStatus`: Set mặc định = 'Unpaid' cho các record cũ
   - `promotions.isPublic`: Set mặc định = true (tất cả voucher cũ là public)
   - `promotions.pointsRequired`: NULL (không ảnh hưởng voucher cũ)

3. **Backup database trước khi migrate:**

   ```sql
   mysqldump -u root -p anhthospa_db > backup_before_migration.sql
   ```

---

## 11. Impact Analysis

### Frontend

- ✅ Cần cập nhật TypeScript types để bao gồm các trường mới
- ✅ Cần xử lý logic `isPublic` và `pointsRequired` trong UI
- ✅ Cần hiển thị `tierLevel` trong profile/wallet

### Backend

- ✅ API endpoints cần xử lý `promotionId` khi tạo appointment
- ✅ API endpoints cần xử lý `promotion_usage` khi đổi/sử dụng voucher
- ✅ Logic validation cần kiểm tra `isPublic` và `pointsRequired`

### Database

- ✅ Không có breaking changes (tất cả trường mới đều nullable hoặc có default)
- ✅ Có thể migrate an toàn mà không mất dữ liệu

---

## 12. Kết Luận

Schema mới đã được cập nhật để hỗ trợ:

1. ✅ Hệ thống voucher public/private
2. ✅ Đổi điểm lấy voucher
3. ✅ Theo dõi việc sử dụng voucher chi tiết
4. ✅ Hạng thành viên (tier level)
5. ✅ Trạng thái thanh toán cho liệu trình
6. ✅ Hỗ trợ hình ảnh dài hơn (LONGTEXT)

Tất cả các thay đổi đều **backward compatible** và không ảnh hưởng đến dữ liệu hiện có.
