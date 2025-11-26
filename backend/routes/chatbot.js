// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();

// Use REST API directly instead of SDK (more reliable)
// API key will be loaded from environment variable GEMINI_API_KEY
// Use gemini-2.0-flash (latest model) as default
// Other options: gemini-pro, gemini-1.5-pro
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
// Try v1beta first, fallback to v1 if needed
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent`;

// Get API key dynamically (in case it's updated)
const getApiKey = () => process.env.GEMINI_API_KEY;

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

if (!getApiKey()) {
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
            info += `   - Mô tả: ${service.description || 'Không có mô tả'}\n`;
            info += `   - Giá: ${price.toLocaleString('vi-VN')} VNĐ`;
            if (originalPrice) {
                info += ` (Giảm từ ${originalPrice.toLocaleString('vi-VN')} VNĐ)`;
            }
            info += `\n`;
            info += `   - Thời gian: ${service.duration} phút\n`;
            if (service.ServiceCategory) {
                info += `   - Danh mục: ${service.ServiceCategory.name}\n`;
            }
            if (service.rating) {
                info += `   - Đánh giá: ${service.rating}/5 (${service.reviewCount || 0} đánh giá)\n`;
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

=== FORMATTING RULES (QUAN TRỌNG) ===
Khi trả lời, hãy format đẹp mắt:
- Sử dụng **text** để in đậm tên dịch vụ, giá tiền, số liệu quan trọng
- Xuống dòng để tách các ý riêng biệt
- Sử dụng dấu * ở đầu dòng khi liệt kê nhiều mục (bullet points)
- Ví dụ format đẹp:

Dưới đây là một số dịch vụ nổi bật tại Anh Thơ Spa:

* **Chăm sóc da mặt cơ bản:** 300.000 VNĐ/lần (60 phút) - Làm sạch sâu, cấp ẩm, giúp da khỏe mạnh.
* **Massage body thư giãn:** 450.000 VNĐ/lần (75 phút) - Giảm căng thẳng, mệt mỏi, tăng cường lưu thông máu.
* **Trị mụn chuyên sâu:** 500.000 VNĐ/lần (90 phút) - Loại bỏ mụn, giảm viêm, ngăn ngừa tái phát.

Bạn quan tâm đến dịch vụ nào để tôi tư vấn chi tiết hơn không? 💕

RULES:
- Always use the actual service and treatment course information provided above
- Do not make up services or prices
- Be friendly, helpful, and professional
- Do not provide medical advice
- For complex questions, advise the user to contact the spa directly
- If asked about a service not in the list, politely inform that you don't have that information and suggest contacting the spa
- ALWAYS format your response with **bold**, line breaks, and bullet points (*) for better readability
`;
};

// GET /api/chatbot/test - Test endpoint
router.get('/test', (req, res) => {
    res.json({
        message: 'Chatbot endpoint is working',
        hasApiKey: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        apiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'none',
        model: GEMINI_MODEL,
        apiUrl: GEMINI_API_URL
    });
});

// POST /api/chatbot/chat
router.post('/chat', async (req, res) => {
    try {
        console.log('=== Chatbot Endpoint Called ===');
        const apiKey = getApiKey();
        console.log('GEMINI_API_KEY exists:', !!apiKey);
        console.log('API key length:', apiKey?.length || 0);
        console.log('Model:', GEMINI_MODEL);
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
        console.log('Using model:', GEMINI_MODEL);
        console.log('API version:', GEMINI_API_VERSION);
        console.log('API URL:', GEMINI_API_URL);
        
        // Call Gemini API using REST API directly (as per official documentation)
        const requestBody = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };
        
        console.log('Request body size:', JSON.stringify(requestBody).length, 'bytes');
        
        let geminiResponse;
        let lastError;
        
        // Try v1beta first, then fallback to v1 if model not found
        const apiVersions = [GEMINI_API_VERSION, 'v1'];
        
        for (const apiVersion of apiVersions) {
            const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${GEMINI_MODEL}:generateContent`;
            
            try {
                console.log(`Trying API version: ${apiVersion}`);
                geminiResponse = await fetch(`${apiUrl}?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                if (geminiResponse.ok) {
                    console.log(`✅ Success with API version: ${apiVersion}`);
                    break; // Success, exit loop
                } else {
                    const errorText = await geminiResponse.text();
                    console.warn(`⚠️ API version ${apiVersion} failed:`, errorText);
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.error?.message?.includes('not found') && apiVersion === 'v1beta' && apiVersions.length > 1) {
                            // Model not found in v1beta, try v1
                            lastError = errorData.error.message;
                            continue;
                        }
                    } catch (e) {
                        // If parsing fails, continue to next version
                    }
                    
                    lastError = errorText;
                }
            } catch (fetchError) {
                console.error(`Error with API version ${apiVersion}:`, fetchError.message);
                lastError = fetchError.message;
                if (apiVersion === apiVersions[apiVersions.length - 1]) {
                    // Last version, throw error
                    throw fetchError;
                }
            }
        }

        if (!geminiResponse || !geminiResponse.ok) {
            const errorText = lastError || await geminiResponse?.text() || 'Unknown error';
            console.error('Gemini API error response:', errorText);
            let errorMessage = `Gemini API error: ${geminiResponse?.status || 'Unknown'} ${geminiResponse?.statusText || 'Unknown'}`;
            
            try {
                const errorData = typeof errorText === 'string' ? JSON.parse(errorText) : errorText;
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                // If parsing fails, use the text as is
                if (typeof errorText === 'string') {
                    errorMessage = errorText;
                }
            }
            
            throw new Error(errorMessage);
        }

        const geminiData = await geminiResponse.json();
        console.log('Gemini API response received successfully');
        console.log('Response structure:', Object.keys(geminiData));
        
        // Extract text from response - handle different response formats
        let replyText = null;
        
        if (geminiData.candidates && geminiData.candidates.length > 0) {
            const candidate = geminiData.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                replyText = candidate.content.parts[0].text;
            }
        }
        
        if (!replyText && geminiData.text) {
            replyText = geminiData.text;
        }
        
        if (!replyText) {
            console.error('No text found in Gemini response:', JSON.stringify(geminiData, null, 2));
            replyText = 'Xin lỗi, không nhận được phản hồi từ AI. Vui lòng thử lại.';
        }
        
        res.json({
            reply: replyText,
            success: true
        });

    } catch (error) {
        console.error('=== ERROR in chatbot route ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        
        // Provide more specific error messages
        let userMessage = 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ với chúng tôi qua hotline: 098-765-4321.';
        
        if (error.message.includes('API key')) {
            userMessage = 'Xin lỗi, dịch vụ chatbot hiện không khả dụng do lỗi cấu hình. Vui lòng liên hệ với chúng tôi qua hotline: 098-765-4321.';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
            userMessage = 'Xin lỗi, dịch vụ chatbot tạm thời quá tải. Vui lòng thử lại sau vài phút.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            userMessage = 'Xin lỗi, không thể kết nối đến dịch vụ AI. Vui lòng kiểm tra kết nối mạng và thử lại.';
        }
        
        res.status(500).json({
            error: error.message || 'Internal server error',
            message: userMessage
        });
    }
});

module.exports = router;

