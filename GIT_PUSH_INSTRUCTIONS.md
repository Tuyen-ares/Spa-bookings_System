# 🌿 Hướng dẫn tạo nhánh mới và push lên Git

## ⚠️ Lưu ý quan trọng:
- **KHÔNG commit file `backend/.env`** - File này chứa thông tin nhạy cảm (mật khẩu, API key)
- File `.env` đã được thêm vào `.gitignore`

## 📋 Các bước thực hiện:

### Bước 1: Kiểm tra và đảm bảo file .env không bị commit
```bash
# Kiểm tra .gitignore
git check-ignore backend/.env

# Nếu không có output, file .env sẽ bị commit (KHÔNG TỐT)
# Nếu có output, file .env đã được ignore (TỐT)
```

### Bước 2: Tạo nhánh mới
```bash
# Tạo và chuyển sang nhánh mới
git checkout -b feature/chatbot-gemini-integration

# Hoặc tên nhánh khác:
# git checkout -b feature/room-management
# git checkout -b fix/database-connection
# git checkout -b develop
```

### Bước 3: Thêm các file đã thay đổi (trừ .env)
```bash
# Thêm tất cả các file (file .env sẽ tự động bị bỏ qua nếu đã có trong .gitignore)
git add .

# Hoặc thêm từng thư mục cụ thể:
git add frontend/
git add backend/routes/
git add backend/models/
git add backend/config/
git add client/
git add admin/
git add staff/
git add types.ts
git add App.tsx
git add vite.config.ts
```

### Bước 4: Loại bỏ file .env khỏi staging (nếu đã add)
```bash
# Kiểm tra file nào đang được staged
git status

# Nếu thấy backend/.env, loại bỏ nó:
git reset HEAD backend/.env
```

### Bước 5: Commit các thay đổi
```bash
git commit -m "Tích hợp chatbot Gemini, quản lý phòng, và cập nhật database connection"
```

### Bước 6: Push nhánh mới lên remote
```bash
# Push nhánh mới lên remote và set upstream
git push -u origin feature/chatbot-gemini-integration
```

## 🔄 Lệnh đầy đủ (copy và chạy):

```bash
# 1. Tạo nhánh mới
git checkout -b feature/chatbot-gemini-integration

# 2. Thêm các file (file .env sẽ tự động bị bỏ qua)
git add .

# 3. Kiểm tra lại (đảm bảo không có backend/.env)
git status

# 4. Loại bỏ .env nếu có (an toàn)
git reset HEAD backend/.env 2>/dev/null || true

# 5. Commit
git commit -m "Tích hợp chatbot Gemini với REST API, thêm quản lý phòng, và sửa lỗi database connection"

# 6. Push lên remote
git push -u origin feature/chatbot-gemini-integration
```

## 📝 Quy ước đặt tên nhánh:

- `feature/ten-tinh-nang` - Tính năng mới (ví dụ: `feature/chatbot-gemini`)
- `fix/ten-loi` - Sửa lỗi (ví dụ: `fix/database-connection`)
- `hotfix/ten-loi-khan` - Sửa lỗi khẩn cấp
- `develop` - Nhánh phát triển
- `main` hoặc `master` - Nhánh chính (KHÔNG push trực tiếp vào đây)

## ⚠️ Checklist trước khi push:

- [ ] Đã tạo nhánh mới (không push trực tiếp vào main)
- [ ] Đã kiểm tra `.gitignore` có ignore `.env` không
- [ ] Đã kiểm tra `git status` - không có `backend/.env`
- [ ] Đã commit với message rõ ràng
- [ ] Đã test code trước khi push
- [ ] Đã push nhánh mới lên remote

## 🔍 Các lệnh hữu ích khác:

### Xem danh sách nhánh:
```bash
git branch -a
```

### Chuyển sang nhánh khác:
```bash
git checkout main
git checkout feature/chatbot-gemini-integration
```

### Xem thay đổi:
```bash
git status
git diff
```

### Xem lịch sử commit:
```bash
git log --oneline
```

### Undo thay đổi (nếu cần):
```bash
# Hủy thay đổi chưa commit
git restore <file>

# Hủy tất cả thay đổi
git restore .
```

## 🚨 Lưu ý bảo mật:

1. **KHÔNG commit file `.env`** - Chứa mật khẩu và API key
2. **Kiểm tra `.gitignore`** - Đảm bảo `.env` đã được ignore
3. **Review trước khi push** - Kiểm tra `git status` trước khi commit
4. **Sử dụng nhánh riêng** - Không push trực tiếp vào main

