# MVC Architecture Implementation

## 📁 Cấu trúc đã tạo

```
backend/
├── controllers/           ✅ Đã tạo
│   ├── paymentController.js
│   ├── appointmentController.js
│   ├── authController.js
│   ├── userController.js
│   ├── serviceController.js
│   └── README.md
├── services/              ✅ Đã tạo
│   ├── paymentService.js
│   ├── appointmentService.js
│   ├── authService.js
│   ├── userService.js
│   └── serviceService.js
├── routes/                ⏳ Cần refactor
│   ├── payments.js        (cần update để dùng controller)
│   ├── appointments.js    (cần update để dùng controller)
│   ├── auth.js            (cần update để dùng controller)
│   ├── users.js           (cần update để dùng controller)
│   ├── services.js        (cần update để dùng controller)
│   └── ... 8 files khác
└── ...
```

## ✅ Hoàn thành (5/13 modules)

### 1. Payment Module

**Files**: `paymentService.js`, `paymentController.js`

**Chức năng**:

- ✅ Get all payments with user details
- ✅ Get payment by ID
- ✅ Get payments by user ID
- ✅ Create VNPay payment URL
- ✅ Process payment (create record)
- ✅ Handle VNPay callback
- ✅ Update payment status
- ✅ CRUD operations

**Smart Features**:

- VNPay integration với signature verification
- Auto-update appointment payment status
- Fallback khi không có User association

### 2. Appointment Module

**Files**: `appointmentService.js`, `appointmentController.js`

**Chức năng**:

- ✅ Smart therapist assignment algorithm
- ✅ Get all appointments with filters
- ✅ Get appointment by ID
- ✅ Create appointment with auto-assign
- ✅ Update/Cancel/Complete appointment
- ✅ Award points after completion
- ✅ Get appointments by date range

**Smart Algorithm**:

```javascript
Score = Customer History (100+)
      + Workload Balancing (50-)
      → Chọn therapist có điểm cao nhất
```

### 3. Auth Module

**Files**: `authService.js`, `authController.js`

**Chức năng**:

- ✅ Register user (with wallet creation for clients)
- ✅ Login with JWT token
- ✅ Change password
- ✅ Reset password
- ✅ Verify token

**Security**:

- Bcrypt password hashing
- JWT token with 7-day expiration
- Role-based authentication

### 4. User Module

**Files**: `userService.js`, `userController.js`

**Chức năng**:

- ✅ Get all users (with role/status filters)
- ✅ Get user by ID (with wallet)
- ✅ Create user (auto-create wallet for clients)
- ✅ Update user (with password hashing)
- ✅ Delete user
- ✅ Get user profile (with appointments & wallet)
- ✅ Update user status

### 5. Service Module

**Files**: `serviceService.js`, `serviceController.js`

**Chức năng**:

- ✅ Service CRUD operations
- ✅ Category CRUD operations
- ✅ Get services by category
- ✅ Auto-calculate rating từ reviews
- ✅ Prevent deleting categories with services

## ⏳ Cần hoàn thành (8 modules)

### 6. Review Module (0%)

- reviewService.js
- reviewController.js
- Features: Reviews, ratings, manager replies, auto-update service rating

### 7. Staff Module (0%)

- staffService.js
- staffController.js
- Features: Availability management, shift scheduling, task assignment

### 8. Wallet Module (0%)

- walletService.js
- walletController.js
- Features: Points earn/spend, balance management, transaction history

### 9. Voucher Module (0%)

- voucherService.js
- voucherController.js
- Features: Promotions, redeemable vouchers, tier system, redeem logic

### 10. Room Module (0%)

- roomService.js
- roomController.js
- Features: Room CRUD, availability checking

### 11. Treatment Course Module (0%)

- treatmentCourseService.js
- treatmentCourseController.js
- Features: Course templates, session tracking, scheduling

### 12. Chatbot Module (0%)

- chatbotService.js
- chatbotController.js
- Features: Gemini AI integration, context management

### 13. Promotions Module (0%)

- Refactor promotions.js route to use voucher module

## 📋 Kế hoạch tiếp theo

### Bước 1: Refactor Route Files (Ưu tiên cao)

Update 5 route files đã có controller:

```bash
routes/
├── payments.js      → Dùng paymentController
├── appointments.js  → Dùng appointmentController
├── auth.js          → Dùng authController
├── users.js         → Dùng userController
└── services.js      → Dùng serviceController
```

**Example refactor**:

```javascript
// Before
router.get("/", async (req, res) => {
  const payments = await db.Payment.findAll();
  res.json(payments);
});

// After
const paymentController = require("../controllers/paymentController");
router.get("/", paymentController.getAllPayments);
```

### Bước 2: Tạo các module còn lại (8 modules)

1. Review → ratings & feedback
2. Staff → scheduling & tasks
3. Wallet → points system
4. Voucher → promotions & loyalty
5. Room → facility management
6. Treatment Course → multi-session bookings
7. Chatbot → AI assistant
8. Promotions → merge with vouchers

### Bước 3: Testing & Documentation

- Unit tests cho services
- Integration tests cho controllers
- API documentation (Swagger/OpenAPI)

## 🎯 Lợi ích của MVC

### Trước (Monolithic Routes)

```javascript
// routes/payments.js - 464 lines
router.get("/", async (req, res) => {
  // 50 lines business logic trực tiếp trong route
});
```

### Sau (MVC Pattern)

```javascript
// routes/payments.js - 10 lines
router.get('/', paymentController.getAllPayments);

// controllers/paymentController.js - 20 lines
async getAllPayments(req, res) {
    const payments = await paymentService.getAllPayments();
    res.json(payments);
}

// services/paymentService.js - 30 lines
async getAllPayments() {
    // Business logic ở đây
}
```

**Ưu điểm**:

- ✅ Code dễ đọc, dễ maintain
- ✅ Reusable services (dùng lại logic)
- ✅ Dễ test (mock services)
- ✅ Separation of concerns
- ✅ Scalable architecture

## 📊 Tiến độ

| Module           | Service | Controller | Route Updated | Progress |
| ---------------- | ------- | ---------- | ------------- | -------- |
| Payment          | ✅      | ✅         | ⏳            | 66%      |
| Appointment      | ✅      | ✅         | ⏳            | 66%      |
| Auth             | ✅      | ✅         | ⏳            | 66%      |
| User             | ✅      | ✅         | ⏳            | 66%      |
| Service          | ✅      | ✅         | ⏳            | 66%      |
| Review           | ⏳      | ⏳         | ⏳            | 0%       |
| Staff            | ⏳      | ⏳         | ⏳            | 0%       |
| Wallet           | ⏳      | ⏳         | ⏳            | 0%       |
| Voucher          | ⏳      | ⏳         | ⏳            | 0%       |
| Room             | ⏳      | ⏳         | ⏳            | 0%       |
| Treatment Course | ⏳      | ⏳         | ⏳            | 0%       |
| Chatbot          | ⏳      | ⏳         | ⏳            | 0%       |
| **TOTAL**        |         |            |               | **31%**  |

## 🚀 Để chạy tiếp

```bash
# Bước 1: Update route files
cd backend/routes
# Edit payments.js, appointments.js, auth.js, users.js, services.js

# Bước 2: Test endpoints
curl http://localhost:5000/api/payments
curl http://localhost:5000/api/appointments

# Bước 3: Create remaining modules
# Copy pattern từ existing controllers/services
```

## 📝 Notes

- JWT_SECRET nên đặt trong `.env`
- VNPay config cần check credentials
- Smart assignment algorithm có thể optimize thêm
- Cần thêm middleware cho authentication
- Cần thêm input validation (express-validator)
