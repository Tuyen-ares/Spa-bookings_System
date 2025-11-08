# Phân Tích Chi Tiết Cấu Trúc Project - Anh Thơ Spa

## 📋 Tổng Quan Project

Đây là một hệ thống quản lý đặt lịch spa full-stack với:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express.js + Sequelize ORM
- **Database**: MySQL
- **Kiến trúc**: 3-portal (Client, Admin, Staff)

---

## 🗂️ Cấu Trúc Thư Mục và Vai Trò

### 1. **`/backend`** - ⭐⭐⭐ QUAN TRỌNG NHẤT (Backend API Server)

**Vai trò**: Đây là trái tim của hệ thống, xử lý tất cả logic nghiệp vụ, kết nối database, và cung cấp API cho frontend.

#### Các file/thư mục quan trọng:

**`server.js`** - File khởi động server
- Khởi tạo Express server
- Cấu hình CORS, middleware
- Đồng bộ database với Sequelize
- Đăng ký tất cả các routes API
- Chạy trên port 3001

**`/config/database.js`** - Cấu hình database
- Kết nối MySQL qua Sequelize
- Định nghĩa tất cả models
- Thiết lập các quan hệ (associations) giữa các bảng
- Chứa helper functions (tier upgrade, spending calculation)

**`/models/`** - Định nghĩa database models
- `User.js` - Model người dùng (Admin, Staff, Customer)
- `Service.js` - Model dịch vụ spa
- `Appointment.js` - Model đặt lịch
- `Payment.js` - Model thanh toán
- `Promotion.js` - Model khuyến mãi
- `Wallet.js` - Model ví điểm
- `Staff.js`, `Customer.js` - Profile mở rộng
- `Review.js` - Model đánh giá
- Và nhiều models khác...

**`/routes/`** - Định nghĩa API endpoints
- `auth.js` - Xác thực (login, register)
- `users.js` - Quản lý người dùng
- `services.js` - Quản lý dịch vụ
- `appointments.js` - Quản lý đặt lịch
- `payments.js` - Quản lý thanh toán
- `staff.js` - API cho staff
- `promotions.js` - Quản lý khuyến mãi
- `reviews.js` - Quản lý đánh giá
- Và các routes khác...

**`/utils/auth.js`** - Tiện ích xác thực
- JWT token verification
- Middleware bảo vệ routes

**`package.json`** - Dependencies backend
- Express, Sequelize, MySQL2
- bcryptjs (mã hóa password)
- jsonwebtoken (JWT)
- cors (Cross-Origin)

---

### 2. **`/client`** - ⭐⭐⭐ QUAN TRỌNG (Giao diện khách hàng)

**Vai trò**: Giao diện công khai cho khách hàng đặt lịch, xem dịch vụ, quản lý profile.

#### Các file/thư mục quan trọng:

**`/pages/`** - Các trang chính
- `HomePage.tsx` - Trang chủ, hiển thị dịch vụ nổi bật
- `ServicesListPage.tsx` - Danh sách tất cả dịch vụ
- `ServiceDetailPage.tsx` - Chi tiết dịch vụ
- `BookingPage.tsx` - Trang đặt lịch
- `AppointmentsPage.tsx` - Lịch sử đặt lịch của khách hàng
- `ProfilePage.tsx` - Trang cá nhân, ví điểm, lịch sử
- `LoginPage.tsx` - Đăng nhập
- `RegisterPage.tsx` - Đăng ký
- `PromotionsPage.tsx` - Trang khuyến mãi
- `QAPage.tsx` - Câu hỏi thường gặp
- `ContactPage.tsx` - Liên hệ

**`/components/`** - Components tái sử dụng
- `Header.tsx` - Header với navigation
- `Footer.tsx` - Footer
- `Chatbot.tsx` - Chatbot AI (Gemini)
- `ServiceCard.tsx` - Card hiển thị dịch vụ
- `PromotionCard.tsx` - Card khuyến mãi
- `ClientProfileModal.tsx` - Modal xem profile khách hàng

**`/services/`** - Services giao tiếp với API
- `apiService.ts` - ⭐ QUAN TRỌNG NHẤT - Tất cả API calls
  - Functions: `login()`, `register()`, `getServices()`, `createAppointment()`, etc.
  - Xử lý authentication headers
  - Error handling
- `chatbotService.ts` - Service cho chatbot
- `geminiService.ts` - Tích hợp Google Gemini AI

---

### 3. **`/admin`** - ⭐⭐⭐ QUAN TRỌNG (Giao diện quản trị)

**Vai trò**: Dashboard quản trị để quản lý toàn bộ hệ thống.

#### Các file/thư mục quan trọng:

**`/pages/`** - Các trang quản trị
- `OverviewPage.tsx` - Dashboard tổng quan, thống kê
- `UsersPage.tsx` - Quản lý người dùng (Admin, Staff, Customer)
- `ServicesPage.tsx` - Quản lý dịch vụ (CRUD)
- `AppointmentsPage.tsx` - Quản lý tất cả đặt lịch
- `PaymentsPage.tsx` - Quản lý thanh toán
- `StaffPage.tsx` - Quản lý nhân viên
- `PromotionsPage.tsx` - Quản lý khuyến mãi
- `ReportsPage.tsx` - Báo cáo, thống kê
- `MarketingPage.tsx` - Marketing tools
- `LoyaltyShopPage.tsx` - Quản lý cửa hàng đổi điểm
- `ContentPage.tsx` - Quản lý nội dung, tin tức nội bộ
- `JobManagementPage.tsx` - Quản lý công việc cho staff
- `SettingsPage.tsx` - Cài đặt hệ thống

**`/components/`** - Components admin
- `AdminLayout.tsx` - Layout chính với sidebar
- `AdminHeader.tsx` - Header admin
- `Sidebar.tsx` - Sidebar navigation
- `AddEditServiceModal.tsx` - Modal thêm/sửa dịch vụ
- `AddEditPromotionModal.tsx` - Modal thêm/sửa khuyến mãi
- `AddEditTaskModal.tsx` - Modal quản lý task
- `AssignScheduleModal.tsx` - Modal phân công lịch
- Và nhiều modals khác...

---

### 4. **`/staff`** - ⭐⭐⭐ QUAN TRỌNG (Giao diện nhân viên)

**Vai trò**: Portal cho nhân viên quản lý lịch làm việc, khách hàng, báo cáo.

#### Các file/thư mục quan trọng:

**`/pages/`** - Các trang staff
- `StaffDashboardPage.tsx` - Dashboard nhân viên
- `StaffSchedulePage.tsx` - Quản lý lịch làm việc
- `StaffAppointmentsPage.tsx` - Lịch hẹn của nhân viên
- `MyTasksPage.tsx` - Nhiệm vụ được giao
- `MyClientsPage.tsx` - Danh sách khách hàng
- `StaffTreatmentProgressPage.tsx` - Theo dõi tiến trình điều trị
- `StaffCustomerInteractionPage.tsx` - Tương tác với khách hàng
- `StaffRewardsPage.tsx` - Phần thưởng, KPI
- `StaffUpsellingPage.tsx` - Bán thêm sản phẩm/dịch vụ
- `StaffPersonalReportsPage.tsx` - Báo cáo cá nhân
- `StaffNotificationsPage.tsx` - Thông báo
- `StaffProfilePage.tsx` - Profile nhân viên
- `StaffTransactionHistoryPage.tsx` - Lịch sử giao dịch

**`/components/`** - Components staff
- `StaffLayout.tsx` - Layout chính
- `StaffHeader.tsx` - Header
- `StaffSidebar.tsx` - Sidebar
- `DayDetailsModal.tsx` - Modal chi tiết ngày
- `ClientProfileModal.tsx` - Modal profile khách hàng

---

### 5. **`/components`** - ⭐⭐ Components dùng chung

**Vai trò**: Components được sử dụng bởi nhiều phần của ứng dụng.

**Các file quan trọng:**
- `ProtectedRoute.tsx` - Route bảo vệ, yêu cầu đăng nhập
- `Header.tsx`, `Footer.tsx` - Header/Footer chung
- `ServiceCard.tsx` - Card dịch vụ
- `Chatbot.tsx` - Chatbot AI

---

### 6. **`/services`** - ⭐⭐ Services dùng chung

**Vai trò**: Services được chia sẻ giữa các phần của ứng dụng.

**Các file:**
- `geminiService.ts` - Service tích hợp Google Gemini AI

---

### 7. **`/shared`** - ⭐ Icons và utilities

**Vai trò**: Tài nguyên dùng chung.

**Các file:**
- `icons.tsx` - Định nghĩa các icon components

---

### 8. **`/public`** - ⭐ Tài nguyên tĩnh

**Vai trò**: Hình ảnh, assets tĩnh.

**Cấu trúc:**
- `/img/general/` - Hình ảnh chung
- `/img/services/` - Hình ảnh dịch vụ
- `/img/promotions/` - Hình ảnh khuyến mãi
- `/img/staff/` - Hình ảnh nhân viên
- `/img/users/` - Hình ảnh người dùng

---

### 9. **Root Files** - ⭐⭐⭐ QUAN TRỌNG

**`App.tsx`** - ⭐⭐⭐ File quan trọng nhất của frontend
- Component gốc của ứng dụng
- Định nghĩa tất cả routes (React Router)
- Quản lý global state (users, services, appointments, etc.)
- Xử lý authentication, navigation
- Phân phối data cho các pages

**`index.tsx`** - Entry point
- Render App component vào DOM

**`types.ts`** - ⭐⭐⭐ Định nghĩa TypeScript types
- Tất cả interfaces, types cho toàn bộ project
- User, Service, Appointment, Payment, etc.
- Rất quan trọng cho type safety

**`constants.tsx`** - Constants dùng chung
- Màu sắc, configs

**`vite.config.ts`** - Cấu hình Vite
- Port, aliases, environment variables

**`package.json`** - Dependencies frontend
- React, React Router, TypeScript, Vite
- Google Gemini AI

**`tsconfig.json`** - Cấu hình TypeScript

**`db.txt`** - ⭐⭐⭐ Script SQL khởi tạo database
- Tạo database, tables
- Insert sample data

---

## 🎯 Thư Mục Quan Trọng Nhất Để Sinh Viên Code

### Top 3 Thư Mục Quan Trọng Nhất:

1. **`/backend`** - ⭐⭐⭐⭐⭐
   - **Lý do**: Chứa toàn bộ logic nghiệp vụ, API, database
   - **Sinh viên sẽ code**: Routes, Models, Business logic
   - **File quan trọng nhất**: `server.js`, `/routes/*.js`, `/models/*.js`

2. **`/client`** - ⭐⭐⭐⭐⭐
   - **Lý do**: Giao diện chính cho khách hàng
   - **Sinh viên sẽ code**: Pages, Components, UI/UX
   - **File quan trọng nhất**: `/pages/*.tsx`, `/services/apiService.ts`

3. **`/admin`** - ⭐⭐⭐⭐
   - **Lý do**: Dashboard quản trị, quản lý hệ thống
   - **Sinh viên sẽ code**: Admin pages, CRUD operations
   - **File quan trọng nhất**: `/pages/*.tsx`, `/components/*.tsx`

---

## 📝 Chi Tiết File Quan Trọng Trong Các Thư Mục Chính

### `/backend/routes/` - API Endpoints

**`auth.js`**
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- Xử lý JWT tokens

**`appointments.js`**
- `GET /api/appointments` - Lấy danh sách đặt lịch
- `POST /api/appointments` - Tạo đặt lịch mới
- `PUT /api/appointments/:id` - Cập nhật đặt lịch
- `DELETE /api/appointments/:id` - Xóa đặt lịch

**`services.js`**
- CRUD operations cho dịch vụ
- Lọc, tìm kiếm dịch vụ

**`users.js`**
- Quản lý người dùng
- Cập nhật profile
- Quản lý tiers

**`payments.js`**
- Xử lý thanh toán
- Lịch sử giao dịch

### `/client/pages/` - Client Pages

**`BookingPage.tsx`**
- Form đặt lịch
- Chọn dịch vụ, nhân viên, thời gian
- Áp dụng khuyến mãi

**`ProfilePage.tsx`**
- Xem/sửa thông tin cá nhân
- Ví điểm, lịch sử giao dịch
- Đánh giá dịch vụ

**`ServiceDetailPage.tsx`**
- Chi tiết dịch vụ
- Đánh giá, hình ảnh
- Nút đặt lịch

### `/admin/pages/` - Admin Pages

**`OverviewPage.tsx`**
- Dashboard với charts, stats
- Tổng quan hệ thống

**`ServicesPage.tsx`**
- CRUD dịch vụ
- Upload hình ảnh
- Quản lý categories

**`AppointmentsPage.tsx`**
- Xem tất cả đặt lịch
- Duyệt/hủy đặt lịch
- Phân công nhân viên

### `/client/services/apiService.ts` - ⭐⭐⭐ Rất Quan Trọng

**Vai trò**: Là cầu nối giữa frontend và backend, tất cả API calls đều đi qua đây.

**Các functions chính:**
- `login()`, `register()` - Authentication
- `getServices()`, `getServiceById()` - Dịch vụ
- `createAppointment()`, `getAppointments()` - Đặt lịch
- `getUserWallet()`, `redeemVoucher()` - Ví điểm
- `getPromotions()`, `applyPromotion()` - Khuyến mãi
- Và nhiều functions khác...

---

## 🔄 Luồng Dữ Liệu

1. **User Action** → Frontend Component
2. **Component** → `apiService.ts` (API call)
3. **apiService** → Backend Route (`/routes/*.js`)
4. **Route** → Model (`/models/*.js`)
5. **Model** → Database (MySQL)
6. **Response** ← Database → Model → Route → apiService → Component → UI

---

## 💡 Lưu Ý Cho Sinh Viên

1. **Bắt đầu từ đâu?**
   - Hiểu `App.tsx` để nắm cấu trúc routing
   - Đọc `types.ts` để hiểu data structures
   - Xem `apiService.ts` để hiểu cách gọi API
   - Nghiên cứu một route backend để hiểu flow

2. **Khi thêm tính năng mới:**
   - Tạo model trong `/backend/models/`
   - Tạo route trong `/backend/routes/`
   - Thêm function trong `apiService.ts`
   - Tạo component/page trong frontend
   - Thêm route trong `App.tsx`

3. **Database:**
   - Chạy script `db.txt` để khởi tạo database
   - Models tự động sync với database qua Sequelize

4. **Authentication:**
   - JWT tokens lưu trong localStorage
   - Protected routes kiểm tra token
   - Backend verify token trong middleware

---

## 📊 Tóm Tắt

| Thư Mục | Mức Độ Quan Trọng | Vai Trò Chính | Sinh Viên Sẽ Code |
|---------|------------------|---------------|-------------------|
| `/backend` | ⭐⭐⭐⭐⭐ | API, Database, Business Logic | Routes, Models, Logic |
| `/client` | ⭐⭐⭐⭐⭐ | Giao diện khách hàng | Pages, Components, UI |
| `/admin` | ⭐⭐⭐⭐ | Dashboard quản trị | Admin Pages, CRUD |
| `/staff` | ⭐⭐⭐⭐ | Portal nhân viên | Staff Pages, Features |
| `/components` | ⭐⭐ | Components chung | Shared Components |
| Root files | ⭐⭐⭐⭐⭐ | Cấu hình, routing | App.tsx, types.ts |

---

**Kết luận**: Sinh viên nên tập trung vào `/backend`, `/client`, và `/admin` để hiểu và phát triển hệ thống. File `App.tsx`, `types.ts`, và `apiService.ts` là những file quan trọng nhất cần nắm vững.

