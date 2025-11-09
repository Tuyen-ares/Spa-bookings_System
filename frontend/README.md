# Frontend - Spa Bookings

## 📁 Cấu trúc Frontend

```
frontend/
├── admin/                  # Admin Dashboard
│   ├── components/         # Admin-specific components
│   │   ├── AdminHeader.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── ... (modals, forms)
│   └── pages/              # Admin pages
│       ├── OverviewPage.tsx
│       ├── AppointmentsPage.tsx
│       ├── ServicesPage.tsx
│       ├── UsersPage.tsx
│       ├── PaymentsPage.tsx
│       ├── PromotionsPage.tsx
│       ├── StaffPage.tsx
│       └── ReportsPage.tsx
│
├── client/                 # Client Interface
│   ├── components/         # Client-specific components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Chatbot.tsx
│   │   └── ServiceCard.tsx
│   └── pages/              # Client pages
│       ├── HomePage.tsx
│       ├── ServicesListPage.tsx
│       ├── ServiceDetailPage.tsx
│       ├── BookingPage.tsx
│       ├── AppointmentsPage.tsx
│       ├── ProfilePage.tsx
│       ├── PromotionsPage.tsx
│       ├── LoginPage.tsx
│       └── RegisterPage.tsx
│
├── staff/                  # Staff Interface
│   ├── components/         # Staff-specific components
│   └── pages/              # Staff pages
│       ├── StaffAppointmentsPage.tsx
│       └── StaffUpsellingPage.tsx
│
├── components/             # Shared Components
│   ├── ProtectedRoute.tsx  # Auth route guard
│   ├── Header.tsx          # Common header
│   ├── Footer.tsx          # Common footer
│   └── ServiceCard.tsx     # Reusable service card
│
├── services/               # API Services
│   ├── apiService.ts       # Generic API client
│   ├── chatbotService.ts   # Chatbot API
│   └── geminiService.ts    # Gemini AI integration
│
├── shared/                 # Shared Utilities
│   └── icons.tsx           # Icon components
│
├── public/                 # Static Assets
│   └── img/                # Images
│
├── App.tsx                 # Main App component with routing
├── index.tsx               # React entry point
├── index.html              # HTML template
├── constants.tsx           # App constants
├── types.ts                # TypeScript types
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

## 🎨 Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: TailwindCSS (assumed)
- **State Management**: React Hooks
- **API Client**: Fetch API

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

App will run on http://localhost:5173

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🔑 Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 📱 Pages & Routes

### Client Routes (/)

- `/` - Home page
- `/services` - Services list
- `/services/:id` - Service detail
- `/booking` - Book appointment
- `/appointments` - My appointments
- `/profile` - User profile
- `/promotions` - Promotions & vouchers
- `/login` - Login
- `/register` - Register
- `/contact` - Contact page
- `/qa` - Q&A page

### Admin Routes (/admin)

- `/admin` - Dashboard overview
- `/admin/appointments` - Manage appointments
- `/admin/services` - Manage services
- `/admin/users` - Manage users
- `/admin/staff` - Manage staff
- `/admin/payments` - Payment records
- `/admin/promotions` - Promotions & vouchers
- `/admin/loyalty-shop` - Loyalty shop
- `/admin/marketing` - Marketing tools
- `/admin/reports` - Reports & analytics

### Staff Routes (/staff)

- `/staff/appointments` - View assigned appointments
- `/staff/upselling` - Upselling opportunities

## 🎭 User Roles

### Admin

- Full access to all features
- Manage users, staff, services
- View analytics & reports
- Approve/reject appointments

### Staff

- View assigned appointments
- Mark appointments complete
- View upselling opportunities
- Manage own schedule

### Client

- Browse services
- Book appointments
- View appointment history
- Earn & redeem loyalty points
- Write reviews

## 🧩 Key Components

### Admin Components

- `AdminLayout` - Admin page wrapper with sidebar
- `AdminHeader` - Admin navigation header
- `Sidebar` - Admin navigation sidebar
- `AddEditServiceModal` - Service form modal
- `AddEditPromotionModal` - Promotion form modal
- `AssignScheduleModal` - Staff schedule assignment

### Client Components

- `Header` - Client navigation header
- `Footer` - Site footer
- `ServiceCard` - Display service info
- `PromotionCard` - Display promotion
- `Chatbot` - AI chatbot interface
- `SkeletonLoader` - Loading placeholder

### Shared Components

- `ProtectedRoute` - Auth guard for protected routes
- `ServiceCard` - Reusable service display

## 🔐 Authentication

- JWT-based authentication
- Token stored in localStorage
- Protected routes with `ProtectedRoute` component
- Auto-redirect to login if unauthorized

## 📡 API Integration

### API Service (`services/apiService.ts`)

```typescript
// GET request
const services = await api.get("/services");

// POST request
const result = await api.post("/appointments", data);

// PUT request
await api.put("/users/:id", userData);

// DELETE request
await api.delete("/services/:id");
```

### Chatbot Service (`services/chatbotService.ts`)

```typescript
const response = await chatbot.sendMessage(message);
```

## 🎨 Styling

- Custom CSS/SCSS (check actual implementation)
- Responsive design
- Mobile-first approach
- Consistent color scheme

## 🐛 Known Issues

- Check GitHub issues for current bugs
- Report new issues with detailed description

## 📝 TODO

- [ ] Add unit tests
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Improve accessibility (a11y)
- [ ] Add PWA support
- [ ] Optimize bundle size
- [ ] Add error boundary
- [ ] Add loading states
- [ ] Improve SEO

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📞 Support

Contact development team for support and questions.
