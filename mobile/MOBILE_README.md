# SPA BOOKING - Mobile App (React Native + Expo)

## 🚀 Cách chạy

### Bước 1: Install dependencies

```bash
cd mobile
npm install
```

### Bước 2: Cấu hình API endpoint

Update `API_BASE_URL` trong `src/services/apiService.ts`:

```typescript
const API_BASE_URL = "http://localhost:3001/api"; // Change if backend runs on different port
```

Trên thiết bị thực, thay `localhost` bằng địa chỉ IP của máy:

```
http://192.168.x.x:3001/api
```

### Bước 3: Start Expo server

```bash
npm start
# hoặc
npx expo start
```

### Bước 4: Chạy trên simulator/device

- **Expo Go (Android/iOS)**: Scan QR code từ terminal
- **Web**: Bấm `w` trong terminal
- **Android Studio**: Bấm `a` trong terminal
- **Xcode**: Bấm `i` trong terminal (macOS only)

## 📱 Cấu trúc dự án

```
mobile/
├── src/
│   ├── screens/            # Tất cả screens
│   │   ├── auth/          # Login, Register
│   │   ├── appointments/  # Danh sách lịch hẹn, chi tiết
│   │   ├── courses/       # Danh sách khóa học, chi tiết
│   │   └── profile/       # Hồ sơ cá nhân
│   │
│   ├── navigation/        # Navigation setup
│   │   ├── RootNavigator.tsx   # Main entry point
│   │   ├── AuthNavigator.tsx   # Auth screens
│   │   └── MainNavigator.tsx   # Main app (bottom tabs)
│   │
│   ├── services/          # API calls
│   │   └── apiService.ts  # Axios client + all endpoints
│   │
│   ├── types/             # TypeScript interfaces
│   │   └── index.ts
│   │
│   ├── hooks/             # Custom React hooks
│   │   └── useAuth.ts
│   │
│   ├── utils/             # Helper functions
│   │   └── formatters.ts  # Date, currency, status formatting
│   │
│   └── components/        # Reusable components (coming soon)
│
├── App.tsx                # Entry point
├── app.json               # Expo config
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Workflow

### 1. Authentication

- User chưa login → **Auth Navigator** (Login/Register screens)
- Login/Register thành công → Token + User lưu vào AsyncStorage
- Token tồn tại → **Main Navigator** (App tabs)
- Token hết hạn → Auto logout

### 2. Appointments

- Hiện danh sách lịch hẹn từ backend
- Click lịch hẹn → Xem chi tiết
- Pull to refresh để cập nhật
- Navigation autofocus để reload data

### 3. Courses

- Tab: "Khóa của tôi" (đã đăng ký)
- Tab: "Khóa có sẵn" (templates chưa đăng ký)
- Click khóa → Xem chi tiết, đặt lịch buổi tập
- Progress bar hiển thị tiến độ

### 4. Profile

- Hiển thị thông tin cá nhân
- Đăng xuất → Tự động quay về Auth Navigator

## 🛠️ Technologies

- **React Native**: Mobile framework
- **Expo**: Development & distribution platform
- **TypeScript**: Type safety
- **@react-navigation**: Routing & navigation
  - Bottom Tab Navigator (Lịch hẹn, Khóa học, Hồ sơ)
  - Native Stack Navigator (nested stacks)
- **axios**: HTTP client
- **@react-native-async-storage**: Local persistent storage
- **expo-vector-icons (Ionicons)**: Icons

## 📝 Làm tiếp

### Screens cần hoàn thiện:

- [ ] AppointmentDetailScreen - Chi tiết lịch hẹn + hủy
- [ ] CourseDetailScreen - Chi tiết khóa học + đăng ký
- [ ] ScheduleSessionScreen - Đặt lịch buổi tập

### Components cần tạo:

- [ ] AppointmentCard (reusable)
- [ ] CourseCard (reusable)
- [ ] LoadingSpinner
- [ ] ErrorMessage
- [ ] Button (custom)
- [ ] Input (custom)

### Features cần thêm:

- [ ] Search/filter appointments & courses
- [ ] Notifications
- [ ] Payment history
- [ ] Reviews & ratings
- [ ] Change password
- [ ] Edit profile

### Monorepo setup (optional):

```
packages/
├── shared/          # Shared types, utils, services
│   ├── types/
│   ├── services/
│   └── utils/
```

## 🐛 Debugging

### Enable React Developer Tools

```bash
npx expo start --localhost
```

### Check logs

```bash
npx expo logs
```

### Debug in browser

Press `j` trong Expo terminal

### Fast refresh

Press `r` trong Expo terminal

## 📦 Build for distribution

### APK (Android)

```bash
eas build --platform android --profile preview
```

### IPA (iOS)

```bash
eas build --platform ios --profile preview
```

Cần EAS account: https://expo.dev

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [React Native Docs](https://reactnative.dev)
- [TypeScript for React Native](https://www.typescriptlang.org/docs/handbook/jsx.html)
