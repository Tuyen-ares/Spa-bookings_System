# Hướng Dẫn Deploy Web Anh Thơ Spa

## 📋 Tổng Quan

Dự án gồm:

- **Frontend**: React + Vite (port 3000)
- **Backend**: Node.js + Express (port 3001)
- **Database**: MySQL

## 🚀 Phương Án 1: Deploy Miễn Phí (Khuyến Nghị)

### A. Deploy Frontend lên Vercel (Miễn phí)

1. **Chuẩn bị:**

   ```bash
   cd frontend
   npm run build
   ```

2. **Tạo file `vercel.json` trong thư mục `frontend/`:**

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ],
     "env": {
       "VITE_API_URL": "https://your-backend-url.railway.app/api"
     }
   }
   ```

3. **Deploy:**
   - Truy cập <https://vercel.com>
   - Đăng nhập bằng GitHub
   - Import project từ GitHub
   - Chọn thư mục `frontend`
   - Thêm environment variable: `VITE_API_URL` = URL backend của bạn
   - Deploy!

### B. Deploy Backend lên Railway (Miễn phí - $5 credit/tháng)

1. **Chuẩn bị file `railway.json` trong thư mục `backend/`:**

   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "node server.js",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Cập nhật `backend/package.json` thêm script:**

   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js"
     }
   }
   ```

3. **Deploy:**
   - Truy cập <https://railway.app>
   - Đăng nhập bằng GitHub
   - New Project → Deploy from GitHub repo
   - Chọn thư mục `backend`
   - Thêm MySQL Database service
   - Thêm Environment Variables:

     ```
     DB_HOST=<railway-db-host>
     DB_USER=<railway-db-user>
     DB_PASSWORD=<railway-db-password>
     DB_NAME=<railway-db-name>
     DB_PORT=3306
     PORT=3001
     JWT_SECRET=<your-jwt-secret>
     FRONTEND_URL=https://your-frontend.vercel.app
     ```

   - Chạy migrations: `npm run db:migrate`

### C. Deploy Database

**Option 1: Railway MySQL (Khuyến nghị)**

- Tự động tạo khi thêm MySQL service trong Railway
- Copy connection string và cập nhật env vars

**Option 2: PlanetScale (Miễn phí)**

- Truy cập <https://planetscale.com>
- Tạo database mới
- Copy connection string

## 🖥️ Phương Án 2: Deploy lên VPS (DigitalOcean, AWS, Vultr)

### Yêu cầu

- VPS với Ubuntu 20.04+
- Domain name (tùy chọn)
- SSH access

### Bước 1: Cài đặt trên VPS

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Cài đặt MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Cài đặt Nginx
sudo apt install nginx -y

# Cài đặt PM2
sudo npm install -g pm2
```

### Bước 2: Setup Database

```bash
# Đăng nhập MySQL
sudo mysql -u root -p

# Tạo database và user
CREATE DATABASE anhthospa_db;
CREATE USER 'spa_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON anhthospa_db.* TO 'spa_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Bước 3: Deploy Backend

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/HOANGSUNSW/Spa-bookings.git
cd Spa-bookings/backend

# Cài đặt dependencies
npm install

# Tạo file .env
sudo nano .env
# Thêm các biến môi trường:
# DB_HOST=localhost
# DB_USER=spa_user
# DB_PASSWORD=your_password
# DB_NAME=anhthospa_db
# DB_PORT=3306
# PORT=3001
# JWT_SECRET=your-secret-key
# FRONTEND_URL=http://your-domain.com

# Chạy migrations
npm run db:migrate

# Chạy với PM2
pm2 start server.js --name spa-backend
pm2 save
pm2 startup
```

### Bước 4: Deploy Frontend

```bash
cd /var/www/Spa-bookings/frontend

# Cài đặt dependencies
npm install

# Build production
npm run build

# Copy build files
sudo cp -r dist/* /var/www/html/
```

### Bước 5: Cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/spa-app
```

Thêm nội dung:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/spa-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Bước 6: SSL với Let's Encrypt (Tùy chọn)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## 🔧 Cấu Hình Cần Thiết

### Environment Variables cho Backend

```env
# Database
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=anhthospa_db
DB_PORT=3306

# Server
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL
FRONTEND_URL=https://your-frontend-url.com

# VNPay (nếu dùng)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-backend-url.com/api/payments/vnpay-return
```

### Environment Variables cho Frontend

```env
VITE_API_URL=https://your-backend-url.com/api
```

## 📝 Checklist Trước Khi Deploy

- [ ] Đã test tất cả chức năng trên local
- [ ] Đã build frontend thành công (`npm run build`)
- [ ] Đã tạo file `.env` với đầy đủ biến môi trường
- [ ] Đã chạy migrations database
- [ ] Đã cập nhật CORS settings trong backend
- [ ] Đã cập nhật API URL trong frontend
- [ ] Đã backup database (nếu có dữ liệu)

## 🐛 Troubleshooting

### Backend không kết nối được database

- Kiểm tra firewall rules
- Kiểm tra database credentials
- Kiểm tra database đã được tạo chưa

### Frontend không gọi được API

- Kiểm tra CORS settings trong backend
- Kiểm tra API URL trong frontend env
- Kiểm tra Nginx proxy settings

### PM2 không tự động restart

```bash
pm2 save
pm2 startup
# Chạy lệnh được PM2 suggest
```

## 📚 Tài Liệu Tham Khảo

- Vercel: <https://vercel.com/docs>
- Railway: <https://docs.railway.app>
- PM2: <https://pm2.keymetrics.io/docs>
- Nginx: <https://nginx.org/en/docs/>
