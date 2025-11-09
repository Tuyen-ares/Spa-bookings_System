# 🔧 Sửa lỗi MySQL Port

## ⚠️ Vấn đề

Lỗi: `ECONNREFUSED 127.0.0.1:3307`

**Nguyên nhân:**

- MySQL đang chạy trên port **3306** (port mặc định)
- File `backend/.env` có `DB_PORT=3307` (sai)

## ✅ Đã sửa

Đã cập nhật `backend/.env`: `DB_PORT=3306`

## 📝 Khởi động lại Backend

```bash
cd backend
npm start
```

## ✅ Kiểm tra

Sau khi khởi động, bạn sẽ thấy:

```
Database synced.
Server is running on port 3001
```

## 📋 Về việc tách API Key Gemini

**Không cần thiết** tách API key Gemini sang file khác. File `.env` là cách chuẩn để quản lý environment variables.

Tuy nhiên, nếu muốn tổ chức tốt hơn, bạn có thể:

1. Giữ nguyên trong `.env` (khuyến nghị)
2. Hoặc tách sang file riêng như `.env.gemini` (không cần thiết)

## 🔍 Kiểm tra MySQL Port

```bash
# Kiểm tra MySQL đang chạy trên port nào
netstat -ano | findstr :3306
netstat -ano | findstr :3307
```

## ✅ Checklist

- [ ] MySQL đang chạy
- [ ] File `backend/.env` có `DB_PORT=3306` (không phải 3307)
- [ ] Backend server đã được restart
- [ ] Database `anhthospa_db` đã được tạo
