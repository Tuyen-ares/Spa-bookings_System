# Hướng Dẫn Sửa Mật Khẩu MySQL

## ⚠️ Lỗi hiện tại:
```
Access denied for user 'root'@'localhost' (using password: YES)
```

## ✅ Giải pháp:

### Bước 1: Mở file `.env`
Mở file `backend/.env` trong editor (VS Code, Notepad++, etc.)

### Bước 2: Tìm và sửa dòng DB_PASSWORD
Tìm dòng:
```env
DB_PASSWORD=your_password_here
```

### Bước 3: Thay bằng mật khẩu MySQL thực tế
Sửa thành mật khẩu MySQL của bạn:
```env
DB_PASSWORD=mat_khau_mysql_cua_ban
```

**Ví dụ:**
- Nếu mật khẩu MySQL của bạn là `123456`:
  ```env
  DB_PASSWORD=123456
  ```

- Nếu MySQL không có mật khẩu:
  ```env
  DB_PASSWORD=
  ```

### Bước 4: Lưu file
Lưu file `.env` sau khi sửa.

### Bước 5: Khởi động lại Backend
Backend sẽ tự động restart nếu dùng nodemon, hoặc:
```powershell
# Nhấn Ctrl+C để dừng
# Sau đó chạy lại:
npm start
```

## 🔍 Cách kiểm tra mật khẩu MySQL:

### Cách 1: Thử đăng nhập MySQL Workbench
1. Mở MySQL Workbench
2. Thử đăng nhập với:
   - Username: `root`
   - Password: mật khẩu bạn vừa nhập vào `.env`
3. Nếu đăng nhập được → mật khẩu đúng ✅
4. Nếu không đăng nhập được → mật khẩu sai ❌

### Cách 2: Thử đăng nhập MySQL Command Line
```powershell
mysql -u root -p
```
Nhập mật khẩu khi được hỏi.

## 📝 Lưu ý quan trọng:

1. **Không có khoảng trắng xung quanh dấu `=`:**
   - ✅ Đúng: `DB_PASSWORD=123456`
   - ❌ Sai: `DB_PASSWORD = 123456`

2. **Không cần dấu ngoặc kép:**
   - ✅ Đúng: `DB_PASSWORD=123456`
   - ❌ Sai: `DB_PASSWORD="123456"`

3. **Nếu mật khẩu có ký tự đặc biệt:**
   - Vẫn để nguyên, không cần escape
   - Ví dụ: `DB_PASSWORD=My@Pass123`

## ✅ Sau khi sửa:

Nếu thấy trong console:
```
Database synced.
Server is running on port 3001
```
→ **Thành công!** ✅

## 🆘 Nếu vẫn lỗi:

1. **Kiểm tra MySQL service đang chạy:**
   - Mở Services (Win + R → `services.msc`)
   - Tìm "MySQL" hoặc "MySQL80"
   - Đảm bảo Status là "Running"

2. **Kiểm tra lại mật khẩu:**
   - Thử đăng nhập MySQL Workbench với mật khẩu đó
   - Nếu không đăng nhập được → mật khẩu sai

3. **Kiểm tra file `.env`:**
   - Đảm bảo file được lưu đúng
   - Đảm bảo không có lỗi cú pháp

4. **Thử reset mật khẩu MySQL (nếu cần):**
   - Tìm hướng dẫn "reset MySQL root password" trên Google

