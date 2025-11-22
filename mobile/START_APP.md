# Hướng dẫn khởi động Mobile App

## Vấn đề

App không hiển thị giao diện khi chạy `npx expo start` bình thường, nhưng hoạt động tốt khi chạy với `--tunnel`.

## Giải pháp

### 1. Khởi động với Tunnel (Khuyến nghị)

```powershell
cd mobile
npx expo start --clear --tunnel
```

Tunnel mode:
- ✅ Bypass vấn đề network/IP address
- ✅ Hoạt động tốt với emulator và thiết bị thật
- ✅ Không cần cấu hình IP address phức tạp
- ⚠️ Chậm hơn một chút so với local network

### 2. Khởi động bình thường (Yêu cầu cấu hình network)

```powershell
cd mobile
npx expo start --clear
```

**Yêu cầu:**
- Backend phải chạy trên `http://localhost:3001` hoặc IP có thể truy cập
- Android emulator cần truy cập được backend qua IP `192.168.80.1:3001`
- Đảm bảo firewall không block kết nối

### 3. Kiểm tra Backend

Đảm bảo backend đang chạy:
```powershell
cd backend
npm start
```

Backend phải:
- Chạy trên port 3001
- Listen trên `0.0.0.0` (không chỉ localhost)
- Có thể truy cập từ emulator/thiết bị

### 4. Xử lý lỗi "Something went wrong"

Nếu app vẫn bị lỗi:

1. **Xóa cache:**
   ```powershell
   # Xóa .expo cache
   if (Test-Path .expo) { Remove-Item -Recurse -Force .expo }
   
   # Xóa node_modules cache
   if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }
   ```

2. **Khởi động lại với clear cache:**
   ```powershell
   npx expo start --clear --tunnel
   ```

3. **Kiểm tra logs trong terminal:**
   - Scroll lên để xem lỗi JavaScript
   - Tìm dòng có `ERROR` hoặc `Error:`
   - Copy lỗi và báo cáo

4. **Kiểm tra API connection:**
   - Xem console logs trong terminal
   - Tìm dòng `🔗 API Base URL:`
   - Đảm bảo URL đúng với backend đang chạy

## Lưu ý

- **Tunnel mode** là giải pháp tốt nhất cho development
- App sẽ vẫn hiển thị UI ngay cả khi API connection fail
- API calls sẽ fail nhưng app không bị crash
- Cần backend running để test các tính năng cần API

