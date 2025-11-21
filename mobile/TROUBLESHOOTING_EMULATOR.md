# 🔧 Troubleshooting: Emulator Màn Hình Tối Đen

## 🐛 Các Vấn Đề Thường Gặp

### 1. Lỗi: "TypeError: fetch failed" khi chạy `npx expo start`

**Nguyên nhân:**

- Expo CLI không thể kết nối đến Expo API để kiểm tra dependencies
- Có thể do mạng, firewall, hoặc proxy

**Giải pháp:**

**Cách 1: Chạy offline (Bỏ qua kiểm tra dependencies)**

```bash
cd mobile
npx expo start --offline
```

**Cách 2: Bỏ qua validation**

```bash
cd mobile
EXPO_NO_DOTENV=1 npx expo start --no-dev
```

**Cách 3: Sử dụng localhost thay vì network**

```bash
cd mobile
npx expo start --localhost
```

**Cách 4: Tắt React Compiler (nếu đang bật)**

```bash
cd mobile
EXPO_NO_REACT_COMPILER=1 npx expo start
```

**Cách 5: Kiểm tra kết nối mạng**

- Tắt VPN nếu đang bật
- Kiểm tra firewall không chặn Node.js
- Thử chạy lại: `npx expo start --offline`

---

### 2. Vấn Đề: Emulator Mở Nhưng Màn Hình Tối Đen

### Nguyên Nhân Có Thể

1. **Expo Go chưa được cài đặt trên emulator**
2. **App đang bị lỗi khi khởi động**
3. **Emulator chưa boot xong hoàn toàn**
4. **Có lỗi trong code khi render**

---

## ✅ Giải Pháp Từng Bước

### Bước 1: Kiểm Tra Emulator Đã Boot Xong

1. Mở **Android Studio**
2. **Tools** → **Device Manager**
3. Đảm bảo emulator đang chạy (có icon ▶️)
4. Đợi emulator boot xong (thấy màn hình home Android)

### Bước 2: Cài Đặt Expo Go Thủ Công

**Cách 1: Từ Play Store trên Emulator**

1. Mở emulator
2. Mở **Play Store** app
3. Tìm kiếm: **"Expo Go"**
4. Cài đặt app **Expo Go** (của Expo)
5. Mở **Expo Go** app

**Cách 2: Cài Đặt APK Trực Tiếp**

```bash
# Tìm đường dẫn adb
# Thường là: C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools\adb.exe

# Download Expo Go APK
# Từ: https://expo.dev/client

# Cài đặt APK
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install path\to\expo-go.apk
```

### Bước 3: Kiểm Tra Logs Từ Emulator

**Kiểm tra logs:**

```powershell
# Tìm adb path
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

# Kiểm tra devices
& $adbPath devices

# Xem logs
& $adbPath logcat | Select-String -Pattern "expo|error|exception|ReactNative"
```

**Hoặc dùng Android Studio:**

1. Mở **Android Studio**
2. **View** → **Tool Windows** → **Logcat**
3. Filter: `expo` hoặc `ReactNative`

### Bước 4: Chạy Lại App

Sau khi cài Expo Go:

```bash
cd mobile
npm start
# Bấm 'a' để mở trên Android emulator
```

### Bước 5: Kiểm Tra Code Có Lỗi

**Kiểm tra console trong terminal:**

- Xem có lỗi nào trong terminal không
- Kiểm tra warnings

**Kiểm tra trong Expo Go:**

1. Mở **Expo Go** trên emulator
2. Shake device (hoặc bấm `Ctrl+M` trên emulator)
3. Chọn **"Debug Remote JS"**
4. Mở Chrome DevTools để xem logs

---

## 🔍 Debug Chi Tiết

### Kiểm Tra Expo Go Đã Cài Chưa

```powershell
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath shell pm list packages | Select-String "expo"
```

**Kết quả mong muốn:**

```
package:host.exp.exponent
```

**Nếu không thấy:** Cài Expo Go từ Play Store

### Kiểm Tra App Đang Chạy

```powershell
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adbPath shell dumpsys window windows | Select-String -Pattern "mCurrentFocus"
```

### Xem Logs Chi Tiết

```powershell
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

# Clear logs
& $adbPath logcat -c

# Xem logs real-time
& $adbPath logcat | Select-String -Pattern "expo|ReactNative|error"
```

---

## 🚀 Giải Pháp Nhanh

### Nếu Expo Go Chưa Cài

1. **Mở emulator**
2. **Mở Play Store** trên emulator
3. **Tìm "Expo Go"** và cài đặt
4. **Mở Expo Go** app
5. **Quay lại terminal**, bấm `r` để reload

### Nếu Expo Go Đã Cài Nhưng Vẫn Tối

1. **Đóng Expo Go** trên emulator
2. **Clear cache:**

   ```bash
   cd mobile
   npx expo start --clear
   ```

3. **Bấm `a`** để mở lại trên emulator

### Nếu Vẫn Không Được

1. **Restart emulator:**
   - Đóng emulator
   - Mở lại từ Android Studio
   - Đợi boot xong

2. **Kiểm tra backend đang chạy:**

   ```bash
   # Terminal khác
   cd backend
   npm start
   ```

3. **Kiểm tra API URL:**
   - Mở `mobile/src/services/apiService.ts`
   - Đảm bảo Android dùng: `http://10.0.2.2:3001/api`

---

## 📝 Checklist

- [ ] Emulator đã boot xong (thấy màn hình home)
- [ ] Expo Go đã được cài đặt trên emulator
- [ ] Backend đang chạy trên port 3001
- [ ] API URL đúng: `http://10.0.2.2:3001/api` cho Android
- [ ] Đã chạy `npm start` trong thư mục mobile
- [ ] Đã bấm `a` để mở trên Android emulator
- [ ] Không có lỗi trong terminal
- [ ] Không có lỗi trong Expo Go (shake device → Debug Remote JS)

---

## 💡 Tips

1. **Luôn đợi emulator boot xong** trước khi chạy app
2. **Cài Expo Go từ Play Store** trên emulator (dễ nhất)
3. **Kiểm tra logs** nếu có vấn đề
4. **Clear cache** nếu app không load: `npx expo start --clear`
5. **Restart emulator** nếu vẫn không được

---

**Nếu vẫn không được, hãy kiểm tra logs và cho tôi biết lỗi cụ thể!**
