# 🔄 Khởi động lại Backend sau khi sửa Port

## ✅ Đã sửa:
- File `backend/.env` có `DB_PORT=3306` ✅
- MySQL đang chạy trên port 3306 ✅

## 🔄 Bước tiếp theo: Khởi động lại Backend

### 1. Dừng Backend Server hiện tại:
- Tìm terminal đang chạy `npm start`
- Nhấn `Ctrl+C` để dừng

### 2. Khởi động lại Backend:
```bash
cd backend
npm start
```

### 3. Kiểm tra Console Log:

Bạn sẽ thấy:
```
📁 Loading .env from: D:\...\backend\.env
✅ Successfully loaded .env file
=== Database Configuration ===
DB_HOST: 127.0.0.1
DB_PORT: 3306
DB_NAME: anhthospa_db
DB_USER: root
DB_PASSWORD: ✅ SET
Database synced.
Server is running on port 3001
```

### 4. Test Frontend:
- Mở `http://localhost:3000`
- Vào trang "Dịch vụ"
- Kiểm tra xem có còn lỗi "Failed to fetch" không

## ✅ Checklist:
- [x] File `backend/.env` có `DB_PORT=3306`
- [x] MySQL đang chạy trên port 3306
- [ ] Backend server đã được **restart**
- [ ] Database kết nối thành công
- [ ] Frontend load được dữ liệu

## 🐛 Nếu vẫn lỗi:

1. **Kiểm tra MySQL Service:**
   ```bash
   # Windows Services
   services.msc
   # Tìm "MySQL" và đảm bảo đang "Running"
   ```

2. **Kiểm tra Database tồn tại:**
   - Mở MySQL Workbench
   - Kiểm tra database `anhthospa_db` có tồn tại không
   - Nếu chưa có, chạy script `db.txt`

3. **Kiểm tra Console Log:**
   - Xem backend console có lỗi gì không
   - Kiểm tra log "Database synced" có xuất hiện không

