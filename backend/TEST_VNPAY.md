# Hướng Dẫn Test VNPay

## Các bước test:

1. **Khởi động Backend:**
   ```powershell
   cd backend
   npm start
   ```

2. **Khởi động Frontend:**
   ```powershell
   npm run dev
   ```

3. **Test thanh toán:**
   - Đăng nhập vào hệ thống
   - Đặt lịch dịch vụ
   - Chọn "Thanh toán Online qua VNPay"
   - Kiểm tra console backend để xem payment URL

4. **Kiểm tra Payment URL:**
   - Xem console backend có log: "VNPay Payment URL created for order: ..."
   - Copy URL và paste vào browser để xem có đúng format không

## Debug nếu vẫn lỗi:

### 1. Kiểm tra Payment URL trong Console
Backend sẽ log payment URL, copy và kiểm tra:
- Có đầy đủ các tham số không?
- Format date có đúng YYYYMMDDHHmmss không?
- Amount có phải số nguyên không?

### 2. Test với Postman/curl
Có thể test trực tiếp bằng cách gọi API:
```bash
POST http://localhost:3001/api/payments/process
Content-Type: application/json

{
  "appointmentId": "apt-1",
  "method": "VNPay",
  "amount": 500000
}
```

### 3. Kiểm tra Terminal ID và Secret Key
Đảm bảo trong `backend/config/vnpay.js`:
- `vnp_TmnCode`: `COT8FR64`
- `vnp_HashSecret`: `G91OXLUD6QZVBADKVZPDL7JTNFCZJAGB`

### 4. Kiểm tra Return URL
Đảm bảo Return URL có thể truy cập được:
- `http://localhost:3001/api/payments/vnpay-return`

## Thẻ test VNPay:

```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mật khẩu OTP: 123456
```

## Lưu ý:

- VNPay Sandbox chỉ chấp nhận các thẻ test được cung cấp
- Payment URL có thời hạn 15 phút
- Nếu vẫn lỗi, kiểm tra lại format date và checksum

