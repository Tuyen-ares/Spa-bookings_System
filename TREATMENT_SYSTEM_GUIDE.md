# 📋 HỆ THỐNG LIỆU TRÌNH ĐIỀU TRỊ - HƯỚNG DẪN TRIỂN KHAI

## 🎯 MỤC TIÊU

Xây dựng hệ thống liệu trình điều trị hoàn chỉnh cho spa, cho phép:

- **Admin**: Tạo gói liệu trình template, quản lý tiến độ khách hàng, gửi nhắc nhở
- **Khách hàng**: Mua gói liệu trình, đặt lịch từng buổi, theo dõi tiến độ

---

## 📊 CẤU TRÚC DATABASE

### 1. **treatment_packages** (Template do Admin tạo)

```sql
- id: VARCHAR(255) PRIMARY KEY
- name: VARCHAR(255) -- "Phục hồi da toàn diện"
- description: TEXT
- price: DECIMAL(10,2)
- totalSessions: INT -- Số buổi (VD: 5)
- duration: INT -- Hạn sử dụng (ngày, VD: 180 = 6 tháng)
- isActive: BOOLEAN
```

### 2. **treatment_package_services** (Dịch vụ từng buổi trong template)

```sql
- id: VARCHAR(255) PRIMARY KEY
- packageId: VARCHAR(255) FK -> treatment_packages
- sessionNumber: INT -- Buổi 1, 2, 3...
- serviceId: VARCHAR(255) FK -> services
- serviceName: VARCHAR(255)
- notes: TEXT -- "Buổi 1: Làm sạch sâu..."
```

### 3. **treatment_courses** (Liệu trình thực tế của khách)

```sql
- id: VARCHAR(255) PRIMARY KEY
- packageId: VARCHAR(255) FK -> treatment_packages
- clientId: VARCHAR(255) FK -> users
- name: VARCHAR(255)
- totalSessions: INT
- completedSessions: INT DEFAULT 0
- progressPercentage: INT DEFAULT 0
- status: ENUM('active', 'paused', 'completed', 'expired', 'cancelled')
- purchaseDate: DATE
- expiryDate: DATE
- nextAppointmentDate: DATE
- treatmentHistory: JSON -- Lịch sử trị liệu
```

### 4. **treatment_course_sessions** (Chi tiết từng buổi)

```sql
- id: VARCHAR(255) PRIMARY KEY
- courseId: VARCHAR(255) FK -> treatment_courses
- sessionNumber: INT
- serviceId: VARCHAR(255) FK -> services
- appointmentId: VARCHAR(255) FK -> appointments
- status: ENUM('pending', 'scheduled', 'completed', 'cancelled')
- scheduledDate: DATE
- completedDate: TIMESTAMP
- therapistId: VARCHAR(255)
- skinConditionBefore: TEXT
- skinConditionAfter: TEXT
- treatmentNotes: TEXT
- nextSessionAdvice: TEXT
```

### 5. **treatment_reminders** (Thông báo nhắc nhở)

```sql
- id: VARCHAR(255) PRIMARY KEY
- courseId: VARCHAR(255) FK -> treatment_courses
- clientId: VARCHAR(255) FK -> users
- sessionNumber: INT
- reminderType: ENUM('next_session', 'expiry_warning', 'completion')
- title: VARCHAR(255)
- message: TEXT
- scheduledDate: DATE
- isRead: BOOLEAN
- isSent: BOOLEAN
```

---

## 🔄 FLOW HOẠT ĐỘNG

### **ADMIN - Tạo gói liệu trình template:**

1. Vào trang "Quản lý liệu trình" → Click "Tạo gói mới"
2. Nhập thông tin:
   - Tên: "Phục hồi da toàn diện"
   - Số buổi: 5
   - Giá: 2,500,000 VNĐ
   - Hạn sử dụng: 180 ngày (6 tháng)
3. Chọn dịch vụ cho từng buổi:
   - Buổi 1: Chăm sóc da cơ bản (Làm sạch sâu)
   - Buổi 2: Chăm sóc da sâu (Tẩy da chết)
   - Buổi 3: Trẻ hóa da (Tái tạo da)
   - Buổi 4: Chăm sóc da cơ bản (Dưỡng trắng)
   - Buổi 5: Chăm sóc da sâu (Hoàn thiện)
4. Lưu → Gói liệu trình hiển thị trên web

### **KHÁCH HÀNG - Mua gói liệu trình:**

1. Vào trang "Liệu trình" → Chọn gói "Phục hồi da"
2. Click "Mua gói" → Thanh toán
3. Hệ thống tạo:
   - `treatment_courses` (liệu trình của khách)
   - 5 records trong `treatment_course_sessions` (status='pending')
4. Khách hàng đặt lịch buổi 1:
   - Vào "Liệu trình của tôi" → Click "Đặt lịch buổi 1"
   - Chọn ngày/giờ → Tạo appointment
   - Session status: pending → scheduled

### **ADMIN - Hoàn thành buổi:**

1. Khách đến làm dịch vụ → Admin mở lịch hẹn
2. Click "Hoàn thành" → Mở modal:
   - Tình trạng da sau: "Da mịn màng hơn, ít mụn"
   - Tư vấn buổi sau: "Tránh ánh nắng mặt trời"
   - Upload ảnh trước/sau (optional)
3. Lưu → Hệ thống:
   - Cập nhật session: status='completed', completedDate=now
   - Tăng `completedSessions` trong `treatment_courses`
   - Tính `progressPercentage = (completedSessions / totalSessions) * 100`
   - Tạo `treatment_reminders` cho buổi tiếp theo
   - Gửi thông báo: "Bạn đã hoàn thành buổi 1! Hãy đặt lịch buổi 2 trong tuần tới"

### **HỆ THỐNG - Gửi nhắc nhở tự động:**

1. **Sau mỗi buổi hoàn thành:**

   ```
   "🎉 Chúc mừng! Bạn đã hoàn thành buổi 1/5

   📋 Buổi tiếp theo: Chăm sóc da sâu
   💡 Tư vấn: Tránh ánh nắng mặt trời

   Hãy đặt lịch buổi 2 để tiếp tục liệu trình!"
   [Đặt lịch ngay]
   ```

2. **Nhắc hạn sử dụng (30 ngày trước khi hết hạn):**

   ```
   "⏰ Liệu trình của bạn sẽ hết hạn sau 30 ngày

   📊 Tiến độ: 3/5 buổi hoàn thành
   🔔 Còn 2 buổi chưa hoàn thành

   Hãy đặt lịch để hoàn thành liệu trình!"
   [Xem liệu trình]
   ```

3. **Hoàn thành liệu trình:**

   ```
   "🎊 Chúc mừng bạn hoàn thành liệu trình!

   ✅ Đã hoàn thành: 5/5 buổi
   📈 Hiệu quả: Da mịn màng, giảm mụn 80%

   💝 Ưu đãi liệu trình tiếp theo: Giảm 20%"
   [Xem ưu đãi]
   ```

---

## 💻 API ENDPOINTS CẦN TRIỂN KHAI

### **Admin APIs:**

```javascript
// 1. Quản lý template
POST   /api/admin/treatment-packages          // Tạo gói mới
GET    /api/admin/treatment-packages          // Danh sách gói
PUT    /api/admin/treatment-packages/:id      // Sửa gói
DELETE /api/admin/treatment-packages/:id      // Xóa gói

POST   /api/admin/treatment-packages/:id/services  // Thêm dịch vụ cho buổi
PUT    /api/admin/treatment-packages/:id/services/:sessionNumber  // Sửa
DELETE /api/admin/treatment-packages/:id/services/:sessionNumber  // Xóa

// 2. Quản lý liệu trình khách hàng
GET    /api/admin/treatment-courses                // Tất cả liệu trình
GET    /api/admin/treatment-courses/:id            // Chi tiết 1 liệu trình
PUT    /api/admin/treatment-courses/:id/pause      // Tạm dừng
PUT    /api/admin/treatment-courses/:id/resume     // Tiếp tục

// 3. Hoàn thành buổi
POST   /api/admin/treatment-courses/:courseId/sessions/:sessionNumber/complete
Body: {
  skinConditionAfter: "Da mịn màng...",
  treatmentNotes: "Sử dụng serum C...",
  nextSessionAdvice: "Tránh ánh nắng...",
  photos: [{type: "before", url: "..."}, {type: "after", url: "..."}]
}

// 4. Gửi nhắc nhở thủ công
POST   /api/admin/treatment-reminders/send
Body: {
  courseId: "...",
  clientId: "...",
  message: "..."
}
```

### **Client APIs:**

```javascript
// 1. Xem gói liệu trình
GET    /api/treatment-packages                    // Danh sách gói đang bán
GET    /api/treatment-packages/:id                // Chi tiết gói

// 2. Mua gói liệu trình
POST   /api/treatment-courses/purchase
Body: {
  packageId: "pkg-001",
  paymentMethod: "Cash" | "VNPay"
}
Response: {
  courseId: "course-xxx",
  sessions: [{sessionNumber: 1, serviceId: "...", status: "pending"}, ...]
}

// 3. Liệu trình của tôi
GET    /api/my-treatment-courses                  // Danh sách liệu trình
GET    /api/my-treatment-courses/:id              // Chi tiết 1 liệu trình
GET    /api/my-treatment-courses/:id/sessions     // Danh sách buổi
GET    /api/my-treatment-courses/:id/history      // Lịch sử trị liệu

// 4. Đặt lịch buổi
POST   /api/my-treatment-courses/:courseId/sessions/:sessionNumber/book
Body: {
  date: "2025-11-20",
  time: "18:00",
  therapistId: "staff-123"
}

// 5. Nhắc nhở
GET    /api/my-treatment-reminders                // Danh sách thông báo
PUT    /api/my-treatment-reminders/:id/read       // Đánh dấu đã đọc
```

---

## 🎨 GIAO DIỆN CẦN XÂY DỰNG

### **ADMIN:**

#### 1. **Trang quản lý gói liệu trình** (`/admin/treatment-packages`)

- Bảng danh sách gói
- Nút "Tạo gói mới"
- Action: Sửa / Xóa / Kích hoạt/Tắt

#### 2. **Modal tạo/sửa gói** (`AddEditTreatmentPackageModal.tsx`)

```tsx
<Modal>
  <Input label="Tên gói" />
  <Input label="Giá" type="number" />
  <Input label="Số buổi" type="number" />
  <Input label="Hạn sử dụng (ngày)" type="number" />
  <TextArea label="Mô tả" />

  <h3>Dịch vụ từng buổi</h3>
  {sessions.map((session, index) => (
    <div key={index}>
      <label>Buổi {index + 1}</label>
      <Select options={services} value={session.serviceId} />
      <Input label="Ghi chú" value={session.notes} />
    </div>
  ))}

  <Button>Thêm buổi</Button>
  <Button type="submit">Lưu gói</Button>
</Modal>
```

#### 3. **Trang quản lý liệu trình khách hàng** (`/admin/treatment-courses`)

- Bảng danh sách liệu trình đang chạy
- Filter: Trạng thái, Khách hàng, Gói liệu trình
- Click vào 1 liệu trình → Chi tiết

#### 4. **Trang chi tiết liệu trình khách hàng** (`/admin/treatment-courses/:id`)

```tsx
<div>
  <h1>{course.name}</h1>
  <p>Khách hàng: {client.name}</p>
  <ProgressBar value={course.progressPercentage} />
  <p>
    {course.completedSessions}/{course.totalSessions} buổi
  </p>

  <h2>Danh sách buổi</h2>
  <Table>
    <tr>
      <th>Buổi</th>
      <th>Dịch vụ</th>
      <th>Ngày hẹn</th>
      <th>Trạng thái</th>
      <th>Hành động</th>
    </tr>
    {sessions.map((session) => (
      <tr>
        <td>Buổi {session.sessionNumber}</td>
        <td>{session.serviceName}</td>
        <td>{session.scheduledDate || "-"}</td>
        <td>
          <Badge status={session.status} />
        </td>
        <td>
          {session.status === "scheduled" && (
            <Button onClick={() => completeSession(session)}>Hoàn thành</Button>
          )}
        </td>
      </tr>
    ))}
  </Table>

  <h2>Lịch sử trị liệu</h2>
  {course.treatmentHistory.map((record) => (
    <Card>
      <p>
        Buổi {record.sessionNumber} - {record.date}
      </p>
      <p>Tình trạng da: {record.skinCondition}</p>
      <p>Ghi chú: {record.notes}</p>
    </Card>
  ))}
</div>
```

#### 5. **Modal hoàn thành buổi** (`CompleteTreatmentSessionModal.tsx`)

```tsx
<Modal title="Hoàn thành buổi {sessionNumber}">
  <TextArea
    label="Tình trạng da sau điều trị"
    placeholder="Da mịn màng hơn, giảm mụn..."
  />

  <TextArea label="Ghi chú trị liệu" placeholder="Sử dụng serum C..." />

  <TextArea
    label="Tư vấn cho buổi tiếp theo"
    placeholder="Tránh ánh nắng mặt trời..."
  />

  <FileUpload label="Ảnh trước/sau (tùy chọn)" multiple />

  <Checkbox
    label="Gửi nhắc nhở đặt lịch buổi tiếp theo cho khách hàng"
    checked={true}
  />

  <Button type="submit">Hoàn thành buổi</Button>
</Modal>
```

### **KHÁCH HÀNG:**

#### 1. **Trang danh sách gói liệu trình** (`/treatment-packages`)

```tsx
<div className="grid grid-cols-3 gap-6">
  {packages.map((pkg) => (
    <Card key={pkg.id}>
      <img src={pkg.imageUrl} />
      <h3>{pkg.name}</h3>
      <p>{pkg.description}</p>
      <p className="text-2xl font-bold">
        {formatPrice(pkg.price)}
        {pkg.originalPrice && (
          <span className="line-through">{formatPrice(pkg.originalPrice)}</span>
        )}
      </p>
      <ul>
        <li>✅ {pkg.totalSessions} buổi điều trị</li>
        <li>⏰ Hạn sử dụng: {pkg.duration} ngày</li>
        {JSON.parse(pkg.benefits).map((benefit) => (
          <li key={benefit}>✨ {benefit}</li>
        ))}
      </ul>
      <Button onClick={() => navigate(`/treatment-packages/${pkg.id}`)}>
        Xem chi tiết
      </Button>
    </Card>
  ))}
</div>
```

#### 2. **Trang chi tiết gói liệu trình** (`/treatment-packages/:id`)

```tsx
<div>
  <img src={pkg.imageUrl} className="w-full" />
  <h1>{pkg.name}</h1>
  <p className="text-3xl font-bold">{formatPrice(pkg.price)}</p>

  <h2>Mô tả</h2>
  <p>{pkg.description}</p>

  <h2>Lợi ích</h2>
  <ul>
    {JSON.parse(pkg.benefits).map((benefit) => (
      <li>✨ {benefit}</li>
    ))}
  </ul>

  <h2>Quy trình điều trị ({pkg.totalSessions} buổi)</h2>
  <Timeline>
    {services.map((service, index) => (
      <TimelineItem key={index}>
        <h4>
          Buổi {index + 1}: {service.serviceName}
        </h4>
        <p>{service.notes}</p>
      </TimelineItem>
    ))}
  </Timeline>

  <Button onClick={() => handlePurchase(pkg.id)}>Mua gói liệu trình</Button>
</div>
```

#### 3. **Trang liệu trình của tôi** (`/my-treatment-courses`)

```tsx
<div>
  <h1>Liệu trình của tôi</h1>

  {courses.map((course) => (
    <Card key={course.id}>
      <h3>{course.name}</h3>
      <ProgressBar
        value={course.progressPercentage}
        label={`${course.completedSessions}/${course.totalSessions} buổi`}
      />
      <p>Hạn sử dụng: {formatDate(course.expiryDate)}</p>
      <Badge status={course.status} />

      <Button onClick={() => navigate(`/my-treatment-courses/${course.id}`)}>
        Xem chi tiết
      </Button>
    </Card>
  ))}
</div>
```

#### 4. **Trang chi tiết liệu trình của tôi** (`/my-treatment-courses/:id`)

```tsx
<div>
  <h1>{course.name}</h1>
  <CircularProgress value={course.progressPercentage} />
  <p>
    {course.completedSessions}/{course.totalSessions} buổi hoàn thành
  </p>

  <h2>Danh sách buổi</h2>
  {sessions.map((session) => (
    <Card
      key={session.id}
      className={session.status === "completed" ? "opacity-60" : ""}>
      <div className="flex justify-between">
        <div>
          <h4>Buổi {session.sessionNumber}</h4>
          <p>{session.serviceName}</p>
          {session.scheduledDate && (
            <p>
              📅 {formatDate(session.scheduledDate)} - {session.scheduledTime}
            </p>
          )}
        </div>
        <Badge status={session.status} />
      </div>

      {session.status === "pending" && (
        <Button onClick={() => bookSession(session)}>Đặt lịch buổi này</Button>
      )}

      {session.status === "completed" && session.nextSessionAdvice && (
        <Alert type="info">💡 Tư vấn: {session.nextSessionAdvice}</Alert>
      )}
    </Card>
  ))}

  <h2>Lịch sử trị liệu</h2>
  {sessions
    .filter((s) => s.status === "completed")
    .map((session) => (
      <Card key={session.id}>
        <h4>
          Buổi {session.sessionNumber} - {formatDate(session.completedDate)}
        </h4>
        <p>Kỹ thuật viên: {session.therapistName}</p>
        <p>Tình trạng da: {session.skinConditionAfter}</p>
        {session.photos && session.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {session.photos.map((photo) => (
              <img key={photo.url} src={photo.url} alt={photo.type} />
            ))}
          </div>
        )}
      </Card>
    ))}
</div>
```

---

## 🚀 TRIỂN KHAI TỪNG BƯỚC

### **Bước 1: Migration Database** ✅

```bash
cd backend
mysql -h 127.0.0.1 -P 3307 -u root -p anhthospa_db < scripts/create-treatment-system.sql
```

### **Bước 2: Cập nhật Models** (Đã có sẵn)

- ✅ TreatmentPackage.js
- ✅ TreatmentPackageService.js
- ✅ TreatmentCourse.js
- ✅ TreatmentCourseSession.js
- ✅ TreatmentReminder.js

### **Bước 3: Tạo API Routes**

1. `backend/routes/treatment-packages.js` (Admin APIs)
2. `backend/routes/treatment-courses.js` (Client + Admin APIs)
3. `backend/routes/treatment-reminders.js` (Reminder system)

### **Bước 4: Frontend - Admin**

1. `admin/pages/TreatmentPackagesPage.tsx` (Quản lý gói)
2. `admin/components/AddEditTreatmentPackageModal.tsx`
3. `admin/pages/TreatmentCoursesManagementPage.tsx` (Quản lý liệu trình KH)
4. `admin/components/CompleteTreatmentSessionModal.tsx`

### **Bước 5: Frontend - Client**

1. `client/pages/TreatmentPackagesPage.tsx` (Danh sách gói)
2. `client/pages/TreatmentPackageDetailPage.tsx` (Chi tiết gói)
3. `client/pages/MyTreatmentCoursesPage.tsx` (Liệu trình của tôi)
4. `client/pages/MyTreatmentCourseDetailPage.tsx` (Chi tiết liệu trình)

### **Bước 6: Tích hợp Reminder System**

1. Tạo cron job gửi nhắc nhở tự động
2. Tích hợp với hệ thống notification hiện có
3. Email/SMS reminder (optional)

---

## ✅ CHECKLIST TRIỂN KHAI

- [ ] **Database**

  - [ ] Chạy migration script
  - [ ] Verify các bảng đã tạo
  - [ ] Insert dữ liệu mẫu

- [ ] **Backend APIs**

  - [ ] CRUD treatment packages
  - [ ] Purchase treatment course
  - [ ] Book session
  - [ ] Complete session
  - [ ] Send reminders

- [ ] **Frontend Admin**

  - [ ] Trang quản lý gói liệu trình
  - [ ] Modal tạo/sửa gói
  - [ ] Trang quản lý liệu trình khách hàng
  - [ ] Modal hoàn thành buổi

- [ ] **Frontend Client**

  - [ ] Trang danh sách gói
  - [ ] Trang chi tiết gói
  - [ ] Trang liệu trình của tôi
  - [ ] Trang chi tiết liệu trình
  - [ ] Flow đặt lịch buổi

- [ ] **Testing**
  - [ ] Test flow mua gói
  - [ ] Test flow đặt lịch buổi
  - [ ] Test flow hoàn thành buổi
  - [ ] Test reminder system

---

## 📞 HỖ TRỢ

Nếu bạn cần tôi triển khai từng phần cụ thể, hãy cho tôi biết bạn muốn bắt đầu từ đâu:

1. Chạy migration database
2. Tạo API routes
3. Xây dựng giao diện Admin
4. Xây dựng giao diện Client
5. Tích hợp reminder system
