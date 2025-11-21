# Kiểm tra kết nối Mobile App

## Tóm tắt kiểm tra Port

✅ **Không có xung đột port:**

- Port 8081: Metro bundler (Expo) - Đang chạy
- Port 3001: Backend server - Đang chạy  
- Port 5554, 5555: Android Emulator - Đang chạy
- Port 3306: MySQL Database - Đang chạy

## Các bước debug màn hình đen

### 1. Reload App trong Expo

Trong terminal đang chạy `npx expo start`, nhấn:

- `r` - Reload app
- `j` - Mở debugger để xem lỗi JavaScript
- `m` - Toggle menu

### 2. Kiểm tra Backend có chạy không

```powershell
# Kiểm tra backend có đang chạy
netstat -ano | findstr ":3001"
```

### 3. Kiểm tra kết nối từ Emulator đến Backend

Android emulator sử dụng IP đặc biệt `10.0.2.2` để truy cập `localhost` của máy host.

Kiểm tra trong emulator:

```bash
# Trong adb shell
adb shell
curl http://10.0.2.2:3001/api/health
```

### 4. Kiểm tra logs JavaScript

Mở debugger (nhấn `j` trong Expo terminal) hoặc:

```powershell
# Xem logs từ emulator
adb logcat | findstr "ReactNativeJS"
```

### 5. Kiểm tra API URL trong code

File `mobile/src/services/apiService.ts` đã được cấu hình đúng:

- Android: `http://10.0.2.2:3001/api`
- iOS: `http://localhost:3001/api`
- Web: `http://localhost:3001/api`

### 6. Thử mở Expo Go thủ công

1. Mở Expo Go app trên emulator
2. Quét QR code từ terminal
3. Hoặc nhập URL: `exp://192.168.80.1:8081`

### 7. Clear cache và restart

```powershell
# Dừng Expo
Ctrl+C

# Clear cache và restart
cd mobile
npx expo start --clear
```

### 8. Kiểm tra lỗi trong App.tsx

App có thể đang chờ `initializeApi()` hoàn thành. Kiểm tra:

- Backend có đang chạy không?
- API có trả về response không?
- Có lỗi network không?

## Lệnh hữu ích

```powershell
# Xem tất cả port đang được sử dụng
netstat -ano | findstr "LISTENING"

# Xem process đang dùng port
Get-Process -Id <PID>

# Xem logs từ emulator
adb logcat -c  # Clear logs
adb logcat | findstr "ReactNative\|Expo\|Error"

# Kiểm tra kết nối backend
Test-NetConnection -ComputerName localhost -Port 3001
```
