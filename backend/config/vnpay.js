// VNPay Configuration using vnpay library
// Thông tin từ mail.md - Môi trường TEST (Sandbox)

const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

// Khởi tạo VNPay instance với cấu hình từ mail.md
const vnpay = new VNPay({
    tmnCode: 'XG0MEY69', // Terminal ID / Mã Website
    secureSecret: 'YCQP43M2WN989CNUA8R01CLB6BPD3H7W', // Secret Key / Chuỗi bí mật tạo checksum
    vnpayHost: 'https://sandbox.vnpayment.vn', // URL thanh toán môi trường TEST
    testMode: true, // Môi trường TEST
    hashAlgorithm: 'SHA512', // Thuật toán hash
    loggerFn: ignoreLogger, // Tắt logger (hoặc có thể bật để debug)
});

// URL Return (User returns from VNPay)
const vnp_ReturnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3001/api/payments/vnpay-return';

// URL IPN (Instant Payment Notification) - Server call server
const vnp_IpnUrl = process.env.VNPAY_IPN_URL || 'http://localhost:3001/api/payments/vnpay-ipn';

module.exports = {
    // Get VNPay instance
    getInstance: () => vnpay,

    // Return URL
    vnp_ReturnUrl,

    // IPN URL
    vnp_IpnUrl,

    // Helper: Create payment URL using vnpay library
    // Note: This function is async to handle both sync and async buildPaymentUrl
    createPaymentUrl: async (orderId, amount, orderDescription, orderType = ProductCode.Other, clientIp = '127.0.0.1') => {
        try {
            // Đảm bảo IP address là IPv4 format
            let ipAddr = clientIp;
            if (ipAddr && ipAddr.includes('::ffff:')) {
                ipAddr = ipAddr.replace('::ffff:', '');
            }
            if (!ipAddr || ipAddr === '::1') {
                ipAddr = '127.0.0.1';
            }

            // Tính toán ngày hết hạn (15 phút từ bây giờ)
            const expireDate = new Date();
            expireDate.setMinutes(expireDate.getMinutes() + 15);

            // Tạo thông tin đơn hàng
            const cleanDescription = (orderDescription || 'Dich vu').substring(0, 100).trim();
            const orderInfo = `Thanh toan don hang ${orderId.substring(0, 20)}${cleanDescription ? ' - ' + cleanDescription : ''}`;

            // Tạo payment URL sử dụng thư viện vnpay
            // IMPORTANT: Thư viện vnpay tự động nhân 100 (chuyển VND sang cents)
            // Vì vậy chỉ cần truyền số VND trực tiếp, không cần nhân 100
            // amount từ frontend đã là VND (ví dụ: 500000 VND)
            const vnp_Amount = Math.round(amount); // Đảm bảo là số nguyên (VND)

            console.log('=== VNPay Amount Debug ===');
            console.log('Amount received (VND):', amount);
            console.log('Amount rounded (VND):', vnp_Amount);
            console.log('=== End Amount Debug ===');

            const vnpayResponse = vnpay.buildPaymentUrl({
                vnp_Amount: vnp_Amount, // Truyền VND trực tiếp, thư viện sẽ tự nhân 100
                vnp_IpAddr: ipAddr,
                vnp_TxnRef: orderId,
                vnp_OrderInfo: orderInfo.substring(0, 255),
                vnp_OrderType: orderType,
                vnp_ReturnUrl: vnp_ReturnUrl,
                vnp_Locale: VnpLocale.VN, // 'vn' hoặc 'en'
                vnp_CreateDate: dateFormat(new Date()), // Tùy chọn, mặc định là hiện tại
                vnp_ExpireDate: dateFormat(expireDate), // Tùy chọn, 15 phút sau
            });

            // Handle both Promise and direct string return
            const paymentUrl = vnpayResponse instanceof Promise ? await vnpayResponse : vnpayResponse;

            console.log('=== VNPay Payment URL Debug ===');
            console.log('Order ID:', orderId);
            console.log('Amount (VND):', vnp_Amount);
            console.log('Order Info:', orderInfo);
            console.log('Payment URL:', paymentUrl);
            console.log('=== End Debug ===');

            // paymentUrl should be a string URL
            return typeof paymentUrl === 'string' ? paymentUrl : paymentUrl.url || paymentUrl.paymentUrl || String(paymentUrl);
        } catch (error) {
            console.error('Error creating VNPay payment URL:', error);
            throw error;
        }
    },

    // Helper: Verify payment response (return URL)
    // Note: verifyReturnUrl might not be async in the library
    verifyPaymentResponse: (vnp_Params) => {
        try {
            const verifyResult = vnpay.verifyReturnUrl(vnp_Params);
            return verifyResult;
        } catch (error) {
            console.error('Error verifying VNPay payment response:', error);
            throw error;
        }
    },

    // Helper: Verify IPN (Instant Payment Notification)
    // Note: VNPay library may use verifyReturnUrl for both return URL and IPN
    verifyIpn: (vnp_Params) => {
        try {
            // Try verifyIpnCall first, fallback to verifyReturnUrl if not available
            if (vnpay.verifyIpnCall) {
                const verifyResult = vnpay.verifyIpnCall(vnp_Params);
                return verifyResult;
            } else {
                // Fallback to verifyReturnUrl for IPN
                const verifyResult = vnpay.verifyReturnUrl(vnp_Params);
                return verifyResult;
            }
        } catch (error) {
            console.error('Error verifying VNPay IPN:', error);
            throw error;
        }
    },

    // Export ProductCode and VnpLocale for use in routes
    ProductCode,
    VnpLocale,
    dateFormat,
};
