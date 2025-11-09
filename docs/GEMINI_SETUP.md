# Hướng dẫn thiết lập Gemini API Key

## ✅ Đã hoàn thành

1. ✅ File `.env` đã được tạo với API key: `AIzaSyAT9cKxM0L_h8UEsxCaJHnHvBcO915ySB8`
2. ✅ File `.env` đã được thêm vào `.gitignore` (bảo mật)
3. ✅ Code đã được cập nhật để load API key từ nhiều nguồn
4. ✅ Đã thêm debug logging để kiểm tra

## 🔧 Các bước để chatbot hoạt động

### Bước 1: Kiểm tra file .env
Đảm bảo file `.env` tồn tại ở thư mục gốc với nội dung:
```
GEMINI_API_KEY=AIzaSyAT9cKxM0L_h8UEsxCaJHnHvBcO915ySB8
```

### Bước 2: **QUAN TRỌNG - Khởi động lại Dev Server**
Sau khi tạo/cập nhật file `.env`, bạn **PHẢI** khởi động lại dev server:

1. **Dừng server hiện tại**: Nhấn `Ctrl+C` trong terminal đang chạy `npm run dev`
2. **Khởi động lại server**: Chạy lại `npm run dev`

**Lý do**: Vite chỉ load environment variables khi khởi động, không tự động reload khi file `.env` thay đổi.

### Bước 3: Kiểm tra Console
Mở trình duyệt và kiểm tra Console (F12):
- Nếu thấy log: `Gemini API Key check: { hasKey: true, ... }` → API key đã được load thành công
- Nếu thấy log: `Gemini API Key check: { hasKey: false, ... }` → API key chưa được load

### Bước 4: Test Chatbot
1. Mở website: `http://localhost:3000`
2. Click vào nút chatbot (góc dưới bên phải)
3. Thử hỏi: "Dịch vụ nào tốt cho da mụn?"
4. Chatbot sẽ tư vấn dựa trên dữ liệu từ database

## 🐛 Troubleshooting

### Vấn đề: Chatbot vẫn báo lỗi "thiếu khóa API"

**Giải pháp 1**: Khởi động lại dev server
```bash
# Dừng server (Ctrl+C)
# Sau đó chạy lại
npm run dev
```

**Giải pháp 2**: Kiểm tra file .env
```bash
# Windows
type .env

# Linux/Mac
cat .env
```

Đảm bảo file có định dạng đúng:
```
GEMINI_API_KEY=AIzaSyAT9cKxM0L_h8UEsxCaJHnHvBcO915ySB8
```

**Giải pháp 3**: Kiểm tra Console (F12)
- Mở Developer Tools (F12)
- Vào tab Console
- Tìm log: `Gemini API Key check:`
- Xem giá trị `hasKey` là `true` hay `false`

**Giải pháp 4**: Xóa cache và rebuild
```bash
# Xóa node_modules và reinstall
rm -rf node_modules
npm install

# Hoặc
npm run build
npm run dev
```

## 📝 Lưu ý

1. **Bảo mật**: File `.env` đã được thêm vào `.gitignore`, không commit lên Git
2. **API Key**: Không chia sẻ API key công khai
3. **Restart**: Luôn restart dev server sau khi thay đổi file `.env`

## 🔍 Debug Information

Code đã được cập nhật để:
- Thử load API key từ nhiều nguồn: `process.env.GEMINI_API_KEY`, `process.env.API_KEY`, `import.meta.env.VITE_GEMINI_API_KEY`
- Log thông tin debug vào Console (không expose full API key)
- Hiển thị hướng dẫn rõ ràng khi thiếu API key

## ✅ Checklist

- [x] File `.env` đã được tạo
- [x] API key đã được thêm vào `.env`
- [x] File `.env` đã được thêm vào `.gitignore`
- [ ] Dev server đã được restart sau khi tạo `.env`
- [ ] Console log hiển thị `hasKey: true`
- [ ] Chatbot hoạt động bình thường

