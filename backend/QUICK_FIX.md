# Sửa Lỗi Port 3307

## Vấn đề
Backend đang cố kết nối đến port 3307 thay vì 3306.

## Nguyên nhân
File `.env` không tồn tại, nên Sequelize không đọc được cấu hình và dùng port mặc định hoặc undefined.

## Giải pháp

### Bước 1: File .env đã được tạo
File `backend/.env` đã được tạo từ `env.example` với `DB_PORT=3306`.

### Bước 2: Sửa mật khẩu MySQL
Mở file `backend/.env` và sửa dòng:
```env
DB_PASSWORD=your_password_here
```
Thành mật khẩu MySQL thực tế của bạn:
```env
DB_PASSWORD=mat_khau_mysql_cua_ban
```

### Bước 3: Khởi động lại Backend
```powershell
cd backend
npm start
```

### Bước 4: Kiểm tra
Nếu thấy trong console:
```
Database synced.
Server is running on port 3001
```
→ Thành công! ✅

Nếu vẫn lỗi port 3307:
1. Kiểm tra lại file `backend/.env` có `DB_PORT=3306` không
2. Đảm bảo không có khoảng trắng thừa: `DB_PORT=3306` (không phải `DB_PORT = 3306`)
3. Khởi động lại backend

## Lưu ý
- File `.env` không được commit lên Git (đã có trong `.gitignore`)
- Đảm bảo MySQL service đang chạy
- Đảm bảo MySQL đang lắng nghe trên port 3306 (hoặc port bạn đã cấu hình)

