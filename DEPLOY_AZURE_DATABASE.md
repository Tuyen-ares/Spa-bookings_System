# 🚀 Hướng Dẫn Deploy Đầy Đủ: Frontend (Vercel) + Backend (Railway) + Database (Azure)

## 📋 Tổng Quan Kiến Trúc

```
Frontend (Vercel) 
    ↓ API Calls
Backend (Railway)
    ↓ Database Connection
Azure Database for MySQL
```

## 🎯 Mục Lục

1. [Chuẩn Bị](#1-chuẩn-bị)
2. [Tạo Azure Database](#2-tạo-azure-database)
3. [Cấu Hình Azure Database](#3-cấu-hình-azure-database)
4. [Deploy Backend lên Railway](#4-deploy-backend-lên-railway)
5. [Kết Nối Railway với Azure Database](#5-kết-nối-railway-với-azure-database)
6. [Deploy Frontend lên Vercel](#6-deploy-frontend-lên-vercel)
7. [Cấu Hình Environment Variables](#7-cấu-hình-environment-variables)
8. [Chạy Database Migrations](#8-chạy-database-migrations)
9. [Test và Kiểm Tra](#9-test-và-kiểm-tra)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Chuẩn Bị

### 1.1. Tài Khoản Cần Có

- ✅ GitHub account (đã có code trên GitHub)
- ✅ Azure account (miễn phí $200 credit đầu tiên)
- ✅ Railway account (miễn phí $5 credit/tháng)
- ✅ Vercel account (miễn phí)

### 1.2. Code Đã Sẵn Sàng

- ✅ Code đã push lên GitHub: `Tuyen-ares/spa_anhTho`
- ✅ Backend trong thư mục `backend/`
- ✅ Frontend trong thư mục `frontend/`

---

## 2. Tạo Azure Database

### 2.1. Đăng Nhập Azure Portal

1. Truy cập: **https://portal.azure.com**
2. Đăng nhập bằng tài khoản Microsoft/Azure
3. Nếu chưa có tài khoản, đăng ký miễn phí (có $200 credit)

### 2.2. Tạo Azure Database for MySQL

1. Trong Azure Portal, click **"+ Create a resource"** (góc trên bên trái)
2. Tìm kiếm: **"Azure Database for MySQL"**
3. Chọn **"Azure Database for MySQL - Flexible Server"** (khuyến nghị)
4. Click **"Create"**

### 2.3. Cấu Hình Database

#### Tab "Basics":

- **Subscription**: Chọn subscription của bạn
- **Resource Group**: 
  - Click **"Create new"**
  - Tên: `spa-anhtho-rg`
  - Click **"OK"**
- **Server Name**: `spa-anhtho-mysql` (phải unique, Azure sẽ kiểm tra)
- **Region**: Chọn gần bạn nhất (ví dụ: `Southeast Asia`)
- **MySQL Version**: `8.0.21` (hoặc mới nhất)
- **Workload Type**: Chọn **"Development"** (để tiết kiệm chi phí)
- **Compute + Storage**: 
  - **Compute tier**: `Burstable`
  - **Compute size**: `Standard_B1ms` (1 vCore, 2GB RAM) - đủ cho dự án nhỏ
  - **Storage**: `20 GB` (có thể tăng sau)
- **Administrator Account**:
  - **Admin username**: `spa_admin` (không dùng `admin`)
  - **Password**: Tạo password mạnh (lưu lại!)
  - **Confirm password**: Nhập lại password
- Click **"Next: Networking >"**

#### Tab "Networking":

- **Connectivity method**: Chọn **"Public access (allowed IP addresses)"**
- **Firewall rules**:
  - Click **"+ Add current client IP address"** (để bạn có thể kết nối)
  - Click **"+ Add 0.0.0.0 - 255.255.255.255"** (để Railway có thể kết nối)
    - **Rule name**: `AllowAll`
    - **Start IP address**: `0.0.0.0`
    - **End IP address**: `255.255.255.255`
- Click **"Next: Security >"**

#### Tab "Security":

- **Enforce SSL connection**: Có thể bật hoặc tắt (khuyến nghị: **Enabled**)
- Click **"Next: Additional settings >"**

#### Tab "Additional settings":

- **Backup retention period**: `7 days` (mặc định)
- Click **"Review + create"**

#### Tab "Review + create":

1. Xem lại tất cả cấu hình
2. Click **"Create"**
3. Đợi deployment (5-10 phút)
4. Khi xong, click **"Go to resource"**

### 2.4. Lấy Thông Tin Kết Nối

1. Trong Azure Database resource, vào **"Overview"**
2. Copy các thông tin sau (lưu lại!):

```
Server name: spa-anhtho-mysql.mysql.database.azure.com
Admin username: spa_admin@spa-anhtho-mysql
Password: [password bạn đã tạo]
```

3. Vào **"Connection strings"** (menu bên trái)
4. Copy **"JDBC"** connection string để tham khảo

---

## 3. Cấu Hình Azure Database

### 3.1. Tạo Database

1. Trong Azure Portal, vào Azure Database resource
2. Vào **"Query editor"** (menu bên trái)
3. Đăng nhập với:
   - **Server admin login name**: `spa_admin@spa-anhtho-mysql`
   - **Password**: [password của bạn]
4. Click **"OK"**
5. Trong query editor, chạy lệnh:

```sql
CREATE DATABASE anhthospa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

6. Click **"Run"**
7. Xác nhận database đã được tạo

### 3.2. Kiểm Tra Firewall Rules

1. Vào **"Networking"** (menu bên trái)
2. Đảm bảo có rule:
   - Rule cho IP của bạn (để test local)
   - Rule `AllowAll` (0.0.0.0 - 255.255.255.255) cho Railway

---

## 4. Deploy Backend lên Railway

### 4.1. Tạo Project trên Railway

1. Truy cập: **https://railway.app**
2. Đăng nhập bằng GitHub
3. Click **"New Project"**
4. Chọn **"Deploy from GitHub repo"**
5. Chọn repository: **`Tuyen-ares/spa_anhTho`**
6. Chọn branch: **`main`**

### 4.2. Cấu Hình Backend Service

1. Railway sẽ tự động tạo service
2. Click vào service vừa tạo
3. Vào tab **"Settings"**
4. Tìm **"Root Directory"**
5. Điền: **`backend`**
6. Click **"Save"**

### 4.3. Generate Public Domain

1. Vẫn trong tab **"Settings"**
2. Scroll xuống phần **"Networking"**
3. Click **"Generate Domain"**
4. Copy URL (ví dụ: `https://spa-anhtho-production.up.railway.app`)
5. **Lưu lại URL này** - sẽ cần cho frontend!

---

## 5. Kết Nối Railway với Azure Database

### 5.1. Thêm Environment Variables

1. Vào Backend service trong Railway
2. Click tab **"Variables"**
3. Click **"+ New Variable"** và thêm từng biến:

```env
# Azure Database Connection
DB_HOST=spa-anhtho-mysql.mysql.database.azure.com
DB_USER=spa_admin@spa-anhtho-mysql
DB_PASSWORD=your-azure-database-password
DB_NAME=anhthospa_db
DB_PORT=3306

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (sẽ cập nhật sau)
FRONTEND_URL=https://your-frontend.vercel.app

# VNPay (nếu dùng)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-backend-url.railway.app/api/payments/vnpay-return
VNPAY_IPN_URL=https://your-backend-url.railway.app/api/payments/vnpay-ipn
```

**Lưu ý quan trọng:**
- `DB_HOST`: Lấy từ Azure Portal → Overview → Server name
- `DB_USER`: Phải có format `username@server-name` (ví dụ: `spa_admin@spa-anhtho-mysql`)
- `DB_PASSWORD`: Password bạn đã tạo khi tạo Azure Database
- `DB_NAME`: `anhthospa_db` (database bạn đã tạo)
- `VNPAY_RETURN_URL` và `VNPAY_IPN_URL`: Thay `your-backend-url` bằng URL Railway của bạn

### 5.2. Cấu Hình SSL (Nếu Azure Database yêu cầu)

Nếu Azure Database có bật SSL:

1. Vào Azure Portal → Azure Database → **"Connection security"**
2. Download **"SSL CA certificate"** (file `.pem`)
3. Convert certificate sang format mà Node.js có thể đọc (hoặc disable SSL trong connection string)

**Hoặc** cập nhật `backend/config/database.js` để hỗ trợ SSL:

```javascript
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false // Chỉ dùng cho development, production nên dùng proper certificate
  }
}
```

---

## 6. Deploy Frontend lên Vercel

### 6.1. Tạo Project trên Vercel

1. Truy cập: **https://vercel.com**
2. Đăng nhập bằng GitHub
3. Click **"Add New..."** → **"Project"**
4. Tìm và chọn repository: **`Tuyen-ares/spa_anhTho`**
5. Click **"Import"**

### 6.2. Cấu Hình Project

1. **Framework Preset**: Chọn **"Vite"** (hoặc để Vercel tự detect)
2. **Root Directory**: 
   - Click **"Edit"** 
   - Chọn **`frontend`**
3. **Build Command**: `npm run build` (tự động)
4. **Output Directory**: `dist` (tự động)

### 6.3. Thêm Environment Variables

1. Scroll xuống phần **"Environment Variables"**
2. Click **"+ Add"**
3. Thêm biến:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.railway.app/api`
     (Thay `your-backend-url` bằng URL Railway từ bước 4.3)
   - **Environment**: Chọn tất cả (Production, Preview, Development)
4. Click **"Deploy"**

### 6.4. Lấy Frontend URL

1. Đợi build xong (2-3 phút)
2. Vercel sẽ cung cấp URL (ví dụ: `https://spa-anhtho.vercel.app`)
3. **Copy URL này** - sẽ cần cập nhật lại backend!

---

## 7. Cấu Hình Environment Variables

### 7.1. Cập Nhật FRONTEND_URL trong Railway

1. Vào Railway → Backend service → **"Variables"**
2. Tìm `FRONTEND_URL`
3. Cập nhật giá trị = URL Vercel từ bước 6.4
4. Railway sẽ tự động redeploy

### 7.2. Cập Nhật CORS trong Backend (Tùy chọn)

1. Về local, mở file `backend/server.js`
2. Tìm dòng CORS và cập nhật:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',  // Development
    'https://your-frontend.vercel.app'  // Production - thay bằng URL Vercel
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

3. Commit và push:
```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push origin main
```

---

## 8. Chạy Database Migrations

### 8.1. Chạy Migrations trên Railway

1. Vào Railway → Backend service → **"Deployments"**
2. Click deployment mới nhất (Active)
3. Click tab **"Logs"**
4. Click tab **"Shell"** (ở trên cùng)
5. Chạy lệnh:
   ```bash
   npm run db:migrate
   ```
6. Đợi migrations chạy xong
7. Kiểm tra logs xem có lỗi không

### 8.2. Kiểm Tra Database

1. Vào Azure Portal → Azure Database → **"Query editor"**
2. Đăng nhập
3. Chạy query:
   ```sql
   USE anhthospa_db;
   SHOW TABLES;
   ```
4. Phải thấy các bảng đã được tạo (users, services, appointments, etc.)

---

## 9. Test và Kiểm Tra

### 9.1. Test Backend API

1. Mở trình duyệt
2. Truy cập: `https://your-backend-url.railway.app/api/services`
3. Phải thấy JSON response (danh sách services)
4. Nếu thấy lỗi, xem logs trong Railway

### 9.2. Test Frontend

1. Truy cập URL Vercel của bạn
2. Mở **DevTools** (F12) → Tab **"Network"**
3. Thử đăng nhập hoặc load trang
4. Kiểm tra các API calls có thành công không
5. Nếu có lỗi CORS, kiểm tra lại CORS settings

### 9.3. Test Database Connection

1. Vào Railway → Backend service → **"Logs"**
2. Kiểm tra logs xem có lỗi kết nối database không
3. Nếu có lỗi "Access denied", kiểm tra lại:
   - DB_USER format: `username@server-name`
   - DB_PASSWORD đúng chưa
   - Firewall rules trong Azure

---

## 10. Troubleshooting

### 10.1. Lỗi: Cannot connect to Azure Database

**Nguyên nhân:**
- Firewall rules chưa đúng
- Username/password sai
- SSL connection issue

**Giải pháp:**
1. Kiểm tra Firewall rules trong Azure:
   - Vào Azure Database → **"Networking"**
   - Đảm bảo có rule cho Railway IPs (hoặc AllowAll)
2. Kiểm tra Username format:
   - Phải là: `username@server-name`
   - Ví dụ: `spa_admin@spa-anhtho-mysql`
3. Kiểm tra Password:
   - Đảm bảo đúng password đã tạo
   - Không có khoảng trắng thừa
4. Nếu vẫn lỗi, thử disable SSL tạm thời:
   - Vào Azure Database → **"Connection security"**
   - Tắt **"Enforce SSL connection"**

### 10.2. Lỗi: Access denied for user

**Nguyên nhân:**
- Username format sai
- User không có quyền truy cập database

**Giải pháp:**
1. Kiểm tra username format: `username@server-name`
2. Đảm bảo database `anhthospa_db` đã được tạo
3. Thử tạo lại database nếu cần

### 10.3. Lỗi: Frontend không gọi được API

**Nguyên nhân:**
- CORS chưa được cấu hình đúng
- API URL sai

**Giải pháp:**
1. Kiểm tra `VITE_API_URL` trong Vercel
2. Kiểm tra CORS trong backend
3. Mở DevTools → Console xem lỗi cụ thể

### 10.4. Lỗi: Build failed trên Railway

**Nguyên nhân:**
- Root Directory chưa đúng
- Dependencies thiếu

**Giải pháp:**
1. Kiểm tra Root Directory = `backend`
2. Xem logs để biết lỗi cụ thể
3. Thử build local: `cd backend && npm install && npm run build`

### 10.5. Lỗi: Migrations failed

**Nguyên nhân:**
- Database chưa được tạo
- Connection string sai

**Giải pháp:**
1. Đảm bảo database `anhthospa_db` đã được tạo trong Azure
2. Kiểm tra lại Environment Variables
3. Thử chạy migrations local trước:
   ```bash
   cd backend
   npm run db:migrate
   ```

---

## 📊 So Sánh Chi Phí

### Azure Database for MySQL Flexible Server

- **Burstable B1ms**: ~$12-15/tháng
- **Storage**: ~$0.10/GB/tháng (20GB = $2/tháng)
- **Backup**: Miễn phí (7 ngày retention)
- **Tổng**: ~$14-17/tháng

### Railway

- **Free tier**: $5 credit/tháng
- **Hobby plan**: $5/tháng (nếu hết credit)

### Vercel

- **Free tier**: Unlimited
- **Giới hạn**: 100GB bandwidth/tháng

### Tổng Chi Phí

- **Tối thiểu**: $14-17/tháng (Azure Database) + $0-5/tháng (Railway) = **$14-22/tháng**
- **Nếu dùng Azure Database Basic tier**: Có thể rẻ hơn (~$10/tháng)

---

## ✅ Checklist Cuối Cùng

- [ ] Đã tạo Azure Database for MySQL
- [ ] Đã tạo database `anhthospa_db`
- [ ] Đã cấu hình Firewall rules
- [ ] Đã deploy backend lên Railway
- [ ] Đã set Root Directory = `backend`
- [ ] Đã generate Public Domain cho Railway
- [ ] Đã thêm Environment Variables trong Railway
- [ ] Đã deploy frontend lên Vercel
- [ ] Đã thêm `VITE_API_URL` trong Vercel
- [ ] Đã chạy database migrations
- [ ] Đã test backend API
- [ ] Đã test frontend
- [ ] Đã cập nhật `FRONTEND_URL` trong Railway
- [ ] Đã test toàn bộ chức năng

---

## 🎉 Hoàn Thành!

Sau khi hoàn thành tất cả các bước, bạn sẽ có:

- ✅ Frontend chạy trên Vercel
- ✅ Backend chạy trên Railway
- ✅ Database chạy trên Azure
- ✅ Tất cả đã được kết nối và hoạt động!

## 📞 Cần Hỗ Trợ?

1. Xem logs trong Railway/Vercel dashboard
2. Kiểm tra Azure Database connection trong Azure Portal
3. Test local trước khi deploy
4. Kiểm tra Environment Variables đã đầy đủ chưa

---

## 📚 Tài Liệu Tham Khảo

- Azure Database for MySQL: https://docs.microsoft.com/azure/mysql/
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Sequelize MySQL: https://sequelize.org/docs/v6/getting-started/

