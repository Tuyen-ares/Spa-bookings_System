'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('promotions', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      expiryDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      discountType: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false,
      },
      discountValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      termsAndConditions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      targetAudience: {
        type: Sequelize.ENUM(
          'All', 'New Clients', 'Birthday', 'Group', 'VIP',
          'Tier Level 1', 'Tier Level 2', 'Tier Level 3'
        ),
        allowNull: true,
        defaultValue: 'All',
      },
      applicableServiceIds: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      minOrderValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      usageCount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      usageLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'NULL = không giới hạn',
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Số lượng voucher còn lại (NULL = không giới hạn)',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
        comment: 'true = public (hiển thị trên trang khách hàng), false = private (chỉ dùng khi biết mã)',
      },
      pointsRequired: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'Số điểm cần thiết để đổi voucher (chỉ áp dụng cho voucher private)',
      },
    });

    // Add foreign key constraint for appointments.promotionId
    // Check if appointments table exists and promotionId column exists
    const [tableInfo] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'appointments'"
    );
    if (tableInfo[0].count > 0) {
      const [columnInfo] = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'promotionId'"
      );
      if (columnInfo[0].count > 0) {
        await queryInterface.addConstraint('appointments', {
          fields: ['promotionId'],
          type: 'foreign key',
          name: 'appointments_promotionId_fk',
          references: {
            table: 'promotions',
            field: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('promotions');
  }
};
