// Script để tạo notification cho voucher sinh nhật và khách mới
// Chạy: node backend/scripts/create-birthday-newclient-notifications.js

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

async function createNotifications() {
    try {
        console.log('🔍 Bắt đầu tạo notifications cho voucher sinh nhật và khách mới...\n');

        // Lấy ngày hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // 1. Tạo notification cho user có sinh nhật hôm nay
        console.log('📅 Kiểm tra users có sinh nhật hôm nay...');
        const todayMonth = today.getMonth() + 1; // 1-12
        const todayDate = today.getDate(); // 1-31
        
        // Lấy tất cả clients active có birthday
        const allClients = await db.User.findAll({
            where: {
                role: 'Client',
                status: 'Active',
                birthday: { [Op.ne]: null }
            }
        });

        // Filter users có sinh nhật hôm nay
        const birthdayUsers = allClients.filter(user => {
            if (!user.birthday) return false;
            const birthday = new Date(user.birthday);
            return birthday.getMonth() + 1 === todayMonth && birthday.getDate() === todayDate;
        });

        console.log(`   Tìm thấy ${birthdayUsers.length} user có sinh nhật hôm nay`);

        // Tìm voucher Birthday
        const birthdayPromotion = await db.Promotion.findOne({
            where: {
                targetAudience: 'Birthday',
                isActive: true
            }
        });

        if (!birthdayPromotion) {
            console.log('   ⚠️ Không tìm thấy voucher Birthday active');
        } else {
            console.log(`   ✅ Tìm thấy voucher Birthday: ${birthdayPromotion.title} (${birthdayPromotion.code})`);

            for (const user of birthdayUsers) {
                // Kiểm tra xem notification đã tồn tại chưa (trong ngày hôm nay)
                const todayStart = new Date(today);
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(today);
                todayEnd.setHours(23, 59, 59, 999);

                const existingNotification = await db.Notification.findOne({
                    where: {
                        userId: user.id,
                        type: 'promotion', // Dùng 'promotion' vì ENUM chưa có 'birthday_gift'
                        relatedId: birthdayPromotion.id,
                        createdAt: {
                            [Op.between]: [todayStart, todayEnd]
                        }
                    }
                });

                if (!existingNotification) {
                    await db.Notification.create({
                        id: `notif-${uuidv4()}`,
                        userId: user.id,
                        type: 'promotion', // Dùng 'promotion' vì ENUM chưa có 'birthday_gift'
                        title: '🎉 Chúc mừng sinh nhật!',
                        message: `Chúc mừng sinh nhật bạn! Bạn đã nhận được voucher "${birthdayPromotion.title}". Hãy đến phần Ưu đãi để sử dụng nhé!`,
                        relatedId: birthdayPromotion.id,
                        sentVia: 'app',
                        isRead: false,
                        emailSent: false,
                        createdAt: new Date(),
                    });
                    console.log(`   ✅ Đã tạo notification sinh nhật cho: ${user.name} (${user.email})`);
                } else {
                    console.log(`   ⏭️  Đã có notification sinh nhật cho: ${user.name} (${user.email})`);
                }
            }
        }

        console.log('\n');

        // 2. Tạo notification cho khách hàng mới
        console.log('👋 Kiểm tra khách hàng mới...');
        
        // Tìm voucher New Clients
        const newClientPromotion = await db.Promotion.findOne({
            where: {
                targetAudience: 'New Clients',
                isActive: true
            }
        });

        if (!newClientPromotion) {
            console.log('   ⚠️ Không tìm thấy voucher New Clients active');
        } else {
            console.log(`   ✅ Tìm thấy voucher New Clients: ${newClientPromotion.title} (${newClientPromotion.code})`);

            // Lấy tất cả clients active
            const allClients = await db.User.findAll({
                where: {
                    role: 'Client',
                    status: 'Active'
                }
            });

            let newClientCount = 0;
            let notificationCount = 0;

            for (const user of allClients) {
                // Kiểm tra xem user có appointment nào không (trừ cancelled)
                const hasAppointments = await db.Appointment.findOne({
                    where: {
                        userId: user.id,
                        status: { [Op.ne]: 'cancelled' }
                    }
                });

                // Kiểm tra xem user đã dùng New Clients voucher chưa
                const hasUsedNewClientVoucher = await db.PromotionUsage.findOne({
                    where: {
                        userId: user.id,
                        appointmentId: { [Op.ne]: null }
                    },
                    include: [{
                        model: db.Promotion,
                        where: {
                            targetAudience: 'New Clients'
                        },
                        required: true
                    }]
                });

                // User là khách mới nếu chưa có appointment và chưa dùng voucher
                const isNewClient = !hasAppointments && !hasUsedNewClientVoucher;

                if (isNewClient) {
                    newClientCount++;

                    // Kiểm tra xem notification đã tồn tại chưa (trong 7 ngày gần đây)
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    sevenDaysAgo.setHours(0, 0, 0, 0);

                    const existingNotification = await db.Notification.findOne({
                        where: {
                            userId: user.id,
                            type: 'promotion',
                            relatedId: newClientPromotion.id,
                            createdAt: {
                                [Op.gte]: sevenDaysAgo
                            }
                        }
                    });

                    if (!existingNotification) {
                        // Kiểm tra voucher còn hạn không
                        const expiryDate = new Date(newClientPromotion.expiryDate);
                        expiryDate.setHours(0, 0, 0, 0);

                        if (today <= expiryDate) {
                            // Format discount value
                            let discountText = '';
                            if (newClientPromotion.discountType === 'percentage') {
                                discountText = `Giảm ${newClientPromotion.discountValue}%`;
                            } else {
                                discountText = `Giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newClientPromotion.discountValue)}`;
                            }

                            await db.Notification.create({
                                id: `notif-${uuidv4()}`,
                                userId: user.id,
                                type: 'promotion',
                                title: '🎁 Chào mừng khách hàng mới!',
                                message: `Chào mừng bạn đến với Anh Tho Spa! Bạn đã nhận được voucher khách hàng mới "${newClientPromotion.title}" (${discountText}). Mã voucher: ${newClientPromotion.code}. Hãy đến phần Ưu đãi để sử dụng nhé!`,
                                relatedId: newClientPromotion.id,
                                sentVia: 'app',
                                isRead: false,
                                emailSent: false,
                                createdAt: new Date(),
                            });
                            notificationCount++;
                            console.log(`   ✅ Đã tạo notification khách mới cho: ${user.name} (${user.email})`);
                        } else {
                            console.log(`   ⚠️  Voucher đã hết hạn cho: ${user.name} (${user.email})`);
                        }
                    } else {
                        console.log(`   ⏭️  Đã có notification khách mới cho: ${user.name} (${user.email})`);
                    }
                }
            }

            console.log(`   📊 Tổng số khách mới: ${newClientCount}`);
            console.log(`   📊 Đã tạo ${notificationCount} notification mới`);
        }

        console.log('\n✅ Hoàn thành!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

createNotifications();

