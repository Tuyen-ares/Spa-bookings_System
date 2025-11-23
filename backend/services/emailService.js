// backend/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter using environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // Your email
        pass: process.env.SMTP_PASS, // Your email password or app password
      },
    });
  }

  /**
   * Send email verification
   * @param {string} email - Email của người đăng ký (người nhận email)
   * @param {string} name - Tên của người đăng ký
   * @param {string} verificationToken - Token xác nhận
   */
  async sendVerificationEmail(email, name, verificationToken) {
    // Frontend uses HashRouter, so we need to include # in the URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/verify-email/${verificationToken}`;

    const mailOptions = {
      from: `"Anh Thơ Spa" <${process.env.SMTP_USER}>`, // Email gửi đi (email của spa/admin)
      to: email, // Email nhận (email của người đăng ký)
      subject: 'Xác nhận đăng ký tài khoản - Anh Thơ Spa',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 10px;
              border: 1px solid #ddd;
            }
            .header {
              text-align: center;
              color: #8B4513;
              margin-bottom: 30px;
            }
            .content {
              background-color: white;
              padding: 25px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #8B4513;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #654321;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
            .link {
              word-break: break-all;
              color: #8B4513;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Anh Thơ Spa</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${name}</strong>,</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Anh Thơ Spa</strong>!</p>
              <p>Để hoàn tất đăng ký, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Xác nhận Email</a>
              </div>
              <p>Hoặc bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
              <p class="link">${verificationUrl}</p>
              <p><strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 24 giờ.</p>
              <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>Trân trọng,<br>Đội ngũ Anh Thơ Spa</p>
              <p>Email này được gửi tự động, vui lòng không trả lời email này.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Xin chào ${name},
        
        Cảm ơn bạn đã đăng ký tài khoản tại Anh Thơ Spa!
        
        Để hoàn tất đăng ký, vui lòng xác nhận địa chỉ email của bạn bằng cách truy cập liên kết sau:
        ${verificationUrl}
        
        Lưu ý: Liên kết này sẽ hết hạn sau 24 giờ.
        
        Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
        
        Trân trọng,
        Đội ngũ Anh Thơ Spa
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Không thể gửi email xác nhận. Vui lòng thử lại sau.');
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Email của người dùng
   * @param {string} name - Tên của người dùng
   * @param {string} resetToken - Token để reset password
   */
  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Anh Thơ Spa" <${process.env.SMTP_USER}>`, // Email gửi đi (email của spa/admin)
      to: email, // Email nhận (email của người dùng)
      subject: 'Đặt lại mật khẩu - Anh Thơ Spa',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 10px;
              border: 1px solid #ddd;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #8C5B43;
              margin: 0;
            }
            .content {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #8C5B43;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #C8A46A;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 10px;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Anh Thơ Spa</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${name}</strong>,</p>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              <p>Để đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt Lại Mật Khẩu</a>
              </div>
              <p>Hoặc bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
              <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Lưu ý:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Liên kết này sẽ hết hạn sau 1 giờ.</li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</li>
                  <li>Để bảo mật, không chia sẻ liên kết này với bất kỳ ai.</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>Trân trọng,<br>Đội ngũ Anh Thơ Spa</p>
              <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
    }
  }

  /**
   * Test email configuration
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Email server is ready to send messages');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();

