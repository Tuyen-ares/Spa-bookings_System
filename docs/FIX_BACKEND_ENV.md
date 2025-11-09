# 🔧 Hướng dẫn sửa lỗi Database Connection

## ⚠️ Vấn đề:
File `backend/.env` chỉ có `GEMINI_API_KEY` mà thiếu thông tin database, khiến backend không thể kết nối MySQL.

## ✅ Giải pháp:

### Bước 1: Mở file `backend/.env`

### Bước 2: Thêm đầy đủ thông tin database

File `backend/.env` phải có đầy đủ nội dung sau:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=anhthospa_db
DB_USER=root
DB_PASSWORD=your_mysql_password_here

# Server Configuration
PORT=3001

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Database Sync Options
DB_ALTER_ON_START=false

# Gemini AI API Key for Chatbot
GEMINI_API_KEY=AIzaSyCDAE9vYGnzeiOfkligU4d27-kHj4tnqDk
```

### Bước 3: Cập nhật thông tin database của bạn

Thay thế:
- `your_mysql_password_here` → Mật khẩu MySQL của bạn
- `your_jwt_secret_key_here_change_in_production` → Một chuỗi bí mật ngẫu nhiên

### Bước 4: Khởi động lại Backend

```bash
cd backend
npm start
```

## 📝 Lưu ý:

- File `.env` phải có ĐẦY ĐỦ thông tin database
- Không chỉ có `GEMINI_API_KEY`
- Sau khi sửa, phải khởi động lại backend

