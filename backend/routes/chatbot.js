// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { Op } = require('sequelize');

// Use REST API directly instead of SDK (more reliable)
// API key will be loaded from environment variable GEMINI_API_KEY
// Default model (requested): gemini-2.5-flash
// Other options: gemini-2.0-flash, gemini-pro, gemini-1.5-flash
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
// Use v1beta API (supports system instruction in contents array)
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent`;

// Candidate models to try if default fails (404/429)
const MODEL_CANDIDATES = (process.env.GEMINI_MODEL_CANDIDATES
    ? process.env.GEMINI_MODEL_CANDIDATES.split(',').map(s => s.trim()).filter(Boolean)
    : [GEMINI_MODEL, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']);

// API version candidates to try when receiving 404 (model not found for version)
const VERSION_CANDIDATES = Array.from(new Set([
    GEMINI_API_VERSION || 'v1beta',
    'v1',
    'v1beta'
]));

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
    // Use shorter instruction when no data to reduce token usage
    const hasData = (services?.length || 0) > 0 || (treatmentCourses?.length || 0) > 0;
    const servicesInfo = hasData ? formatServicesAndCourses(services, treatmentCourses) : '';

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

// Local fallback responder when Gemini is unavailable (e.g., quota 429)
const localResponder = (history = [], services = [], treatmentCourses = []) => {
    const lastUser = [...(history || [])].reverse().find(h => h.sender === 'user');
    const intro = '**Xin chào!** Chatbot đang quá tải, mình trả lời nhanh như sau:';

    const blocks = [];
    if ((services?.length || 0) > 0) {
        const top = services.slice(0, 3).map(s => `* **${s.name}** — ${s.duration} phút, giá khoảng ${(s.discountPrice ?? s.price)?.toLocaleString('vi-VN')} VNĐ`).join('\n');
        blocks.push('Một số dịch vụ nổi bật:\n' + top);
    }
    if ((treatmentCourses?.length || 0) > 0) {
        const topC = treatmentCourses.slice(0, 3).map(c => `* **${c.serviceName}** — ${c.totalSessions} buổi, mỗi buổi ${c.sessionDuration || 60} phút`).join('\n');
        blocks.push('Một vài liệu trình phổ biến:\n' + topC);
    }

    const tail = '\nNếu cần hỗ trợ chi tiết hoặc đặt lịch, vui lòng vào mục Đặt lịch hoặc gọi hotline: **098-765-4321**.';
    const questionEcho = lastUser ? `\n\nBạn vừa hỏi: "${lastUser.text}"` : '';
    return `${intro}\n\n${blocks.join('\n\n')}${questionEcho}${tail}`.trim();
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

        const { history } = req.body;

        if (!history || !Array.isArray(history)) {
            console.error('ERROR: Invalid request - history is missing or not an array');
            return res.status(400).json({
                error: 'Invalid request. History is required and must be an array.',
                message: 'Yêu cầu không hợp lệ. Vui lòng thử lại.'
            });
        }

        console.log('Processing chat request:');
        console.log('- History length:', history.length);

        // Always fetch freshest data from server to ensure coverage of all services
        // This avoids relying on possibly stale or partial client-provided arrays
        let services = [];
        let treatmentCourses = [];
        try {
            services = await db.Service.findAll({
                include: [{
                    model: db.ServiceCategory,
                    attributes: ['id', 'name']
                }],
                order: [['name', 'ASC']]
            });
            console.log('- Loaded services from DB:', services.length);
        } catch (e) {
            console.error('Failed to load services from DB:', e.message);
        }
        try {
            // Prefer template-like courses (no client association) if any exist in DB
            // Note: schema may not include isTemplate; we fallback to clientId NULL if available
            treatmentCourses = await db.TreatmentCourse.findAll({
                where: {
                    [Op.or]: [
                        // @ts-ignore optional field in some deployments
                        { isTemplate: true },
                        { clientId: { [Op.is]: null } }
                    ]
                },
                order: [['createdAt', 'DESC']],
                attributes: [
                    'id', 'serviceId', 'serviceName', 'totalSessions', 'durationWeeks',
                    'frequencyType', 'frequencyValue', 'notes', 'createdAt'
                ]
            });
            console.log('- Loaded template treatment courses from DB:', treatmentCourses.length);
        } catch (e) {
            console.warn('No template treatment courses available or fetch failed:', e.message);
            treatmentCourses = [];
        }

        const systemInstruction = generateSystemInstruction(services, treatmentCourses);
        console.log('System instruction length:', systemInstruction.length);

        // Convert history to Gemini format
        // Put system instruction as FIRST message in contents (correct v1beta format)
        const contents = [
            {
                role: 'user',
                parts: [{ text: systemInstruction }]
            },
            ...history.map(message => ({
                role: message.sender === 'user' ? 'user' : 'model',
                parts: [{ text: message.text }],
            }))
        ];

        console.log('Calling Gemini API via REST with fallback...');
        console.log('Using model:', GEMINI_MODEL);
        console.log('API version:', GEMINI_API_VERSION);
        console.log('API URL:', GEMINI_API_URL);

        // Call Gemini API using REST API directly (v1beta format)
        // NOTE: Do NOT use systemInstruction field at root level - put it in contents array
        const requestBody = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        console.log('Request body size:', JSON.stringify(requestBody).length, 'bytes');

        const tryCall = async (model, apiVersion) => {
            const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;
            console.log(`Calling Gemini API: ${apiUrl}`);
            const response = await fetch(`${apiUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            return response;
        };

        let lastErrorText = null;
        for (const model of MODEL_CANDIDATES) {
            for (const ver of VERSION_CANDIDATES) {
                try {
                    const resp = await tryCall(model, ver);
                    if (!resp.ok) {
                        const text = await resp.text();
                        lastErrorText = text;
                        console.error(`Gemini API error (${model}, ${ver}):`, text);
                        // If model not found for version or rate limited, try next combination
                        if (resp.status === 404 || resp.status === 429) continue;
                        // Other errors: break out of version loop
                        break;
                    }
                    const data = await resp.json();
                    console.log(`Gemini API response received successfully from model: ${model}, version: ${ver}`);
                    let replyText = null;
                    if (data.candidates && data.candidates.length > 0) {
                        const candidate = data.candidates[0];
                        if (candidate.content?.parts?.length > 0) {
                            replyText = candidate.content.parts[0].text;
                        }
                    }
                    if (!replyText && data.text) replyText = data.text;
                    if (!replyText) replyText = 'Xin lỗi, không nhận được phản hồi từ AI. Vui lòng thử lại.';
                    return res.json({ reply: replyText, success: true, modelUsed: model, apiVersionUsed: ver });
                } catch (e) {
                    console.error(`Error calling model ${model} with version ${ver}:`, e);
                    lastErrorText = e?.message || String(e);
                    // try next version
                }
            }
        }

        console.warn('All Gemini model attempts failed. Activating local fallback.');
        const fallbackText = localResponder(history, services, treatmentCourses);
        return res.json({ reply: fallbackText, success: true, source: 'fallback', lastError: lastErrorText });

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

