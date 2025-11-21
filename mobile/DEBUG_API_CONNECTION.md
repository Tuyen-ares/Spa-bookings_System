# Hướng dẫn Debug Kết nối API

## ✅ Đã cấu hình đúng:

1. **Backend**: Đã listen trên `0.0.0.0:3001` ✅
2. **Mobile App**: Đã cấu hình IP `192.168.80.1:3001/api` ✅
3. **Port 3001**: Đang mở và có thể truy cập ✅

## 🔍 Kiểm tra Backend đang chạy:

### 1. Kiểm tra trong terminal backend:
```bash
cd backend
npm start
```

Bạn sẽ thấy:
```
Server is running on port 3001
Server listening on 0.0.0.0:3001 (accessible from network)
```

### 2. Kiểm tra trong browser:
Mở Chrome và truy cập:
- `http://localhost:3001/` → Sẽ thấy "Welcome to Anh Thơ Spa Backend API!"
- `http://192.168.80.1:3001/` → Cũng sẽ thấy message tương tự

### 3. Kiểm tra API endpoint:
- `http://localhost:3001/api/auth/login` → Sẽ trả về lỗi validation (bình thường)
- `http://192.168.80.1:3001/api/auth/login` → Cũng sẽ trả về lỗi validation

## 🐛 Debug trong Mobile App:

### 1. Kiểm tra logs trong Expo terminal:
Tìm các dòng:
```
LOG API client initialized with base URL: http://192.168.80.1:3001/api
```

### 2. Kiểm tra lỗi kết nối:
Nếu thấy lỗi như:
- `Network Error`
- `ECONNREFUSED`
- `timeout`

→ Có nghĩa là app không thể kết nối đến backend.

### 3. Thêm debug logs:

Trong `mobile/src/services/apiService.ts`, thêm vào hàm `initializeApi`:

```typescript
export const initializeApi = async () => {
  const token = await AsyncStorage.getItem('token');
  
  console.log('🔗 API Base URL:', API_BASE_URL); // Thêm dòng này
  
  apiClient = axios.create({
    baseURL: API_BASE_URL,
    // ...
  });
  
  // Test connection
  try {
    const testResponse = await apiClient.get('/auth/login');
    console.log('✅ API connection successful');
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
  }
};
```

## 🚀 Các bước khắc phục:

### Bước 1: Đảm bảo Backend đang chạy
```bash
cd backend
npm start
```

### Bước 2: Kiểm tra Firewall
Windows Firewall có thể chặn port 3001. Tạm thời tắt firewall để test.

### Bước 3: Reload App
Trong Expo terminal, nhấn `r` để reload app.

### Bước 4: Kiểm tra IP Address
Đảm bảo IP `192.168.80.1` là IP đúng của máy bạn:
```powershell
ipconfig | findstr /i "IPv4"
```

Nếu IP khác, cập nhật trong `mobile/src/services/apiService.ts`.

## 📱 Test nhanh:

1. Mở app trong emulator
2. Mở Expo terminal
3. Tìm log: `LOG API client initialized with base URL: ...`
4. Nếu thấy IP đúng → API đã được cấu hình
5. Thử đăng nhập → Xem có lỗi network không

## ⚠️ Lưu ý:

- Backend PHẢI đang chạy trước khi mở app
- IP address PHẢI đúng với IP của máy bạn
- Firewall có thể chặn kết nối
- Emulator và máy tính PHẢI cùng mạng (hoặc emulator dùng 10.0.2.2)

