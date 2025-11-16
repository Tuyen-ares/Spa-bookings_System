-- Script để cập nhật database sau khi chạy migrations
-- Chạy script này sau khi đã chạy migrations thành công

USE anhthospa_db;

-- 1. Cập nhật ENUM type của notifications để thêm 'payment_received'
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'new_appointment',
  'appointment_confirmed', 
  'appointment_cancelled',
  'appointment_reminder',
  'treatment_course_reminder',
  'promotion',
  'payment_success',
  'payment_received',
  'system'
) NOT NULL DEFAULT 'system';

-- 2. Cập nhật tất cả Cash payments từ 'Completed' về 'Pending' 
-- (chỉ cập nhật các payment cũ, payment mới sẽ tự động là Pending)
UPDATE payments 
SET status = 'Pending' 
WHERE method = 'Cash' 
  AND status = 'Completed'
  AND date < NOW();

-- 3. Cập nhật appointment paymentStatus tương ứng
UPDATE appointments a
INNER JOIN payments p ON a.id = p.appointmentId
SET a.paymentStatus = 'Unpaid'
WHERE p.method = 'Cash' 
  AND p.status = 'Pending';

-- 4. Kiểm tra kết quả
SELECT 
    'Total Cash Payments' as Type,
    COUNT(*) as Count
FROM payments 
WHERE method = 'Cash'
UNION ALL
SELECT 
    'Pending Cash Payments' as Type,
    COUNT(*) as Count
FROM payments 
WHERE method = 'Cash' AND status = 'Pending'
UNION ALL
SELECT 
    'Completed Cash Payments' as Type,
    COUNT(*) as Count
FROM payments 
WHERE method = 'Cash' AND status = 'Completed';

-- 5. Hiển thị các payment cần admin xác nhận
SELECT 
    p.id,
    p.transactionId,
    p.method,
    p.status,
    p.amount,
    u.name as customer_name,
    p.serviceName,
    p.date
FROM payments p
LEFT JOIN users u ON p.userId = u.id
WHERE p.method = 'Cash' 
  AND p.status = 'Pending'
ORDER BY p.date DESC
LIMIT 20;

COMMIT;

-- Thông báo hoàn thành
SELECT '✅ Database update completed successfully!' as Message;
