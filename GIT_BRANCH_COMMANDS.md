# 🌿 Hướng dẫn tạo nhánh mới và push lên Git

## 📋 Các bước thực hiện:

### Bước 1: Kiểm tra trạng thái hiện tại
```bash
git status
git branch
git remote -v
```

### Bước 2: Tạo và chuyển sang nhánh mới
```bash
# Tạo nhánh mới và chuyển sang nhánh đó
git checkout -b ten-nhanh-moi

# Hoặc (Git 2.23+)
git switch -c ten-nhanh-moi
```

**Ví dụ:**
```bash
git checkout -b feature/chatbot-gemini
# hoặc
git checkout -b develop
# hoặc
git checkout -b fix/database-connection
```

### Bước 3: Thêm các thay đổi (nếu có)
```bash
# Xem các file đã thay đổi
git status

# Thêm tất cả các file đã thay đổi
git add .

# Hoặc thêm từng file cụ thể
git add backend/.env
git add backend/routes/chatbot.js
git add client/services/geminiService.ts
```

### Bước 4: Commit các thay đổi
```bash
git commit -m "Mô tả ngắn gọn về thay đổi"
```

**Ví dụ:**
```bash
git commit -m "Tích hợp chatbot Gemini với REST API và sửa lỗi database connection"
```

### Bước 5: Push nhánh mới lên remote
```bash
# Push nhánh mới lên remote và set upstream
git push -u origin ten-nhanh-moi
```

**Ví dụ:**
```bash
git push -u origin feature/chatbot-gemini
```

## 📝 Quy ước đặt tên nhánh:

- `feature/ten-tinh-nang` - Tính năng mới
- `fix/ten-loi` - Sửa lỗi
- `hotfix/ten-loi-khan` - Sửa lỗi khẩn cấp
- `develop` - Nhánh phát triển
- `main` hoặc `master` - Nhánh chính

## 🔄 Các lệnh hữu ích khác:

### Xem danh sách nhánh:
```bash
git branch -a
```

### Chuyển sang nhánh khác:
```bash
git checkout ten-nhanh
# hoặc
git switch ten-nhanh
```

### Xóa nhánh local:
```bash
git branch -d ten-nhanh
```

### Xóa nhánh trên remote:
```bash
git push origin --delete ten-nhanh
```

### Cập nhật nhánh từ remote:
```bash
git pull origin ten-nhanh
```

### Merge nhánh vào main:
```bash
git checkout main
git merge ten-nhanh
git push origin main
```

## ⚠️ Lưu ý:

1. **Không commit file `.env`**: File `.env` chứa thông tin nhạy cảm, đảm bảo đã có trong `.gitignore`

2. **Kiểm tra `.gitignore`**: Đảm bảo các file sau đã được ignore:
   - `.env`
   - `backend/.env`
   - `node_modules/`
   - `*.log`

3. **Commit message**: Viết commit message rõ ràng, mô tả đúng thay đổi

4. **Push thường xuyên**: Push code thường xuyên để backup và đồng bộ với team

## 📋 Checklist trước khi push:

- [ ] Đã kiểm tra `git status`
- [ ] Đã thêm các file cần thiết (`git add`)
- [ ] Đã commit với message rõ ràng
- [ ] Đã kiểm tra `.gitignore` (không commit file nhạy cảm)
- [ ] Đã test code trước khi push
- [ ] Đã push nhánh mới lên remote

