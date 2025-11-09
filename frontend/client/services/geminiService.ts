
import type { ChatMessage, Service, TreatmentCourse } from '../../types';

const API_BASE_URL = 'http://localhost:3001/api';

// Call backend chatbot endpoint instead of calling Gemini API directly
// This is more secure and follows best practices
export const getChatbotResponse = async (
    history: ChatMessage[],
    services: Service[] = [],
    treatmentCourses: TreatmentCourse[] = []
): Promise<string> => {
    try {
        console.log('Calling chatbot API:', {
            url: `${API_BASE_URL}/chatbot/chat`,
            historyLength: history.length,
            servicesCount: services.length,
            treatmentCoursesCount: treatmentCourses.length
        });

        const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                history,
                services,
                treatmentCourses,
            }),
        });

        console.log('Chatbot API response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Chatbot API error:', errorData);
            console.error('Response status:', response.status);
            console.error('Response statusText:', response.statusText);
            return errorData.message || errorData.error || 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ với chúng tôi qua hotline: 098-765-4321.';
        }

        const data = await response.json();
        console.log('Chatbot API success:', data);
        return data.reply || data.message || 'Xin lỗi, không nhận được phản hồi từ chatbot.';
    } catch (error: any) {
        console.error('Error calling chatbot API:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return 'Xin lỗi, không thể kết nối đến dịch vụ chatbot. Vui lòng đảm bảo backend server đang chạy trên port 3001 và thử lại sau hoặc liên hệ với chúng tôi qua hotline: 098-765-4321.';
    }
};
