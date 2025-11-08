# Sửa Lỗi VNPay "Dữ liệu gửi sang không đúng định dạng"

## Lỗi:
```
Dữ liệu gửi sang không đúng định dạng
```

## Nguyên nhân thường gặp:

1. **Format date sai**: VNPay yêu cầu format `YYYYMMDDHHmmss` (14 ký tự, không có dấu gạch ngang hoặc dấu hai chấm)
2. **Amount không đúng**: Phải là số nguyên (không có dấu chấm), đơn vị là xu (cents)
3. **Checksum (hash) sai**: Do cách tạo query string hoặc hash không đúng
4. **URL encoding sai**: Một số ký tự đặc biệt cần được encode
5. **OrderInfo có ký tự đặc biệt**: VNPay không chấp nhận một số ký tự đặc biệt trong OrderInfo

## Đã sửa:

### 1. Format Date
- ✅ Sửa lại format date từ `YYYY-MM-DDTHH:mm:ss` → `YYYYMMDDHHmmss`
- ✅ Đảm bảo đúng 14 ký tự

### 2. Amount
- ✅ Đảm bảo amount là số nguyên (dùng `Math.round()`)
- ✅ Convert sang string trước khi thêm vào params

### 3. Query String và Hash
- ✅ Sắp xếp params theo thứ tự alphabet
- ✅ Tạo query string không encode để tạo hash
- ✅ Tạo hash bằng SHA512
- ✅ URL cuối cùng được encode đúng cách

### 4. OrderInfo
- ✅ Loại bỏ ký tự đặc biệt
- ✅ Giới hạn độ dài tối đa 255 ký tự

## Kiểm tra lại:

1. **Khởi động lại Backend:**
   ```powershell
   cd backend
   npm start
   ```

2. **Test lại thanh toán:**
   - Đặt lịch dịch vụ
   - Chọn "Thanh toán Online qua VNPay"
   - Kiểm tra xem có redirect đến VNPay không
   - Nếu vẫn lỗi, kiểm tra console backend để xem payment URL được tạo ra

3. **Debug Payment URL:**
   Thêm log vào `backend/routes/payments.js` để xem URL:
   ```javascript
   console.log('VNPay Payment URL:', paymentUrl);
   ```

## Lưu ý:

- **Môi trường TEST**: Đang dùng VNPay Sandbox
- **Return URL**: Phải là URL có thể truy cập được
- **IPN URL**: Cần cấu hình trong VNPay Merchant Admin
- **Thẻ test**: Dùng thẻ test từ `mail.md` để test

## Nếu vẫn lỗi:

1. Kiểm tra Terminal ID và Secret Key có đúng không
2. Kiểm tra Return URL có đúng format không
3. Kiểm tra console backend để xem payment URL được tạo ra
4. So sánh payment URL với ví dụ từ VNPay documentation

