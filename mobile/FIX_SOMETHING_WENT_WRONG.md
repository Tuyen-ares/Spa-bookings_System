# Hướng dẫn Sửa lỗi "Something went wrong"

## 🔴 Lỗi hiện tại:
Emulator hiển thị: "Something went wrong. Sorry about that. You can go back to Expo home or try to reload the project."

## 🔍 Nguyên nhân có thể:

### 1. Lỗi JavaScript trong code
- Import component không tồn tại
- Lỗi syntax
- Lỗi khi render component
- Thiếu dependency

### 2. ADB Connection Issue
- Device offline
- Port forwarding failed

### 3. Navigation Error
- Navigator chưa được setup đúng
- Component không được export đúng

## ✅ Các bước Debug:

### Bước 1: Xem lỗi chi tiết trong Terminal

Scroll lên trong terminal Expo để xem lỗi JavaScript. Tìm các dòng:
- `ERROR`
- `Error:`
- `TypeError:`
- `ReferenceError:`

### Bước 2: Mở Expo DevTools

Trong terminal Expo, nhấn `j` để mở debugger:
```
Press j │ open debugger
```

Hoặc mở browser và truy cập:
```
http://localhost:19002/debugger-ui
```

### Bước 3: Kiểm tra Console Logs

Trong DevTools, mở Console tab để xem lỗi chi tiết.

### Bước 4: Kiểm tra ADB Connection

```powershell
adb devices
```

Phải thấy device online:
```
emulator-5554    device
```

Nếu thấy `offline`, restart ADB:
```powershell
adb kill-server
adb start-server
adb devices
```

### Bước 5: Restart Expo Server

1. Nhấn `Ctrl+C` để dừng Expo
2. Clear cache:
```powershell
if (Test-Path .expo) { Remove-Item -Recurse -Force .expo }
if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }
```
3. Khởi động lại:
```powershell
npx expo start -c
```

### Bước 6: Restart Emulator

1. Đóng emulator
2. Mở lại từ Android Studio
3. Đợi emulator khởi động hoàn toàn
4. Nhấn `a` trong Expo terminal để mở app

## 🐛 Các lỗi thường gặp:

### Lỗi 1: "Cannot read property of undefined"
→ Kiểm tra các object/array trước khi truy cập property

### Lỗi 2: "Component is not defined"
→ Kiểm tra import statement

### Lỗi 3: "NavigationContainer must be a descendant of..."
→ Đảm bảo NavigationContainer chỉ có 1 instance

### Lỗi 4: "Network Error" hoặc "ECONNREFUSED"
→ Backend chưa chạy hoặc IP sai

## 📝 Checklist:

- [ ] Backend server đang chạy
- [ ] ADB device online
- [ ] Expo server đang chạy
- [ ] Không có lỗi syntax trong code
- [ ] Tất cả imports đều đúng
- [ ] Components đều được export đúng

## 🚀 Giải pháp nhanh:

1. **Xem logs trong terminal** (quan trọng nhất!)
2. **Nhấn `j` để mở debugger** và xem console
3. **Restart ADB**: `adb kill-server && adb start-server`
4. **Restart Expo**: `Ctrl+C` → `npx expo start -c`
5. **Restart emulator**

## 💡 Tip:

Nếu vẫn không thấy lỗi, thử:
- Mở Chrome DevTools: `http://localhost:19002/debugger-ui`
- Xem Network tab để kiểm tra API calls
- Xem Console tab để xem JavaScript errors

