'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Client user IDs
    const clientIds = ['user-client-1', 'user-client-2', 'user-client-3'];

    // All service IDs from seed-services.js (35 services)
    const serviceIds = [
      // Nail (6 services)
      'svc-nail-basic',
      'svc-nail-gel',
      'svc-nail-art',
      'svc-nail-combo',
      'svc-nail-premium',
      'svc-nail-acrylic',
      // Massage (6 services)
      'svc-massage-body-herbal',
      'svc-massage-thai',
      'svc-massage-stone',
      'svc-massage-aromatherapy',
      'svc-massage-foot',
      'svc-massage-deep',
      // Skincare (6 services)
      'svc-facial-basic',
      'svc-facial-deep',
      'svc-facial-whitening',
      'svc-facial-anti-aging',
      'svc-facial-hydrating',
      'svc-facial-acne',
      // Body Care (6 services)
      'svc-body-scrub',
      'svc-body-wrap',
      'svc-body-whitening',
      'svc-body-firming',
      'svc-body-detox',
      'svc-body-moisturizing',
      // Hair Care (6 services)
      'svc-hair-herbal-wash',
      'svc-hair-argan-mask',
      'svc-hair-organic-dye',
      'svc-hair-nano-straight',
      'svc-hair-event-styling',
      'svc-hair-keratin',
      // Waxing (5 services)
      'svc-wax-arms',
      'svc-wax-legs',
      'svc-wax-eyebrows',
      'svc-wax-upperlip',
      'svc-wax-back-deep',
    ];

    // Review templates by service category
    const reviewTemplates = {
      massage: [
        { rating: 5, comment: 'Massage rất tuyệt vời! Chuyên viên có kỹ thuật chuyên nghiệp, tôi cảm thấy thư giãn hoàn toàn sau buổi massage. Sẽ quay lại lần sau.' },
        { rating: 5, comment: 'Dịch vụ massage chất lượng cao, không gian yên tĩnh và thoải mái. Tôi đã giảm được căng thẳng và đau nhức cơ bắp rất nhiều.' },
        { rating: 4, comment: 'Massage tốt, chuyên viên nhiệt tình. Tuy nhiên thời gian có vẻ hơi ngắn so với mong đợi. Nhìn chung hài lòng với dịch vụ.' },
        { rating: 5, comment: 'Trải nghiệm tuyệt vời! Tôi đã thử nhiều nơi nhưng đây là nơi massage tốt nhất. Chuyên viên rất chuyên nghiệp và tận tâm.' },
        { rating: 4, comment: 'Massage rất thư giãn, tinh dầu thơm dễ chịu. Giá cả hợp lý so với chất lượng dịch vụ. Sẽ giới thiệu cho bạn bè.' },
        { rating: 5, comment: 'Tuyệt vời! Sau buổi massage tôi ngủ ngon hơn rất nhiều. Chuyên viên massage đúng các điểm đau nhức, cảm giác rất dễ chịu.' },
        { rating: 4, comment: 'Dịch vụ tốt, không gian spa đẹp và sạch sẽ. Massage giúp tôi giảm stress sau một tuần làm việc căng thẳng.' },
      ],
      skincare: [
        { rating: 5, comment: 'Chăm sóc da mặt rất chuyên nghiệp! Da tôi sáng và mịn màng hơn rõ rệt sau liệu trình. Chuyên viên tư vấn rất tận tâm.' },
        { rating: 5, comment: 'Liệu trình làm sạch sâu rất hiệu quả, da mặt sạch sẽ và thông thoáng hơn nhiều. Sản phẩm sử dụng có vẻ chất lượng tốt.' },
        { rating: 4, comment: 'Dịch vụ tốt, da mặt được chăm sóc kỹ lưỡng. Tuy nhiên giá hơi cao so với một số nơi khác. Nhìn chung hài lòng.' },
        { rating: 5, comment: 'Rất hài lòng với dịch vụ! Da mặt tôi đã cải thiện đáng kể, mụn giảm và da sáng hơn. Sẽ tiếp tục sử dụng dịch vụ.' },
        { rating: 4, comment: 'Chăm sóc da mặt chuyên nghiệp, chuyên viên có kinh nghiệm. Da mặt mịn màng và sáng hơn sau liệu trình.' },
        { rating: 5, comment: 'Tuyệt vời! Da mặt tôi đã được cải thiện rất nhiều. Chuyên viên tư vấn rất chi tiết về cách chăm sóc da tại nhà.' },
        { rating: 4, comment: 'Dịch vụ tốt, không gian spa sạch sẽ và chuyên nghiệp. Da mặt được chăm sóc kỹ lưỡng, cảm giác rất thư giãn.' },
      ],
      bodycare: [
        { rating: 5, comment: 'Tẩy tế bào chết toàn thân rất hiệu quả! Da mịn màng và sáng hơn rõ rệt. Chuyên viên thực hiện rất chuyên nghiệp.' },
        { rating: 4, comment: 'Ủ dưỡng thể tốt, da mềm mịn sau liệu trình. Không gian spa đẹp và thoải mái. Giá cả hợp lý.' },
        { rating: 5, comment: 'Xông hơi thải độc rất thư giãn, cảm giác cơ thể nhẹ nhàng và sảng khoái hơn. Sẽ quay lại thường xuyên.' },
        { rating: 4, comment: 'Dịch vụ làm săn chắc da tốt, da bụng và đùi săn chắc hơn. Cần nhiều buổi để thấy rõ hiệu quả hơn.' },
        { rating: 5, comment: 'Rất hài lòng với dịch vụ dưỡng trắng toàn thân! Da sáng và đều màu hơn. Chuyên viên tư vấn rất nhiệt tình.' },
        { rating: 4, comment: 'Cấp ẩm toàn thân tốt, da mềm mịn và không còn khô ráp. Sản phẩm sử dụng có mùi thơm dễ chịu.' },
        { rating: 5, comment: 'Tẩy da chết chuyên sâu rất hiệu quả! Da mịn màng và sáng hơn rõ rệt. Cảm giác rất sạch sẽ và thư giãn.' },
      ],
      haircare: [
        { rating: 5, comment: 'Gội đầu thảo dược rất thư giãn! Da đầu sạch thoáng, tóc mềm mượt. Chuyên viên massage đầu rất chuyên nghiệp.' },
        { rating: 4, comment: 'Hấp dầu Argan tốt, tóc mượt và bóng hơn. Cần thực hiện định kỳ để duy trì hiệu quả. Giá cả hợp lý.' },
        { rating: 5, comment: 'Nhuộm phục hồi Organic rất an toàn! Màu tóc đẹp, không gây hư tổn. Chuyên viên tư vấn màu rất tận tâm.' },
        { rating: 4, comment: 'Duỗi dưỡng sinh Nano hiệu quả, tóc thẳng mượt tự nhiên. Tuy nhiên cần chăm sóc cẩn thận sau duỗi.' },
        { rating: 5, comment: 'Tạo kiểu tóc sự kiện rất đẹp! Kiểu tóc giữ nếp lâu, phù hợp cho các dịp đặc biệt. Chuyên viên có tay nghề cao.' },
        { rating: 4, comment: 'Phục hồi tóc Keratin tốt, tóc khỏe và mượt hơn. Cần thực hiện định kỳ để duy trì hiệu quả lâu dài.' },
      ],
      waxing: [
        { rating: 5, comment: 'Waxing tay rất hiệu quả! Da tay mịn màng, không đau. Chuyên viên thực hiện cẩn thận và an toàn.' },
        { rating: 4, comment: 'Waxing chân tốt, da chân mịn màng. Cần thực hiện định kỳ để duy trì hiệu quả. Giá cả hợp lý.' },
        { rating: 5, comment: 'Wax lông mày định hình rất đẹp! Dáng mày sắc nét, hài hòa với khuôn mặt. Chuyên viên có tay nghề cao.' },
        { rating: 4, comment: 'Wax môi trên nhẹ nhàng, không đau. Da mịn màng, không bị thâm. Hiệu quả duy trì từ 2-3 tuần.' },
        { rating: 5, comment: 'Wax lưng chuyên sâu rất hiệu quả! Da lưng sạch thoáng, mịn màng. Chuyên viên thực hiện nhanh chóng và chuyên nghiệp.' },
      ],
      nail: [
        { rating: 5, comment: 'Chăm sóc móng tay cơ bản tốt, móng gọn gàng và đẹp. Chuyên viên thực hiện cẩn thận và nhanh chóng.' },
        { rating: 4, comment: 'Sơn gel móng tay đẹp và bền màu! Màu sắc đa dạng, giữ được lâu từ 2-3 tuần. Rất hài lòng!' },
        { rating: 5, comment: 'Vẽ nghệ thuật móng tay rất đẹp! Kỹ thuật vẽ tay chuyên nghiệp, họa tiết độc đáo. Phù hợp cho các dịp đặc biệt.' },
        { rating: 4, comment: 'Combo nail tay + chân rất tiện lợi! Móng đẹp, da mềm mịn. Trải nghiệm chăm sóc móng hoàn chỉnh.' },
        { rating: 5, comment: 'Gói nail spa thư giãn tuyệt vời! Ngâm thảo dược và massage rất thư giãn. Móng đẹp và da tay mềm mịn.' },
        { rating: 4, comment: 'Nối móng Acrylic/Gel tự nhiên và bền đẹp. Chuyên viên có kỹ thuật tốt. Có thể kết hợp với sơn gel và vẽ nghệ thuật.' },
      ],
    };

    // Generate reviews for each service (at least 5 reviews per service)
    const reviews = [];
    let reviewIdCounter = 1;
    const baseDate = new Date('2024-01-01');

    serviceIds.forEach((serviceId, serviceIndex) => {
      // Determine category for review template
      let category = 'massage';
      if (serviceId.includes('facial')) {
        category = 'skincare';
      } else if (serviceId.includes('body-')) {
        category = 'bodycare';
      } else if (serviceId.includes('hair-')) {
        category = 'haircare';
      } else if (serviceId.includes('wax-')) {
        category = 'waxing';
      } else if (serviceId.includes('nail-')) {
        category = 'nail';
      }

      const templates = reviewTemplates[category] || reviewTemplates.massage;

      // Generate 5-7 reviews per service
      const numReviews = 5 + Math.floor(Math.random() * 3); // 5-7 reviews

      for (let i = 0; i < numReviews; i++) {
        const template = templates[i % templates.length];
        const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];

        // Generate date (spread across 2024)
        const daysOffset = Math.floor(Math.random() * 365);
        const reviewDate = new Date(baseDate);
        reviewDate.setDate(reviewDate.getDate() + daysOffset);

        reviews.push({
          id: `rev-${reviewIdCounter++}`,
          serviceId: serviceId,
          userId: clientId,
          appointmentId: null, // Can be linked to appointments if needed
          rating: template.rating,
          comment: template.comment,
          date: reviewDate,
        });
      }
    });

    await queryInterface.bulkInsert('reviews', reviews, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('reviews', null, {});
  }
};
