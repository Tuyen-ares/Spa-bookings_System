# PHÂN TÍCH HỆ THỐNG ANH THƠ SPA

## 1. Tổng quan dự án

Dự án **Anh Thơ Spa** là một hệ thống quản lý đặt lịch và vận hành Spa toàn diện, bao gồm 3 thành phần chính:

- **Backend (Node.js/Express)**: Cung cấp API, quản lý logic nghiệp vụ và cơ sở dữ liệu.
- **Frontend (React/Vite)**: Giao diện web cho Khách hàng (Client), Quản trị viên (Admin) và Nhân viên (Staff).
- **Mobile App (React Native/Expo)**: Ứng dụng di động dành cho Khách hàng.

Hệ thống hỗ trợ các quy trình nghiệp vụ cốt lõi như: Đặt lịch hẹn, Quản lý dịch vụ, Thanh toán (VNPay, Ví điện tử), Quản lý liệu trình điều trị, và Chăm sóc khách hàng (Chatbot AI).

---

## 2. Kiến trúc hệ thống & Công nghệ

### 2.1. Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (sử dụng thư viện `mysql2`)
- **ORM**: Sequelize (quản lý schema, migrations, models)
- **Authentication**: JWT (JSON Web Token)
- **Các module chính**:
  - `auth`: Đăng ký, đăng nhập, xác thực email, quên mật khẩu.
  - `appointments`: Quản lý đặt lịch, trạng thái lịch hẹn.
  - `payments`: Tích hợp cổng thanh toán VNPay, quản lý giao dịch.
  - `services`: CRUD dịch vụ, danh mục.
  - `treatmentCourses`: Quản lý liệu trình điều trị dài hạn.
  - `chatbot`: Tích hợp Google GenAI (Gemini) để tư vấn tự động.

### 2.2. Frontend (Web)

- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite
- **Routing**: React Router DOM (v6+)
- **State Management**: React Hooks (`useState`, `useEffect`, `useContext`) & Local State.
- **UI/UX**: Tailwind CSS (dự đoán qua class names), Recharts (biểu đồ).
- **Phân quyền**:
  - **Client Portal**: Trang chủ, đặt lịch, xem dịch vụ, lịch sử liệu trình.
  - **Admin Portal**: Dashboard thống kê, quản lý Users, Services, Appointments, Payments.
  - **Staff Portal**: Xem lịch làm việc, quản lý lịch hẹn được phân công.

### 2.3. Mobile App

- **Framework**: React Native (Expo SDK 50+)
- **Navigation**: React Navigation (Native Stack, Bottom Tabs)
- **Tính năng**: Tương tự Client Portal trên web (Đặt lịch, xem hồ sơ, thông báo).

---

## 3. Cơ sở dữ liệu (Database Schema)

Dựa trên Migrations và Models, hệ thống có các bảng chính sau:

1. **Users (`users`)**:
    - Lưu thông tin người dùng (Admin, Staff, Client).
    - Các trường: `id`, `name`, `email`, `password`, `role`, `phone`, `status`, `walletBalance` (ví tích điểm).

2. **Services (`services`)**:
    - Danh sách dịch vụ Spa cung cấp.
    - Các trường: `id`, `name`, `price`, `duration`, `categoryId`, `description`, `isActive`.

3. **Appointments (`appointments`)**:
    - Lịch hẹn của khách hàng.
    - Quan hệ: `userId` (Client), `serviceId`, `therapistId` (Staff).
    - Trạng thái: `pending`, `upcoming`, `completed`, `cancelled`, `in-progress`.
    - Thanh toán: `paymentStatus` ('Paid', 'Unpaid').

4. **Payments (`payments`)**:
    - Giao dịch thanh toán.
    - Các trường: `amount`, `method` (VNPay, Cash, etc.), `status`, `transactionId`.

5. **TreatmentCourses (`treatment_courses`)**:
    - Quản lý liệu trình (gói nhiều buổi).
    - Các trường: `totalSessions`, `completedSessions`, `expiryDate`.

6. **TreatmentSessions (`treatment_sessions`)**:
    - Chi tiết từng buổi trong liệu trình.
    - Quan hệ với `treatment_courses` và `appointments`.

7. **Promotions (`promotions`)**:
    - Mã giảm giá, chương trình khuyến mãi.

8. **Reviews (`reviews`)**:
    - Đánh giá dịch vụ của khách hàng.

---

## 4. Phân tích Luồng chức năng chính

### 4.1. Luồng Đặt lịch (Booking Flow)

1. **Khách hàng**:
    - Chọn dịch vụ (`Service`) hoặc Liệu trình (`TreatmentCourse`).
    - Chọn ngày giờ (`date`, `time`) và Kỹ thuật viên (tùy chọn).
    - Hệ thống kiểm tra tính khả dụng của Kỹ thuật viên (`StaffAvailability`).
    - Tạo `Appointment` với trạng thái `pending`.
2. **Thanh toán (Optional)**:
    - Khách hàng có thể chọn thanh toán ngay qua VNPay.
    - Nếu thành công -> Cập nhật `paymentStatus` = 'Paid'.
3. **Xác nhận**:
    - Admin/Staff duyệt lịch -> Trạng thái chuyển sang `upcoming` (hoặc `scheduled`).
    - Hệ thống gửi thông báo (`Notification`) cho khách hàng.

### 4.2. Luồng Điều trị & Liệu trình (Treatment Flow)

1. Khách hàng mua gói liệu trình (`TreatmentCourse`).
2. Mỗi lần đến Spa, nhân viên tạo một `Appointment` gắn với `TreatmentSession`.
3. Khi hoàn thành buổi điều trị:
    - Cập nhật `completedSessions` trong `TreatmentCourse`.
    - Cập nhật trạng thái `Appointment` thành `completed`.
    - Nhân viên ghi chú kết quả điều trị (`staffNotes`).

### 4.3. Luồng Thanh toán (Payment Flow)

1. Hỗ trợ thanh toán tại quầy (Cash/Card) hoặc Online (VNPay).
2. **VNPay Integration**:
    - Backend tạo URL thanh toán (`paymentController.createVNPayUrl`).
    - Frontend chuyển hướng user sang VNPay.
    - VNPay IPN (Instant Payment Notification) gọi về Backend để cập nhật trạng thái `Payment` và `Appointment`.

### 4.4. Luồng Phân quyền (Authorization)

- **Admin**: Toàn quyền hệ thống (CRUD Users, Services, xem Báo cáo doanh thu).
- **Staff**: Chỉ xem lịch làm việc của mình, cập nhật trạng thái lịch hẹn được giao.
- **Client**: Chỉ xem và thao tác trên dữ liệu cá nhân (Lịch sử đặt, Ví tiền, Profile).

---

## 5. Các điểm nổi bật & Logic nghiệp vụ

- **Chatbot AI**: Sử dụng Google Gemini để trả lời câu hỏi về dịch vụ và tư vấn liệu trình.
- **Ví điện tử (Wallet)**: Khách hàng có ví tích điểm/tiền nạp trước để thanh toán nhanh.
- **Staff Availability**: Hệ thống quản lý ca làm việc (`StaffShift`) để đảm bảo không trùng lịch khi khách đặt.
- **Real-time Notification**: Có cơ chế polling hoặc socket (cần kiểm tra kỹ hơn, hiện thấy polling trong mobile app) để thông báo trạng thái đơn hàng/lịch hẹn.

## 6. Kết luận

Hệ thống Anh Thơ Spa được thiết kế theo kiến trúc Monolithic (Backend) kết hợp với Frontend tách rời (SPA + Mobile), đảm bảo tính linh hoạt và trải nghiệm người dùng tốt trên đa nền tảng. Cấu trúc code rõ ràng, tuân thủ mô hình MVC ở Backend và Component-based ở Frontend.
