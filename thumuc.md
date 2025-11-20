# PHÂN TÍCH CẤU TRÚC THƯ MỤC DỰ ÁN ANH THƠ SPA

## 📋 TỔNG QUAN DỰ ÁN

Dự án **Anh Thơ Spa Management System** là một hệ thống quản lý spa toàn diện với kiến trúc Full-Stack:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Sequelize ORM
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Token)

---

## 🗂️ CẤU TRÚC THƯ MỤC CHÍNH

### 1. 📁 `/backend` - Backend Server (Node.js/Express)

**Chức năng**: Chứa toàn bộ logic backend, API endpoints, models, và database migrations.

#### 1.1. `/backend/config/` - Cấu hình hệ thống
- **`database.js`**: 
  - **Nhiệm vụ**: Cấu hình kết nối Sequelize với MySQL, định nghĩa models và associations
  - **Quan trọng**: File này là trung tâm của database layer, quản lý tất cả relationships giữa các models
  - **Chức năng chính**:
    - Khởi tạo Sequelize connection
    - Import và định nghĩa tất cả models (User, Service, Appointment, Payment, etc.)
    - Thiết lập associations (One-to-One, One-to-Many, Many-to-Many)
    - Helper functions (calculateUserTotalSpending, checkAndUpgradeTier)
  
- **`vnpay.js`**: 
  - **Nhiệm vụ**: Cấu hình tích hợp VNPay payment gateway
  - **Quan trọng**: Xử lý thanh toán trực tuyến qua VNPay

#### 1.2. `/backend/models/` - Database Models (Sequelize)
**Chức năng**: Định nghĩa cấu trúc dữ liệu và schema cho từng bảng trong database.

**Các file quan trọng**:
- **`User.js`**: 
  - Model cho bảng users (Admin, Staff, Client)
  - Fields: id, name, email, password, phone, role, status, etc.
  - **Quan trọng**: Là model cốt lõi, liên kết với hầu hết các models khác
  
- **`Appointment.js`**: 
  - Model cho lịch hẹn của khách hàng
  - Fields: serviceId, userId, therapistId, date, time, status, paymentStatus
  - **Quan trọng**: Quản lý toàn bộ lịch hẹn, liên kết User (client), User (therapist), Service
  
- **`Service.js`**: 
  - Model cho dịch vụ spa
  - Fields: name, description, price, discountPercent, duration, categoryId
  - **Quan trọng**: Lưu trữ thông tin dịch vụ, có virtual field `discountPrice` tự động tính toán
  
- **`Payment.js`**: 
  - Model cho thanh toán
  - Fields: userId, appointmentId, amount, method, status
  - **Quan trọng**: Quản lý tất cả giao dịch thanh toán
  
- **`TreatmentCourse.js`**: 
  - Model cho liệu trình điều trị
  - Fields: userId, serviceId, totalSessions, completedSessions, status
  - **Quan trọng**: Quản lý các gói liệu trình nhiều buổi
  
- **`Wallet.js`**: 
  - Model cho ví điện tử và điểm thưởng
  - Fields: userId, balance, points, pointsHistory (JSON)
  - **Quan trọng**: Quản lý số dư và điểm tích lũy của khách hàng
  
- **`Promotion.js`**: Model cho mã khuyến mãi
- **`Review.js`**: Model cho đánh giá dịch vụ
- **`Room.js`**: Model cho phòng điều trị
- **`Notification.js`**: Model cho thông báo nội bộ
- **`StaffShift.js`**: Model cho ca làm việc của nhân viên
- **`StaffTask.js`**: Model cho công việc được giao cho nhân viên
- **`TreatmentPackage.js`**: Model cho gói điều trị (template)
- **`TreatmentSession.js`**: Model cho từng buổi trong liệu trình

#### 1.3. `/backend/migrations/` - Database Migrations
**Chức năng**: Quản lý thay đổi schema database theo version control.

**Các migration quan trọng**:
- **`20250113000001-create-users.js`**: Tạo bảng users
- **`20250113000002-create-rooms.js`**: Tạo bảng rooms
- **`20250113000003-create-service-categories.js`**: Tạo bảng service_categories
- **`20250113000004-create-services.js`**: Tạo bảng services
- **`20250113000005-create-appointments.js`**: Tạo bảng appointments với foreign keys
- **`20250113000006-create-payments.js`**: Tạo bảng payments
- **`20250113000010-create-wallets.js`**: Tạo bảng wallets
- **`20250113000012-create-treatment-courses.js`**: Tạo bảng treatment_courses
- **`20250114000002-create-treatment-packages.js`**: Tạo bảng treatment_packages

**Quan trọng**: Migrations đảm bảo database schema được version control và có thể rollback.

#### 1.4. `/backend/routes/` - API Routes
**Chức năng**: Định nghĩa các API endpoints và routing.

**Các file quan trọng**:
- **`auth.js`**: 
  - Routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/change-password`
  - **Quan trọng**: Xử lý authentication và authorization
  
- **`users.js`**: 
  - Routes: CRUD operations cho users
  - **Quan trọng**: Quản lý thông tin người dùng
  
- **`services.js`**: 
  - Routes: CRUD operations cho services
  - **Quan trọng**: Quản lý dịch vụ spa
  
- **`appointments.js`**: 
  - Routes: CRUD operations cho appointments
  - **Quan trọng**: Quản lý lịch hẹn
  
- **`payments.js`**: 
  - Routes: Xử lý thanh toán, tích hợp VNPay
  - **Quan trọng**: Xử lý tất cả giao dịch thanh toán
  
- **`treatment-courses.js`**: 
  - Routes: Quản lý liệu trình điều trị
  - **Quan trọng**: Quản lý các gói liệu trình
  
- **`wallets.js`**: 
  - Routes: Quản lý ví và điểm thưởng
  - **Quan trọng**: Xử lý điểm tích lũy và số dư
  
- **`notifications.js`**: Routes cho thông báo
- **`rooms.js`**: Routes cho quản lý phòng
- **`staff.js`**: Routes cho nhân viên
- **`reviews.js`**: Routes cho đánh giá

#### 1.5. `/backend/controllers/` - Business Logic Controllers
**Chức năng**: Chứa business logic, xử lý request từ routes và gọi services.

**Các file quan trọng**:
- **`authController.js`**: 
  - Xử lý login, register, change password
  - Validation input, generate JWT tokens
  - **Quan trọng**: Bảo mật authentication
  
- **`userController.js`**: 
  - CRUD operations cho users
  - **Quan trọng**: Quản lý người dùng
  
- **`appointmentController.js`**: 
  - Xử lý booking, cancel, update appointments
  - **Quan trọng**: Logic nghiệp vụ cho lịch hẹn
  
- **`serviceController.js`**: 
  - CRUD operations cho services
  - **Quan trọng**: Quản lý dịch vụ
  
- **`paymentController.js`**: 
  - Xử lý thanh toán, tích hợp VNPay
  - **Quan trọng**: Xử lý giao dịch tài chính

#### 1.6. `/backend/services/` - Service Layer
**Chức năng**: Tách biệt business logic khỏi controllers, xử lý database operations.

**Các file**:
- **`authService.js`**: Logic authentication (hash password, verify token)
- **`userService.js`**: Business logic cho users
- **`appointmentService.js`**: Business logic cho appointments
- **`serviceService.js`**: Business logic cho services
- **`paymentService.js`**: Business logic cho payments

**Quan trọng**: Service layer giúp code dễ maintain và test.

#### 1.7. `/backend/utils/` - Utility Functions
**Chức năng**: Các hàm tiện ích dùng chung.

- **`auth.js`**: 
  - JWT token generation và verification
  - Middleware authentication
  - **Quan trọng**: Bảo mật API endpoints

#### 1.8. `/backend/seeders/` - Database Seeders
**Chức năng**: Tạo dữ liệu mẫu cho development và testing.

**Các seeder**:
- **`20250109100001-seed-users.js`**: Seed users (Admin, Staff, Clients)
- **`20250109100002-seed-wallets.js`**: Seed wallets
- **`20250109100003-seed-service-categories.js`**: Seed service categories
- **`20250109100004-seed-services.js`**: Seed services
- **`20250109100005-seed-appointments.js`**: Seed appointments
- **`20250109100006-seed-payments.js`**: Seed payments
- **`20250109100007-seed-promotions.js`**: Seed promotions
- **`20250109100008-seed-reviews.js`**: Seed reviews

**Quan trọng**: Giúp setup database nhanh chóng với dữ liệu test.

#### 1.9. `/backend/jobs/` - Scheduled Jobs (Cron)
**Chức năng**: Chạy các tác vụ định kỳ.

- **`treatmentCourseCron.js`**: 
  - Kiểm tra và cập nhật trạng thái treatment courses (expired, completed)
  - Chạy hàng ngày lúc 9:00 AM
  - **Quan trọng**: Tự động quản lý lifecycle của liệu trình

#### 1.10. `/backend/scripts/` - Utility Scripts
**Chức năng**: Các script hỗ trợ development và maintenance.

- **`run-migrations.js`**: Chạy migrations
- **`recreate-database.js`**: Tạo lại database
- **`check-migration-status.js`**: Kiểm tra trạng thái migrations
- Các file SQL: Scripts SQL để fix hoặc update database

#### 1.11. `/backend/server.js` - Entry Point
**Chức năng**: File chính khởi động Express server.

**Nhiệm vụ**:
- Load environment variables
- Cấu hình middleware (CORS, JSON parser)
- Sync database với Sequelize
- Đăng ký tất cả routes
- Khởi động server trên port 3001
- Schedule cron jobs

**Quan trọng**: File này là điểm vào của toàn bộ backend application.

---

### 2. 📁 `/frontend` - Frontend Application (React/TypeScript)

**Chức năng**: Giao diện người dùng, tương tác với backend API.

#### 2.1. `/frontend/client/` - Client Portal
**Chức năng**: Giao diện cho khách hàng.

**`/frontend/client/pages/`**:
- **`HomePage.tsx`**: 
  - Trang chủ, hiển thị services và promotions
  - **Quan trọng**: Landing page của website
  
- **`ServicesListPage.tsx`**: 
  - Danh sách tất cả dịch vụ
  - **Quan trọng**: Browse services
  
- **`ServiceDetailPage.tsx`**: 
  - Chi tiết dịch vụ, booking form
  - **Quan trọng**: Trang đặt lịch
  
- **`BookingPage.tsx`**: 
  - Trang đặt lịch hẹn
  - **Quan trọng**: Core booking functionality
  
- **`AppointmentsPage.tsx`**: 
  - Danh sách lịch hẹn của khách hàng
  - **Quan trọng**: Quản lý appointments
  
- **`ProfilePage.tsx`**: 
  - Thông tin cá nhân, lịch sử thanh toán, điểm tích lũy
  - **Quan trọng**: User profile management
  
- **`TreatmentPackagesPage.tsx`**: 
  - Danh sách gói điều trị
  - **Quan trọng**: Browse treatment packages
  
- **`TreatmentCourseDetailPage.tsx`**: 
  - Chi tiết liệu trình đã đăng ký
  - **Quan trọng**: Track treatment progress
  
- **`PromotionsPage.tsx`**: 
  - Danh sách khuyến mãi
  - **Quan trọng**: Marketing và promotions
  
- **`LoginPage.tsx`**: Đăng nhập
- **`RegisterPage.tsx`**: Đăng ký
- **`PaymentSuccessPage.tsx`**: Trang thành công sau thanh toán
- **`PaymentFailedPage.tsx`**: Trang thất bại thanh toán

**`/frontend/client/components/`**:
- **`Header.tsx`**: Header navigation
- **`Footer.tsx`**: Footer
- **`Chatbot.tsx`**: AI chatbot hỗ trợ khách hàng
- **`ServiceCard.tsx`**: Card hiển thị service
- **`PromotionCard.tsx`**: Card hiển thị promotion
- **`NotificationBell.tsx`**: Bell icon hiển thị notifications

**`/frontend/client/services/`**:
- **`apiService.ts`**: 
  - Tất cả API calls đến backend
  - Functions: login, register, getServices, getAppointments, etc.
  - **Quan trọng**: Layer giao tiếp với backend
  
- **`chatbotService.ts`**: Service cho chatbot
- **`geminiService.ts`**: Tích hợp Google Gemini AI

#### 2.2. `/frontend/admin/` - Admin Portal
**Chức năng**: Giao diện quản trị cho Admin.

**`/frontend/admin/pages/`**:
- **`OverviewPage.tsx`**: 
  - Dashboard tổng quan (statistics, charts)
  - **Quan trọng**: Admin dashboard
  
- **`UsersPage.tsx`**: 
  - Quản lý users (Admin, Staff, Clients)
  - **Quan trọng**: User management
  
- **`ServicesPage.tsx`**: 
  - CRUD operations cho services
  - **Quan trọng**: Service management
  
- **`AppointmentsPage.tsx`**: 
  - Quản lý tất cả appointments
  - **Quan trọng**: Appointment management
  
- **`PaymentsPage.tsx`**: 
  - Quản lý payments
  - **Quan trọng**: Financial management
  
- **`StaffPage.tsx`**: 
  - Quản lý nhân viên
  - **Quan trọng**: Staff management
  
- **`JobManagementPage.tsx`**: 
  - Quản lý công việc (tasks) cho nhân viên
  - **Quan trọng**: Task assignment
  
- **`RoomsPage.tsx`**: 
  - Quản lý phòng điều trị
  - **Quan trọng**: Room management
  
- **`TreatmentCoursesPage.tsx`**: 
  - Quản lý liệu trình điều trị
  - **Quan trọng**: Treatment course management
  
- **`PromotionsPage.tsx`**: 
  - Quản lý promotions
  - **Quan trọng**: Marketing management

**`/frontend/admin/components/`**:
- **`AdminLayout.tsx`**: Layout cho admin portal
- **`Sidebar.tsx`**: Navigation sidebar
- **`AdminHeader.tsx`**: Header với user info
- **`AddEditServiceModal.tsx`**: Modal thêm/sửa service
- **`AddEditPromotionModal.tsx`**: Modal thêm/sửa promotion
- **`AssignScheduleModal.tsx`**: Modal gán lịch cho nhân viên

#### 2.3. `/frontend/staff/` - Staff Portal
**Chức năng**: Giao diện cho nhân viên.

**`/frontend/staff/pages/`**:
- **`StaffDashboardPage.tsx`**: 
  - Dashboard nhân viên (appointments hôm nay, KPI)
  - **Quan trọng**: Staff overview
  
- **`StaffSchedulePage.tsx`**: 
  - Lịch làm việc của nhân viên
  - **Quan trọng**: Schedule management
  
- **`StaffAppointmentsPage.tsx`**: 
  - Danh sách appointments được gán cho nhân viên
  - **Quan trọng**: Appointment handling
  
- **`MyTasksPage.tsx`**: 
  - Công việc được giao
  - **Quan trọng**: Task management
  
- **`MyClientsPage.tsx`**: 
  - Danh sách khách hàng
  - **Quan trọng**: Client management
  
- **`StaffProfilePage.tsx`**: Profile nhân viên

**`/frontend/staff/components/`**:
- **`StaffLayout.tsx`**: Layout cho staff portal
- **`StaffSidebar.tsx`**: Navigation sidebar
- **`StaffHeader.tsx`**: Header

#### 2.4. `/frontend/components/` - Shared Components
**Chức năng**: Components dùng chung cho cả client, admin, staff.

- **`ProtectedRoute.tsx`**: 
  - Route protection, kiểm tra authentication và authorization
  - **Quan trọng**: Bảo mật routes
  
- **`Header.tsx`**: Shared header
- **`Footer.tsx`**: Shared footer
- **`ServiceCard.tsx`**: Shared service card
- **`Chatbot.tsx`**: Shared chatbot

#### 2.5. `/frontend/shared/` - Shared Utilities
**Chức năng**: Utilities và helpers dùng chung.

- **`dateUtils.ts`**: Date formatting utilities
- **`icons.tsx`**: Icon components

#### 2.6. `/frontend/services/` - Frontend Services
**Chức năng**: Services cho frontend (không phải API calls).

- **`geminiService.ts`**: Google Gemini AI integration

#### 2.7. `/frontend/App.tsx` - Main Application Component
**Chức năng**: Root component, định nghĩa routing và global state.

**Nhiệm vụ**:
- Setup React Router
- Quản lý global state (currentUser, allServices, allAppointments, etc.)
- Định nghĩa tất cả routes (client, admin, staff)
- Handle authentication flow
- Fetch initial data

**Quan trọng**: File này là trung tâm của frontend application.

#### 2.8. `/frontend/types.ts` - TypeScript Type Definitions
**Chức năng**: Định nghĩa tất cả TypeScript interfaces và types.

**Các types quan trọng**:
- `User`, `Service`, `Appointment`, `Payment`, `Wallet`
- `Promotion`, `Review`, `TreatmentCourse`
- `UserRole`, `StaffRole`, `PaymentMethod`, etc.

**Quan trọng**: Đảm bảo type safety cho toàn bộ frontend.

---

### 3. 📁 `/docs` - Documentation
**Chức năng**: Tài liệu hướng dẫn và documentation.

**Các file quan trọng**:
- **`database.md`**: Database documentation
- **`MVC_ARCHITECTURE.md`**: Kiến trúc MVC
- **`DATABASE_SETUP.md`**: Hướng dẫn setup database
- **`GEMINI_SETUP.md`**: Hướng dẫn setup Gemini AI
- Các file FIX_*.md: Hướng dẫn fix các lỗi thường gặp

---

## 🔑 CÁC FILE QUAN TRỌNG NHẤT

### Backend:
1. **`backend/server.js`**: Entry point, khởi động server
2. **`backend/config/database.js`**: Database configuration và associations
3. **`backend/models/User.js`**: Core user model
4. **`backend/routes/auth.js`**: Authentication routes
5. **`backend/controllers/authController.js`**: Authentication logic

### Frontend:
1. **`frontend/App.tsx`**: Root component, routing
2. **`frontend/types.ts`**: Type definitions
3. **`frontend/client/services/apiService.ts`**: API communication layer
4. **`frontend/client/pages/BookingPage.tsx`**: Core booking functionality
5. **`frontend/admin/pages/OverviewPage.tsx`**: Admin dashboard

---

## 📊 KIẾN TRÚC TỔNG QUAN

```
Spa-bookings/
├── backend/              # Backend API Server
│   ├── config/          # Configuration files
│   ├── models/          # Sequelize models
│   ├── migrations/      # Database migrations
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic controllers
│   ├── services/        # Service layer
│   ├── utils/           # Utility functions
│   ├── seeders/         # Database seeders
│   ├── jobs/            # Cron jobs
│   └── server.js        # Entry point
│
├── frontend/             # Frontend React App
│   ├── client/          # Client portal
│   ├── admin/           # Admin portal
│   ├── staff/           # Staff portal
│   ├── components/      # Shared components
│   ├── services/        # Frontend services
│   ├── shared/          # Shared utilities
│   ├── App.tsx          # Root component
│   └── types.ts         # TypeScript types
│
└── docs/                # Documentation
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Database**: Sử dụng MySQL với Sequelize ORM. Tất cả schema changes phải thông qua migrations.

2. **Authentication**: JWT-based authentication. Token được lưu trong localStorage.

3. **API Communication**: Frontend giao tiếp với backend qua REST API tại `http://localhost:3001/api`.

4. **Environment Variables**: Backend cần file `.env` với database credentials và API keys.

5. **Cron Jobs**: Treatment course status được tự động cập nhật hàng ngày lúc 9:00 AM.

6. **Payment Integration**: Tích hợp VNPay cho thanh toán trực tuyến.

7. **AI Integration**: Sử dụng Google Gemini AI cho chatbot.

---

## 🎯 KẾT LUẬN

Dự án được tổ chức theo kiến trúc MVC (Model-View-Controller) với sự tách biệt rõ ràng giữa:
- **Backend**: API server, business logic, database
- **Frontend**: UI components, user interactions, API calls

Mỗi thư mục có vai trò và nhiệm vụ cụ thể, giúp code dễ maintain và scale.

