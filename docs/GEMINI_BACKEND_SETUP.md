# Hướng dẫn thiết lập Gemini Chatbot Backend

## ✅ Đã hoàn thành

1. ✅ Đã tạo backend endpoint `/api/chatbot/chat`
2. ✅ Đã cập nhật frontend để gọi backend endpoint (an toàn hơn)
3. ✅ Đã tạo file `backend/.env` với GEMINI_API_KEY
4. ✅ Đã cập nhật `backend/env.example`

## 🔧 Cài đặt

### Bước 1: Cài đặt package @google/genai

```bash
cd backend
npm install @google/genai
```

**Lưu ý**: Nếu gặp lỗi network, bạn có thể:

- Thử lại sau
- Hoặc cài thủ công: Copy package từ frontend `node_modules/@google/genai` sang `backend/node_modules/`

### Bước 2: Kiểm tra file backend/.env

Đảm bảo file `backend/.env` có nội dung:

```
GEMINI_API_KEY=AIzaSyAT9cKxM0L_h8UEsxCaJHnHvBcO915ySB8
```

### Bước 3: Khởi động lại Backend Server

```bash
cd backend
npm start
```

Bạn sẽ thấy log:

```
Server is running on port 3001
Access the API at http://localhost:3001
```

### Bước 4: Khởi động Frontend

```bash
npm run dev
```

## 📋 Kiểm tra

### Test Backend Endpoint

```bash
curl -X POST http://localhost:3001/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "history": [
      {"sender": "user", "text": "Xin chào"}
    ],
    "services": [],
    "treatmentCourses": []
  }'
```

### Test từ Frontend

1. Mở website: `http://localhost:3000`
2. Click vào nút chatbot
3. Thử hỏi: "Dịch vụ nào tốt cho da mụn?"

## 🔒 Bảo mật

- ✅ API key được lưu trong `backend/.env` (không commit lên Git)
- ✅ Frontend gọi backend endpoint, không gọi trực tiếp Gemini API
- ✅ API key không được expose ra frontend

## 🐛 Troubleshooting

### Lỗi: "Cannot find module '@google/genai'"

**Giải pháp**: Cài đặt package

```bash
cd backend
npm install @google/genai
```

### Lỗi: "GEMINI_API_KEY is not set"

**Giải pháp**:

1. Kiểm tra file `backend/.env` có tồn tại không
2. Kiểm tra nội dung file có `GEMINI_API_KEY=...`
3. Khởi động lại backend server

### Lỗi: "Cannot connect to backend"

**Giải pháp**:

1. Đảm bảo backend server đang chạy trên port 3001
2. Kiểm tra CORS settings trong `backend/server.js`
3. Kiểm tra firewall/antivirus không block port 3001

## 📝 Cấu trúc

```
Frontend (React)
    ↓ (HTTP POST)
Backend API (/api/chatbot/chat)
    ↓ (GoogleGenAI SDK)
Gemini API
```

## ✅ Checklist

- [ ] Đã cài đặt `@google/genai` trong backend
- [ ] File `backend/.env` đã có `GEMINI_API_KEY`
- [ ] Backend server đang chạy trên port 3001
- [ ] Frontend đang chạy trên port 3000
- [ ] Chatbot hoạt động bình thường
