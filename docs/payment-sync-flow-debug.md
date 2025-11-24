# Payment Sync Flow - Debug Guide

## Flow hoàn chỉnh từ Booking đến Admin Panel

### 1. User đặt lịch (BookingPage.tsx)

**Step 1.1: Tính totalAmount**
```typescript
const totalAmount = calculateTotal(); // Tính sau giảm giá/voucher
// Ví dụ: 1.200.000 - 120.000 (10%) = 1.080.000 VND
```

**Step 1.2: Tạo appointmentsToCreate**
```typescript
const appointmentsToCreate = selectedServices.map(({ service, quantity }) => ({
    // ...
    totalAmount: totalAmount // 1.080.000 VND
}));
```

**Step 1.3: Gửi lên backend**
```typescript
await apiService.createAppointment(apt) // Gửi totalAmount trong body
```

**✅ Checkpoint 1**: Kiểm tra console log:
- `📤 [BookingPage] Creating appointments with data:` - totalAmount có đúng không?

---

### 2. Backend nhận và tạo TreatmentCourse (appointments.js)

**Step 2.1: Nhận totalAmount**
```javascript
const totalAmount = newAppointmentData.totalAmount 
    ? parseFloat(newAppointmentData.totalAmount) 
    : (parseFloat(service.price) * quantity);
```

**Step 2.2: Tạo TreatmentCourse**
```javascript
await db.TreatmentCourse.create({
    // ...
    totalAmount: totalAmount, // 1.080.000 VND
    paymentStatus: 'Unpaid'
});
```

**✅ Checkpoint 2**: Kiểm tra console log:
- `💰 [TREATMENT COURSE] Creating with totalAmount:` - totalAmount có đúng không?
- `✅ [TREATMENT COURSE] Created:` - totalAmount đã được lưu chưa?

---

### 3. User thanh toán VNPay (BookingPage.tsx)

**Step 3.1: Gọi processPayment**
```typescript
const result = await apiService.processPayment(
    createdAppointments[0].id,
    paymentMethod,
    totalAmount // 1.080.000 VND
);
```

**✅ Checkpoint 3**: Kiểm tra console log:
- `📤 [BookingPage] Processing payment:` - totalAmount có đúng không?

---

### 4. Backend tạo Payment (payments.js)

**Step 4.1: Tạo Payment record**
```javascript
const payment = await db.Payment.create({
    appointmentId: appointmentId,
    amount: amount, // 1.080.000 VND từ frontend
    method: 'VNPay',
    status: 'Pending'
});
```

**✅ Checkpoint 4**: Kiểm tra console log:
- `=== Payment Process Debug ===` - Amount có đúng không?

---

### 5. VNPay Callback (payments.js)

**Step 5.1: VNPay Return/IPN**
```javascript
// Tìm Payment
const payment = await db.Payment.findOne({ 
    where: { transactionId: orderId } 
});

// Cập nhật Payment status
await payment.update({ status: 'Completed' });
```

**Step 5.2: Cập nhật Appointment**
```javascript
await appointment.update({ 
    paymentStatus: 'Paid',
    status: 'pending'
});
```

**Step 5.3: Đồng bộ TreatmentCourse** ⭐ QUAN TRỌNG
```javascript
await syncTreatmentCourseFromPayment(appointment.id, payment.amount);
```

**✅ Checkpoint 5**: Kiểm tra console log:
- `🔄 [VNPay RETURN/IPN] Processing appointment` - appointmentId có đúng không?
- `🔄 [SYNC TREATMENT COURSE] Starting sync` - paymentAmount có đúng không?
- `✅ [SYNC TREATMENT COURSE] Found treatment session` - có tìm thấy TreatmentSession không?
- `✅ [SYNC TREATMENT COURSE] Treatment course updated successfully` - có update thành công không?

---

### 6. Admin GET Treatment Course (treatmentCourses.js)

**Step 6.1: Query TreatmentCourse**
```javascript
const course = await db.TreatmentCourse.findByPk(req.params.id);
```

**Step 6.2: Đồng bộ lại từ Payment (fallback)**
```javascript
// Nếu totalAmount chưa đúng, đồng bộ lại từ Payment
const payment = await db.Payment.findOne({
    where: {
        appointmentId: { [Op.in]: appointmentIds },
        status: 'Completed'
    }
});

if (payment && payment.amount) {
    await course.update({ 
        totalAmount: paymentAmount,
        paymentStatus: 'Paid'
    });
}
```

**✅ Checkpoint 6**: Kiểm tra console log:
- `✅ [TREATMENT COURSE GET] Updated totalAmount from Payment` - có update không?

---

## Các điểm cần kiểm tra khi debug

### 1. Kiểm tra totalAmount có được gửi đúng không?
```bash
# Backend console log
📝 [POST /api/appointments] Request body: totalAmount: 1080000
💰 [TREATMENT COURSE] Creating with totalAmount: parsedTotalAmount: 1080000
```

### 2. Kiểm tra Payment có được tạo với amount đúng không?
```bash
# Backend console log
=== Payment Process Debug ===
Amount received from frontend: 1080000
```

### 3. Kiểm tra syncTreatmentCourseFromPayment có được gọi không?
```bash
# Backend console log
🔄 [VNPay RETURN] Calling syncTreatmentCourseFromPayment for appointment xxx, payment amount: 1080000
🔄 [SYNC TREATMENT COURSE] Starting sync for appointment xxx, paymentAmount: 1080000
```

### 4. Kiểm tra TreatmentSession có được tìm thấy không?
```bash
# Backend console log
✅ [SYNC TREATMENT COURSE] Found treatment session: xxx, treatmentCourseId: xxx
```

### 5. Kiểm tra TreatmentCourse có được update không?
```bash
# Backend console log
✅ [SYNC TREATMENT COURSE] Treatment course xxx updated successfully: paymentStatus: 'Paid', totalAmount: 1080000
```

### 6. Kiểm tra GET treatment course có trả về đúng không?
```bash
# Backend console log
✅ [TREATMENT COURSE GET] Updated totalAmount from Payment: 1080000 VND
```

---

## Các lỗi thường gặp

### Lỗi 1: TreatmentSession không được tìm thấy
**Nguyên nhân**: Appointment chưa được link với TreatmentSession
**Giải pháp**: Kiểm tra logic tạo TreatmentSession trong appointments.js

### Lỗi 2: Transaction rollback
**Nguyên nhân**: Có lỗi trong quá trình update
**Giải pháp**: Kiểm tra error log trong console

### Lỗi 3: Payment.amount không đúng
**Nguyên nhân**: Frontend gửi sai amount hoặc VNPay trả về sai
**Giải pháp**: Kiểm tra log ở Checkpoint 4

### Lỗi 4: totalAmount không được update
**Nguyên nhân**: syncTreatmentCourseFromPayment không được gọi hoặc bị lỗi
**Giải pháp**: Kiểm tra log ở Checkpoint 5

---

## Test Case

1. **Tạo booking**: Service 1.200.000 VND, giảm 10% → totalAmount = 1.080.000 VND
2. **Thanh toán VNPay**: 1.080.000 VND
3. **Kiểm tra logs**: Tất cả checkpoints phải pass
4. **Kiểm tra database**: 
   - `payments.amount = 1080000`
   - `treatment_courses.totalAmount = 1080000`
   - `treatment_courses.paymentStatus = 'Paid'`
5. **Kiểm tra admin panel**: Hiển thị 1.080.000 VND và "Đã thanh toán"

