'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tính ngày hết hạn: 1 năm từ bây giờ
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const expiryDateString = expiryDate.toISOString().split('T')[0];

    const vipTierVouchers = [
      // Hạng Đồng (Tier Level 1) - 10 triệu
      {
        id: 'promo-vip-tier-1-dong',
        title: 'Voucher VIP Hạng Đồng - Giảm 10%',
        description: 'Voucher hàng tháng dành riêng cho khách hàng hạng Đồng. Giảm 10% cho tất cả dịch vụ tại spa.',
        code: 'VIP_DONG_10',
        discountType: 'percentage',
        discountValue: 10,
        expiryDate: expiryDateString,
        applicableServiceIds: null, // Áp dụng cho tất cả dịch vụ
        termsAndConditions: 'Voucher VIP hàng tháng dành cho khách hàng hạng Đồng. Áp dụng cho đơn hàng từ 500,000 VNĐ trở lên. Không áp dụng cùng các chương trình khuyến mãi khác. Voucher có hiệu lực trong 30 ngày kể từ ngày nhận.',
        targetAudience: 'Tier Level 1',
        isPublic: false, // Private voucher - chỉ gửi cho khách VIP
        isActive: true,
        minOrderValue: 500000,
        stock: null, // Không giới hạn số lượng (gửi tự động hàng tháng)
        pointsRequired: null, // Không cần đổi bằng điểm
        usageCount: 0,
      },
      
      // Hạng Bạc (Tier Level 2) - 30 triệu
      {
        id: 'promo-vip-tier-2-bac',
        title: 'Voucher VIP Hạng Bạc - Giảm 15%',
        description: 'Voucher hàng tháng dành riêng cho khách hàng hạng Bạc. Giảm 15% cho tất cả dịch vụ tại spa.',
        code: 'VIP_BAC_15',
        discountType: 'percentage',
        discountValue: 15,
        expiryDate: expiryDateString,
        applicableServiceIds: null, // Áp dụng cho tất cả dịch vụ
        termsAndConditions: 'Voucher VIP hàng tháng dành cho khách hàng hạng Bạc. Áp dụng cho đơn hàng từ 800,000 VNĐ trở lên. Không áp dụng cùng các chương trình khuyến mãi khác. Voucher có hiệu lực trong 30 ngày kể từ ngày nhận.',
        targetAudience: 'Tier Level 2',
        isPublic: false, // Private voucher - chỉ gửi cho khách VIP
        isActive: true,
        minOrderValue: 800000,
        stock: null, // Không giới hạn số lượng (gửi tự động hàng tháng)
        pointsRequired: null, // Không cần đổi bằng điểm
        usageCount: 0,
      },
      
      // Hạng Kim cương (Tier Level 3) - 50 triệu
      {
        id: 'promo-vip-tier-3-kimcuong',
        title: 'Voucher VIP Hạng Kim Cương - Giảm 20%',
        description: 'Voucher hàng tháng dành riêng cho khách hàng hạng Kim Cương. Giảm 20% cho tất cả dịch vụ tại spa.',
        code: 'VIP_KIMCUONG_20',
        discountType: 'percentage',
        discountValue: 20,
        expiryDate: expiryDateString,
        applicableServiceIds: null, // Áp dụng cho tất cả dịch vụ
        termsAndConditions: 'Voucher VIP hàng tháng dành cho khách hàng hạng Kim Cương. Áp dụng cho đơn hàng từ 1,000,000 VNĐ trở lên. Không áp dụng cùng các chương trình khuyến mãi khác. Voucher có hiệu lực trong 30 ngày kể từ ngày nhận.',
        targetAudience: 'Tier Level 3',
        isPublic: false, // Private voucher - chỉ gửi cho khách VIP
        isActive: true,
        minOrderValue: 1000000,
        stock: null, // Không giới hạn số lượng (gửi tự động hàng tháng)
        pointsRequired: null, // Không cần đổi bằng điểm
        usageCount: 0,
      },
    ];

    // Kiểm tra xem đã có voucher cho các tier này chưa
    const existingVouchers = await queryInterface.sequelize.query(
      `SELECT id FROM promotions WHERE targetAudience IN ('Tier Level 1', 'Tier Level 2', 'Tier Level 3')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Chỉ insert nếu chưa có voucher cho các tier này
    if (existingVouchers.length === 0) {
      await queryInterface.bulkInsert('promotions', vipTierVouchers, {});
      console.log('✅ Đã tạo seed data cho voucher VIP hàng tháng (Hạng Đồng, Bạc, Kim Cương)');
    } else {
      console.log('⚠️ Đã tồn tại voucher VIP cho một hoặc nhiều tier. Bỏ qua seed data.');
      console.log(`   Tìm thấy ${existingVouchers.length} voucher(s) hiện có.`);
    }
  },

  async down(queryInterface, Sequelize) {
    // Xóa các voucher VIP tier khi rollback
    const { Op } = require('sequelize');
    await queryInterface.bulkDelete('promotions', {
      targetAudience: {
        [Op.in]: ['Tier Level 1', 'Tier Level 2', 'Tier Level 3']
      }
    }, {});
  }
};

