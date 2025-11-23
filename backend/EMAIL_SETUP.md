# 📧 Cấu hình Email Service

Để sử dụng tính năng xác nhận email, bạn cần cấu hình SMTP trong file `.env` của backend.

## 📋 Các biến môi trường cần thiết:

```env
# ============================================
# SMTP Configuration (Email Service)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com        # Email dùng để GỬI email (email của spa/admin)
SMTP_PASS=your-app-password            # Mật khẩu ứng dụng (App Password) - KHÔNG phải mật khẩu Gmail thông thường!

# ============================================
# Frontend URL
# ============================================
FRONTEND_URL=http://localhost:3000     # URL của frontend (để tạo link xác nhận trong email)
```

## ⚠️ Lưu ý quan trọng:

- **`SMTP_USER`**: Đây là email dùng để **GỬI** email (email của spa/admin dùng để xác thực với SMTP server)
- **Email nhận**: Email xác nhận sẽ được gửi đến **email của người đăng ký** (không phải SMTP_USER)
- **Ví dụ**: 
  - Bạn cấu hình: `SMTP_USER=spa@gmail.com`
  - Người dùng đăng ký với: `user@example.com`
  - Kết quả: Email được gửi **từ** `spa@gmail.com` **đến** `user@example.com`

## 📝 Hướng dẫn cấu hình Gmail (Chi tiết):

### Bước 1: Bật xác thực 2 bước (2-Step Verification)

1. Đăng nhập vào tài khoản Gmail của bạn
2. Truy cập: https://myaccount.google.com/security
3. Tìm mục **"2-Step Verification"** (Xác minh 2 bước)
4. Nhấn **"Get started"** (Bắt đầu)
5. Làm theo hướng dẫn để bật xác thực 2 bước
   - Có thể dùng số điện thoại để nhận mã xác minh
   - Hoặc dùng ứng dụng Google Authenticator

> ⚠️ **Bắt buộc**: Phải bật xác thực 2 bước trước khi tạo App Password!

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

### Bước 3: Cập nhật file `.env`

Mở file `backend/.env` và cập nhật:

```env
SMTP_USER=your-email@gmail.com        # ← Thay bằng email Gmail của bạn
SMTP_PASS=xxxx xxxx xxxx xxxx          # ← Thay bằng App Password vừa tạo (16 ký tự)
```

**Ví dụ cụ thể:**
```env
SMTP_USER=anhthospa@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

> 💡 **Lưu ý**: 
> - `SMTP_USER`: Email Gmail của bạn (email dùng để gửi)
> - `SMTP_PASS`: App Password (16 ký tự) vừa tạo ở Bước 2
> - **KHÔNG dùng mật khẩu Gmail thông thường!**

### Bước 4: Khởi động lại Backend Server

1. Dừng server backend (nếu đang chạy): `Ctrl + C`
2. Khởi động lại:
   ```bash
   cd backend
   npm start
   ```

3. Kiểm tra console log:
   - Nếu thấy: `✅ Email service initialized successfully` → Thành công!
   - Nếu thấy lỗi: Kiểm tra lại cấu hình SMTP

## Các dịch vụ email khác:

### SendGrid:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## Kiểm tra cấu hình:

Sau khi cấu hình, khởi động lại server backend. Server sẽ tự động kiểm tra kết nối email khi khởi động.

Nếu có lỗi, kiểm tra console log để xem chi tiết.

