# Tổng hợp sử dụng Database trong hệ thống

## ✅ Trạng thái hiện tại
**Tất cả dữ liệu đều được lấy từ MySQL database thông qua Express.js API backend.**

## 📋 Cấu hình API

### Frontend API Service
- **File**: `client/services/apiService.ts`
- **Base URL**: `http://localhost:3001/api`
- **Tất cả API calls**: GET, POST, PUT, DELETE đều thông qua backend

### Backend API Server
- **Port**: `3001`
- **Database**: MySQL (Sequelize ORM)
- **Schema**: Định nghĩa trong `db.txt`

## 🔄 Luồng dữ liệu

```
Frontend (React) 
    ↓
apiService.ts (API calls)
    ↓
Backend API (Express.js)
    ↓
Sequelize ORM
    ↓
MySQL Database
```

## 📊 Các module sử dụng database

### 1. Authentication & Users
- ✅ Login/Register → `POST /api/auth/login`, `/api/auth/register`
- ✅ User Management → `GET/POST/PUT/DELETE /api/users`
- ✅ User Wallet → `GET /api/wallets/:userId`

### 2. Services & Appointments
- ✅ Services → `GET/POST/PUT/DELETE /api/services`
- ✅ Appointments → `GET/POST/PUT/DELETE /api/appointments`
- ✅ Treatment Courses → `GET/POST/PUT/DELETE /api/treatment-courses`

### 3. Staff Management
- ✅ Staff Shifts → `GET/POST/PUT/DELETE /api/staff/shifts`
- ✅ Staff Availability → `GET/PUT/DELETE /api/staff/availability`
- ✅ Staff Tasks → `GET/POST/PUT/DELETE /api/staff/tasks`

### 4. Rooms Management
- ✅ Rooms → `GET/POST/PUT/DELETE /api/rooms`

### 5. Promotions & Loyalty
- ✅ Promotions → `GET/POST/PUT/DELETE /api/promotions`
- ✅ Vouchers → `GET/POST/PUT/DELETE /api/vouchers`
- ✅ Tiers → `GET/PUT /api/vouchers/tiers/:level`

### 6. Payments & Transactions
- ✅ Payments → `GET/POST/PUT /api/payments`
- ✅ Payment Processing → `POST /api/payments/process`

### 7. Reviews & Ratings
- ✅ Reviews → `GET/POST/PUT/DELETE /api/reviews`

### 8. Internal Communication
- ✅ Internal News → `GET/POST/PUT/DELETE /api/staff/news`
- ✅ Internal Notifications → `GET/POST /api/staff/notifications`

## 🛡️ Error Handling

### Fallback Strategy
Khi API call thất bại, hệ thống sử dụng fallback:
- **Empty arrays `[]`** cho danh sách
- **Null/undefined** cho single objects
- **Error messages** hiển thị cho user

### Ví dụ:
```typescript
try {
    const data = await apiService.getServices();
    setServices(data);
} catch (error) {
    console.error("Error fetching services:", error);
    setServices([]); // Fallback to empty array
    setError(error.message);
}
```

## 📝 Data Flow trong App.tsx

### Global State Management
- `App.tsx` fetch tất cả data khi khởi động
- Props được truyền xuống các pages
- Pages có thể fetch thêm data nếu cần (fallback)

### Example:
```typescript
// App.tsx
const [allUsers, setAllUsers] = useState<User[]>([]);
const [allServices, setAllServices] = useState<Service[]>([]);
// ... fetch data on mount

// Pages
<UsersPage allUsers={allUsers} />
<ServicesPage allServices={allServices} />
```

## 🔍 Kiểm tra Database Connection

### Backend
- File: `backend/config/database.js`
- Sequelize connection với MySQL
- Models: Định nghĩa trong `backend/models/`

### Test Connection
```bash
# Test database connection
node -e "const db = require('./backend/config/database'); db.sequelize.authenticate().then(() => console.log('DB OK')).catch(err => console.error('Error:', err));"
```

## 📦 Seed Data

### File: `backend/seedData.js`
- **Mục đích**: Chỉ dùng để seed database khi setup lần đầu
- **Không được sử dụng** trong production code
- **Chỉ chạy một lần** khi khởi tạo database

## ✅ Checklist

- [x] Tất cả API calls đều thông qua `apiService.ts`
- [x] Không có mock data trong production code
- [x] Error handling với fallback phù hợp
- [x] Database schema được định nghĩa trong `db.txt`
- [x] Backend models sử dụng Sequelize ORM
- [x] Tất cả CRUD operations đều qua API
- [x] Authentication sử dụng JWT tokens
- [x] Real-time data updates khi có thay đổi

## 🚀 Next Steps

1. **Environment Variables**: Nên sử dụng `.env` cho API_BASE_URL
2. **API Error Handling**: Có thể cải thiện error messages
3. **Loading States**: Đảm bảo loading states hiển thị đúng
4. **Data Caching**: Có thể thêm caching để tối ưu performance
5. **API Rate Limiting**: Cân nhắc thêm rate limiting cho backend

## 📚 Tài liệu liên quan

- `db.txt` - Database schema
- `backend/models/` - Sequelize models
- `backend/routes/` - API routes
- `client/services/apiService.ts` - Frontend API service

