# 🔧 Hướng dẫn sửa lỗi Database Connection

## ⚠️ Vấn đề:
Backend không thể kết nối database với lỗi: `Access denied for user ''@'localhost' (using password: NO)`

## 🔍 Nguyên nhân:
File `backend/.env` đã có đầy đủ thông tin database, nhưng có thể:
1. Backend server chưa được **khởi động lại** sau khi cập nhật .env
2. File .env có vấn đề về encoding hoặc format
3. Có conflict giữa root/.env và backend/.env

## ✅ Giải pháp:

### Bước 1: Kiểm tra file backend/.env

File `backend/.env` phải có đầy đủ:
```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=Tuyendeptrai142
DB_NAME=anhthospa_db
PORT=3001
GEMINI_API_KEY=AIzaSyCDAE9vYGnzeiOfkligU4d27-kHj4tnqDk
```

### Bước 2: **QUAN TRỌNG - Khởi động lại Backend Server**

**Dừng backend hiện tại:**
- Tìm terminal đang chạy backend
- Nhấn `Ctrl+C` để dừng

**Khởi động lại:**
```bash
cd backend
npm start
```

### Bước 3: Kiểm tra Console Log

Sau khi khởi động, bạn sẽ thấy log:
```
Loading .env from: D:\...\backend\.env
Successfully loaded .env file
=== Database Configuration ===
DB_HOST: 127.0.0.1
DB_PORT: 3307
DB_NAME: anhthospa_db
DB_USER: root
DB_PASSWORD: ***SET***
Database synced.
Server is running on port 3001
```

### Bước 4: Kiểm tra MySQL đang chạy

Đảm bảo MySQL đang chạy trên port **3307** (không phải 3306):
```bash
# Windows
netstat -ano | findstr :3307
```

### Bước 5: Kiểm tra Database tồn tại

Đảm bảo database `anhthospa_db` đã được tạo:
```sql
SHOW DATABASES;
```

## 🐛 Nếu vẫn lỗi:

### 1. Kiểm tra MySQL Service
```bash
# Windows Services
services.msc
# Tìm "MySQL" và đảm bảo đang "Running"
```

### 2. Kiểm tra Mật khẩu MySQL
- Mật khẩu trong `.env`: `Tuyendeptrai142`
- Đảm bảo mật khẩu đúng với MySQL của bạn

### 3. Kiểm tra Port MySQL
- File `.env` có `DB_PORT=3307`
- Đảm bảo MySQL đang chạy trên port 3307
- Nếu MySQL chạy trên port 3306, sửa `.env`: `DB_PORT=3306`

### 4. Kiểm tra User MySQL
- File `.env` có `DB_USER=root`
- Đảm bảo user `root` có quyền truy cập database

## ✅ Checklist:

- [ ] File `backend/.env` có đầy đủ thông tin database
- [ ] Backend server đã được **khởi động lại** sau khi cập nhật .env
- [ ] MySQL service đang chạy
- [ ] MySQL đang chạy trên port đúng (3307 hoặc 3306)
- [ ] Database `anhthospa_db` đã được tạo
- [ ] User `root` có quyền truy cập database
- [ ] Mật khẩu MySQL đúng

## 📝 Lưu ý quan trọng:

**Sau khi sửa file `.env`, LUÔN phải khởi động lại backend server!**

Node.js chỉ load environment variables khi khởi động, không tự động reload khi file .env thay đổi.

