# 📧 Hướng Dẫn Cấu Hình Email (SMTP) - Gmail

## 🎯 Mục đích
Cấu hình email để hệ thống có thể gửi email xác nhận đăng ký tài khoản đến người dùng.

## ⚠️ Lưu ý quan trọng
- **`SMTP_USER`**: Email của spa/admin dùng để **GỬI** email (email này sẽ xuất hiện trong phần "From" của email)
- **Email nhận**: Email xác nhận sẽ được gửi đến **email của người đăng ký** (không phải SMTP_USER)
- **Ví dụ**: 
  - Bạn cấu hình: `SMTP_USER=spa@gmail.com`
  - Người dùng đăng ký với: `user@example.com`
  - Kết quả: Email được gửi **từ** `spa@gmail.com` **đến** `user@example.com`

---

## 📋 Các bước cấu hình Gmail

### Bước 1: Bật xác thực 2 bước (2-Step Verification)

1. Đăng nhập vào tài khoản Gmail của bạn
2. Truy cập: https://myaccount.google.com/security
3. Tìm mục **"2-Step Verification"** (Xác minh 2 bước)
4. Nhấn **"Get started"** (Bắt đầu)
5. Làm theo hướng dẫn để bật xác thực 2 bước
   - Có thể dùng số điện thoại để nhận mã xác minh
   - Hoặc dùng ứng dụng Google Authenticator

> ⚠️ **Bắt buộc**: Phải bật xác thực 2 bước trước khi tạo App Password!

---

### Bước 2: Tạo App Password (Mật khẩu ứng dụng)

1. Truy cập: https://myaccount.google.com/apppasswords
   - Hoặc vào: https://myaccount.google.com/security → Tìm "App passwords"

2. Nếu chưa bật 2-Step Verification, bạn sẽ thấy thông báo yêu cầu bật trước

3. Chọn ứng dụng:
   - Chọn **"Mail"** trong dropdown "Select app"
   - Chọn **"Other (Custom name)"** trong dropdown "Select device"
   - Nhập tên: **"Anh Tho Spa"** (hoặc tên bạn muốn)

4. Nhấn **"Generate"** (Tạo)

5. Google sẽ hiển thị mật khẩu 16 ký tự:
   ```
   xxxx xxxx xxxx xxxx
   ```
   - ⚠️ **Lưu ý**: Copy mật khẩu này ngay lập tức, bạn sẽ không thể xem lại!
   - Mật khẩu có thể có dấu cách hoặc không (cả hai đều được)

---

### Bước 3: Cập nhật file `.env`

Mở file `backend/.env` và cập nhật các dòng sau:

```env
# ============================================
# SMTP Configuration (Email Service)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com        # ← Thay bằng email Gmail của bạn
SMTP_PASS=xxxx xxxx xxxx xxxx          # ← Thay bằng App Password vừa tạo
```

**Ví dụ cụ thể:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=anhthospa@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

> 💡 **Lưu ý**: 
> - `SMTP_USER`: Email Gmail của bạn (email dùng để gửi)
> - `SMTP_PASS`: App Password (16 ký tự) vừa tạo ở Bước 2
> - Không dùng mật khẩu Gmail thông thường!

---

### Bước 4: Cấu hình Frontend URL

Đảm bảo `FRONTEND_URL` được cấu hình đúng:

```env
FRONTEND_URL=http://localhost:3000
```

- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

---

### Bước 5: Khởi động lại Backend Server

1. Dừng server backend (nếu đang chạy): `Ctrl + C`
2. Khởi động lại:
   ```bash
   cd backend
   npm start
   ```

3. Kiểm tra console log:
   - Nếu thấy: `✅ Email service initialized successfully` → Thành công!
   - Nếu thấy lỗi: Kiểm tra lại cấu hình SMTP

---

## 🔍 Kiểm tra cấu hình

### Test 1: Kiểm tra kết nối SMTP

Khi khởi động backend, server sẽ tự động kiểm tra kết nối email. Xem console log:

```
✅ Email service initialized successfully
```

### Test 2: Test gửi email

1. Đăng ký một tài khoản mới trên website
2. Kiểm tra email của người đăng ký (không phải SMTP_USER)
3. Email xác nhận sẽ có:
   - **From**: "Anh Thơ Spa" <your-email@gmail.com>
   - **To**: email của người đăng ký
   - **Subject**: "Xác nhận đăng ký tài khoản - Anh Thơ Spa"
   - **Nội dung**: Link xác nhận email

---

## ❌ Xử lý lỗi thường gặp

### Lỗi 1: "Invalid login"
- **Nguyên nhân**: Sai email hoặc mật khẩu
- **Giải pháp**: 
  - Kiểm tra lại `SMTP_USER` và `SMTP_PASS`
  - Đảm bảo đã dùng **App Password**, không phải mật khẩu Gmail thông thường

### Lỗi 2: "Less secure app access"
- **Nguyên nhân**: Gmail chặn ứng dụng không an toàn
- **Giải pháp**: 
  - Đảm bảo đã bật **2-Step Verification**
  - Sử dụng **App Password** thay vì mật khẩu thông thường

### Lỗi 3: "Connection timeout"
- **Nguyên nhân**: Firewall hoặc mạng chặn cổng 587
- **Giải pháp**: 
  - Kiểm tra firewall
  - Thử dùng cổng 465 với `SMTP_SECURE=true`

### Lỗi 4: Email không đến
- **Nguyên nhân**: Email bị chặn hoặc vào spam
- **Giải pháp**: 
  - Kiểm tra thư mục Spam
  - Kiểm tra lại `FRONTEND_URL` trong `.env`

---

## 📧 Cấu hình cho các dịch vụ email khác

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

---

## ✅ Checklist hoàn thành

- [ ] Đã bật 2-Step Verification trên Gmail
- [ ] Đã tạo App Password
- [ ] Đã cập nhật `SMTP_USER` trong `.env`
- [ ] Đã cập nhật `SMTP_PASS` trong `.env`
- [ ] Đã cập nhật `FRONTEND_URL` trong `.env`
- [ ] Đã khởi động lại backend server
- [ ] Đã test đăng ký và nhận email xác nhận

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Console log của backend server
2. File `backend/EMAIL_SETUP.md`
3. Tài liệu Gmail: https://support.google.com/accounts/answer/185833

