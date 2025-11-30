-- ============================================
-- TẠO DATABASE CHO DỰ ÁN ANH THƠ SPA
-- ============================================
-- Chạy file này trong MySQL Workbench hoặc phpMyAdmin
-- trước khi chạy migration

CREATE DATABASE IF NOT EXISTS anhthospa_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Kiểm tra database đã được tạo
SHOW DATABASES LIKE 'anhthospa_db';

-- Sử dụng database
USE anhthospa_db;

-- Hiển thị thông tin database
SELECT 
    SCHEMA_NAME as 'Database',
    DEFAULT_CHARACTER_SET_NAME as 'Charset',
    DEFAULT_COLLATION_NAME as 'Collation'
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'anhthospa_db';

