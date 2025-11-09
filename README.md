# Spa Bookings - Project Structure

## 📁 Cấu trúc dự án

```
Spa-bookings/
├── frontend/           # Frontend React + TypeScript + Vite
│   ├── admin/          # Admin dashboard pages & components
│   ├── client/         # Client-facing pages & components
│   ├── staff/          # Staff interface pages
│   ├── components/     # Shared React components
│   ├── services/       # API service functions
│   ├── shared/         # Shared utilities & icons
│   ├── public/         # Static assets
│   ├── App.tsx         # Main App component
│   ├── index.html      # HTML entry point
│   ├── index.tsx       # React entry point
│   ├── vite.config.ts  # Vite configuration
│   ├── tsconfig.json   # TypeScript config
│   └── package.json    # Frontend dependencies
│
├── backend/            # Backend Node.js + Express + Sequelize
│   ├── controllers/    # HTTP request handlers
│   ├── services/       # Business logic layer
│   ├── routes/         # API route definitions
│   ├── models/         # Sequelize models
│   ├── migrations/     # Database migrations
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   ├── server.js       # Express server entry
│   └── package.json    # Backend dependencies
│
└── docs/               # Documentation & notes
    ├── README.md       # Main documentation
    ├── database.md     # Database schema docs
    ├── db.txt          # Database schema SQL
    ├── chuc_nang.txt   # Feature list (Vietnamese)
    ├── lieu_trinh.txt  # Treatment courses info
    └── *.md            # Various setup & fix guides
```

## 🚀 Quick Start

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
npm install
npm start
```

## 📚 Documentation

- [Database Schema](./docs/database.md)
- [Features List](./docs/chuc_nang.txt)
- [Backend Setup](./docs/GEMINI_BACKEND_SETUP.md)
- [Fix Guides](./docs/) - Various troubleshooting guides

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **UI**: Custom components + TailwindCSS
- **State**: React Hooks

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL 8.x
- **ORM**: Sequelize
- **Auth**: JWT + bcrypt
- **API**: RESTful API
- **Payment**: VNPay integration
- **AI**: Google Gemini API

## 🏗️ Architecture

```
Client (React)
    ↓
API Routes (Express)
    ↓
Controllers (HTTP handling)
    ↓
Services (Business logic)
    ↓
Models (Sequelize ORM)
    ↓
Database (MySQL)
```

## 📦 Main Features

1. **User Management** (Admin, Staff, Client roles)
2. **Service Management** (Categories, services, pricing)
3. **Appointment Booking** (Smart therapist assignment)
4. **Payment Processing** (VNPay, Cash, Card)
5. **Reviews & Ratings**
6. **Staff Scheduling** (Availability, shifts, tasks)
7. **Loyalty Program** (Points, tiers, vouchers)
8. **Treatment Courses** (Multi-session bookings)
9. **Chatbot** (AI-powered with Gemini)
10. **Analytics Dashboard** (Admin overview)

## 🔐 Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_gemini_key
```

### Backend (.env)

```
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=anhthospa_db
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_key
VNP_TMN_CODE=your_vnpay_code
VNP_HASH_SECRET=your_vnpay_secret
```

## 🗄️ Database

- **Type**: MySQL 8.x
- **Tables**: 13 tables
  - users, service_categories, services
  - wallets, appointments, payments
  - promotions, reviews, treatment_courses
  - staff_availability, staff_shifts, staff_tasks, rooms

## 📝 API Endpoints

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/change-password`

### Users

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Services

- `GET /api/services`
- `GET /api/services/:id`
- `POST /api/services`
- `PUT /api/services/:id`

### Appointments

- `GET /api/appointments`
- `POST /api/appointments`
- `PUT /api/appointments/:id`
- `PUT /api/appointments/:id/complete`

### Payments

- `GET /api/payments`
- `POST /api/payments/process`
- `POST /api/payments/create-vnpay-url`

... and more (see backend/routes/ for complete list)

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
npm run test
```

## 📄 License

Private - Anh Thơ Spa Management System

## 👥 Team

Developed with ❤️ for Anh Thơ Spa
