# 🔧 Sửa lỗi: File backend/.env không tồn tại

## ⚠️ Vấn đề
File `backend/.env` không tồn tại, khiến backend không thể kết nối database và chatbot không hoạt động.

## ✅ Giải pháp

### Bước 1: Tạo file backend/.env

**Tạo file thủ công:**
1. Mở thư mục `backend/`
2. Tạo file mới tên `.env` (chấm env, không có tên trước)
3. Copy nội dung sau vào file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=anhthospa_db
DB_USER=root
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3001

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Database Sync Options
DB_ALTER_ON_START=false

# Gemini AI API Key for Chatbot
GEMINI_API_KEY=AIzaSyCDAE9vYGnzeiOfkligU4d27-kHj4tnqDk
```

### Bước 2: Cập nhật mật khẩu MySQL

**Quan trọng:** Thay `your_password_here` bằng mật khẩu MySQL thực tế của bạn:

```env
DB_PASSWORD=mat_khau_mysql_cua_ban
```

**Nếu MySQL không có mật khẩu:**
```env
DB_PASSWORD=
```

### Bước 3: Cập nhật JWT Secret

Thay `your_jwt_secret_key_here_change_in_production` bằng một chuỗi ngẫu nhiên:

```env
JWT_SECRET=your_random_secret_key_here
```

### Bước 4: Khởi động lại Backend

Sau khi tạo file `.env`:
```bash
cd backend
npm start
```

## 🔍 Kiểm tra

### Kiểm tra file .env đã được tạo:
```bash
# Windows PowerShell
Get-Content backend\.env
```

### Kiểm tra backend đã kết nối database:
Nếu thấy trong console:
```
Database synced.
Server is running on port 3001
```
→ Thành công! ✅

### Nếu vẫn lỗi:
1. Kiểm tra file `backend/.env` có tồn tại không
2. Kiểm tra mật khẩu MySQL có đúng không
3. Kiểm tra MySQL service có đang chạy không

## 📝 Lưu ý

- File `.env` không được commit lên Git (đã có trong `.gitignore`)
- Đảm bảo MySQL service đang chạy
- Sau khi tạo/cập nhật `.env`, phải khởi động lại backend

