
import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from '../../types';

const systemInstruction = `
You are a friendly and helpful virtual assistant for Anh Thơ Spa, a beauty and wellness center in Vietnam.
Your name is Thơ.
Your role is to answer customer questions about services, bookings, and general spa information.
Keep your answers concise, friendly, and professional. Always communicate in Vietnamese.

Here is some information about Anh Thơ Spa:
- Services: We offer facials, massages, body treatments, and hair removal.
- Booking: Customers can book through the app or call our hotline.
- Location: 123 Beauty St, Hanoi, Vietnam.
- Opening hours: 9 AM - 8 PM, Monday to Sunday.

Do not provide medical advice. For complex questions, advise the user to contact the spa directly at 098-765-4321.
`;

export const getChatbotResponse = async (history: ChatMessage[]): Promise<string> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        return "Xin lỗi, dịch vụ chatbot hiện không khả dụng do thiếu khóa API.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const contents = history.map(message => ({
            role: message.sender === 'user' ? 'user' : 'model',
            parts: [{ text: message.text }],
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error with Gemini API:", error);
        return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.";
    }
};
