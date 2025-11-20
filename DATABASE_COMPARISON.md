# SO SÁNH DATABASE SCHEMA: Migrations vs db.txt

## 📊 Tổng Quan

So sánh các bảng trong **Migrations hiện tại** với **db.txt** để tìm sự khác biệt.

---

## ✅ BẢNG CÓ TRONG CẢ HAI

| Bảng | Migrations | db.txt | Ghi Chú |
|------|------------|--------|---------|
| `users` | ✅ `20250113000001-create-users.js` | ✅ | Khớp |
| `rooms` | ✅ `20250113000002-create-rooms.js` | ✅ | Khớp |
| `service_categories` | ✅ `20250113000003-create-service-categories.js` | ✅ | Khớp |
| `services` | ✅ `20250113000004-create-services.js` | ✅ | Khớp |
| `appointments` | ✅ `20250113000005-create-appointments.js` | ✅ | Khớp |
| `payments` | ✅ `20250113000006-create-payments.js` | ✅ | Khớp |
| `staff_shifts` | ✅ `20250113000007-create-staff-shifts.js` | ✅ | Khớp |
| `promotions` | ✅ `20250113000008-create-promotions.js` | ✅ | Khớp |
| `wallets` | ✅ `20250113000010-create-wallets.js` | ✅ | Khớp |
| `reviews` | ✅ `20250113000011-create-reviews.js` | ✅ | Khớp |

**Tổng: 10 bảng khớp**

---

## ❌ BẢNG CHỈ CÓ TRONG db.txt (KHÔNG CÓ MIGRATION)

| Bảng | db.txt | Migrations | Ghi Chú |
|------|--------|------------|---------|
| `staff_availability` | ✅ Có (dòng 253-266) | ❌ **THIẾU** | Model `StaffAvailability.js` tồn tại nhưng không có migration |
| `treatment_courses` | ✅ Có (dòng 140-167) | ❌ Đã xóa | Đã xóa theo yêu cầu |
| `staff_tasks` | ✅ Có (dòng 290-305) | ❌ Đã xóa | Đã xóa theo yêu cầu |

**Tổng: 1 bảng thiếu migration (`staff_availability`)**

---

## ❌ BẢNG CHỈ CÓ TRONG MIGRATIONS (KHÔNG CÓ TRONG db.txt)

| Bảng | Migrations | db.txt | Ghi Chú |
|------|------------|--------|---------|
| `notifications` | ✅ `20250113000009-create-notifications.js` | ❌ **THIẾU** | Có migration nhưng không có trong db.txt |

**Tổng: 1 bảng thiếu trong db.txt (`notifications`)**

---

## 🔍 CHI TIẾT SỰ KHÁC BIỆT

### 1. `staff_availability` - THIẾU MIGRATION

**Trạng thái:**

- ✅ Model: `backend/models/StaffAvailability.js` tồn tại
- ✅ db.txt: Có định nghĩa bảng (dòng 253-266)
- ❌ Migration: **KHÔNG CÓ** migration file tạo bảng này

**Cấu trúc trong db.txt:**

```sql
CREATE TABLE `staff_availability` (
  `id` varchar(255) NOT NULL,
  `staffId` varchar(255) NOT NULL,
  `date` date DEFAULT NULL,
  `dayOfWeek` int DEFAULT NULL,
  `startTime` varchar(10) DEFAULT NULL,
  `endTime` varchar(10) DEFAULT NULL,
  `isAvailable` tinyint(1) DEFAULT 1,
  `timeSlots` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `staffId` (`staffId`),
  KEY `staffId_date` (`staffId`,`date`),
  CONSTRAINT `staff_availability_fk_staff` FOREIGN KEY (`staffId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Hành động cần thiết:** Tạo migration file `20250113000013-create-staff-availability.js`

---

### 2. `notifications` - THIẾU TRONG db.txt

**Trạng thái:**

- ✅ Model: `backend/models/Notification.js` tồn tại
- ✅ Migration: `20250113000009-create-notifications.js` tồn tại
- ❌ db.txt: **KHÔNG CÓ** định nghĩa bảng này

**Cấu trúc trong migration:**

- `id` (STRING, PK)
- `userId` (STRING, FK → users.id)
- `type` (ENUM: 'new_appointment', 'appointment_confirmed', 'appointment_cancelled', 'appointment_reminder', 'treatment_course_reminder', 'promotion', 'payment_success', 'payment_received', 'system')
- `title` (STRING)
- `message` (TEXT)
- `relatedId` (STRING, nullable)
- `isRead` (BOOLEAN, default: false)
- `sentVia` (ENUM: 'app', 'email', 'both')
- `emailSent` (BOOLEAN, default: false)
- `createdAt` (DATE)

**Hành động cần thiết:** Thêm định nghĩa bảng `notifications` vào db.txt

---

## 📋 TÓM TẮT

### Bảng trong Migrations (11 bảng)

1. ✅ users
2. ✅ rooms
3. ✅ service_categories
4. ✅ services
5. ✅ appointments
6. ✅ payments
7. ✅ staff_shifts
8. ✅ promotions
9. ✅ **notifications** (có migration, thiếu trong db.txt)
10. ✅ wallets
11. ✅ reviews

### Bảng trong db.txt (13 bảng)

1. ✅ users
2. ✅ service_categories
3. ✅ services
4. ✅ wallets
5. ✅ appointments
6. ❌ treatment_courses (đã xóa)
7. ✅ payments
8. ✅ promotions
9. ✅ reviews
10. ❌ **staff_availability** (có trong db.txt, thiếu migration)
11. ✅ staff_shifts
12. ❌ staff_tasks (đã xóa)
13. ✅ rooms

### Bảng đã xóa (theo yêu cầu)

- ❌ treatment_courses
- ❌ treatment_packages
- ❌ treatment_package_services
- ❌ treatment_course_services
- ❌ staff_tasks

---

## 🔧 HÀNH ĐỘNG CẦN THỰC HIỆN

### 1. Tạo Migration cho `staff_availability`

**File:** `backend/migrations/20250113000013-create-staff-availability.js`

### 2. Thêm `notifications` vào db.txt

**Vị trí:** Sau bảng `reviews` (khoảng dòng 247)

### 3. Xóa `treatment_courses` khỏi db.txt

**Vị trí:** Dòng 139-167 (đã xóa trong code nhưng còn trong db.txt)

### 4. Xóa `staff_tasks` khỏi db.txt

**Vị trí:** Dòng 289-305 (đã xóa trong code nhưng còn trong db.txt)

---

## 📝 KẾT LUẬN

**Sự khác biệt chính:**

1. ❌ **Thiếu migration** cho `staff_availability` (có model và db.txt nhưng không có migration)
2. ❌ **Thiếu trong db.txt** bảng `notifications` (có migration và model nhưng không có trong db.txt)
3. ⚠️ **db.txt còn chứa** các bảng đã xóa: `treatment_courses`, `staff_tasks`

**Cần đồng bộ:**

- Tạo migration cho `staff_availability`
- Thêm `notifications` vào db.txt
- Xóa `treatment_courses` và `staff_tasks` khỏi db.txt
