-- Migration: Đơn giản hóa bảng promotions
-- Chỉ giữ các cột cần thiết: id, title, description, code, expiryDate, imageUrl, 
-- discountType, discountValue, termsAndConditions, targetAudience, 
-- applicableServiceIds, minOrderValue, stock, isActive

-- Bước 1: Backup data cũ (optional - uncomment nếu cần)
-- CREATE TABLE promotions_backup AS SELECT * FROM promotions;

-- Bước 2: Xóa các cột không cần thiết
ALTER TABLE promotions DROP COLUMN IF EXISTS usageCount;
ALTER TABLE promotions DROP COLUMN IF EXISTS usageLimit;
ALTER TABLE promotions DROP COLUMN IF EXISTS pointsRequired;
ALTER TABLE promotions DROP COLUMN IF EXISTS isVoucher;

-- Bước 3: Đảm bảo cột stock tồn tại với cấu trúc đúng
-- Nếu cột stock chưa có, tạo mới:
-- ALTER TABLE promotions ADD COLUMN IF NOT EXISTS stock INTEGER NULL COMMENT 'Số lượng còn lại (NULL = không giới hạn)';

-- Bước 4: Update dữ liệu mẫu - Set stock cho các mã hiện có
-- Set 100 lượt cho tất cả các mã đang active và chưa có stock
UPDATE promotions 
SET stock = 100 
WHERE stock IS NULL AND isActive = 1;

-- Hoặc set theo từng mã cụ thể:
-- UPDATE promotions SET stock = 50 WHERE code = '40VIP';
-- UPDATE promotions SET stock = 100 WHERE code = 'NEWCLIENT';

-- Bước 5: Kiểm tra kết quả
SELECT id, code, title, discountType, discountValue, stock, isActive, expiryDate 
FROM promotions 
ORDER BY code;
