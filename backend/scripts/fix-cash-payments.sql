-- SQL để cập nhật tất cả thanh toán tiền mặt từ 'Completed' về 'Pending'
-- Chạy script này trong MySQL Workbench hoặc phpMyAdmin

-- 1. Cập nhật trạng thái payment
UPDATE payments 
SET status = 'Pending' 
WHERE method = 'Cash' 
AND status = 'Completed';

-- 2. Cập nhật trạng thái appointment liên quan
UPDATE appointments a
INNER JOIN payments p ON a.id = p.appointmentId
SET a.paymentStatus = 'Unpaid'
WHERE p.method = 'Cash' 
AND p.status = 'Pending';

-- Kiểm tra kết quả
SELECT 
    p.transactionId,
    p.method,
    p.status as payment_status,
    a.paymentStatus as appointment_payment_status,
    p.amount,
    p.date
FROM payments p
LEFT JOIN appointments a ON p.appointmentId = a.id
WHERE p.method = 'Cash'
ORDER BY p.date DESC;
