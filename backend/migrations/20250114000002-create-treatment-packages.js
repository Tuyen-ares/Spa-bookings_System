// backend/migrations/20250114000002-create-treatment-packages.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Create treatment_packages table
        await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS treatment_packages (
          id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL COMMENT 'Tên gói liệu trình',
          description TEXT COMMENT 'Mô tả chi tiết về gói liệu trình',
          price DECIMAL(10,2) NOT NULL COMMENT 'Giá của gói liệu trình',
          originalPrice DECIMAL(10,2) COMMENT 'Giá gốc (để hiển thị giảm giá)',
          totalSessions INTEGER NOT NULL DEFAULT 10 COMMENT 'Tổng số buổi trong gói',
          duration INTEGER COMMENT 'Thời hạn sử dụng (số ngày)',
          benefits TEXT COMMENT 'Lợi ích của gói liệu trình (JSON array)',
          imageUrl VARCHAR(255) COMMENT 'Ảnh đại diện cho gói',
          isActive BOOLEAN DEFAULT 1 COMMENT 'Gói có đang hoạt động không',
          isFeatured BOOLEAN DEFAULT 0 COMMENT 'Gói có được nổi bật không',
          displayOrder INTEGER DEFAULT 0 COMMENT 'Thứ tự hiển thị',
          minSessionsPerWeek INTEGER DEFAULT 2 COMMENT 'Số buổi tối thiểu mỗi tuần',
          maxSessionsPerWeek INTEGER DEFAULT 3 COMMENT 'Số buổi tối đa mỗi tuần',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX idx_packages_active (isActive),
          INDEX idx_packages_featured (isFeatured),
          INDEX idx_packages_display_order (displayOrder)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `, { transaction });      console.log('✅ Created treatment_packages table');

      // 2. Create treatment_package_services junction table
        await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS treatment_package_services (
          id INTEGER AUTO_INCREMENT,
          treatmentPackageId VARCHAR(255) NOT NULL,
          serviceId VARCHAR(255) NOT NULL,
          serviceName VARCHAR(255) NOT NULL COMMENT 'Cached service name for performance',
          \`order\` INTEGER DEFAULT 0 COMMENT 'Thứ tự thực hiện dịch vụ trong gói',
          sessionsPerService INTEGER DEFAULT 1 COMMENT 'Số buổi cho mỗi dịch vụ này trong gói',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          FOREIGN KEY (treatmentPackageId) REFERENCES treatment_packages(id) ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE ON UPDATE CASCADE,
          INDEX idx_tps_package_id (treatmentPackageId),
          INDEX idx_tps_service_id (serviceId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `, { transaction });      console.log('✅ Created treatment_package_services table');

      // 3. Add packageId column to treatment_courses
      const tableDescription = await queryInterface.describeTable('treatment_courses');
      
      if (!tableDescription.packageId) {
        await queryInterface.addColumn('treatment_courses', 'packageId', {
          type: Sequelize.STRING(255),
          allowNull: true,
          references: {
            model: 'treatment_packages',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'ID của gói liệu trình mẫu (nếu khách đăng ký từ package)'
        }, { transaction });

        console.log('✅ Added packageId column to treatment_courses');
      } else {
        console.log('⏭️  packageId column already exists');
      }

      await transaction.commit();
      console.log('✅ Migration completed: Created treatment packages structure');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove packageId from treatment_courses
      const tableDescription = await queryInterface.describeTable('treatment_courses');
      if (tableDescription.packageId) {
        await queryInterface.removeColumn('treatment_courses', 'packageId', { transaction });
      }

      // Drop tables
      await queryInterface.dropTable('treatment_package_services', { transaction });
      await queryInterface.dropTable('treatment_packages', { transaction });

      await transaction.commit();
      console.log('✅ Rollback completed: Removed treatment packages structure');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
