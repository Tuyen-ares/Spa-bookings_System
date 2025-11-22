'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Client user IDs
    const clientIds = ['user-client-1', 'user-client-2', 'user-client-3'];
    
    // All service IDs from seed-services.js (49 services)
    const serviceIds = [
      // Massage (7)
      'svc-massage-body-herbal',
      'svc-massage-thai-traditional',
      'svc-massage-stone-hot',
      'svc-massage-aromatherapy',
      'svc-massage-swedish',
      'svc-massage-deep-tissue',
      'svc-massage-foot-reflexology',
      // Skincare (7)
      'svc-facial-basic',
      'svc-facial-deep-cleansing',
      'svc-facial-whitening',
      'svc-facial-anti-aging',
      'svc-facial-hydrating',
      'svc-facial-acne-treatment',
      'svc-facial-collagen-boost',
      // Body Care (7)
      'svc-body-scrub',
      'svc-body-wrap',
      'svc-body-detox',
      'svc-body-firming',
      'svc-body-whitening',
      'svc-body-moisturizing',
      'svc-body-exfoliation',
      // Relax (7)
      'svc-relax-aromatherapy',
      'svc-relax-meditation',
      'svc-relax-sound-therapy',
      'svc-relax-floating',
      'svc-relax-yoga',
      'svc-relax-sauna',
      'svc-relax-jacuzzi',
      // Spa Package (7)
      'svc-combo-relax',
      'svc-combo-detox',
      'svc-combo-royal',
      'svc-combo-beauty',
      'svc-combo-wellness',
      'svc-combo-premium',
      'svc-combo-couple',
      // Triệt Lông (7)
      'svc-hair-removal-armpit',
      'svc-hair-removal-legs',
      'svc-hair-removal-bikini',
      'svc-hair-removal-face',
      'svc-hair-removal-arms',
      'svc-hair-removal-full-body',
      'svc-hair-removal-back',
      // Clinic (7)
      'svc-clinic-acne-treatment',
      'svc-clinic-melanin-removal',
      'svc-clinic-scar-treatment',
      'svc-clinic-pigmentation',
      'svc-clinic-rf-lifting',
      'svc-clinic-microneedling',
      'svc-clinic-hydrafacial',
      // Nail (7)
      'svc-nail-manicure-basic',
      'svc-nail-pedicure-basic',
      'svc-nail-gel-polish',
      'svc-nail-nail-art',
      'svc-nail-extension',
      'svc-nail-combo-full',
      'svc-nail-paraffin',
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
      relax: [
        { rating: 5, comment: 'Thư giãn aromatherapy tuyệt vời! Tinh dầu thơm dễ chịu, giúp tôi giảm stress và ngủ ngon hơn. Rất hài lòng!' },
        { rating: 4, comment: 'Thiền định giúp tôi tĩnh tâm và thư giãn. Không gian yên tĩnh, phù hợp cho người cần nghỉ ngơi tinh thần.' },
        { rating: 5, comment: 'Âm thanh trị liệu rất độc đáo và hiệu quả! Cảm giác thư giãn sâu, tinh thần nhẹ nhàng và thoải mái hơn nhiều.' },
        { rating: 4, comment: 'Thư giãn nổi trên nước rất thú vị! Cảm giác không trọng lực giúp giảm đau lưng và thư giãn cơ bắp.' },
        { rating: 5, comment: 'Yoga thư giãn rất tốt, giáo viên hướng dẫn tận tâm. Giúp tôi tăng cường sự linh hoạt và giảm căng thẳng.' },
        { rating: 4, comment: 'Xông hơi khô thư giãn tốt, giúp đào thải độc tố và thư giãn cơ bắp. Cảm giác sảng khoái sau khi xông.' },
        { rating: 5, comment: 'Bồn sục Jacuzzi rất thư giãn! Massage tự động giúp giảm đau nhức và cải thiện tuần hoàn máu. Rất hài lòng!' },
      ],
      package: [
        { rating: 5, comment: 'Gói combo rất tuyệt vời! Được thư giãn toàn diện từ massage đến chăm sóc da mặt. Giá cả hợp lý so với chất lượng.' },
        { rating: 5, comment: 'Gói thanh lọc & tái tạo da rất hiệu quả! Da mặt sáng và khỏe mạnh hơn rõ rệt. Trải nghiệm spa hoàn chỉnh và chuyên nghiệp.' },
        { rating: 5, comment: 'Gói hoàng gia đẳng cấp! Tất cả các liệu trình đều chất lượng cao, không gian spa sang trọng. Đáng đồng tiền bát gạo!' },
        { rating: 4, comment: 'Gói làm đẹp toàn diện tốt, kết hợp nhiều dịch vụ trong một. Tuy nhiên thời gian hơi dài, cần sắp xếp thời gian phù hợp.' },
        { rating: 5, comment: 'Gói chăm sóc sức khỏe & sắc đẹp rất toàn diện! Vừa thư giãn vừa làm đẹp, cảm giác cơ thể khỏe mạnh và da đẹp hơn.' },
        { rating: 5, comment: 'Gói Premium cao cấp nhất! Tất cả dịch vụ đều tuyệt vời, chuyên viên chuyên nghiệp. Trải nghiệm spa đẳng cấp nhất!' },
        { rating: 5, comment: 'Gói spa đôi rất lãng mạn! Không gian riêng tư, dịch vụ chất lượng. Phù hợp cho các cặp đôi muốn thư giãn cùng nhau.' },
      ],
      hairremoval: [
        { rating: 5, comment: 'Triệt lông nách rất hiệu quả! Sau vài buổi lông đã mọc ít và mỏng hơn nhiều. Chuyên viên thực hiện cẩn thận và an toàn.' },
        { rating: 4, comment: 'Triệt lông chân tốt, da mịn màng hơn. Cần nhiều buổi để thấy hiệu quả rõ rệt. Giá cả hợp lý.' },
        { rating: 5, comment: 'Triệt lông vùng bikini an toàn và kín đáo. Chuyên viên có kinh nghiệm, thực hiện nhẹ nhàng. Rất hài lòng!' },
        { rating: 4, comment: 'Triệt lông mặt nhẹ nhàng, không đau. Da mặt mịn màng và sáng hơn. Cần tiếp tục để thấy hiệu quả lâu dài.' },
        { rating: 5, comment: 'Triệt lông tay hiệu quả, da tay mịn màng. Tự tin hơn khi mặc áo ngắn tay. Sẽ tiếp tục điều trị.' },
        { rating: 5, comment: 'Triệt lông toàn thân rất tiện lợi! Một lần điều trị cho tất cả các vùng. Chuyên viên chuyên nghiệp, thực hiện cẩn thận.' },
        { rating: 4, comment: 'Triệt lông lưng tốt, da mịn màng. Giá cả hợp lý. Cần nhiều buổi để đạt hiệu quả tối đa.' },
      ],
      clinic: [
        { rating: 5, comment: 'Điều trị mụn chuyên sâu rất hiệu quả! Mụn giảm đáng kể sau vài buổi. Bác sĩ tư vấn rất chi tiết và tận tâm.' },
        { rating: 4, comment: 'Điều trị thâm nám tốt, da sáng hơn. Cần nhiều buổi để thấy rõ hiệu quả. Thiết bị hiện đại và an toàn.' },
        { rating: 5, comment: 'Điều trị sẹo rỗ hiệu quả! Sẹo đã được cải thiện rõ rệt sau liệu trình. Bác sĩ có chuyên môn cao.' },
        { rating: 4, comment: 'Điều trị rối loạn sắc tố da tốt, da đều màu hơn. Cần kiên trì để đạt kết quả tốt nhất.' },
        { rating: 5, comment: 'Nâng cơ RF rất hiệu quả! Da săn chắc và giảm chảy xệ rõ rệt. Không đau, không cần nghỉ dưỡng. Rất hài lòng!' },
        { rating: 4, comment: 'Lăn kim vi điểm tốt, da cải thiện sau vài buổi. Cần chăm sóc da cẩn thận sau điều trị.' },
        { rating: 5, comment: 'HydraFacial tuyệt vời! Da sạch sẽ và sáng hơn ngay sau một buổi. Phù hợp cho mọi loại da, không đau.' },
      ],
      nail: [
        { rating: 5, comment: 'Chăm sóc móng tay cơ bản tốt, móng gọn gàng và đẹp. Chuyên viên thực hiện cẩn thận và nhanh chóng.' },
        { rating: 4, comment: 'Chăm sóc móng chân tốt, da chân mềm mịn. Massage chân thư giãn. Giá cả hợp lý.' },
        { rating: 5, comment: 'Sơn gel móng tay đẹp và bền màu! Màu sắc đa dạng, giữ được lâu từ 2-3 tuần. Rất hài lòng!' },
        { rating: 5, comment: 'Vẽ nghệ thuật móng tay rất đẹp! Kỹ thuật vẽ tay chuyên nghiệp, họa tiết độc đáo. Phù hợp cho các dịp đặc biệt.' },
        { rating: 4, comment: 'Nối móng tay tự nhiên và bền đẹp. Chuyên viên có kỹ thuật tốt. Có thể kết hợp với sơn gel và vẽ nghệ thuật.' },
        { rating: 5, comment: 'Gói chăm sóc móng tay & chân đầy đủ rất tiện lợi! Móng đẹp, da mềm mịn. Trải nghiệm chăm sóc móng hoàn chỉnh.' },
        { rating: 4, comment: 'Chăm sóc móng với paraffin tốt, da tay mềm mịn và dưỡng ẩm. Phù hợp cho da khô và nứt nẻ.' },
      ],
    };

    // Generate reviews for each service (at least 5 reviews per service)
    const reviews = [];
    let reviewIdCounter = 1;
    const baseDate = new Date('2024-01-01');

    serviceIds.forEach((serviceId, serviceIndex) => {
      // Determine category for review template
      let category = 'massage';
      if (serviceId.includes('facial') || serviceId.includes('skincare')) {
        category = 'skincare';
      } else if (serviceId.includes('body-')) {
        category = 'bodycare';
      } else if (serviceId.includes('relax-')) {
        category = 'relax';
      } else if (serviceId.includes('combo-')) {
        category = 'package';
      } else if (serviceId.includes('hair-removal')) {
        category = 'hairremoval';
      } else if (serviceId.includes('clinic-')) {
        category = 'clinic';
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
