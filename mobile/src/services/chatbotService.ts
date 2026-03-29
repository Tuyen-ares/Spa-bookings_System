// Mobile Chatbot Service (uses backend Gemini 2.5 Flash)
// Aligns with backend/routes/chatbot.js (default model gemini-2.5-flash)
import { Platform } from 'react-native';

// Match apiService base URL logic so device/emulator reaches backend
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api';
  }
  if (Platform.OS === 'android') {
    // Android emulator -> host machine backend port 3002
    return 'http://10.0.2.2:3002/api';
  }
  // iOS simulator / physical device: update IP to your LAN if needed
  return 'http://192.168.1.7:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatResponse {
  reply: string;
  success: boolean;
  error?: string;
  message?: string;
}

// Send chat to backend Gemini (gemini-2.5-flash)
export const sendChatMessage = async (
  history: ChatMessage[],
  services: any[] = [],
  treatmentCourses: any[] = []
): Promise<string> => {
  // Convert history to backend format
  const formattedHistory = history.map(msg => ({
    text: msg.text,
    sender: msg.sender,
  }));

  try {
    const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history: formattedHistory,
        services,
        treatmentCourses,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.');
    }

    const data: ChatResponse = await response.json();
    return data.reply || data.message || 'Xin lỗi, không nhận được phản hồi từ chatbot.';
  } catch (error: any) {
    console.error('Chatbot error:', error);
    throw new Error(error.message || 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.');
  }
};

// Quick connectivity test (also reveals backend model)
export const testChatbotConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chatbot/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return false;

    const data = await response.json();
    return !!data.hasApiKey;
  } catch (error) {
    console.error('Chatbot test error:', error);
    return false;
  }
};
