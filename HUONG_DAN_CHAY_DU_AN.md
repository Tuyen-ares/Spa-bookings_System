# Hướng Dẫn Chạy Dự Án Anh Thơ Spa

## 📋 Mục Lục

1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt Dependencies](#cài-đặt-dependencies)
3. [Cấu Hình Database](#cấu-hình-database)
4. [Chạy Migrations](#chạy-migrations)
5. [Chạy Backend Server](#chạy-backend-server)
6. [Chạy Frontend](#chạy-frontend)
7. [Truy Cập Ứng Dụng](#truy-cập-ứng-dụng)
8. [Các Lệnh Hữu Ích](#các-lệnh-hữu-ích)
9. [Troubleshooting](#troubleshooting)

---

## 🖥️ Yêu Cầu Hệ Thống

- **Node.js**: phiên bản 18.x trở lên
- **MySQL**: phiên bản 8.0 trở lên (hoặc MariaDB 10.5+)
- **npm**: phiên bản 9.x trở lên (hoặc yarn)
- **Git**: để clone repository

### Kiểm tra phiên bản

```bash
node --version
npm --version
mysql --version
```

---

## 📦 Cài Đặt Dependencies

### 1. Clone repository (nếu chưa có)

```bash
git clone https://github.com/HOANGSUNSW/Spa-bookings.git
cd Spa-bookings
```

### 2. Cài đặt Backend Dependencies

```bash
cd backend
npm install
```

### 3. Cài đặt Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## 🗄️ Cấu Hình Database

### 1. Khởi động MySQL Server

**Windows (XAMPP):**

- Mở XAMPP Control Panel
- Click "Start" cho MySQL service

**Windows (MySQL Standalone):**

- Mở Services (services.msc)
- Tìm "MySQL" và Start service

**Linux/Mac:**

```bash
sudo systemctl start mysql
# hoặc
sudo service mysql start
```

### 2. Tạo Database

Đăng nhập vào MySQL:

```bash
mysql -u root -p
```

Tạo database:

```sql
CREATE DATABASE IF NOT EXISTS anhthospa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Tạo File .env

Tạo file `.env` trong thư mục `backend/`:

**Windows (PowerShell):**

```powershell
cd backend
Copy-Item env.example .env
```

**Linux/Mac:**

```bash
cd backend
cp env.example .env
```

**Hoặc tạo thủ công:** Tạo file `backend/.env` với nội dung:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=anhthospa_db
DB_USER=root
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3001

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Database Sync Options
DB_ALTER_ON_START=false

# Gemini AI API Key for Chatbot (optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

**⚠️ Lưu ý:**

- Thay `your_password_here` bằng mật khẩu MySQL của bạn
- Thay `your_jwt_secret_key_here_change_in_production` bằng một chuỗi ngẫu nhiên bảo mật
- Kiểm tra `DB_PORT` (mặc định MySQL là 3306, nhưng có thể là 3307)
- Nếu không dùng chatbot, có thể bỏ qua `GEMINI_API_KEY`

---

## 🔄 Chạy Migrations

Migrations sẽ tạo tất cả các bảng trong database theo schema đã định nghĩa.

### Chạy tất cả migrations

```bash
cd backend
npx sequelize-cli db:migrate
```

### Kiểm tra trạng thái migrations

```bash
npx sequelize-cli db:migrate:status
```

### Rollback migration cuối cùng (nếu cần)

```bash
npx sequelize-cli db:migrate:undo
```

### Rollback tất cả migrations (nếu cần)

```bash
npx sequelize-cli db:migrate:undo:all
```

**✅ Kết quả mong đợi:**

- Tất cả các bảng được tạo thành công
- Không có lỗi kết nối database
- Thông báo: "migrated: 20250113000001-create-users.js", etc.

---

## 🚀 Chạy Backend Server

### 1. Chạy Backend (Development Mode)

```bash
cd backend
npm start
```

Hoặc với nodemon (tự động restart khi có thay đổi):

```bash
npm start
```

**✅ Kết quả mong đợi:**

```
Server is running on port 3001
Database connected successfully
```

### 2. Kiểm tra Backend đang chạy

Mở trình duyệt và truy cập:

- <http://localhost:3001/api/services> (kiểm tra API)

---

## 💻 Chạy Frontend

### 1. Mở terminal mới và chạy Frontend

```bash
cd frontend
npm run dev
```

**✅ Kết quả mong đợi:**

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 2. Truy cập ứng dụng

Mở trình duyệt và truy cập: **<http://localhost:5173>**

---

## 🌐 Truy Cập Ứng Dụng

### Frontend URLs

- **Client Portal**: <http://localhost:5173>
- **Admin Portal**: <http://localhost:5173/admin>
- **Staff Portal**: <http://localhost:5173/staff>

### Backend API

- **API Base URL**: <http://localhost:3001/api>
- **API Docs**: <http://localhost:3001/api/services> (ví dụ)

### Tài khoản mặc định (nếu có seed data)

- **Admin**: <admin@anhtho.com> / password
- **Staff**: <staff@anhtho.com> / password
- **Client**: <customer@anhtho.com> / password

---

## 🛠️ Các Lệnh Hữu Ích

### Backend Commands

```bash
# Chạy server
npm start

# Chạy migrations
npm run db:migrate

# Xem trạng thái migrations
npm run db:migrate:status

# Rollback migration
npm run db:migrate:undo

# Rollback tất cả
npm run db:migrate:undo:all
```

### Frontend Commands

```bash
# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

### Database Commands

```bash
# Kết nối MySQL
mysql -u root -p

# Xem danh sách databases
SHOW DATABASES;

# Sử dụng database
USE anhthospa_db;

# Xem danh sách tables
SHOW TABLES;

# Xem cấu trúc bảng
DESCRIBE users;
```

---

## 🔧 Troubleshooting

### 1. Lỗi: "ECONNREFUSED 127.0.0.1:3307"

**Nguyên nhân:** MySQL server chưa chạy hoặc port sai

**Giải pháp:**

- Kiểm tra MySQL server đang chạy
- Kiểm tra port trong file `.env` (có thể là 3306 thay vì 3307)
- Kiểm tra username/password trong `.env`

### 2. Lỗi: "Database does not exist"

**Nguyên nhân:** Database chưa được tạo

**Giải pháp:**

```sql
CREATE DATABASE anhthospa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Lỗi: "Table already exists"

**Nguyên nhân:** Bảng đã tồn tại từ lần chạy migration trước

**Giải pháp:**

- Rollback migrations: `npm run db:migrate:undo:all`
- Hoặc xóa database và tạo lại: `DROP DATABASE anhthospa_db; CREATE DATABASE anhthospa_db;`

### 4. Lỗi: "Cannot find module"

**Nguyên nhân:** Dependencies chưa được cài đặt

**Giải pháp:**

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 5. Lỗi: "Port 3001 already in use"

**Nguyên nhân:** Port 3001 đang được sử dụng bởi process khác

**Giải pháp:**

- Tìm và kill process: `netstat -ano | findstr :3001` (Windows) hoặc `lsof -ti:3001 | xargs kill` (Linux/Mac)
- Hoặc đổi port trong file `.env`: `PORT=3002`

### 6. Lỗi: "Port 5173 already in use"

**Nguyên nhân:** Port 5173 đang được sử dụng

**Giải pháp:**

- Vite sẽ tự động tìm port khác
- Hoặc chỉ định port: `npm run dev -- --port 5174`

### 7. Lỗi Migration: "Foreign key constraint fails"

**Nguyên nhân:** Thứ tự migration không đúng hoặc bảng cha chưa tồn tại

**Giải pháp:**

- Kiểm tra thứ tự migration files (theo timestamp)
- Đảm bảo các bảng cha được tạo trước (users, services, etc.)

### 8. Frontend không kết nối được Backend

**Nguyên nhân:** CORS hoặc API URL sai

**Giải pháp:**

- Kiểm tra Backend đang chạy trên port 3001
- Kiểm tra file `frontend/services/apiService.ts` có đúng URL: `http://localhost:3001/api`
- Kiểm tra CORS config trong `backend/server.js`

---

## 📝 Checklist Trước Khi Chạy

- [ ] Node.js đã cài đặt (v18+)
- [ ] MySQL server đang chạy
- [ ] Database `anhthospa_db` đã được tạo
- [ ] File `.env` đã được tạo trong `backend/` với cấu hình đúng
- [ ] Backend dependencies đã cài đặt (`npm install` trong `backend/`)
- [ ] Frontend dependencies đã cài đặt (`npm install` trong `frontend/`)
- [ ] Migrations đã chạy thành công (`npm run db:migrate`)

---

## 🎯 Quy Trình Chạy Dự Án (Tóm Tắt)

```bash
# 1. Cài đặt dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Cấu hình database
# - Tạo file .env trong backend/
# - Khởi động MySQL server
# - Tạo database: CREATE DATABASE anhthospa_db;

# 3. Chạy migrations
cd backend
npm run db:migrate

# 4. Chạy Backend (terminal 1)
npm start

# 5. Chạy Frontend (terminal 2)
cd ../frontend
npm run dev

# 6. Truy cập ứng dụng
# http://localhost:5173
```

---

## 📚 Tài Liệu Tham Khảo

- **Database Schema**: `docs/db.txt`
- **Database Details**: `docs/database_details.md`
- **Migration Guide**: `backend/migrations/MIGRATION-GUIDE.md`
- **Treatment Course Implementation**: `docs/TREATMENT_COURSE_IMPLEMENTATION.md`

---

## 💡 Tips

1. **Development Mode**: Sử dụng `npm start` (nodemon) để tự động restart khi có thay đổi
2. **Database Reset**: Nếu cần reset database, rollback tất cả migrations và chạy lại
3. **API Testing**: Sử dụng Postman hoặc curl để test API endpoints
4. **Logs**: Kiểm tra console logs để debug các vấn đề
5. **Git**: Luôn commit file `.env.example` nhưng KHÔNG commit file `.env`

---

## 🆘 Hỗ Trợ

Nếu gặp vấn đề không được giải quyết ở đây:

1. Kiểm tra logs trong console
2. Kiểm tra file `.env` có đúng cấu hình
3. Kiểm tra MySQL server đang chạy
4. Kiểm tra ports 3001 và 5173 không bị chiếm dụng
5. Xem thêm trong các file README.md trong từng thư mục

---

**Chúc bạn chạy dự án thành công! 🎉**
