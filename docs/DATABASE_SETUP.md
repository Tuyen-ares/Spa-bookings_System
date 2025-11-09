# Hướng dẫn Kết nối Database

## 1. Cấu hình Database

### Bước 1: Tạo file `.env` trong thư mục `backend/`

Copy file `env.example` thành `.env` và điền thông tin kết nối database của bạn:

```bash
# Windows PowerShell
Copy-Item backend\env.example backend\.env

# Linux/Mac
cp backend/env.example backend/.env
```

### Bước 2: Chỉnh sửa file `.env`

Mở file `backend/.env` và cập nhật các thông tin sau:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=anhthospa_db
DB_USER=root
DB_PASSWORD=your_password_here

PORT=3001
JWT_SECRET=your_jwt_secret_key_here_change_in_production
DB_ALTER_ON_START=false
```

**Lưu ý:**
- `DB_PASSWORD`: Điền mật khẩu MySQL của bạn
- `JWT_SECRET`: Đặt một chuỗi bí mật ngẫu nhiên (dùng để mã hóa JWT token)
- `DB_ALTER_ON_START`: Đặt `true` nếu muốn Sequelize tự động cập nhật schema khi khởi động (không khuyến khích trong production)

## 2. Tạo Database trong MySQL

### Bước 1: Mở MySQL Workbench hoặc MySQL Command Line

### Bước 2: Chạy script `db.txt`

1. Mở file `db.txt` trong project
2. Copy toàn bộ nội dung
3. Paste vào MySQL Workbench hoặc MySQL Command Line
4. Chạy script (Execute)

Script sẽ:
- Tạo database `anhthospa_db`
- Tạo tất cả các bảng cần thiết
- Chèn dữ liệu mẫu

## 3. Kiểm tra Kết nối

### Bước 1: Cài đặt dependencies (nếu chưa có)

```bash
cd backend
npm install
```

### Bước 2: Khởi động server

```bash
npm start
```

Nếu kết nối thành công, bạn sẽ thấy:
```
Database synced.
Server is running on port 3001
Access the API at http://localhost:3001
```

## 4. Các thay đổi đã thực hiện

### Models đã được cập nhật để khớp với database:

1. **Customer.js**: 
   - Đã bỏ `selfCareIndex`, `qrCodeUrl`
   - Đã bỏ foreign key đến `tiers` table

2. **Staff.js**: 
   - Đã bỏ `kpiGoals`, `qrCodeUrl`, `staffTierId`
   - Đã bỏ foreign key đến `staff_tiers` table

3. **Payment.js**: 
   - Đã thêm `bookingId` field
   - Đã bỏ `productId` field

4. **StaffTask.js**: 
   - Đã bỏ `priority` field

5. **database.js**: 
   - Đã bỏ models: `Tier`, `StaffTier`, `Product`, `Sale`
   - Đã bỏ các associations liên quan đến các bảng đã xóa
   - Đã cập nhật `checkAndUpgradeTier` function

6. **routes/users.js**: 
   - Đã bỏ `Tier` và `StaffTier` từ include profiles

## 5. Troubleshooting

### Lỗi: "Access denied for user"
- Kiểm tra lại `DB_USER` và `DB_PASSWORD` trong file `.env`
- Đảm bảo user MySQL có quyền truy cập database

### Lỗi: "Unknown database"
- Đảm bảo đã chạy script `db.txt` để tạo database
- Kiểm tra `DB_NAME` trong file `.env` có đúng tên database không

### Lỗi: "Table doesn't exist"
- Đảm bảo đã chạy script `db.txt` hoàn chỉnh
- Kiểm tra xem có lỗi nào khi chạy script không

### Lỗi: "Sequelize connection error"
- Kiểm tra MySQL service đã chạy chưa
- Kiểm tra `DB_HOST` và `DB_PORT` có đúng không
- Kiểm tra firewall có chặn port 3306 không

## 6. Kiểm tra Database Schema

Sau khi kết nối thành công, bạn có thể kiểm tra các bảng đã được tạo:

```sql
USE anhthospa_db;
SHOW TABLES;
```

Bạn sẽ thấy các bảng sau:
- users
- customers
- staff
- services
- service_categories
- appointments
- payments
- promotions
- wallets
- reviews
- ... và các bảng khác

## 7. Lưu ý quan trọng

- **KHÔNG** commit file `.env` lên Git (đã có trong `.gitignore`)
- **KHÔNG** đặt `DB_ALTER_ON_START=true` trong production
- Đảm bảo `JWT_SECRET` là một chuỗi ngẫu nhiên và bảo mật
- Backup database trước khi chạy migrations hoặc alter schema

