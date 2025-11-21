# Hướng dẫn Xem Logs để Debug

## ❌ DevTools không hoạt động?

Không sao! Bạn có thể xem logs trực tiếp trong terminal.

## ✅ Cách 1: Xem logs trong Terminal Expo (Đơn giản nhất)

1. **Scroll LÊN trong terminal Expo**
2. **Tìm các dòng có:**
   - `ERROR` (màu đỏ)
   - `Error:`
   - `TypeError:`
   - `ReferenceError:`
   - `Cannot read property`
   - `undefined is not an object`

3. **Lỗi thường xuất hiện sau:**
   - `Android Bundled ...`
   - `LOG App: Ready!`
   - `LOG RootNavigator: ...`

## ✅ Cách 2: Sử dụng ADB Logcat

Mở terminal mới và chạy:
```powershell
adb logcat | findstr /i "error exception crash"
```

Hoặc xem tất cả logs:
```powershell
adb logcat
```

## ✅ Cách 3: Xem logs React Native

Trong terminal Expo, logs sẽ tự động hiển thị. Tìm các dòng:
- `LOG` - Thông tin bình thường
- `WARN` - Cảnh báo
- `ERROR` - Lỗi nghiêm trọng

## 🔍 Các lỗi thường gặp:

### 1. "Cannot read property 'X' of undefined"
→ Object chưa được khởi tạo trước khi sử dụng

### 2. "Component is not defined"
→ Import sai hoặc component chưa được export

### 3. "Network Error" hoặc "ECONNREFUSED"
→ Backend chưa chạy hoặc IP sai

### 4. "NavigationContainer must be a descendant of..."
→ Có nhiều NavigationContainer

## 📝 Checklist Debug:

1. [ ] Scroll lên trong terminal Expo
2. [ ] Tìm dòng có `ERROR` hoặc `Error:`
3. [ ] Copy toàn bộ dòng lỗi
4. [ ] Gửi cho tôi để tôi sửa

## 💡 Tip:

Nếu không thấy lỗi trong terminal, thử:
- Nhấn `r` để reload app (có thể trigger lỗi)
- Đóng và mở lại app trong emulator
- Clear cache và restart: `npx expo start -c`

