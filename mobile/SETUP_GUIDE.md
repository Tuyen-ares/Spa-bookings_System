# 🔧 CẤU HÌNH BACKEND CHO MOBILE

## ⚠️ QUAN TRỌNG: Thay đổi API URL

Khi chạy app trên **thiết bị thực** (điện thoại, tablet), bạn KHÔNG thể dùng `localhost`!

### Bước 1: Tìm địa chỉ IP của máy tính

**Windows:**

```powershell
ipconfig
# Tìm dòng "IPv4 Address" trong phần "Wireless LAN adapter Wi-Fi"
# Ví dụ: 192.168.1.14
```

**macOS/Linux:**

```bash
ifconfig
# hoặc
ip addr show
```

### Bước 2: Cập nhật API URL trong mobile app

Mở file `mobile/src/services/apiService.ts`:

```typescript
// ❌ SAI - Không hoạt động trên thiết bị thực
const API_BASE_URL = "http://localhost:3001/api";

// ✅ ĐÚNG - Thay bằng IP máy tính
const API_BASE_URL = "http://192.168.1.14:3001/api"; // <-- Thay IP này
```

### Bước 3: Đảm bảo backend chạy

```bash
cd backend
npm start
# Backend phải chạy trên port 3001
```

### Bước 4: Kiểm tra firewall

Đảm bảo Windows Firewall cho phép Node.js:

- Mở **Windows Defender Firewall**
- **Allow an app through firewall**
- Tìm **Node.js** và check cả **Private** và **Public**

### Bước 5: Test API

Từ điện thoại, mở browser và truy cập:

```
http://192.168.1.14:3001/api/services
```

Nếu thấy JSON response → OK! Bắt đầu chạy app.

---

## 📱 Chạy App trên Expo Go

### Android/iOS (Expo Go app)

1. Install Expo Go từ App Store / Play Store
2. Mở terminal:
   ```bash
   cd mobile
   npm start
   ```
3. Scan QR code bằng Expo Go (Android) hoặc Camera (iOS)
4. App sẽ tự động reload khi bạn edit code

### Web Browser (dev only)

```bash
npm start
# Bấm 'w' để mở web version
```

---

## 🐛 Troubleshooting

### Lỗi: "Network request failed"

- ✅ Kiểm tra backend đang chạy: `http://192.168.1.14:3001`
- ✅ Kiểm tra API_BASE_URL có đúng IP không
- ✅ Điện thoại và máy tính phải cùng WiFi
- ✅ Tắt VPN nếu đang bật

### Lỗi: "Unable to resolve module"

```bash
cd mobile
npm install
npx expo start --clear
```

### Lỗi: "Cannot read property 'map' of undefined"

- Kiểm tra backend có trả về data đúng format không
- Xem console logs trong Expo Go (shake device → Debug Remote JS)

### App không reload sau khi sửa code

- Bấm `r` trong terminal để reload
- Hoặc shake device → Reload

---

## 🎯 Quick Start Checklist

- [ ] Backend chạy trên port 3001
- [ ] Tìm IP máy tính (VD: 192.168.1.14)
- [ ] Update `API_BASE_URL` trong `apiService.ts`
- [ ] Firewall cho phép Node.js
- [ ] Điện thoại và máy tính cùng WiFi
- [ ] Test API: `http://IP:3001/api/services`
- [ ] Chạy `npm start` trong folder mobile
- [ ] Scan QR code bằng Expo Go

---

## 📚 API Endpoints đang dùng

```
GET    /api/services              - Danh sách dịch vụ
GET    /api/appointments          - Danh sách lịch hẹn
GET    /api/appointments/:id      - Chi tiết lịch hẹn
POST   /api/appointments          - Tạo lịch hẹn mới
PUT    /api/appointments/:id      - Cập nhật lịch hẹn
GET    /api/treatment-courses     - Danh sách khóa học
GET    /api/treatment-courses/:id - Chi tiết khóa học
POST   /api/treatment-courses/:id/register - Đăng ký khóa học
POST   /api/treatment-courses/:courseId/sessions/:sessionId/schedule - Đặt lịch buổi
POST   /api/auth/login            - Đăng nhập
POST   /api/auth/register         - Đăng ký
GET    /api/users                 - Danh sách users (staff)
```

---

## 💡 Tips

1. **Auto-reload:** App tự động reload khi bạn save file
2. **Console logs:** Shake device → Debug Remote JS → Mở Chrome DevTools
3. **Fast refresh:** Không cần reload lại app khi sửa UI
4. **Errors:** Xem trong Expo terminal hoặc shake device

---

## 🚀 Production Build

### APK (Android)

```bash
npx eas build --platform android --profile preview
```

### IPA (iOS)

```bash
npx eas build --platform ios --profile preview
```

Trước khi build:

1. Đổi `API_BASE_URL` thành URL production (không phải IP local)
2. Tạo EAS account: https://expo.dev
3. Run `eas login`

---

**Prepared by:** GitHub Copilot  
**Last Updated:** November 20, 2025
