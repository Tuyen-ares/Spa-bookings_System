# CHƯƠNG 4: CÀI ĐẶT HỆ THỐNG

## 4.1. TỔNG QUAN HỆ THỐNG

Hệ thống quản lý đặt lịch spa "Anh Thơ Spa" được xây dựng theo mô hình kiến trúc 3 lớp (Three-tier Architecture) với các thành phần chính:

- **Frontend**: React 18 với TypeScript, sử dụng Vite làm build tool
- **Backend**: Node.js với Express.js framework
- **Database**: MySQL 8.0 với Sequelize ORM

Hệ thống hỗ trợ 3 loại người dùng: Admin, Nhân viên (Staff) và Khách hàng (Client), mỗi người dùng có giao diện và quyền hạn riêng biệt.

---

## 4.2. YÊU CẦU HỆ THỐNG

### 4.2.1. Yêu cầu phần cứng

#### Máy chủ phát triển (Development Server)
- **CPU**: Tối thiểu 2 core, khuyến nghị 4 core trở lên
- **RAM**: Tối thiểu 4GB, khuyến nghị 8GB trở lên
- **Ổ cứng**: Tối thiểu 10GB dung lượng trống
- **Kết nối mạng**: Có kết nối Internet để tải dependencies và truy cập API

#### Máy chủ sản xuất (Production Server)
- **CPU**: Tối thiểu 4 core
- **RAM**: Tối thiểu 8GB, khuyến nghị 16GB trở lên
- **Ổ cứng**: Tối thiểu 50GB dung lượng trống (SSD khuyến nghị)
- **Kết nối mạng**: Băng thông tối thiểu 100Mbps

### 4.2.2. Yêu cầu phần mềm

#### Phần mềm cần thiết

**1. Node.js**
- **Phiên bản**: 18.x trở lên
- **Địa chỉ tải**: https://nodejs.org/
- **Kiểm tra phiên bản**:
```bash
node --version
# Kết quả mong đợi: v18.x.x hoặc cao hơn
```

**2. npm (Node Package Manager)**
- **Phiên bản**: 9.x trở lên (tự động cài cùng Node.js)
- **Kiểm tra phiên bản**:
```bash
npm --version
# Kết quả mong đợi: 9.x.x hoặc cao hơn
```

**3. MySQL Database Server**
- **Phiên bản**: MySQL 8.0 trở lên hoặc MariaDB 10.5+
- **Địa chỉ tải**: https://dev.mysql.com/downloads/mysql/
- **Kiểm tra phiên bản**:
```bash
mysql --version
# Kết quả mong đợi: mysql Ver 8.0.x hoặc cao hơn
```

**4. Git**
- **Phiên bản**: 2.x trở lên
- **Địa chỉ tải**: https://git-scm.com/
- **Sử dụng để**: Clone repository và quản lý phiên bản code

**5. Code Editor (Tùy chọn)**
- Visual Studio Code (khuyến nghị)
- Hoặc bất kỳ IDE nào hỗ trợ JavaScript/TypeScript

#### Hệ điều hành hỗ trợ

- **Windows**: Windows 10/11 (64-bit)
- **Linux**: Ubuntu 20.04+, Debian 10+, CentOS 8+
- **macOS**: macOS 10.15+ (Catalina trở lên)

---

## 4.3. MÔI TRƯỜNG PHÁT TRIỂN

### 4.3.1. Cấu trúc dự án

Dự án được tổ chức theo cấu trúc monorepo với các thư mục chính:

```
Spa-bookings/
├── frontend/              # Ứng dụng Frontend
│   ├── admin/            # Trang Admin
│   ├── client/           # Trang Khách hàng
│   ├── staff/            # Trang Nhân viên
│   ├── components/       # Component dùng chung
│   ├── services/         # API service layer
│   ├── shared/           # Utilities và icons
│   ├── App.tsx           # Component chính
│   ├── vite.config.ts    # Cấu hình Vite
│   └── package.json      # Dependencies frontend
│
├── backend/              # Ứng dụng Backend
│   ├── controllers/      # Xử lý HTTP requests
│   ├── services/         # Business logic
│   ├── routes/           # Định nghĩa API routes
│   ├── models/           # Sequelize models
│   ├── migrations/       # Database migrations
│   ├── seeders/          # Dữ liệu mẫu
│   ├── config/           # File cấu hình
│   ├── utils/            # Utilities
│   ├── server.js         # Entry point
│   └── package.json      # Dependencies backend
│
└── docs/                 # Tài liệu
```

### 4.3.2. Công nghệ sử dụng

#### Frontend Stack
- **React 19.2.0**: Framework JavaScript cho giao diện người dùng
- **TypeScript 5.8.2**: Ngôn ngữ lập trình type-safe
- **Vite 6.2.0**: Build tool và development server
- **React Router 7.9.5**: Điều hướng (routing) trong ứng dụng
- **TailwindCSS**: Framework CSS utility-first (sử dụng thông qua inline styles)

#### Backend Stack
- **Node.js 18+**: Runtime environment
- **Express.js 4.19.2**: Web framework
- **Sequelize 6.37.7**: ORM (Object-Relational Mapping) cho MySQL
- **MySQL2 3.15.3**: Driver kết nối MySQL
- **JWT (jsonwebtoken 9.0.2)**: Xác thực người dùng
- **bcrypt 6.0.0**: Mã hóa mật khẩu
- **dotenv 16.4.5**: Quản lý biến môi trường

#### Các thư viện bổ trợ
- **VNPay 1.6.1**: Tích hợp thanh toán VNPay
- **Google Gemini AI 1.29.0**: Chatbot AI
- **Nodemailer 7.0.10**: Gửi email
- **node-cron 4.2.1**: Lên lịch tác vụ định kỳ
- **UUID 10.0.0**: Tạo ID duy nhất

---

## 4.4. CÀI ĐẶT VÀ CẤU HÌNH HỆ THỐNG

### 4.4.1. Bước 1: Clone repository

```bash
# Clone repository từ GitHub
git clone https://github.com/HOANGSUNSW/Spa-bookings.git

# Di chuyển vào thư mục dự án
cd Spa-bookings
```

### 4.4.2. Bước 2: Cài đặt Backend Dependencies

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt tất cả dependencies
npm install
```

**Thời gian cài đặt**: Khoảng 2-5 phút tùy vào tốc độ mạng

**Dependencies chính được cài đặt**:
- express, cors, dotenv
- sequelize, mysql2, sequelize-cli
- jsonwebtoken, bcrypt, bcryptjs
- @google/genai, nodemailer
- vnpay, uuid, axios
- node-cron

### 4.4.3. Bước 3: Cài đặt Frontend Dependencies

```bash
# Quay lại thư mục gốc và di chuyển vào frontend
cd ../frontend

# Cài đặt tất cả dependencies
npm install
```

**Thời gian cài đặt**: Khoảng 3-7 phút

**Dependencies chính được cài đặt**:
- react, react-dom
- react-router-dom
- typescript
- vite, @vitejs/plugin-react
- @google/genai
- uuid, qs, recharts

### 4.4.4. Bước 4: Cấu hình Database

#### 4.4.4.1. Khởi động MySQL Server

**Trên Windows (XAMPP)**:
1. Mở XAMPP Control Panel
2. Click nút "Start" cho MySQL service
3. Đảm bảo MySQL đang chạy (nút chuyển sang màu xanh)

**Trên Windows (MySQL Standalone)**:
1. Mở Services (nhấn Win + R, gõ `services.msc`)
2. Tìm service "MySQL" hoặc "MySQL80"
3. Click chuột phải → Start

**Trên Linux**:
```bash
sudo systemctl start mysql
# hoặc
sudo service mysql start
```

**Trên macOS**:
```bash
brew services start mysql
# hoặc
sudo /usr/local/mysql/support-files/mysql.server start
```

#### 4.4.4.2. Tạo Database

Đăng nhập vào MySQL:

```bash
mysql -u root -p
```

Nhập mật khẩu MySQL của bạn.

Tạo database:

```sql
CREATE DATABASE IF NOT EXISTS anhthospa_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

Kiểm tra database đã được tạo:

```sql
SHOW DATABASES;
```

Thoát MySQL:

```sql
EXIT;
```

#### 4.4.4.3. Tạo file cấu hình .env cho Backend

**Trên Windows (PowerShell)**:
```powershell
cd backend
Copy-Item env.example .env
```

**Trên Linux/Mac**:
```bash
cd backend
cp env.example .env
```

Mở file `.env` và cấu hình các biến môi trường:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=anhthospa_db

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret Key (tạo chuỗi ngẫu nhiên, ít nhất 32 ký tự)
JWT_SECRET=your_super_secret_jwt_key_change_in_production_2024

# Google Gemini API (lấy từ https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# VNPay Configuration (lấy từ VNPay merchant account)
VNP_TMN_CODE=your_vnpay_tmn_code
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5000/api/payments/vnpay-return

# Email Configuration (tùy chọn, cho chức năng gửi email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL (cho CORS)
FRONTEND_URL=http://localhost:3000
```

**Lưu ý quan trọng**:
- Thay `your_mysql_password` bằng mật khẩu MySQL thực tế của bạn
- Thay `your_super_secret_jwt_key_change_in_production_2024` bằng chuỗi bí mật ngẫu nhiên (khuyến nghị dùng ít nhất 32 ký tự)
- Để lấy Gemini API Key: https://makersuite.google.com/app/apikey
- Để lấy VNPay credentials: Đăng ký merchant account tại https://vnpay.vn/

### 4.4.5. Bước 5: Chạy Database Migrations

Migrations là các script tự động tạo và cập nhật cấu trúc database.

```bash
# Đảm bảo đang ở thư mục backend
cd backend

# Chạy migrations
npm run db:migrate
```

**Kết quả mong đợi**:
```
Sequelize CLI [Node: x.x.x]

Loaded configuration file "config/config.js".
Using environment "development".
== 20250113000001-create-users: migrating =======
== 20250113000001-create-users: migrated (0.xxx s)
== 20250113000003-create-service-categories: migrating =======
== 20250113000003-create-service-categories: migrated (0.xxx s)
...
```

**Các bảng được tạo**:
1. `users` - Quản lý người dùng (Admin, Staff, Client)
2. `wallets` - Ví điểm thưởng
3. `service_categories` - Danh mục dịch vụ
4. `services` - Dịch vụ spa
5. `appointments` - Lịch hẹn
6. `payments` - Thanh toán
7. `staff_shifts` - Ca làm việc nhân viên
8. `promotions` - Khuyến mãi/Voucher
9. `promotion_usage` - Lịch sử sử dụng voucher
10. `notifications` - Thông báo
11. `reviews` - Đánh giá
12. `treatment_courses` - Liệu trình trị liệu
13. `treatment_sessions` - Các buổi của liệu trình

### 4.4.6. Bước 6: Seed dữ liệu mẫu

Seeders tạo dữ liệu mẫu để phục vụ phát triển và kiểm thử:

```bash
# Đảm bảo đang ở thư mục backend
cd backend

# Chạy seeders (theo thứ tự)
npx sequelize-cli db:seed:all
```

**Các seeders được chạy**:
1. `seed-users.js` - Tạo tài khoản mẫu (Admin, Staff, Client)
2. `seed-wallets.js` - Tạo ví điểm thưởng
3. `seed-service-categories.js` - Tạo danh mục dịch vụ
4. `seed-services.js` - Tạo dịch vụ spa
5. `seed-promotions.js` - Tạo voucher/khuyến mãi
6. `seed-appointments.js` - Tạo lịch hẹn mẫu
7. `seed-payments.js` - Tạo thanh toán mẫu
8. `seed-reviews.js` - Tạo đánh giá mẫu

**Tài khoản mẫu được tạo**:
- **Admin**: `admin@spa.vn` / `admin123`
- **Staff**: `recep1@spa.vn` / `recep123`
- **Client**: `hoantuyen04@gmail.com` / `123456`

### 4.4.7. Bước 7: Cấu hình Frontend

Tạo file `.env` trong thư mục `frontend`:

**Trên Windows (PowerShell)**:
```powershell
cd frontend
@"
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here
"@ | Out-File -FilePath .env -Encoding utf8
```

**Trên Linux/Mac**:
```bash
cd frontend
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here
EOF
```

**Hoặc tạo thủ công file `.env` với nội dung**:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 4.5. CHẠY ỨNG DỤNG

### 4.5.1. Khởi động Backend Server

Mở terminal/command prompt đầu tiên:

```bash
cd backend
npm start
```

**Kết quả mong đợi**:
```
Database synced.
Server is running on port 5000
Access the API at http://localhost:5000
API documentation available at http://localhost:5000/api
```

**Port mặc định**: 5000 (có thể thay đổi trong file `.env`)

**Chế độ development với auto-reload**:
```bash
npm run dev
```

Sử dụng `nodemon` để tự động khởi động lại server khi có thay đổi code.

### 4.5.2. Khởi động Frontend Development Server

Mở terminal/command prompt thứ hai:

```bash
cd frontend
npm run dev
```

**Kết quả mong đợi**:
```
  VITE v6.2.0  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Port mặc định**: 3000 (Vite tự động chọn port khác nếu 3000 đã được sử dụng)

### 4.5.3. Truy cập ứng dụng

Sau khi cả hai server đã khởi động:

1. **Giao diện khách hàng**: http://localhost:3000/
2. **Giao diện Admin**: http://localhost:3000/#/admin/dashboard
3. **Giao diện Nhân viên**: http://localhost:3000/#/staff/dashboard
4. **Backend API**: http://localhost:5000/api

**Đăng nhập mẫu**:
- **Admin**: Email: `admin@spa.vn`, Password: `admin123`
- **Nhân viên**: Email: `recep1@spa.vn`, Password: `recep123`
- **Khách hàng**: Email: `hoantuyen04@gmail.com`, Password: `123456`

---

## 4.6. CẤU HÌNH CÁC DỊCH VỤ TÍCH HỢP

### 4.6.1. Cấu hình Google Gemini AI (Chatbot)

**Bước 1**: Truy cập https://makersuite.google.com/app/apikey

**Bước 2**: Đăng nhập bằng tài khoản Google

**Bước 3**: Tạo API Key mới

**Bước 4**: Copy API Key và thêm vào file `.env`:
- Backend: `GEMINI_API_KEY=your_api_key_here`
- Frontend: `VITE_GEMINI_API_KEY=your_api_key_here`

**Bước 5**: Khởi động lại cả backend và frontend server

**Sử dụng**: Chatbot sẽ tự động hoạt động tại trang khách hàng với URL `/client/chatbot`

### 4.6.2. Cấu hình VNPay (Thanh toán trực tuyến)

**Bước 1**: Đăng ký tài khoản merchant tại https://vnpay.vn/

**Bước 2**: Sau khi được duyệt, nhận thông tin:
- `TMN_CODE`: Mã merchant
- `HASH_SECRET`: Mã bí mật

**Bước 3**: Thêm vào file `backend/.env`:
```env
VNP_TMN_CODE=your_tmn_code
VNP_HASH_SECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html  # Môi trường test
# VNP_URL=https://www.vnpayment.vn/paymentv2/vpcpay.html    # Môi trường production
VNP_RETURN_URL=http://localhost:5000/api/payments/vnpay-return
```

**Bước 4**: Khởi động lại backend server

**Lưu ý**: 
- Môi trường test (sandbox) dùng để kiểm thử
- Môi trường production cần đăng ký và được VNPay duyệt

### 4.6.3. Cấu hình Email Service (Tùy chọn)

**Cho Gmail**:

**Bước 1**: Bật 2-Step Verification cho tài khoản Google

**Bước 2**: Tạo App Password:
- Truy cập: https://myaccount.google.com/apppasswords
- Chọn "Mail" và "Other (Custom name)"
- Tạo và copy mật khẩu

**Bước 3**: Thêm vào file `backend/.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

**Chức năng**: 
- Gửi email xác nhận đăng ký
- Gửi email đặt lại mật khẩu
- Gửi thông báo lịch hẹn

---

## 4.7. CẤU TRÚC DATABASE

### 4.7.1. Sơ đồ quan hệ các bảng

```
users (1) ──────< (1) wallets
  │
  │ (1)
  │
  ├──< (N) appointments
  ├──< (N) payments
  ├──< (N) reviews
  ├──< (N) promotion_usage
  ├──< (N) notifications
  └──< (N) treatment_courses

services (1) ───< (N) appointments
  │
  └──< (N) reviews

service_categories (1) ───< (N) services

appointments (1) ───< (N) payments
  │
  └──< (1) treatment_sessions

treatment_courses (1) ───< (N) treatment_sessions

users (Staff) (1) ───< (N) staff_shifts
```

### 4.7.2. Chi tiết các bảng chính

#### Bảng `users`
- **Mục đích**: Lưu trữ thông tin người dùng
- **Các trường chính**:
  - `id`: ID duy nhất (VARCHAR, Primary Key)
  - `email`: Email (UNIQUE)
  - `password`: Mật khẩu đã hash (VARCHAR)
  - `role`: Vai trò (ENUM: 'Admin', 'Staff', 'Client')
  - `name`: Tên người dùng
  - `phone`: Số điện thoại
  - `birthday`: Ngày sinh
  - `address`: Địa chỉ
  - `isEmailVerified`: Trạng thái xác thực email (BOOLEAN)

#### Bảng `appointments`
- **Mục đích**: Lưu trữ lịch hẹn
- **Các trường chính**:
  - `id`: ID duy nhất
  - `userId`: ID khách hàng (Foreign Key)
  - `serviceId`: ID dịch vụ (Foreign Key)
  - `therapistId`: ID nhân viên phụ trách (Foreign Key)
  - `date`: Ngày hẹn (DATE)
  - `time`: Giờ hẹn (TIME)
  - `status`: Trạng thái (ENUM: 'pending', 'upcoming', 'completed', 'cancelled')
  - `paymentStatus`: Trạng thái thanh toán (ENUM: 'Paid', 'Unpaid')
  - `bookingGroupId`: ID nhóm đặt lịch (cho liệu trình)

#### Bảng `treatment_courses`
- **Mục đích**: Lưu trữ liệu trình trị liệu
- **Các trường chính**:
  - `id`: ID duy nhất
  - `clientId`: ID khách hàng
  - `serviceId`: ID dịch vụ
  - `totalSessions`: Tổng số buổi
  - `completedSessions`: Số buổi đã hoàn thành
  - `totalAmount`: Tổng tiền
  - `paymentStatus`: Trạng thái thanh toán
  - `expiryDate`: Ngày hết hạn

#### Bảng `promotions`
- **Mục đích**: Lưu trữ voucher/khuyến mãi
- **Các trường chính**:
  - `id`: ID duy nhất
  - `code`: Mã voucher (UNIQUE)
  - `title`: Tên voucher
  - `discountType`: Loại giảm giá (ENUM: 'percentage', 'fixed')
  - `discountValue`: Giá trị giảm
  - `isPublic`: Công khai (BOOLEAN)
  - `pointsRequired`: Điểm cần để đổi (INTEGER)
  - `stock`: Số lượng còn lại
  - `targetAudience`: Đối tượng (ENUM: 'All', 'New Clients', 'Birthday')

### 4.7.3. Các ràng buộc và chỉ mục

- **Foreign Keys**: Đảm bảo tính toàn vẹn dữ liệu giữa các bảng
- **Unique Constraints**: Email, mã voucher không được trùng lặp
- **Indexes**: Được tạo trên các trường thường xuyên query (email, userId, serviceId)
- **Charset**: UTF8MB4 để hỗ trợ đầy đủ ký tự tiếng Việt và emoji

---

## 4.8. CÁC THUẬT TOÁN VÀ LOGIC QUAN TRỌNG

### 4.8.1. Thuật toán phân công nhân viên tự động

**Mục đích**: Tự động gán nhân viên phù hợp cho lịch hẹn mới

**Logic**:
1. Lọc nhân viên có vai trò phù hợp với dịch vụ
2. Kiểm tra lịch trống (không có ca làm việc trùng thời gian)
3. Ưu tiên nhân viên có ít lịch hẹn nhất trong ngày
4. Ưu tiên nhân viên có đánh giá cao nhất
5. Gán nhân viên phù hợp nhất

**File thực hiện**: `backend/services/appointmentService.js`

### 4.8.2. Thuật toán tính điểm thưởng

**Mục đích**: Tính điểm thưởng cho khách hàng sau mỗi lần thanh toán

**Công thức**:
```
Điểm thưởng = floor(Tổng tiền thanh toán / 1000)
```

**Ví dụ**:
- Thanh toán 2,500,000 VNĐ → Nhận 2,500 điểm
- Thanh toán 3,750,000 VNĐ → Nhận 3,750 điểm

**File thực hiện**: `backend/routes/payments.js`

### 4.8.3. Thuật toán xếp hạng khách hàng (Tier System)

**Mục đích**: Xếp hạng khách hàng dựa trên tổng chi tiêu

**Các hạng**:
- **Đồng (Bronze)**: 0 - 2,000,000 VNĐ
- **Bạc (Silver)**: 2,000,001 - 5,000,000 VNĐ
- **Vàng (Gold)**: 5,000,001 - 10,000,000 VNĐ
- **Kim Cương (Diamond)**: > 10,000,000 VNĐ

**File thực hiện**: `backend/utils/tierUtils.js`

### 4.8.4. Logic xử lý voucher

**Các loại voucher**:
1. **Voucher công khai (Public)**: Ai cũng có thể dùng
2. **Voucher đổi điểm (Redeemed)**: Phải đổi bằng điểm
3. **Voucher khách hàng mới**: Chỉ dùng 1 lần cho 1 dịch vụ
4. **Voucher sinh nhật**: Chỉ dùng đúng ngày sinh nhật, 1 lần/năm

**Logic trừ voucher**:
- Voucher đổi điểm: Trừ ngay khi đặt lịch
- Voucher công khai: Trừ stock khi áp dụng
- Hoàn lại voucher khi admin từ chối lịch hẹn

**File thực hiện**: `backend/routes/promotions.js`, `backend/routes/appointments.js`

### 4.8.5. Logic đồng bộ trạng thái thanh toán

**Mục đích**: Đảm bảo trạng thái thanh toán nhất quán giữa Appointment và TreatmentCourse

**Logic**:
1. Khi TreatmentCourse được thanh toán → Tất cả Appointment trong liệu trình → "Paid"
2. Khi Appointment đầu tiên được thanh toán → Cập nhật TreatmentCourse nếu phù hợp
3. Kiểm tra session 1 của liệu trình để xác định trạng thái

**File thực hiện**: `backend/routes/appointments.js`, `backend/routes/payments.js`

---

## 4.9. KIỂM TRA VÀ XÁC MINH

### 4.9.1. Kiểm tra kết nối Database

```bash
cd backend
node -e "const db = require('./models'); db.sequelize.authenticate().then(() => console.log('✅ Database connected!')).catch(err => console.error('❌ Error:', err));"
```

**Kết quả mong đợi**: `✅ Database connected!`

### 4.9.2. Kiểm tra API Endpoints

Sau khi backend server đã khởi động, truy cập:

```
http://localhost:5000/api/services
```

**Kết quả mong đợi**: JSON response chứa danh sách dịch vụ

### 4.9.3. Kiểm tra Frontend Build

```bash
cd frontend
npm run build
```

**Kết quả mong đợi**: Tạo thư mục `dist/` chứa các file build

### 4.9.4. Kiểm tra Migrations Status

```bash
cd backend
npm run db:migrate:status
```

**Kết quả mong đợi**: Hiển thị trạng thái các migrations (up/down)

---

## 4.10. TROUBLESHOOTING (XỬ LÝ LỖI)

### 4.10.1. Lỗi kết nối Database

**Lỗi**: `Error: connect ECONNREFUSED 127.0.0.1:3307`

**Giải pháp**:
1. Kiểm tra MySQL Server đã khởi động chưa
2. Kiểm tra port trong file `.env` có đúng không (mặc định: 3307)
3. Kiểm tra mật khẩu trong file `.env`

### 4.10.2. Lỗi Module không tìm thấy

**Lỗi**: `Error: Cannot find module 'xxx'`

**Giải pháp**:
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### 4.10.3. Lỗi Port đã được sử dụng

**Lỗi**: `Error: listen EADDRINUSE: address already in use :::5000`

**Giải pháp**:
1. Tìm process đang dùng port:
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

2. Dừng process hoặc đổi port trong file `.env`

### 4.10.4. Lỗi Migration

**Lỗi**: Migration không chạy được

**Giải pháp**:
```bash
# Hoàn nguyên migration cuối cùng
npm run db:migrate:undo

# Hoặc hoàn nguyên tất cả
npm run db:migrate:undo:all

# Chạy lại từ đầu
npm run db:migrate
```

### 4.10.5. Lỗi CORS

**Lỗi**: `Access to fetch at 'http://localhost:5000/api' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Giải pháp**: Kiểm tra file `backend/server.js` đã cấu hình CORS đúng chưa, thêm frontend URL vào whitelist

---

## 4.11. ĐẶC TẢ MÔI TRƯỜNG

### 4.11.1. Môi trường Development

- **Database**: Local MySQL (127.0.0.1:3307)
- **Backend URL**: http://localhost:5000
- **Frontend URL**: http://localhost:3000
- **NODE_ENV**: `development`
- **Logging**: Bật đầy đủ (console.log)
- **Auto-reload**: Bật (nodemon cho backend, Vite HMR cho frontend)

### 4.11.2. Môi trường Production

- **Database**: Remote MySQL với SSL connection
- **Backend URL**: https://api.yourdomain.com
- **Frontend URL**: https://yourdomain.com
- **NODE_ENV**: `production`
- **Logging**: Tắt hoặc ghi vào file log
- **Security**: 
  - HTTPS bắt buộc
  - CORS chỉ cho phép domain chính thức
  - JWT_SECRET phức tạp
  - Rate limiting cho API

### 4.11.3. Biến môi trường Production

Các biến môi trường cần thay đổi khi deploy production:

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_PORT=3306
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_SSL=true
JWT_SECRET=your_very_strong_random_secret_key_here
VNP_URL=https://www.vnpayment.vn/paymentv2/vpcpay.html
FRONTEND_URL=https://yourdomain.com
```

---

## 4.12. KẾT LUẬN

Chương 4 đã trình bày chi tiết quy trình cài đặt và cấu hình hệ thống quản lý đặt lịch spa "Anh Thơ Spa". Hệ thống được xây dựng với kiến trúc hiện đại, dễ bảo trì và mở rộng. Việc cài đặt được thực hiện qua các bước rõ ràng, từ cài đặt dependencies, cấu hình database, đến chạy migrations và seeders. Các dịch vụ tích hợp như VNPay và Google Gemini AI được cấu hình linh hoạt, hỗ trợ cả môi trường development và production. Hệ thống đã sẵn sàng để triển khai và sử dụng trong thực tế.

