# Sửa Lỗi Kết nối Database - ECONNREFUSED

## Lỗi hiện tại:
```
Error: connect ECONNREFUSED 127.0.0.1:3307
```

## Nguyên nhân:
Backend đang cố kết nối đến port **3307**, nhưng MySQL thường chạy trên port **3306**.

## Cách sửa:

### Bước 1: Kiểm tra file `.env`

Mở file `backend/.env` và kiểm tra dòng `DB_PORT`:

```env
DB_PORT=3306  # Đảm bảo là 3306, không phải 3307
```

### Bước 2: Kiểm tra MySQL đang chạy trên port nào

**Cách 1: Kiểm tra trong MySQL Workbench**
- Mở MySQL Workbench
- Xem port trong connection settings (thường là 3306)

**Cách 2: Kiểm tra bằng PowerShell**
```powershell
netstat -an | findstr :3306
netstat -an | findstr :3307
```

### Bước 3: Sửa file `.env`

Nếu MySQL chạy trên port 3306, sửa file `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=anhthospa_db
DB_USER=root
DB_PASSWORD=your_password_here
```

Nếu MySQL chạy trên port 3307, giữ nguyên:
```env
DB_PORT=3307
```

### Bước 4: Kiểm tra MySQL Service đang chạy

**Cách 1: Services Manager**
1. Nhấn `Win + R`
2. Gõ `services.msc`
3. Tìm "MySQL" hoặc "MySQL80"
4. Đảm bảo Status là "Running"

**Cách 2: PowerShell**
```powershell
Get-Service -Name "*mysql*"
```

Nếu MySQL chưa chạy, khởi động:
```powershell
Start-Service MySQL80
# hoặc
Start-Service MySQL
```

### Bước 5: Khởi động lại Backend

Sau khi sửa `.env`, khởi động lại backend:
```powershell
cd backend
npm start
```

## Kiểm tra kết nối thành công:

Nếu thấy trong console:
```
Database synced.
Server is running on port 3001
```

→ Database đã kết nối thành công! ✅

## Troubleshooting thêm:

### Nếu vẫn lỗi sau khi sửa port:

1. **Kiểm tra MySQL đã được cài đặt:**
   ```powershell
   mysql --version
   ```

2. **Kiểm tra MySQL đang lắng nghe:**
   ```powershell
   netstat -an | findstr :3306
   ```

3. **Kiểm tra firewall:**
   - Đảm bảo Windows Firewall không chặn port 3306

4. **Kiểm tra thông tin đăng nhập:**
   - `DB_USER` và `DB_PASSWORD` trong `.env` có đúng không
   - Thử đăng nhập MySQL bằng MySQL Workbench với thông tin này

5. **Kiểm tra database đã được tạo:**
   - Mở MySQL Workbench
   - Kiểm tra xem database `anhthospa_db` đã tồn tại chưa
   - Nếu chưa, chạy script `db.txt` để tạo database

## Lưu ý:

- File `.env` không được commit lên Git (đã có trong `.gitignore`)
- Đảm bảo MySQL service đang chạy trước khi khởi động backend
- Port MySQL mặc định là 3306, nhưng có thể khác tùy cấu hình

