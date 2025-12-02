// backend/services/authService.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { Op } = require('sequelize');
const emailService = require('./emailService');

class AuthService {
    /**
     * Register new user
     */
    async register(userData) {
        const { name, email, password, phone, role = 'Client', gender, birthday } = userData;

        // Check if user exists
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = `user-client-${uuidv4()}`;

        // Start transaction
        const t = await db.sequelize.transaction();

        try {
            // Format birthday to YYYY-MM-DD if provided
            let formattedBirthday = null;
            if (birthday) {
                try {
                    const birthDate = new Date(birthday);
                    if (!isNaN(birthDate.getTime())) {
                        formattedBirthday = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    }
                } catch (e) {
                    console.warn('Invalid birthday format:', birthday);
                }
            }

            // Generate email verification token
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');

            // Create user with Pending status and unverified email
            const user = await db.User.create({
                id: userId,
                name,
                email,
                password: hashedPassword,
                phone: phone ? phone.trim() : null,
                profilePictureUrl: null, // Default to null, will display icon
                joinDate: new Date().toISOString().split('T')[0],
                birthday: formattedBirthday,
                gender: gender || null,
                role,
                status: 'Pending', // Set to Pending until email is verified
                lastLogin: null, // Don't set lastLogin on registration
                emailVerificationToken: emailVerificationToken,
                isEmailVerified: false
            }, { transaction: t });

            // Commit transaction first
            await t.commit();

            // Send verification email (outside transaction)
            // Email sẽ được gửi đến email của người đăng ký (biến 'email' ở đây)
            try {
                await emailService.sendVerificationEmail(email, name, emailVerificationToken);
                console.log(`✅ Verification email sent successfully to: ${email}`);
            } catch (emailError) {
                console.error('❌ Error sending verification email:', emailError);
                console.error('Error details:', {
                    message: emailError.message,
                    stack: emailError.stack,
                    code: emailError.code
                });
                // Don't fail registration if email fails, but log it
                // User can still verify later using resend verification email
            }

            // Return success message (don't return token until email is verified)
            return {
                message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.',
                email: email,
                requiresVerification: true
            };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(email, password) {
        // Normalize email (trim and lowercase)
        const normalizedEmail = (email || '').trim().toLowerCase();

        console.log('🔐 Login attempt:', {
            email: normalizedEmail,
            passwordLength: password ? password.length : 0
        });

        // Find user (case-insensitive email search)
        const user = await db.User.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('email')),
                normalizedEmail
            )
        });

        if (!user) {
            console.log('❌ User not found for email:', normalizedEmail);
            throw new Error('Invalid email or password');
        }

        console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status
        });

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('❌ Invalid password for user:', user.email);
            throw new Error('Invalid email or password');
        }

        console.log('✅ Password verified successfully');

        // Check if email is verified
        if (!user.isEmailVerified) {
            console.log('❌ User email is not verified');
            throw new Error('Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư của bạn.');
        }

        // Check if user is active
        if (user.status !== 'Active') {
            console.log('❌ User account is not active:', user.status);
            if (user.status === 'Pending') {
                throw new Error('Tài khoản chưa được kích hoạt. Vui lòng xác nhận email trước.');
            }
            throw new Error('Account is inactive or locked');
        }

        // Update last login
        await user.update({
            lastLogin: new Date()
        });

        // Tự động kiểm tra và gửi voucher VIP nếu user chưa nhận voucher tháng này (chỉ cho Client)
        if (user.role === 'Client') {
            try {
                const wallet = await db.Wallet.findOne({ where: { userId: user.id } });
                if (wallet && wallet.tierLevel >= 1) {
                    // Gửi voucher trong background để không làm chậm login
                    setImmediate(async () => {
                        try {
                            const monthlyVoucherService = require('../services/monthlyVoucherService');
                            const result = await monthlyVoucherService.sendMonthlyVoucherToUser(
                                user.id,
                                wallet.tierLevel,
                                new Date()
                            );
                            
                            if (result.success) {
                                console.log(`✅ [LOGIN] Đã tự động gửi voucher cho user ${user.id} (Tier Level ${wallet.tierLevel}) khi đăng nhập`);
                            } else if (result.message && result.message.includes('đã nhận')) {
                                console.log(`ℹ️ [LOGIN] User ${user.id} đã nhận voucher tháng này rồi`);
                            }
                        } catch (error) {
                            console.error(`❌ [LOGIN] Lỗi khi tự động gửi voucher cho user ${user.id}:`, error.message);
                        }
                    });
                }
            } catch (error) {
                // Không throw error để không ảnh hưởng đến login
                console.error(`❌ [LOGIN] Lỗi khi kiểm tra wallet cho user ${user.id}:`, error.message);
            }
        }

        // Check if today is user's birthday and create birthday notification if needed (only for Clients)
        if (user.role === 'Client' && user.birthday) {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const birthday = new Date(user.birthday);
                birthday.setHours(0, 0, 0, 0);
                const isBirthdayToday = birthday.getMonth() === today.getMonth() && 
                                       birthday.getDate() === today.getDate();

                if (isBirthdayToday) {
                    // Check if birthday notification already exists for today
                    const todayStart = new Date(today);
                    todayStart.setHours(0, 0, 0, 0);
                    const todayEnd = new Date(today);
                    todayEnd.setHours(23, 59, 59, 999);

                    const existingNotification = await db.Notification.findOne({
                        where: {
                            userId: user.id,
                            type: 'promotion', // Dùng 'promotion' vì ENUM chưa có 'birthday_gift' trong database
                            relatedId: birthdayPromotion.id,
                            createdAt: {
                                [Op.between]: [todayStart, todayEnd]
                            }
                        }
                    });

                    if (!existingNotification) {
                        // Find birthday promotion
                        const birthdayPromotion = await db.Promotion.findOne({
                            where: {
                                targetAudience: 'Birthday',
                                isActive: true
                            }
                        });

                        if (birthdayPromotion) {
                            await db.Notification.create({
                                id: `notif-${uuidv4()}`,
                                userId: user.id,
                                type: 'promotion', // Dùng 'promotion' vì ENUM chưa có 'birthday_gift' trong database
                                title: '🎉 Chúc mừng sinh nhật!',
                                message: `Chúc mừng sinh nhật bạn! Bạn đã nhận được voucher "${birthdayPromotion.title}". Hãy đến phần Ưu đãi để sử dụng nhé!`,
                                relatedId: birthdayPromotion.id,
                                sentVia: 'app',
                                isRead: false,
                                emailSent: false,
                                createdAt: new Date(),
                            });
                            console.log(`✅ Birthday notification created for user ${user.name} (${user.id})`);
                        }
                    }
                }
            } catch (birthdayError) {
                console.error('Error creating birthday notification:', birthdayError);
                // Don't fail login if birthday notification fails
            }
        }

        // Check if user is a new client and create new client voucher notification if needed (only for Clients)
        if (user.role === 'Client') {
            try {
                // Check if user has any appointments (excluding cancelled)
                const hasAppointments = await db.Appointment.findOne({
                    where: {
                        userId: user.id,
                        status: { [Op.ne]: 'cancelled' }
                    }
                });

                // Check if user has already used New Clients voucher
                const hasUsedNewClientVoucher = await db.PromotionUsage.findOne({
                    where: {
                        userId: user.id,
                        appointmentId: { [Op.ne]: null } // Đã được dùng (có appointmentId)
                    },
                    include: [{
                        model: db.Promotion,
                        where: {
                            targetAudience: 'New Clients'
                        },
                        required: true
                    }]
                });

                // User is a new client if they have no appointments and haven't used New Clients voucher
                const isNewClient = !hasAppointments && !hasUsedNewClientVoucher;

                if (isNewClient) {
                    // Check if new client notification already exists (check last 7 days)
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    sevenDaysAgo.setHours(0, 0, 0, 0);

                    // Find New Clients promotion first
                    const newClientPromotion = await db.Promotion.findOne({
                        where: {
                            targetAudience: 'New Clients',
                            isActive: true
                        }
                    });

                    if (newClientPromotion) {
                        // Check if notification for this promotion already exists
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

                        // If no existing notification, create one
                        if (!existingNotification) {
                            // Check if voucher is still valid
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
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
                                console.log(`✅ New client notification created for user ${user.name} (${user.id})`);
                            }
                        }
                    }
                }
            } catch (newClientError) {
                console.error('Error creating new client notification:', newClientError);
                // Don't fail login if new client notification fails
            }
        }

        // Generate token
        const token = this.generateToken(user);

        return {
            user: this.formatUserResponse(user),
            token
        };
    }

    /**
     * Generate JWT token
     */
    generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Format user response (remove sensitive data)
     */
    formatUserResponse(user) {
        const userData = user.toJSON();
        delete userData.password;
        return userData;
    }

    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        const user = await db.User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify old password
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        // Check if new password is different from current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw new Error('New password must be different');
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        return { message: 'Password changed successfully' };
    }

    /**
     * Request password reset (forgot password)
     * Generates a reset token and sends email
     */
    async forgotPassword(email) {
        console.log('🔍 Forgot password requested for email:', email);

        // Normalize email (trim and lowercase)
        const normalizedEmail = (email || '').trim().toLowerCase();

        if (!normalizedEmail) {
            throw new Error('Vui lòng cung cấp địa chỉ email.');
        }

        // Find user by email (case-insensitive)
        const user = await db.User.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('email')),
                normalizedEmail
            )
        });

        console.log('👤 User found:', user ? user.email : 'Not found');

        // Always return success message (security: don't reveal if email exists)
        if (!user) {
            console.log('Password reset requested for non-existent email:', normalizedEmail);
            return {
                message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn.'
            };
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            throw new Error('Email chưa được xác nhận. Vui lòng xác nhận email trước khi đặt lại mật khẩu.');
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date();
        resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token expires in 1 hour

        // Save reset token to user
        await user.update({
            passwordResetToken: resetToken,
            passwordResetTokenExpires: resetTokenExpires
        });

        // Send reset email
        try {
            await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
            console.log(`✅ Password reset email sent to: ${user.email}`);
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
            // Clear token if email fails
            await user.update({
                passwordResetToken: null,
                passwordResetTokenExpires: null
            });
            throw new Error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
        }

        return {
            message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn.'
        };
    }

    /**
     * Verify reset password token
     */
    async verifyResetToken(token) {
        const user = await db.User.findOne({
            where: { passwordResetToken: token }
        });

        if (!user) {
            throw new Error('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        }

        // Check if token is expired
        if (user.passwordResetTokenExpires && new Date() > new Date(user.passwordResetTokenExpires)) {
            // Clear expired token
            await user.update({
                passwordResetToken: null,
                passwordResetTokenExpires: null
            });
            throw new Error('Token đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.');
        }

        return {
            valid: true,
            email: user.email,
            name: user.name
        };
    }

    /**
     * Reset password with token (forgot password flow)
     */
    async resetPasswordWithToken(token, newPassword) {
        // Validate password
        if (!newPassword || newPassword.length < 6) {
            throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
        }

        // Find user by reset token
        const user = await db.User.findOne({
            where: { passwordResetToken: token }
        });

        if (!user) {
            throw new Error('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        }

        // Check if token is expired
        if (user.passwordResetTokenExpires && new Date() > new Date(user.passwordResetTokenExpires)) {
            // Clear expired token
            await user.update({
                passwordResetToken: null,
                passwordResetTokenExpires: null
            });
            throw new Error('Token đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await user.update({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetTokenExpires: null
        });

        console.log(`✅ Password reset successfully for user: ${user.email}`);

        return {
            message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.'
        };
    }

    /**
     * Reset password (admin function - old method, kept for backward compatibility)
     */
    async resetPassword(email, newPassword) {
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        return { message: 'Password reset successfully' };
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token) {
        console.log('🔍 Verifying email with token:', token ? token.substring(0, 20) + '...' : 'null');

        // Find user by verification token
        const user = await db.User.findOne({
            where: { emailVerificationToken: token }
        });

        if (!user) {
            console.log('❌ User not found with token:', token ? token.substring(0, 20) + '...' : 'null');
            throw new Error('Token xác nhận không hợp lệ hoặc đã hết hạn.');
        }

        console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            status: user.status
        });

        // Check if already verified
        if (user.isEmailVerified) {
            console.log('ℹ️ User already verified');
            return {
                message: 'Email đã được xác nhận trước đó. Bạn có thể đăng nhập ngay.',
                alreadyVerified: true
            };
        }

        // Start transaction
        const t = await db.sequelize.transaction();

        try {
            console.log('🔄 Updating user status to Active...');
            // Update user: verify email and activate account
            await user.update({
                isEmailVerified: true,
                status: 'Active',
                emailVerificationToken: null // Clear token after verification
            }, { transaction: t });

            console.log('✅ User updated successfully');

            // Create wallet for client if not exists
            if (user.role === 'Client') {
                const existingWallet = await db.Wallet.findOne({
                    where: { userId: user.id },
                    transaction: t
                });

                if (!existingWallet) {
                    await db.Wallet.create({
                        id: `wallet-${uuidv4()}`,
                        userId: user.id,
                        points: 0,
                        totalSpent: 0.00
                    }, { transaction: t });
                }
            }

            // Commit transaction
            await t.commit();
            console.log('✅ Transaction committed successfully');

            // Generate token for immediate login
            const finalUser = await db.User.findByPk(user.id);
            console.log('✅ Final user status:', {
                id: finalUser.id,
                email: finalUser.email,
                isEmailVerified: finalUser.isEmailVerified,
                status: finalUser.status
            });

            const token = this.generateToken(finalUser);
            console.log('✅ Token generated for user:', finalUser.email);

            return {
                message: 'Email đã được xác nhận thành công! Tài khoản của bạn đã được kích hoạt.',
                user: this.formatUserResponse(finalUser),
                token
            };
        } catch (error) {
            console.error('❌ Error in verifyEmail transaction:', error);
            await t.rollback();
            throw error;
        }
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail(email) {
        const user = await db.User.findOne({ where: { email } });

        if (!user) {
            throw new Error('Email không tồn tại trong hệ thống.');
        }

        if (user.isEmailVerified) {
            throw new Error('Email đã được xác nhận. Bạn có thể đăng nhập ngay.');
        }

        // Generate new token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        await user.update({ emailVerificationToken });

        // Send email
        try {
            await emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);
            return { message: 'Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.' };
        } catch (error) {
            throw new Error('Không thể gửi email xác nhận. Vui lòng thử lại sau.');
        }
    }
}

module.exports = new AuthService();
