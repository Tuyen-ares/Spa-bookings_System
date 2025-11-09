# Database Migrations Guide

## Tổng quan

Dự án sử dụng **Sequelize CLI** để quản lý database migrations. Tất cả migrations được tạo theo cấu trúc từ file `db.txt`.

## Cấu trúc migrations

```
backend/
├── migrations/
│   ├── 20250109000001-create-users.js
│   ├── 20250109000002-create-service-categories.js
│   ├── 20250109000003-create-services.js
│   ├── 20250109000004-create-wallets.js
│   ├── 20250109000005-create-appointments.js
│   ├── 20250109000006-create-payments.js
│   ├── 20250109000007-create-promotions.js
│   ├── 20250109000008-create-reviews.js
│   ├── 20250109000009-create-treatment-courses.js
│   ├── 20250109000010-create-staff-availability.js
│   ├── 20250109000011-create-staff-shifts.js
│   ├── 20250109000012-create-staff-tasks.js
│   └── 20250109000013-create-rooms.js
├── config/
│   └── config.js
└── .sequelizerc
```

## Danh sách bảng (13 bảng)

### Core Tables - Bảng cốt lõi

1. **users** - Quản lý tài khoản (Admin, Staff, Client)
2. **service_categories** - Danh mục dịch vụ
3. **services** - Dịch vụ spa
4. **wallets** - Ví điểm & lịch sử điểm

### Booking & Appointment Tables

5. **appointments** - Đặt lịch (Admin phê duyệt, Staff xem lịch)
6. **treatment_courses** - Liệu trình điều trị

### Payment & Promotion Tables

7. **payments** - Thanh toán (VNPay, Counter, Cash, Card, Momo, ZaloPay)
8. **promotions** - Khuyến mãi & Voucher đổi điểm

### Review & Feedback Tables

9. **reviews** - Đánh giá dịch vụ

### Staff Management Tables

10. **staff_availability** - Lịch khả dụng nhân viên
11. **staff_shifts** - Ca làm việc nhân viên
12. **staff_tasks** - Công việc nhân viên

### Facility Management

13. **rooms** - Phòng điều trị

## Cài đặt

### 1. Cài đặt Sequelize CLI

```bash
npm install --save-dev sequelize-cli
npm install --save sequelize mysql2
```

### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục `backend/`:

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=anhthospa_db
NODE_ENV=development
```

## Chạy Migrations

### Chạy tất cả migrations (tạo database từ đầu)

```bash
cd backend
npx sequelize-cli db:migrate
```

### Rollback migration gần nhất

```bash
npx sequelize-cli db:migrate:undo
```

### Rollback tất cả migrations

```bash
npx sequelize-cli db:migrate:undo:all
```

### Rollback đến migration cụ thể

```bash
npx sequelize-cli db:migrate:undo:all --to 20250109000005-create-appointments.js
```

### Kiểm tra trạng thái migrations

```bash
npx sequelize-cli db:migrate:status
```

## Tạo Migration mới

### Tạo migration trống

```bash
npx sequelize-cli migration:generate --name add-column-to-users
```

### Ví dụ migration thêm cột

```javascript
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "address", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "address");
  },
};
```

## Scripts NPM

Thêm vào `package.json`:

```json
{
  "scripts": {
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:undo": "sequelize-cli db:migrate:undo",
    "db:migrate:undo:all": "sequelize-cli db:migrate:undo:all",
    "db:migrate:status": "sequelize-cli db:migrate:status"
  }
}
```

Sử dụng:

```bash
npm run db:migrate
npm run db:migrate:undo
npm run db:migrate:status
```

## Foreign Keys & Relationships

### users → wallets (1:1)

- `wallets.userId` → `users.id`
- ON DELETE CASCADE

### users → appointments (1:N)

- `appointments.userId` → `users.id` (Khách hàng)
- `appointments.therapistId` → `users.id` (Nhân viên)

### services → appointments (1:N)

- `appointments.serviceId` → `services.id`

### service_categories → services (1:N)

- `services.categoryId` → `service_categories.id`

### appointments → payments (1:N)

- `payments.appointmentId` → `appointments.id`

### appointments → reviews (1:1)

- `reviews.appointmentId` → `appointments.id` (UNIQUE)

### users → staff_availability (1:N)

- `staff_availability.staffId` → `users.id`

### users → staff_shifts (1:N)

- `staff_shifts.staffId` → `users.id`

### users → staff_tasks (N:N)

- `staff_tasks.assignedToId` → `users.id`
- `staff_tasks.assignedById` → `users.id`

### rooms → appointments (1:N)

- `appointments.roomId` → `rooms.id`

## Best Practices

### 1. Naming Conventions

- Migration files: `YYYYMMDDHHMMSS-descriptive-name.js`
- Table names: lowercase, plural (users, appointments)
- Foreign keys: `tableName_fk_reference`

### 2. Transaction Support

Always use transactions for complex migrations:

```javascript
up: async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.addColumn(
      "users",
      "newField",
      {
        type: Sequelize.STRING,
      },
      { transaction }
    );

    await queryInterface.addIndex("users", ["newField"], {
      transaction,
    });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
```

### 3. Indexes

Add indexes cho các cột thường query:

```javascript
await queryInterface.addIndex("appointments", ["date", "time"], {
  name: "date_time_idx",
});
```

### 4. Data Migration

Nếu cần migrate data, tạo migration riêng:

```javascript
up: async (queryInterface, Sequelize) => {
  await queryInterface.sequelize.query(`
    UPDATE users SET status = 'Active' WHERE status IS NULL
  `);
};
```

## Troubleshooting

### Lỗi "Access denied for user"

- Kiểm tra username/password trong `.env`
- Verify MySQL service đang chạy

### Lỗi "Unknown database"

```bash
# Tạo database thủ công
mysql -u root -p
CREATE DATABASE anhthospa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Lỗi "Table already exists"

```bash
# Rollback và chạy lại
npm run db:migrate:undo:all
npm run db:migrate
```

### Lỗi Foreign Key constraint

- Đảm bảo thứ tự migrations đúng (parent table trước child table)
- Kiểm tra referenced table đã được tạo

## Migration History

Sequelize lưu trữ migration history trong bảng `SequelizeMeta`:

```sql
SELECT * FROM SequelizeMeta ORDER BY name;
```

## Production Deployment

### 1. Backup database trước khi migrate

```bash
mysqldump -u root -p anhthospa_db > backup_$(date +%Y%m%d).sql
```

### 2. Chạy migrations trên production

```bash
NODE_ENV=production npx sequelize-cli db:migrate
```

### 3. Rollback nếu có lỗi

```bash
NODE_ENV=production npx sequelize-cli db:migrate:undo
```

## Notes

- Tất cả migrations được tạo dựa trên schema trong `db.txt`
- Charset: `utf8mb4`, Collation: `utf8mb4_unicode_ci`
- No timestamps (createdAt, updatedAt) trừ `staff_tasks`
- Enum values phải match với models
- JSON fields dùng cho array/object data
