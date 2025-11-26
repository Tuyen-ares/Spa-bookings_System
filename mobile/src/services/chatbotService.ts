// Mobile Chatbot Service
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use same API base URL logic as apiService
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api';
  }
  // Must match the IP in apiService.ts
  return 'http://192.168.1.3:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatRequest {
  history: Array<{ text: string; sender: 'user' | 'bot' }>;
  services?: any[];
  treatmentCourses?: any[];
}

export interface ChatResponse {
  reply: string;
  success: boolean;
}

export const sendChatMessage = async (
  history: ChatMessage[],
  services: any[] = [],
  treatmentCourses: any[] = []
): Promise<string> => {
  try {
    // Convert history to API format
    const formattedHistory = history.map(msg => ({
      text: msg.text,
      sender: msg.sender
    }));

    const token = await AsyncStorage.getItem('token');
    
    const response = await axios.post<ChatResponse>(
      `${API_BASE_URL}/chatbot/chat`,
      {
        history: formattedHistory,
        services,
        treatmentCourses
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      }
    );

    return response.data.reply;
  } catch (error: any) {
    console.error('Chatbot error:', error);
    throw new Error(
      error.response?.data?.message || 
      'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.'
    );
  }
};

export const testChatbotConnection = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(
      `${API_BASE_URL}/chatbot/test`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      }
    );
    return response.data.hasApiKey;
  } catch (error) {
    console.error('Chatbot test error:', error);
    return false;
  }
};
