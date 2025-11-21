# ✅ CHECKLIST TESTING - SPA BOOKING MOBILE APP

## 📋 Pre-Testing Setup

### Backend

- [ ] Backend đang chạy trên http://localhost:3001
- [ ] Test API: `curl http://localhost:3001/api/services` (phải trả về JSON)
- [ ] Database có data mẫu (services, users, appointments)

### Mobile Config

- [ ] Đã update `API_BASE_URL` trong `src/services/apiService.ts`
- [ ] IP address đúng (nếu test trên thiết bị thực)
- [ ] Điện thoại và máy tính cùng WiFi
- [ ] Expo server đang chạy

---

## 🔐 AUTHENTICATION FLOW

### Test Login

- [ ] Mở app → Hiển thị màn Login
- [ ] Nhập email sai → Show error "Đăng nhập thất bại"
- [ ] Nhập email/password đúng → Chuyển sang Main app
- [ ] Token được lưu vào AsyncStorage
- [ ] Tắt app → Mở lại → Tự động login (không cần nhập lại)

### Test Register

- [ ] Bấm "Đăng ký" từ màn Login
- [ ] Không nhập gì → Show error "Vui lòng nhập tên, email và mật khẩu"
- [ ] Nhập password < 6 ký tự → Show error
- [ ] Điền đầy đủ thông tin → Đăng ký thành công → Vào Main app
- [ ] Chọn giới tính (Nam/Nữ/Khác)
- [ ] Birthday & phone optional

### Test Logout

- [ ] Vào Profile tab
- [ ] Bấm "Đăng xuất"
- [ ] Confirm dialog xuất hiện
- [ ] Bấm "Đăng xuất" → Quay lại màn Login
- [ ] Token đã bị xóa khỏi AsyncStorage

---

## 📅 APPOINTMENTS

### List View

- [ ] Tab "Lịch hẹn" hiển thị danh sách
- [ ] Mỗi appointment có: service name, date, time, therapist, price
- [ ] Status badge hiện màu đúng:
  - Green: completed
  - Blue: upcoming
  - Orange: pending
  - Red: cancelled
- [ ] Pull down → Refresh danh sách
- [ ] Nếu chưa có lịch → Hiển thị empty state

### Detail View

- [ ] Click appointment → Vào detail screen
- [ ] Hiển thị đầy đủ: service name, date, time, therapist, notes
- [ ] Payment status (Paid/Unpaid)
- [ ] Rating (nếu có)
- [ ] Nếu status = pending/upcoming → Show button "Hủy lịch hẹn"

### Cancel Appointment

- [ ] Bấm "Hủy lịch hẹn"
- [ ] Confirm dialog xuất hiện
- [ ] Bấm "Hủy lịch" → API call thành công
- [ ] Alert "Đã hủy lịch hẹn"
- [ ] Quay lại list → Lịch đã bị hủy (status = cancelled)

---

## 📚 TREATMENT COURSES

### List View - Tab 1: Khóa của tôi

- [ ] Hiển thị courses đã đăng ký
- [ ] Mỗi course có: name, consultant, progress, status
- [ ] Progress bar hiển thị % hoàn thành
- [ ] Badge: Hoàn thành X/Y buổi
- [ ] Pull to refresh

### List View - Tab 2: Khóa có sẵn

- [ ] Hiển thị templates (khóa chưa đăng ký)
- [ ] Mỗi course có: name, price, total sessions
- [ ] Pull to refresh

### Detail View - Template

- [ ] Click template course → Vào detail
- [ ] Hiển thị: name, description, price, total sessions, consultant
- [ ] List dịch vụ trong khóa
- [ ] Button "Đăng ký khóa học" ở dưới cùng

### Register for Course

- [ ] Bấm "Đăng ký khóa học"
- [ ] API call thành công
- [ ] Alert "Đã đăng ký khóa học"
- [ ] Quay lại tab "Khóa của tôi" → Course mới xuất hiện

### Detail View - Registered Course

- [ ] Click registered course → Vào detail
- [ ] Hiển thị progress stats (Hoàn thành, Đã đặt, Chưa đặt)
- [ ] Progress bar
- [ ] Danh sách sessions với status:
  - Completed (green)
  - Scheduled (blue)
  - Pending (orange)

### Schedule Session

- [ ] Click session có status "pending"
- [ ] Button "Đặt lịch" xuất hiện
- [ ] Bấm "Đặt lịch" → Form scheduling mở ra
- [ ] Date auto-fill với today
- [ ] Chọn service từ dropdown
- [ ] Chọn staff (optional)
- [ ] Nhập notes (optional)
- [ ] Bấm "Xác nhận đặt lịch"
- [ ] Alert "Đã đặt lịch buổi học"
- [ ] Quay lại detail → Session status = scheduled

---

## 👤 PROFILE

### View Profile

- [ ] Tab "Hồ sơ" hiển thị thông tin
- [ ] Avatar placeholder
- [ ] Name, email, role
- [ ] Phone (nếu có)
- [ ] Birthday (nếu có)
- [ ] Gender (nếu có)

### Options (Placeholders)

- [ ] Button "Đổi mật khẩu" hiển thị
- [ ] Button "Thông báo" hiển thị
- [ ] Button "Hỗ trợ" hiển thị
- [ ] Version number ở bottom

---

## 🎨 UI/UX CHECKS

### Theme & Colors

- [ ] Purple theme (#8b5cf6) consistent
- [ ] Cards có shadows
- [ ] Status colors đúng (green, blue, orange, red)
- [ ] Icons sử dụng Ionicons

### Navigation

- [ ] Bottom tabs hoạt động (Lịch hẹn, Khóa học, Hồ sơ)
- [ ] Back button hoạt động trên all stacks
- [ ] Header titles đúng tiếng Việt

### Loading States

- [ ] Spinner hiển thị khi loading data
- [ ] Button disabled khi submitting
- [ ] ActivityIndicator trong button khi loading

### Error Handling

- [ ] Network error → Alert "Không thể tải dữ liệu"
- [ ] Validation error → Alert với message cụ thể
- [ ] API error → Alert với error message từ backend

### Performance

- [ ] Pull-to-refresh smooth
- [ ] Navigation smooth (không lag)
- [ ] Scrolling smooth
- [ ] Fast refresh hoạt động khi edit code

---

## 🐛 EDGE CASES

- [ ] Không có internet → Error message
- [ ] Backend offline → Error message
- [ ] Empty lists → Empty state với icon + text
- [ ] Token expired → Auto logout → Quay lại Login
- [ ] Đăng ký trùng course → Error "Đã đăng ký rồi"
- [ ] Cancel appointment đã cancelled → Should fail

---

## ✅ FINAL CHECKS

- [ ] App không crash khi:
  - Switch tabs nhanh
  - Back và forward navigation
  - Pull refresh nhiều lần
  - Submit form nhanh liên tiếp
- [ ] AsyncStorage hoạt động (token persist qua app restart)
- [ ] All API calls có try/catch
- [ ] All async operations có loading state
- [ ] Console không có errors (trừ warnings)

---

## 📊 TEST ACCOUNTS

Tạo test accounts trong database:

```sql
-- Client account
INSERT INTO users (name, email, password, role) VALUES
('Test Client', 'client@test.com', 'hashed_password', 'Client');

-- Staff account
INSERT INTO users (name, email, password, role) VALUES
('Test Staff', 'staff@test.com', 'hashed_password', 'Staff');

-- Admin account
INSERT INTO users (name, email, password, role) VALUES
('Test Admin', 'admin@test.com', 'hashed_password', 'Admin');
```

---

## 📸 SCREENSHOTS (Optional)

Chụp screenshots các màn:

- [ ] Login screen
- [ ] Appointments list
- [ ] Appointment detail
- [ ] Courses list (both tabs)
- [ ] Course detail
- [ ] Schedule session form
- [ ] Profile

---

**Testing Date:** ****\_\_\_****  
**Tested By:** ****\_\_\_****  
**Device:** ****\_\_\_****  
**OS:** ****\_\_\_****  
**Result:** ⬜ PASS | ⬜ FAIL

**Notes:**

---

---

---
