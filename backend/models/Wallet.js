// backend/models/Wallet.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    tierLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Hạng thành viên (0=Thành viên, 1=Đồng, 2=Bạc, 3=Kim cương)',
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Tổng số tiền đã chi tiêu',
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      comment: 'Lần cập nhật cuối cùng',
    },
  }, {
    tableName: 'wallets',
    timestamps: false,
    hooks: {
      // Tự động sync tierLevel khi totalSpent thay đổi
      // Chỉ sync khi totalSpent thay đổi, không sync khi chỉ tierLevel thay đổi (cho phép admin override)
      beforeUpdate: async (wallet, options) => {
        // Lưu tierLevel cũ để so sánh sau
        const oldTierLevel = wallet._previousDataValues?.tierLevel ?? wallet.tierLevel;
        
        // Chỉ sync tierLevel nếu totalSpent thay đổi VÀ tierLevel không được set thủ công trong cùng lần update
        // Nếu chỉ tierLevel thay đổi (không có totalSpent), giữ nguyên giá trị tierLevel mới
        if (wallet.changed('totalSpent') && !wallet.changed('tierLevel')) {
          // totalSpent thay đổi nhưng tierLevel không được set thủ công → tự động sync
          const { calculateTierInfo } = require('../utils/tierUtils');
          const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
          const tierInfo = calculateTierInfo(totalSpent);
          wallet.tierLevel = tierInfo.currentTier.level;
          
          console.log(`🔄 [Wallet Hook] Auto-syncing tierLevel: totalSpent=${totalSpent} → tierLevel=${tierInfo.currentTier.level} (${tierInfo.currentTier.name})`);
        } else if (wallet.changed('totalSpent') && wallet.changed('tierLevel')) {
          // Cả totalSpent và tierLevel đều thay đổi → ưu tiên tierLevel được set thủ công (admin override)
          console.log(`⚠️ [Wallet Hook] Both totalSpent and tierLevel changed - keeping manual tierLevel=${wallet.tierLevel}`);
        } else if (!wallet.changed('totalSpent') && wallet.changed('tierLevel')) {
          // Chỉ tierLevel thay đổi (admin override) → giữ nguyên giá trị mới
          console.log(`✅ [Wallet Hook] Manual tierLevel update: tierLevel=${wallet.tierLevel} (admin override)`);
        }
        
        // Lưu oldTierLevel vào options để dùng trong afterUpdate
        options.oldTierLevel = oldTierLevel;
      },
      // Sau khi update, kiểm tra xem có lên hạng không và tự động gửi voucher
      afterUpdate: async (wallet, options) => {
        try {
          const oldTierLevel = options.oldTierLevel ?? wallet._previousDataValues?.tierLevel;
          const newTierLevel = wallet.tierLevel;
          
          // Chỉ gửi voucher nếu tierLevel tăng lên (lên hạng) và >= 1 (VIP tier)
          if (oldTierLevel !== undefined && newTierLevel > oldTierLevel && newTierLevel >= 1) {
            console.log(`\n🎉 [Wallet Hook] User ${wallet.userId} lên hạng: ${oldTierLevel} → ${newTierLevel}`);
            
            // Import monthly voucher service
            const monthlyVoucherService = require('../services/monthlyVoucherService');
            
            // Kiểm tra xem user đã nhận voucher cho tier mới chưa
            const result = await monthlyVoucherService.sendMonthlyVoucherToUser(
              wallet.userId,
              newTierLevel,
              new Date() // Tháng hiện tại
            );
            
            if (result.success) {
              console.log(`✅ [Wallet Hook] Đã tự động gửi voucher cho user ${wallet.userId} khi lên hạng ${newTierLevel}`);
            } else if (result.message.includes('đã nhận')) {
              console.log(`ℹ️ [Wallet Hook] User ${wallet.userId} đã nhận voucher cho hạng ${newTierLevel} rồi`);
            } else {
              console.log(`⚠️ [Wallet Hook] Không thể gửi voucher cho user ${wallet.userId}: ${result.message}`);
            }
          }
        } catch (error) {
          // Không throw error để không ảnh hưởng đến việc update wallet
          console.error(`❌ [Wallet Hook] Lỗi khi tự động gửi voucher sau khi lên hạng:`, error.message);
        }
      },
      // Sync tierLevel khi tạo wallet mới
      beforeCreate: async (wallet, options) => {
        if (wallet.totalSpent !== undefined && wallet.totalSpent !== null) {
          const { calculateTierInfo } = require('../utils/tierUtils');
          const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
          const tierInfo = calculateTierInfo(totalSpent);
          wallet.tierLevel = tierInfo.currentTier.level;
        } else {
          // Nếu không có totalSpent, mặc định là tierLevel 0 (Thành viên)
          wallet.tierLevel = wallet.tierLevel || 0;
        }
      }
    }
  });

  return Wallet;
};
