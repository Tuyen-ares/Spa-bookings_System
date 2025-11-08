// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();

// Use REST API directly instead of SDK (more reliable)
// API key will be loaded from environment variable GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Use node-fetch for Node.js (Node.js 18+ has fetch built-in, but we'll use node-fetch for compatibility)
// Check if fetch is available globally (Node.js 18+)
const fetch = globalThis.fetch || (() => {
    try {
        return require('node-fetch');
    } catch (e) {
        console.error('ERROR: fetch is not available. Please install node-fetch: npm install node-fetch');
        throw new Error('fetch is not available. Please install node-fetch');
    }
})();

if (!apiKey) {
    console.error('WARNING: GEMINI_API_KEY is not set in environment variables');
}

// Format services and treatment courses for system instruction
const formatServicesAndCourses = (services = [], treatmentCourses = []) => {
    let info = '';
    
    // Create a map of services by ID for quick lookup
    const servicesMap = new Map();
    services.forEach(service => {
        servicesMap.set(service.id, service);
    });
    
    if (services && services.length > 0) {
        info += '\n\n=== DANH SÁCH DỊCH VỤ ===\n';
        services.forEach((service, index) => {
            // Only show active services
            if (service.isActive === false) {
                return;
            }
            
            const price = service.discountPrice ? service.discountPrice : service.price;
            const originalPrice = service.discountPrice ? service.price : null;
            info += `${index + 1}. ${service.name}\n`;
            info += `   - Mô tả: ${service.description || service.longDescription || 'Không có mô tả'}\n`;
            info += `   - Giá: ${price.toLocaleString('vi-VN')} VNĐ`;
            if (originalPrice) {
                info += ` (Giảm từ ${originalPrice.toLocaleString('vi-VN')} VNĐ)`;
            }
            info += `\n`;
            info += `   - Thời gian: ${service.duration} phút\n`;
            if (service.category) {
                info += `   - Danh mục: ${service.category}\n`;
            }
            if (service.rating) {
                info += `   - Đánh giá: ${service.rating}/5 (${service.reviewCount || 0} đánh giá)\n`;
            }
            if (service.isHot) {
                info += `   - 🔥 Dịch vụ hot\n`;
            }
            if (service.isNew) {
                info += `   - 🆕 Dịch vụ mới\n`;
            }
            info += '\n';
        });
    }
    
    // Filter template courses (courses without clientId) for customer consultation
    const templateCourses = treatmentCourses ? treatmentCourses.filter(course => !course.clientId) : [];
    
    if (templateCourses.length > 0) {
        info += '\n\n=== DANH SÁCH LIỆU TRÌNH ===\n';
        templateCourses.forEach((course, index) => {
            info += `${index + 1}. ${course.serviceName}\n`;
            if (course.description) {
                info += `   - Mô tả: ${course.description}\n`;
            }
            info += `   - Tổng số buổi: ${course.totalSessions}\n`;
            info += `   - Số buổi mỗi tuần: ${course.sessionsPerWeek}\n`;
            info += `   - Thời gian mỗi buổi: ${course.sessionDuration} phút\n`;
            if (course.sessionTime) {
                info += `   - Giờ cố định: ${course.sessionTime}\n`;
            }
            
            // Get service price information
            const relatedService = servicesMap.get(course.serviceId);
            if (relatedService) {
                const servicePrice = relatedService.discountPrice ? relatedService.discountPrice : relatedService.price;
                const totalPrice = servicePrice * course.totalSessions;
                info += `   - Giá mỗi buổi: ${servicePrice.toLocaleString('vi-VN')} VNĐ\n`;
                info += `   - Tổng giá liệu trình: ${totalPrice.toLocaleString('vi-VN')} VNĐ (${course.totalSessions} buổi)\n`;
            }
            
            info += '\n';
        });
    }
    
    return info;
};

// Generate system instruction
const generateSystemInstruction = (services = [], treatmentCourses = []) => {
    const servicesInfo = formatServicesAndCourses(services, treatmentCourses);
    
    return `
You are a friendly and helpful virtual assistant for Anh Thơ Spa, a beauty and wellness center in Vietnam.
Your name is Thơ.
Your role is to answer customer questions about services, treatment courses, bookings, and general spa information.
Keep your answers concise, friendly, and professional. Always communicate in Vietnamese.

IMPORTANT: You have access to real-time information about our services and treatment courses. Use this information to provide accurate recommendations and answers.

${servicesInfo}

=== HƯỚNG DẪN TƯ VẤN ===
1. Khi khách hàng hỏi về dịch vụ:
   - Giới thiệu dịch vụ phù hợp dựa trên nhu cầu
   - Cung cấp thông tin về giá, thời gian, và đánh giá
   - Gợi ý các dịch vụ hot hoặc mới nếu phù hợp

2. Khi khách hàng hỏi về liệu trình:
   - Giải thích chi tiết về liệu trình (số buổi, thời gian, lịch trình)
   - So sánh với dịch vụ đơn lẻ nếu khách hàng hỏi
   - Tư vấn về lịch trình phù hợp

3. Khi khách hàng muốn đặt lịch:
   - Hướng dẫn khách hàng vào trang "Đặt lịch" hoặc "Booking"
   - Hoặc gọi hotline: 098-765-4321

4. General Information:
   - Location: 123 Beauty St, Hanoi, Vietnam
   - Opening hours: 9 AM - 8 PM, Monday to Sunday
   - Hotline: 098-765-4321

RULES:
- Always use the actual service and treatment course information provided above
- Do not make up services or prices
- Be friendly, helpful, and professional
- Do not provide medical advice
- For complex questions, advise the user to contact the spa directly
- If asked about a service not in the list, politely inform that you don't have that information and suggest contacting the spa
`;
};

// GET /api/chatbot/test - Test endpoint
router.get('/test', (req, res) => {
    res.json({
        message: 'Chatbot endpoint is working',
        hasApiKey: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        apiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'none'
    });
});

// POST /api/chatbot/chat
router.post('/chat', async (req, res) => {
    try {
        console.log('=== Chatbot Endpoint Called ===');
        console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
        console.log('API key length:', process.env.GEMINI_API_KEY?.length || 0);
        console.log('Request body keys:', Object.keys(req.body));
        
        if (!apiKey) {
            console.error('ERROR: Chatbot service not available - missing API key');
            console.error('Process env keys:', Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API')));
            return res.status(500).json({
                error: 'Chatbot service is not available. GEMINI_API_KEY is not configured.',
                message: 'Xin lỗi, dịch vụ chatbot hiện không khả dụng. Vui lòng liên hệ với chúng tôi qua hotline: 098-765-4321.'
            });
        }

        const { history, services = [], treatmentCourses = [] } = req.body;

        if (!history || !Array.isArray(history)) {
            console.error('ERROR: Invalid request - history is missing or not an array');
            return res.status(400).json({
                error: 'Invalid request. History is required and must be an array.',
                message: 'Yêu cầu không hợp lệ. Vui lòng thử lại.'
            });
        }

        console.log('Processing chat request:');
        console.log('- History length:', history.length);
        console.log('- Services count:', services?.length || 0);
        console.log('- Treatment courses count:', treatmentCourses?.length || 0);

        const systemInstruction = generateSystemInstruction(services, treatmentCourses);
        console.log('System instruction length:', systemInstruction.length);

        // Convert history to Gemini format
        const contents = history.map(message => ({
            role: message.sender === 'user' ? 'user' : 'model',
            parts: [{ text: message.text }],
        }));

        console.log('Calling Gemini API via REST...');
        
        // Call Gemini API using REST API directly (as per official documentation)
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                }
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error response:', errorText);
            throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        console.log('Gemini API response received successfully');
        
        // Extract text from response
        const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                         geminiData.text || 
                         'Xin lỗi, không nhận được phản hồi từ AI.';
        
        res.json({
            reply: replyText,
            success: true
        });

    } catch (error) {
        console.error('=== ERROR in chatbot route ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        res.status(500).json({
            error: error.message || 'Internal server error',
            message: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ với chúng tôi qua hotline: 098-765-4321.'
        });
    }
});

module.exports = router;

