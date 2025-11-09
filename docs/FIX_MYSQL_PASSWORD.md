# Sửa Lỗi MySQL Access Denied

## Lỗi hiện tại:
```
Access denied for user 'root'@'localhost' (using password: YES)
```

## Nguyên nhân:
Mật khẩu MySQL trong file `.env` không đúng hoặc chưa được cập nhật.

## Cách sửa:

### Bước 1: Mở file `.env`
Mở file `backend/.env` trong editor.

### Bước 2: Tìm dòng DB_PASSWORD
Tìm dòng:
```env
DB_PASSWORD=your_password_here
```

### Bước 3: Sửa thành mật khẩu MySQL thực tế
Thay `your_password_here` bằng mật khẩu MySQL của bạn:
```env
DB_PASSWORD=mat_khau_mysql_cua_ban
```

**Lưu ý:**
- Nếu MySQL của bạn không có mật khẩu, để trống: `DB_PASSWORD=`
- Không có khoảng trắng xung quanh dấu `=`
- Nếu mật khẩu có ký tự đặc biệt, không cần đặt trong dấu ngoặc kép

### Bước 4: Lưu file và khởi động lại Backend
Sau khi sửa, lưu file và backend sẽ tự động restart (nếu dùng nodemon).

Hoặc khởi động lại thủ công:
```powershell
# Nhấn Ctrl+C để dừng backend
# Sau đó chạy lại:
npm start
```

## Kiểm tra mật khẩu MySQL

### Cách 1: Thử đăng nhập MySQL
Mở MySQL Command Line hoặc MySQL Workbench và thử đăng nhập với:
- User: `root`
- Password: mật khẩu bạn vừa nhập vào `.env`

Nếu đăng nhập thành công → mật khẩu đúng ✅
Nếu không đăng nhập được → mật khẩu sai ❌

### Cách 2: Kiểm tra trong MySQL Workbench
1. Mở MySQL Workbench
2. Xem connection settings
3. Kiểm tra mật khẩu đang dùng

## Các trường hợp khác

### Nếu MySQL không có mật khẩu:
```env
DB_PASSWORD=
```

### Nếu dùng user khác (không phải root):
```env
DB_USER=ten_user_cua_ban
DB_PASSWORD=mat_khau_cua_user
```

### Nếu MySQL chạy trên port khác:
```env
DB_PORT=3307  # hoặc port khác
```

## Sau khi sửa

Nếu thấy trong console:
```
Database synced.
Server is running on port 3001
```
→ Thành công! ✅

## Troubleshooting

### Vẫn lỗi "Access denied":
1. Kiểm tra MySQL service đang chạy:
   ```powershell
   Get-Service -Name "*mysql*"
   ```

2. Kiểm tra user và password có đúng không:
   - Thử đăng nhập MySQL bằng command line hoặc Workbench
   - Đảm bảo user `root` có quyền truy cập từ `localhost`

3. Kiểm tra file `.env`:
   - Đảm bảo không có khoảng trắng thừa
   - Đảm bảo không có dấu ngoặc kép không cần thiết
   - Đảm bảo file được lưu đúng

4. Thử reset mật khẩu MySQL (nếu cần):
   - Tìm hướng dẫn reset MySQL root password trên Google

