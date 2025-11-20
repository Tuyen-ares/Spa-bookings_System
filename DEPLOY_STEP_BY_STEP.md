# 🚀 Hướng Dẫn Deploy Từng Bước - Anh Thơ Spa

## ⚡ Phương Án Khuyến Nghị: Railway + Vercel (Tự Động Deploy từ Git)

### Tại sao chọn phương án này?

- ✅ **Miễn phí** (hoặc rất rẻ)
- ✅ **Tự động deploy** khi push code lên GitHub
- ✅ **Dễ setup** - chỉ cần vài click
- ✅ **SSL tự động** - không cần cấu hình
- ✅ **Không cần biết về server** - platform lo hết

---

## 📋 Bước 1: Chuẩn Bị Code trên GitHub

### 1.1. Đảm bảo code đã được push lên GitHub

```bash
# Kiểm tra trạng thái
git status

# Nếu có thay đổi chưa commit
git add .
git commit -m "Prepare for deployment"
git push origin tuyenv2
```

### 1.2. Kiểm tra các file cấu hình đã có

- ✅ `backend/package.json` có script `"start": "node server.js"`
- ✅ `backend/railway.json` (đã tạo)
- ✅ `frontend/vercel.json` (đã tạo)

---

## 🚂 Bước 2: Deploy Backend lên Railway (10 phút)

### 2.1. Tạo tài khoản Railway

1. Truy cập: **<https://railway.app>**
2. Click **"Login"** → Chọn **"Login with GitHub"**
3. Authorize Railway truy cập GitHub của bạn

### 2.2. Tạo Project mới

1. Click **"New Project"**
2. Chọn **"Deploy from GitHub repo"**
3. Chọn repository: **`HOANGSUNSW/Spa-bookings`**
4. Chọn branch: **`tuyenv2`** (hoặc `main`)

### 2.3. Cấu hình Backend Service

1. Railway sẽ tự động phát hiện thư mục `backend`
2. Nếu không, click vào service → **Settings** → **Root Directory**: `backend`

### 2.4. Thêm MySQL Database

1. Trong project, click **"+ New"**
2. Chọn **"Database"** → **"Add MySQL"**
3. Railway sẽ tự động tạo database

### 2.5. Cấu hình Environment Variables

1. Click vào **Backend service** → Tab **"Variables"**
2. Click **"+ New Variable"** và thêm từng biến sau:

```env
# Database (Railway tự động tạo, dùng template variables)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}

# Server
PORT=3001
NODE_ENV=production

# JWT Secret (tạo một chuỗi ngẫu nhiên)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (sẽ cập nhật sau khi deploy frontend)
FRONTEND_URL=https://your-frontend.vercel.app
```

**Lưu ý**:

- `${{MySQL.MYSQLHOST}}` là template variable của Railway, tự động lấy từ MySQL service
- Tìm MySQL service trong project → **Variables** → Copy các giá trị này

### 2.6. Chạy Database Migrations

1. Click vào **Backend service** → Tab **"Deployments"**
2. Click vào deployment mới nhất → Tab **"Logs"**
3. Click tab **"Shell"** (ở trên cùng)
4. Chạy lệnh:

   ```bash
   npm run db:migrate
   ```

### 2.7. Lấy Backend URL

1. Click vào **Backend service** → Tab **"Settings"**
2. Scroll xuống **"Networking"**
3. Click **"Generate Domain"**
4. Copy URL (ví dụ: `https://spa-backend-production.up.railway.app`)
5. **Lưu lại URL này** - sẽ cần cho frontend!

---

## 🎨 Bước 3: Deploy Frontend lên Vercel (5 phút)

### 3.1. Tạo tài khoản Vercel

1. Truy cập: **<https://vercel.com>**
2. Click **"Sign Up"** → Chọn **"Continue with GitHub"**
3. Authorize Vercel truy cập GitHub

### 3.2. Import Project

1. Click **"Add New..."** → **"Project"**
2. Tìm và chọn repository: **`HOANGSUNSW/Spa-bookings`**
3. Click **"Import"**

### 3.3. Cấu hình Project

1. **Framework Preset**: Chọn **"Vite"** (hoặc để Vercel tự detect)
2. **Root Directory**: Chọn **`frontend`**
   - Click **"Edit"** → Chọn `frontend` folder
3. **Build Command**: `npm run build` (tự động)
4. **Output Directory**: `dist` (tự động)

### 3.4. Thêm Environment Variables

1. Scroll xuống **"Environment Variables"**
2. Click **"+ Add"**
3. Thêm biến:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.railway.app/api`
     (Thay `your-backend-url` bằng URL backend từ Railway)
   - **Environment**: Chọn tất cả (Production, Preview, Development)

### 3.5. Deploy

1. Click **"Deploy"**
2. Đợi build (2-3 phút)
3. Khi xong, Vercel sẽ cung cấp URL (ví dụ: `https://spa-bookings.vercel.app`)
4. **Copy URL này** - sẽ cần cập nhật lại backend!

---

## 🔄 Bước 4: Cập Nhật CORS trong Backend

### 4.1. Cập nhật CORS settings

1. Về local, mở file `backend/server.js`
2. Tìm dòng CORS và cập nhật:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',  // Development
    'https://your-frontend.vercel.app'  // Production - thay bằng URL Vercel của bạn
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### 4.2. Cập nhật FRONTEND_URL trong Railway

1. Về Railway → Backend service → Variables
2. Tìm `FRONTEND_URL`
3. Cập nhật giá trị = URL Vercel của bạn
4. Railway sẽ tự động redeploy

### 4.3. Commit và Push

```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push origin tuyenv2
```

Railway sẽ tự động deploy lại với CORS mới!

---

## ✅ Bước 5: Kiểm Tra

### 5.1. Test Backend

1. Mở trình duyệt
2. Truy cập: `https://your-backend.railway.app/api/services`
3. Phải thấy JSON response (danh sách services)

### 5.2. Test Frontend

1. Truy cập URL Vercel của bạn
2. Mở **DevTools** (F12) → Tab **Network**
3. Thử đăng nhập hoặc load trang
4. Kiểm tra các API calls có thành công không

### 5.3. Test Database

1. Vào Railway → MySQL service → **Connect** tab
2. Copy connection string
3. Dùng MySQL client (như MySQL Workbench) để kết nối
4. Kiểm tra các bảng đã được tạo

---

## 🔄 Cập Nhật Code Sau Này

### Mỗi khi có thay đổi code

```bash
# 1. Commit và push lên GitHub
git add .
git commit -m "Your commit message"
git push origin tuyenv2

# 2. Railway và Vercel sẽ TỰ ĐỘNG deploy!
# Không cần làm gì thêm - chỉ đợi vài phút
```

---

## 💰 Chi Phí

### Railway

- **Free tier**: $5 credit/tháng
- Đủ cho dự án nhỏ (~500MB RAM, 1GB storage)
- Nếu hết credit: $5/tháng cho Hobby plan

### Vercel

- **Free tier**: Unlimited
- Giới hạn: 100GB bandwidth/tháng (đủ cho hàng nghìn visitors)

### Tổng chi phí: **$0-5/tháng** 🎉

---

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: Backend không kết nối database

**Giải pháp:**

1. Kiểm tra Environment Variables trong Railway
2. Đảm bảo đã dùng template variables: `${{MySQL.MYSQLHOST}}`
3. Kiểm tra MySQL service đã được tạo chưa

### Lỗi: Frontend không gọi được API

**Giải pháp:**

1. Kiểm tra `VITE_API_URL` trong Vercel
2. Kiểm tra CORS trong backend
3. Mở DevTools → Console xem lỗi cụ thể

### Lỗi: Build failed

**Giải pháp:**

1. Xem logs trong Railway/Vercel
2. Kiểm tra `package.json` có đúng dependencies không
3. Thử build local: `npm run build`

---

## 📞 Cần Giúp Đỡ?

1. Xem logs trong Railway/Vercel dashboard
2. Kiểm tra GitHub Actions (nếu có)
3. Test local trước khi deploy

---

## 🎯 Tóm Tắt Quy Trình

```
1. Push code lên GitHub ✅
   ↓
2. Railway: Deploy backend + MySQL
   ↓
3. Vercel: Deploy frontend
   ↓
4. Cập nhật CORS và env vars
   ↓
5. Test và hoàn thành! 🎉
```

**Sau này chỉ cần:**

```
git push → Tự động deploy! 🚀
```
