# Hướng dẫn Kết nối App với Expo Server

## ❌ Lỗi: "No apps connected"

Lỗi này xảy ra khi bạn nhấn `r` (reload) nhưng app chưa được mở trong emulator.

## ✅ Giải pháp:

### Cách 1: Mở app bằng Expo CLI (Khuyên dùng)

1. **Đảm bảo Android emulator đang chạy**
   - Mở Android Studio
   - Khởi động emulator (Medium_Phone)

2. **Trong terminal Expo, nhấn `a`**
   ```
   Press a │ open Android
   ```
   - Expo sẽ tự động mở app trong emulator
   - Đợi app load (có thể mất 10-30 giây lần đầu)

3. **Sau khi app mở, bạn có thể:**
   - Nhấn `r` để reload
   - Nhấn `Shift + r` để hard reload
   - Lưu file → Fast Refresh tự động

### Cách 2: Mở app bằng Expo Go

1. **Mở Expo Go app trong emulator**
   - Tìm app "Expo Go" trong emulator
   - Mở app

2. **Quét QR code**
   - Trong terminal Expo, bạn sẽ thấy QR code
   - Trong Expo Go app, nhấn "Scan QR code"
   - Quét QR code từ terminal

3. **App sẽ tự động load**

## 🔍 Kiểm tra App đã kết nối:

Khi app đã kết nối, bạn sẽ thấy trong terminal:
```
› Opening on Android...
› Opening exp://192.168.80.1:8082 on Medium_Phone
Android Bundled ... index.js (... modules)
LOG  App: Initializing...
LOG  App: Ready!
```

Và trong emulator, bạn sẽ thấy giao diện app (không còn màn hình trắng).

## ⚠️ Lưu ý:

- **Lần đầu mở app**: Có thể mất 30-60 giây để bundle
- **Reload (`r`)**: Chỉ hoạt động khi app đã được mở
- **Fast Refresh**: Tự động khi bạn lưu file (không cần nhấn `r`)

## 🐛 Nếu vẫn không kết nối được:

1. **Kiểm tra emulator đang chạy:**
   ```powershell
   adb devices
   ```
   Phải thấy device trong danh sách

2. **Restart Expo server:**
   - Nhấn `Ctrl+C` để dừng
   - Chạy lại: `npx expo start -c`

3. **Restart emulator:**
   - Đóng emulator
   - Mở lại từ Android Studio

4. **Kiểm tra port:**
   - Đảm bảo port 8081 hoặc 8082 không bị chặn
   - Kiểm tra firewall

