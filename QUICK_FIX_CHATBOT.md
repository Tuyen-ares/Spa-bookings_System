# 🔧 Hướng dẫn nhanh sửa lỗi Chatbot

## ⚠️ Lỗi: "Không thể kết nối đến dịch vụ chatbot"

### Nguyên nhân:
1. **Backend server chưa chạy** hoặc chưa có file `backend/.env` với `GEMINI_API_KEY`

## ✅ Giải pháp nhanh:

### Bước 1: Kiểm tra file backend/.env

File `backend/.env` đã được tạo với nội dung:
```
GEMINI_API_KEY=AIzaSyAT9cKxM0L_h8UEsxCaJHnHvBcO915ySB8
```

**Nếu file chưa có**, tạo thủ công:
1. Mở file `backend/env.example`
2. Copy toàn bộ nội dung
3. Tạo file mới `backend/.env`
4. Paste nội dung vào
5. Thay `your_gemini_api_key_here` bằng `AIzaSyAT9cKxM0L_h8UEsxCaJHnHvBcO915ySB8`

### Bước 2: Kiểm tra Backend Server đang chạy

**Mở terminal mới và chạy:**
```bash
cd backend
npm start
```

**Kiểm tra log:**
```
Database synced.
Server is running on port 3001
Access the API at http://localhost:3001
```

**Nếu thấy lỗi:**
- "Cannot find module '@google/genai'" → Chạy: `npm install @google/genai`
- "GEMINI_API_KEY is not set" → Kiểm tra file `backend/.env`

### Bước 3: Test Backend Endpoint

**Mở browser và vào:**
```
http://localhost:3001/api/chatbot/test
```

**Kỳ vọng response:**
```json
{
  "message": "Chatbot endpoint is working",
  "hasApiKey": true,
  "apiKeyLength": 39,
  "apiKeyPrefix": "AIzaSyAT9c..."
}
```

**Nếu `hasApiKey: false`:**
- File `backend/.env` chưa có `GEMINI_API_KEY`
- Hoặc backend server chưa load file `.env`
- → **Khởi động lại backend server**

### Bước 4: Kiểm tra Frontend Console

**Mở browser Console (F12):**
1. Vào tab Console
2. Gửi tin nhắn trong chatbot
3. Tìm log: `Calling chatbot API:`
4. Xem có lỗi gì không

**Các lỗi thường gặp:**
- `Failed to fetch` → Backend server chưa chạy
- `404 Not Found` → Route chưa được đăng ký
- `500 Internal Server Error` → Xem backend console log

### Bước 5: Kiểm tra Backend Console

**Xem terminal đang chạy backend:**
- Tìm log: `=== Chatbot Endpoint Called ===`
- Xem `GEMINI_API_KEY exists: true/false`
- Xem có lỗi gì không

## 🚀 Quick Start

**Nếu mọi thứ đã sẵn sàng:**

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```

3. **Test:**
   - Mở: `http://localhost:3000`
   - Click chatbot
   - Gửi tin nhắn: "Xin chào"

## 📝 Checklist

- [ ] File `backend/.env` tồn tại
- [ ] File `backend/.env` có `GEMINI_API_KEY=AIzaSyAT9cKxM0L_h8UEsxCaJHnHvBcO915ySB8`
- [ ] Backend server đang chạy trên port 3001
- [ ] Test endpoint `/api/chatbot/test` trả về `hasApiKey: true`
- [ ] Frontend đang chạy trên port 3000
- [ ] Console không có lỗi CORS

## 🐛 Nếu vẫn không hoạt động:

1. **Kiểm tra Backend đang chạy:**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Nếu không thấy port 3001 → Backend chưa chạy
   ```

2. **Kiểm tra file .env:**
   ```bash
   # Windows PowerShell
   Get-Content backend\.env
   
   # Phải thấy: GEMINI_API_KEY=AIzaSyAT9cKxM0L_h8UEsxCaJHnHvBcO915ySB8
   ```

3. **Khởi động lại tất cả:**
   - Dừng backend (Ctrl+C)
   - Dừng frontend (Ctrl+C)
   - Khởi động lại backend
   - Khởi động lại frontend

## 💡 Tips

- **Luôn kiểm tra backend console log** để xem lỗi chi tiết
- **Backend phải chạy trước frontend**
- **File `.env` phải ở thư mục `backend/` (không phải root)**
- **Sau khi tạo/cập nhật `.env`, phải khởi động lại backend**

