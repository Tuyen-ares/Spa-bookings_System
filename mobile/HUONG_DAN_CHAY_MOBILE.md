# 📱 Hướng Dẫn Chạy Mobile App trên Máy Giả Lập - Anh Thơ Spa

## 📋 Yêu Cầu

### 1. Cài Đặt Node.js

- Node.js 18+ (đã có nếu đã chạy được backend/frontend)

### 2. Cài Đặt Java JDK (Cho Android Emulator)

**Kiểm tra JDK hiện tại:**

```bash
java -version
```

**Yêu cầu:**

- **JDK 17** hoặc **JDK 21** (khuyến nghị cho Android development)
- Nếu chưa có hoặc version cũ, cài đặt JDK 17:
  - Download: <https://adoptium.net/temurin/releases/?version=17>
  - Hoặc dùng: `choco install openjdk17` (nếu có Chocolatey)

**Kiểm tra JAVA_HOME:**

```bash
echo %JAVA_HOME%
# Phải trỏ đến thư mục JDK (ví dụ: C:\Program Files\Java\jdk-17)
```

### 3. Cài Đặt Android Studio (Cho Android Emulator)

1. Download: <https://developer.android.com/studio>
2. Cài đặt Android Studio
3. Mở Android Studio → **More Actions** → **SDK Manager**
4. Cài đặt:
   - **Android SDK Platform** (API 33 hoặc 34)
   - **Android SDK Build-Tools**
   - **Android Emulator**
   - **Intel x86 Emulator Accelerator (HAXM)** hoặc **Android Emulator Hypervisor Driver (AMD)**
5. Tạo Virtual Device:
   - **Tools** → **Device Manager** → **Create Device**
   - Chọn device (ví dụ: Pixel 5)
   - Chọn System Image (API 33 hoặc 34)
   - Finish

### 4. Cài Đặt Xcode (Cho iOS Simulator - Chỉ macOS)

- Chỉ cần nếu chạy iOS Simulator
- Download từ App Store
- Mở Xcode → Install additional components

---

## 🚀 Các Bước Chạy Mobile App trên Emulator

### Bước 1: Cài Đặt Dependencies

```bash
cd mobile
npm install
```

### Bước 2: Cấu Hình API URL cho Emulator

**QUAN TRỌNG**: Cập nhật API URL trong file `mobile/src/services/apiService.ts`:

Mở file `mobile/src/services/apiService.ts` và cập nhật:

```typescript
// Auto-detect API URL based on platform
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api';
  }
  // Android Emulator: dùng 10.0.2.2 thay vì localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api'; // <-- Cho Android Emulator
  }
  // iOS Simulator: dùng localhost
  if (Platform.OS === 'ios') {
    return 'http://localhost:3001/api'; // <-- Cho iOS Simulator
  }
  // Fallback
  return 'http://localhost:3001/api';
};
```

**Lưu ý:**

- **Android Emulator**: `http://10.0.2.2:3001/api` (10.0.2.2 là localhost của emulator)
- **iOS Simulator**: `http://localhost:3001/api`
- **Web Browser**: `http://localhost:3001/api`

### Bước 3: Đảm Bảo Backend Đang Chạy

```bash
cd backend
npm start
# Backend phải chạy trên port 3001
```

**Kiểm tra backend:**

- Mở browser: `http://localhost:3001/api/services`
- Phải thấy JSON response

### Bước 4: Khởi Động Emulator

#### Android Emulator

1. Mở **Android Studio**
2. **Tools** → **Device Manager**
3. Click **Play** (▶️) để khởi động emulator
4. Đợi emulator boot xong (có thể mất 1-2 phút)

#### iOS Simulator (macOS only)

1. Mở **Xcode**
2. **Xcode** → **Open Developer Tool** → **Simulator**
3. Hoặc chạy: `open -a Simulator`
4. Chọn device: **File** → **Open Simulator** → Chọn iPhone

### Bước 5: Chạy Mobile App

```bash
cd mobile
npm start
# hoặc
npx expo start
```

### Bước 6: Mở App trên Emulator

Sau khi chạy `npm start`, bạn sẽ thấy menu:

```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

**Chọn platform:**

- **Android Emulator**: Bấm `a` trong terminal
- **iOS Simulator**: Bấm `i` trong terminal (chỉ macOS)
- **Web Browser**: Bấm `w` trong terminal

### Bước 3: Chạy Mobile App

```bash
cd mobile
npm start
# hoặc
npx expo start
```

---

## 🔧 Cấu Hình Chi Tiết

### 1. Kiểm Tra và Cài Đặt JDK

**Kiểm tra JDK version:**

```bash
java -version
```

**Kết quả mong muốn:**

```
openjdk version "17.0.x" 2024-xx-xx
OpenJDK Runtime Environment (build 17.0.x+x)
OpenJDK 64-Bit Server VM (build 17.0.x+x, mixed mode, sharing)
```

**Nếu chưa có hoặc version cũ:**

1. **Download JDK 17:**
   - Truy cập: <https://adoptium.net/temurin/releases/?version=17>
   - Chọn **Windows x64** → Download **JDK 17**
   - Cài đặt

2. **Set JAVA_HOME Environment Variable:**
   - Mở **System Properties** → **Environment Variables**
   - Thêm **JAVA_HOME**: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
   - Thêm vào **Path**: `%JAVA_HOME%\bin`
   - Restart terminal và kiểm tra lại: `java -version`

### 2. Cấu Hình API URL cho Emulator

Mở `mobile/src/services/apiService.ts` và cập nhật:

```typescript
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api';
  }
  // Android Emulator: 10.0.2.2 là localhost của emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api';
  }
  // iOS Simulator: dùng localhost
  if (Platform.OS === 'ios') {
    return 'http://localhost:3001/api';
  }
  return 'http://localhost:3001/api';
};
```

### 3. Kiểm Tra Backend

Đảm bảo backend đang chạy:

```bash
# Test từ trình duyệt:
http://localhost:3001/api/services
# Phải thấy JSON response
```

### 4. Cấu Hình Android Studio

1. **Mở Android Studio**
2. **File** → **Settings** (hoặc **Preferences** trên macOS)
3. **Appearance & Behavior** → **System Settings** → **Android SDK**
4. Đảm bảo đã cài:
   - ✅ Android SDK Platform 33 hoặc 34
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
5. **Tools** → **Device Manager** → Tạo Virtual Device nếu chưa có

---

## 📱 Các Lệnh Hữu Ích

### Chạy App trên Emulator

```bash
cd mobile
npm start              # Khởi động Expo (sau đó bấm 'a' cho Android hoặc 'i' cho iOS)
npm run android        # Tự động mở Android emulator và chạy app
npm run ios            # Tự động mở iOS simulator và chạy app (macOS only)
npm run web            # Chạy trên web browser
```

### Kiểm Tra Emulator

**Android:**

```bash
# Kiểm tra emulator đang chạy
adb devices
# Phải thấy device: emulator-5554
```

**iOS (macOS):**

```bash
# Kiểm tra simulator
xcrun simctl list devices
```

### Debug

```bash
# Clear cache và restart
npx expo start --clear

# Xem logs
# Shake device → "Debug Remote JS" → Mở Chrome DevTools
```

### Reload App

- **Trong terminal**: Bấm `r`
- **Trên điện thoại**: Shake device → "Reload"

---

## 🐛 Troubleshooting

### Lỗi: "Network request failed"

**Nguyên nhân:**

- API URL sai
- Backend không chạy
- Firewall chặn
- Điện thoại và máy tính không cùng WiFi

**Giải pháp:**

1. Kiểm tra backend đang chạy: `http://YOUR_IP:3001/api/services`
2. Kiểm tra API_BASE_URL trong `apiService.ts`
3. Đảm bảo điện thoại và máy tính cùng WiFi
4. Tắt VPN nếu đang bật
5. Kiểm tra Firewall settings

### Lỗi: "Unable to resolve module"

**Giải pháp:**

```bash
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### Lỗi: "Cannot read property 'map' of undefined"

**Nguyên nhân:**

- Backend không trả về data đúng format
- API endpoint không tồn tại

**Giải pháp:**

1. Kiểm tra backend logs
2. Test API endpoint bằng browser/Postman
3. Xem console logs trong Expo (shake device → Debug Remote JS)

### App không reload sau khi sửa code

**Giải pháp:**

- Bấm `r` trong terminal để reload
- Hoặc shake device → "Reload"
- Hoặc bấm `m` để mở menu → "Reload"

### QR Code không scan được

**Giải pháp:**

- Đảm bảo điện thoại và máy tính cùng WiFi
- Thử dùng tunnel mode:

  ```bash
  npx expo start --tunnel
  ```

- Hoặc nhập URL thủ công trong Expo Go

---

## ✅ Checklist Trước Khi Chạy

- [ ] Đã cài đặt Node.js 18+
- [ ] Đã cài đặt JDK 17 hoặc 21
- [ ] Đã set JAVA_HOME environment variable
- [ ] Đã cài đặt Android Studio (cho Android)
- [ ] Đã tạo Android Virtual Device (AVD)
- [ ] Đã cài đặt Xcode (cho iOS - chỉ macOS)
- [ ] Đã chạy `npm install` trong thư mục `mobile`
- [ ] Đã cập nhật `getApiBaseUrl()` trong `apiService.ts` cho emulator
- [ ] Backend đang chạy trên port 3001
- [ ] Đã test API: `http://localhost:3001/api/services`
- [ ] Android Emulator hoặc iOS Simulator đã được khởi động

---

## 🎯 Quick Start (Tóm Tắt)

```bash
# 1. Kiểm tra JDK
java -version
# Phải là JDK 17 hoặc 21

# 2. Khởi động Android Emulator (từ Android Studio)
# Tools → Device Manager → Click Play

# 3. Cài đặt dependencies
cd mobile
npm install

# 4. Cập nhật API URL trong src/services/apiService.ts
# Android: http://10.0.2.2:3001/api
# iOS: http://localhost:3001/api

# 5. Đảm bảo backend đang chạy
cd ../backend
npm start

# 6. Chạy mobile app
cd ../mobile
npm start

# 7. Bấm 'a' để mở trên Android Emulator
# hoặc 'i' để mở trên iOS Simulator
```

---

## 📚 Tài Liệu Tham Khảo

- Expo Documentation: <https://docs.expo.dev>
- React Native: <https://reactnative.dev>
- Expo Go: <https://expo.dev/client>

---

## 💡 Tips

1. **Hot Reload**: App tự động reload khi bạn save file
2. **Console Logs**: Shake device → "Debug Remote JS" → Mở Chrome DevTools
3. **Fast Refresh**: Không cần reload lại app khi sửa UI
4. **Errors**: Xem trong Expo terminal hoặc shake device

---

**Chúc bạn code vui vẻ! 🚀**
