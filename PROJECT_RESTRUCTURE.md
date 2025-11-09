# 📁 Project Structure - Spa Bookings

## ✅ Cấu trúc mới (Organized)

```
Spa-bookings/
├── 📂 frontend/                # Frontend Application
│   ├── admin/                  # Admin dashboard
│   ├── client/                 # Client interface
│   ├── staff/                  # Staff interface
│   ├── components/             # Shared components
│   ├── services/               # API services
│   ├── shared/                 # Utilities
│   ├── public/                 # Static assets
│   ├── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── README.md
│
├── 📂 backend/                 # Backend API
│   ├── controllers/            # ✅ 5 controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── serviceController.js
│   │   ├── appointmentController.js
│   │   └── paymentController.js
│   ├── services/               # ✅ 5 services
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── serviceService.js
│   │   ├── appointmentService.js
│   │   └── paymentService.js
│   ├── routes/                 # ✅ 3/13 refactored
│   │   ├── auth.js             # ✅ Clean
│   │   ├── users.js            # ✅ Clean
│   │   ├── services.js         # ✅ Clean
│   │   ├── appointments.js     # ⏳ Next
│   │   ├── payments.js         # ⏳ Next
│   │   └── ... 8 more files
│   ├── models/                 # Sequelize models
│   ├── migrations/             # ✅ 13 migrations
│   ├── config/                 # Configuration
│   ├── utils/                  # Utilities
│   ├── server.js
│   ├── package.json
│   └── MVC_ARCHITECTURE.md
│
├── 📂 docs/                    # Documentation
│   ├── database.md
│   ├── db.txt
│   ├── chuc_nang.txt
│   ├── FIX_*.md                # Fix guides
│   ├── GEMINI_*.md             # AI setup
│   ├── GIT_*.md                # Git guides
│   └── INDEX.md                # Docs index
│
├── .gitignore
├── .cursorrules
├── README.md                   # Main readme
└── install.sh
```

## 🔄 Thay đổi từ cấu trúc cũ

### ❌ Trước (Messy)

```
Spa-bookings/
├── admin/          ← Frontend, nằm ở root
├── client/         ← Frontend, nằm ở root
├── staff/          ← Frontend, nằm ở root
├── components/     ← Frontend, nằm ở root
├── services/       ← Frontend, nằm ở root
├── public/         ← Frontend, nằm ở root
├── App.tsx         ← Frontend, nằm ở root
├── index.html      ← Frontend, nằm ở root
├── vite.config.ts  ← Frontend, nằm ở root
├── package.json    ← Frontend package.json ở root
├── backend/        ← Backend app
├── database.md     ← Doc ở root
├── db.txt          ← Doc ở root
├── FIX_*.md        ← 15 fix guides ở root
└── ... 30+ files ở root level
```

### ✅ Sau (Clean)

```
Spa-bookings/
├── frontend/       ✅ All frontend files
├── backend/        ✅ All backend files
├── docs/           ✅ All documentation
├── .gitignore
├── .cursorrules
├── README.md
└── install.sh
```

## 📊 Thống kê

### Files di chuyển

- **Frontend**: 16 files/folders → `frontend/`
- **Documentation**: 23 files → `docs/`
- **Backend**: Giữ nguyên trong `backend/`

### Root directory

- **Trước**: ~40 files/folders
- **Sau**: 7 items (4 files + 3 folders)
- **Giảm**: ~83% clutter

## 🎯 Lợi ích

### 1. Tổ chức tốt hơn

- Frontend và Backend tách biệt rõ ràng
- Documentation tập trung một chỗ
- Dễ navigate và tìm kiếm

### 2. Dễ maintain

- Mỗi phần có README riêng
- Dependency management rõ ràng
- Scope isolation

### 3. Deploy friendly

```bash
# Deploy frontend
cd frontend && npm run build

# Deploy backend
cd backend && npm start
```

### 4. Git friendly

```bash
# Work on frontend
cd frontend
git checkout feature/new-ui

# Work on backend
cd backend
git checkout feature/new-api
```

### 5. Docker ready

```dockerfile
# Frontend Dockerfile
FROM node:18
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Backend Dockerfile
FROM node:18
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
CMD ["node", "server.js"]
```

## 📝 Scripts mới

### Root package.json (Optional)

```json
{
  "scripts": {
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm start",
    "dev:all": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "build:frontend": "cd frontend && npm run build",
    "test:frontend": "cd frontend && npm test",
    "test:backend": "cd backend && npm test"
  }
}
```

## 🚀 Workflow mới

### Setup dự án

```bash
# Clone repo
git clone <repo-url>
cd Spa-bookings

# Install all dependencies
npm run install:all

# Or install separately
cd frontend && npm install
cd ../backend && npm install
```

### Development

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm start
```

### Build & Deploy

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## 📚 Documentation Links

- [Main README](../README.md)
- [Frontend README](../frontend/README.md)
- [Backend MVC Architecture](../backend/MVC_ARCHITECTURE.md)
- [Documentation Index](../docs/INDEX.md)

## ✅ Checklist

- [x] Tạo thư mục `frontend/`
- [x] Di chuyển frontend files vào `frontend/`
- [x] Tạo thư mục `docs/`
- [x] Di chuyển documentation vào `docs/`
- [x] Tạo README cho mỗi thư mục
- [x] Dọn dẹp root directory
- [x] Xóa folder lỗi `backend/frontend/`
- [ ] Update import paths trong code (nếu cần)
- [ ] Test frontend build
- [ ] Test backend server
- [ ] Update .gitignore (nếu cần)
- [ ] Update CI/CD config (nếu có)

## ⚠️ Migration Notes

### Import paths

Nếu có relative imports giữa frontend và backend (không nên có), cần update paths.

### Environment variables

- Frontend: `frontend/.env`
- Backend: `backend/.env`

### Git

Có thể cần rebase hoặc merge conflicts nếu có branches đang active.

## 🎉 Kết quả

✅ **Cấu trúc clean và professional**
✅ **Dễ scale và maintain**
✅ **Ready cho CI/CD**
✅ **Docker-friendly**
✅ **Team-friendly**
