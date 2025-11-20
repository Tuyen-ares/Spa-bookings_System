# 🚀 Hướng Dẫn Deploy Nhanh - Anh Thơ Spa

## Phương Án Đơn Giản Nhất (Khuyến Nghị)

### Bước 1: Deploy Backend lên Railway (5 phút)

1. **Truy cập**: <https://railway.app>
2. **Đăng nhập** bằng GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Chọn repository**: `HOANGSUNSW/Spa-bookings`
5. **Chọn Root Directory**: `backend`
6. **Thêm MySQL Database**:
   - Click **+ New** → **Database** → **MySQL**
7. **Thêm Environment Variables**:
   - Click vào service backend → **Variables**
   - Thêm các biến sau:

     ```
     DB_HOST=${{MySQL.MYSQLHOST}}
     DB_USER=${{MySQL.MYSQLUSER}}
     DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
     DB_NAME=${{MySQL.MYSQLDATABASE}}
     DB_PORT=${{MySQL.MYSQLPORT}}
     PORT=3001
     JWT_SECRET=your-super-secret-key-change-this
     FRONTEND_URL=https://your-frontend.vercel.app
     NODE_ENV=production
     ```

8. **Chạy Migrations**:
   - Click vào service backend → **Deployments** → **View Logs**
   - Click **Shell** tab
   - Chạy: `npm run db:migrate`
9. **Copy Backend URL**:
   - Click vào service → **Settings** → **Generate Domain**
   - Copy URL (ví dụ: `https://spa-backend.railway.app`)

### Bước 2: Deploy Frontend lên Vercel (3 phút)

1. **Truy cập**: <https://vercel.com>
2. **Đăng nhập** bằng GitHub
3. **Add New Project** → **Import Git Repository**
4. **Chọn repository**: `HOANGSUNSW/Spa-bookings`
5. **Cấu hình**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. **Environment Variables**:
   - Thêm: `VITE_API_URL` = `https://your-backend-url.railway.app/api`
7. **Deploy**!

### Bước 3: Cập Nhật CORS trong Backend

Sau khi có URL frontend, cập nhật CORS trong `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app'  // Thêm URL Vercel của bạn
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

Commit và push lại, Railway sẽ tự động redeploy.

## ✅ Kiểm Tra

1. **Backend**: Truy cập `https://your-backend.railway.app/api/services` - phải trả về JSON
2. **Frontend**: Truy cập URL Vercel - phải load được trang chủ
3. **API Connection**: Mở DevTools → Network → kiểm tra API calls

## 💰 Chi Phí

- **Vercel**: Miễn phí (hobby plan)
- **Railway**: $5 credit/tháng (đủ cho dự án nhỏ)
- **Tổng**: ~$0-5/tháng

## 🔄 Cập Nhật Code

Mỗi khi push code lên GitHub:

- **Railway**: Tự động deploy
- **Vercel**: Tự động deploy

## 📞 Hỗ Trợ

Nếu gặp lỗi:

1. Kiểm tra logs trong Railway/Vercel dashboard
2. Kiểm tra environment variables
3. Kiểm tra database connection
4. Kiểm tra CORS settings
