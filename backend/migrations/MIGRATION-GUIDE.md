# Database Migrations

This directory contains database migration files for the Anh Thơ Spa application.

## 🗂️ Migration Files Overview

Migrations are executed in sequential order based on timestamps in filenames:

### Core Tables

1. **20250113000001-create-users.js** - User accounts (Admin, Staff, Client)
2. **20250113000002-create-rooms.js** - Treatment rooms
3. **20250113000003-create-service-categories.js** - Service categories
4. **20250113000004-create-services.js** - Spa services
5. **20250113000005-create-appointments.js** - Booking appointments
6. **20250113000006-create-payments.js** - Payment transactions
7. **20250113000007-create-staff-shifts.js** - Staff shift schedules
8. **20250113000008-create-promotions.js** - Promotions and vouchers
9. **20250113000009-create-notifications.js** - User notifications
10. **20250113000010-create-wallets.js** - Loyalty points and tiers
11. **20250113000011-create-reviews.js** - Service reviews
12. **20250113000012-create-treatment-courses.js** - Multi-session treatment packages

## 🚀 Running Migrations

### Prerequisites

- MySQL server running (default port: 3307)
- Database configured in `.env` file
- Sequelize CLI installed globally: `npm install -g sequelize-cli`

### Commands

#### Run all pending migrations

```bash
npx sequelize-cli db:migrate
```

#### Undo last migration

```bash
npx sequelize-cli db:migrate:undo
```

#### Undo all migrations

```bash
npx sequelize-cli db:migrate:undo:all
```

#### Check migration status

```bash
npx sequelize-cli db:migrate:status
```

## 📋 Database Schema Summary

### Key Tables & Relationships

**Users** → Appointments (client), Payments, Wallets, Staff Shifts (staff)  
**Rooms** → Appointments, Staff Shifts  
**Services** → Appointments, Reviews, Treatment Courses  
**Appointments** → Payments, Reviews  
**Payments** → Status: Pending (Cash requires admin confirmation) → Completed

### Important Notes

1. **Payment Status Flow**:

   - Cash payments: Start as `Pending`, require admin confirmation to become `Completed`
   - VNPay payments: Start as `Pending`, auto-updated to `Completed` after callback

2. **Appointment Status**:

   - `pending` - Newly created, awaiting confirmation
   - `upcoming` - Confirmed and scheduled
   - `in-progress` - Currently being performed
   - `completed` - Finished
   - `cancelled` - Cancelled by user/admin

3. **Staff Shifts**:

   - Requires `roomId` assignment
   - Prevents duplicate shifts (same staff, date, shift type)
   - Status: `pending` → `approved` → visible to customers

4. **Notifications**:
   - Added `payment_received` type for cash payment alerts
   - Types: new_appointment, appointment_confirmed, payment_success, etc.

## 🔧 Troubleshooting

### Connection Issues

If you get connection errors, verify:

- MySQL service is running
- `.env` file has correct database credentials
- Port 3307 is correct (or change in `.env`)

### Migration Conflicts

If migrations fail:

```bash
# Check which migrations have run
npx sequelize-cli db:migrate:status

# Undo problematic migration
npx sequelize-cli db:migrate:undo

# Fix the migration file
# Re-run migrations
npx sequelize-cli db:migrate
```

## 📝 Creating New Migrations

```bash
npx sequelize-cli migration:generate --name your-migration-name
```

Follow the existing migration patterns for consistency.

## 🔄 Re-creating Database from Scratch

If you need to completely reset the database:

```bash
# 1. Drop and recreate database (run in MySQL)
DROP DATABASE IF EXISTS anhthospa_db;
CREATE DATABASE anhthospa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Run all migrations
cd backend
npx sequelize-cli db:migrate

# 3. Seed data (if you have seeders)
npx sequelize-cli db:seed:all
```
