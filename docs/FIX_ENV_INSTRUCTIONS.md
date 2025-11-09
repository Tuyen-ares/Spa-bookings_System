# 🔧 Hướng dẫn sửa lỗi Database Connection

## ⚠️ Vấn đề:
File `backend/.env` chỉ có `GEMINI_API_KEY` mà **thiếu thông tin database**, khiến backend không thể kết nối MySQL.

Lỗi: `Access denied for user ''@'localhost' (using password: NO)`

## ✅ Đã sửa:
Đã copy file `backend/env.example` thành `backend/.env` và cập nhật API key mới.

## 📝 Bước tiếp theo:

### 1. Mở file `backend/.env`

### 2. Cập nhật thông tin database của bạn:

Thay thế các giá trị sau:
- `your_password_here` → **Mật khẩu MySQL của bạn**
- `your_jwt_secret_key_here_change_in_production` → **Một chuỗi bí mật ngẫu nhiên**

Ví dụ:
```env
DB_PASSWORD=matkhau123
JWT_SECRET=my_secret_key_12345
```

### 3. Khởi động lại Backend:

```bash
cd backend
npm start
```

## ✅ Kiểm tra:

Sau khi khởi động, bạn sẽ thấy:
```
Database synced.
Server is running on port 3001
```

Nếu vẫn lỗi:
- Kiểm tra mật khẩu MySQL đúng chưa
- Kiểm tra MySQL đang chạy chưa
- Kiểm tra database `anhthospa_db` đã tồn tại chưa

## 📋 File .env đầy đủ:

File `backend/.env` phải có:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=anhthospa_db
DB_USER=root
DB_PASSWORD=your_mysql_password_here

# Server Configuration
PORT=3001

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Database Sync Options
DB_ALTER_ON_START=false

# Gemini AI API Key
GEMINI_API_KEY=AIzaSyCDAE9vYGnzeiOfkligU4d27-kHj4tnqDk
```

