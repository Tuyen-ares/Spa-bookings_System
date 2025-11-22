# Chạy App ở Chế Độ Bình Thường (Không Cần Tunnel)

## Vấn đề

App không hiển thị giao diện khi chạy `npx expo start` bình thường, nhưng hoạt động tốt với `--tunnel`.

## Giải pháp

Đã sửa API base URL để Android emulator sử dụng `10.0.2.2` - đây là IP đặc biệt của Android emulator để truy cập host's localhost.

## Cách chạy

### Chạy bình thường (không tunnel):
```powershell
cd mobile
npx expo start --clear
```

Hoặc:
```powershell
npm run start:clear
```

### Yêu cầu

1. **Backend phải chạy trên port 3001:**
   ```powershell
   cd backend
   npm start
   ```

2. **Backend phải listen trên `0.0.0.0` (đã cấu hình sẵn):**
   - Backend sẽ tự động listen trên `0.0.0.0:3001`
   - Điều này cho phép emulator truy cập qua `10.0.2.2:3001`

3. **Không cần cấu hình gì thêm:**
   - Android emulator tự động map `10.0.2.2` → host's `localhost`
   - Code đã được cấu hình tự động

## API Base URL theo Platform

- **Android Emulator**: `http://10.0.2.2:3001/api` (10.0.2.2 = host's localhost)
- **iOS Simulator**: `http://localhost:3001/api` (simulator chia sẻ network với host)
- **Web**: `http://localhost:3001/api`
- **Physical Device**: Cần dùng IP thực (192.168.80.1:3001/api)

## Kiểm tra

Sau khi chạy `npx expo start --clear`, bạn sẽ thấy trong logs:
- `🔗 API Base URL: http://10.0.2.2:3001/api` (cho Android emulator)
- App sẽ tự động kết nối đến backend

Nếu vẫn không hoạt động:
1. Đảm bảo backend đang chạy
2. Kiểm tra logs trong terminal để xem lỗi cụ thể
3. Thử reload app: nhấn `r` trong terminal Expo

