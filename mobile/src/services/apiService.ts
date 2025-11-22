import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type {
  User,
  Appointment,
  Service,
  ServiceCategory,
  Promotion,
  Review,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  TreatmentCourse,
  ChatMessage
} from '../types';

// Auto-detect API URL based on platform
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api';
  }
  // For Android emulator/device, use your computer's real IP address
  // This is your machine's IP: 192.168.80.1
  // Make sure your backend is accessible from this IP
  if (Platform.OS === 'android') {
    return 'http://192.168.80.1:3001/api';
  }
  // iOS Simulator: can use localhost directly
  if (Platform.OS === 'ios') {
    return 'http://localhost:3001/api';
  }
  // Fallback
  return 'http://192.168.80.1:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

let apiClient: AxiosInstance | null = null;
let isInitializing = false;
let initPromise: Promise<AxiosInstance> | null = null;

// Pre-initialize API client to avoid race conditions
// This ensures apiClient is always available, even if initializeApi() hasn't been called yet
let preInitialized = false;

// Ensure API client is initialized before use
const ensureApiClient = async (): Promise<AxiosInstance> => {
  // If already initialized, return it
  if (apiClient) {
    return apiClient;
  }

  // If currently initializing, wait for it
  if (isInitializing && initPromise) {
    console.log('⏳ API client is initializing, waiting...');
    try {
      return await initPromise;
    } catch (error) {
      // If initialization failed, try again
      console.log('⚠️ Previous initialization failed, retrying...');
      isInitializing = false;
      initPromise = null;
    }
  }

  // Start initialization
  console.log('🔄 Ensuring API client is initialized...');
  isInitializing = true;
  initPromise = initializeApi();

  try {
    const client = await initPromise;
    apiClient = client; // Store for future use
    console.log('✅ API client initialized successfully');
    isInitializing = false;
    initPromise = null;
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize API client:', error);
    // Reset state on error so we can retry
    isInitializing = false;
    initPromise = null;
    throw error;
  }
};

// Initialize API client
export const initializeApi = async () => {
  const token = await AsyncStorage.getItem('token');

  console.log('🔗 API Base URL:', API_BASE_URL); // Debug log

  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    timeout: 10000, // 10 seconds timeout
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired, clear storage
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      }

      // Debug network errors
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        console.error('❌ API Connection Error:', error.message);
        console.error('🔗 Attempted URL:', error.config?.url);
        console.error('🔗 Base URL:', API_BASE_URL);
      }

      return Promise.reject(error);
    }
  );

  // Test connection on initialization
  try {
    // Just log that we're trying to connect
    console.log('🔄 Testing API connection to:', API_BASE_URL);
  } catch (error) {
    console.error('❌ API initialization error:', error);
  }

  // Update global apiClient
  apiClient = client;
  return client;
};

// --- AUTHENTICATION ---
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const client = await ensureApiClient();
  const response = await client.post('/auth/login', credentials);
  const data = response.data;

  // Save token & user to AsyncStorage
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const client = await ensureApiClient();
  const response = await client.post('/auth/register', data);
  const result = response.data;

  // Save token & user to AsyncStorage
  await AsyncStorage.setItem('token', result.token);
  await AsyncStorage.setItem('user', JSON.stringify(result.user));

  return result;
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const changePassword = async (data: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> => {
  const client = await ensureApiClient();
  const response = await client.post('/auth/change-password', data);
  return response.data;
};

// --- APPOINTMENTS ---
export const getUserAppointments = async (userId: string): Promise<Appointment[]> => {
  const client = await ensureApiClient();
  const response = await client.get(`/appointments/user/${userId}`);
  return response.data;
};

export const getAppointments = async (): Promise<Appointment[]> => {
  const client = await ensureApiClient();
  const response = await client.get('/appointments');
  return response.data;
};

export const getAppointmentById = async (id: string): Promise<Appointment> => {
  const client = await ensureApiClient();
  const response = await client.get(`/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (data: Partial<Appointment>) => {
  const client = await ensureApiClient();
  const response = await client.post('/appointments', data);
  return response.data;
};

export const updateAppointment = async (id: string, data: Partial<Appointment>) => {
  const client = await ensureApiClient();
  const response = await client.put(`/appointments/${id}`, data);
  return response.data;
};

export const cancelAppointment = async (id: string) => {
  const client = await ensureApiClient();
  const response = await client.put(`/appointments/${id}`, { status: 'cancelled' });
  return response.data;
};

// --- SERVICES ---
export const getServices = async (): Promise<Service[]> => {
  try {
    const client = await ensureApiClient();
    const response = await client.get('/services');
    return response.data;
  } catch (error: any) {
    console.error('Error in getServices:', error);
    throw error;
  }
};

export const getServiceById = async (id: string): Promise<Service> => {
  const client = await ensureApiClient();
  const response = await client.get(`/services/${id}`);
  return response.data;
};

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  const client = await ensureApiClient();
  const response = await client.get('/services/categories');
  return response.data;
};

// --- PROMOTIONS ---
export const getPromotions = async (): Promise<Promotion[]> => {
  const client = await ensureApiClient();
  const response = await client.get('/promotions');
  return response.data;
};

// --- REVIEWS ---
export const getReviews = async (): Promise<Review[]> => {
  const client = await ensureApiClient();
  const response = await client.get('/reviews');
  return response.data;
};

export const createReview = async (data: Partial<Review>) => {
  const client = await ensureApiClient();
  const response = await client.post('/reviews', data);
  return response.data;
};

// --- USERS ---
export const getUsers = async (): Promise<User[]> => {
  const client = await ensureApiClient();
  const response = await client.get('/users');
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const client = await ensureApiClient();
  const response = await client.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id: string, data: Partial<User>) => {
  const client = await ensureApiClient();
  const response = await client.put(`/users/${id}`, data);
  return response.data;
};

// --- STAFF SHIFTS ---
export const getStaffShifts = async (staffId: string) => {
  const client = await ensureApiClient();
  const response = await client.get(`/staff/shifts/${staffId}`);
  return response.data;
};

export const createStaffShift = async (data: any) => {
  const client = await ensureApiClient();
  const response = await client.post('/staff/shifts', data);
  return response.data;
};

// --- PAYMENTS ---
export const processPayment = async (appointmentId: string, method: 'VNPay' | 'Cash', amount: number) => {
  const client = await ensureApiClient();
  const response = await client.post('/payments/process', {
    appointmentId,
    method,
    amount
  });
  return response.data;
};

// --- SERVICES (ADMIN CRUD) ---
export const createService = async (data: Partial<Service>) => {
  const client = await ensureApiClient();
  const response = await client.post('/services', data);
  return response.data;
};

export const updateService = async (id: string, data: Partial<Service>) => {
  const client = await ensureApiClient();
  const response = await client.put(`/services/${id}`, data);
  return response.data;
};

export const deleteService = async (id: string) => {
  const client = await ensureApiClient();
  const response = await client.delete(`/services/${id}`);
  return response.data;
};

// --- TREATMENT COURSES ---
export const getTreatmentCourses = async (params?: { clientId?: string; status?: string }) => {
  const client = await ensureApiClient();
  const response = await client.get('/treatment-courses', { params });
  return response.data as TreatmentCourse[];
};

export const getTreatmentCourseById = async (id: string) => {
  const client = await ensureApiClient();
  const response = await client.get(`/treatment-courses/${id}`);
  return response.data as TreatmentCourse;
};

export const confirmTreatmentCoursePayment = async (id: string) => {
  const client = await ensureApiClient();
  const response = await client.put(`/treatment-courses/${id}/confirm-payment`);
  return response.data;
};

export const completeTreatmentSession = async (
  courseId: string,
  payload: { sessionNumber: number; customerStatusNotes?: string; adminNotes?: string }
) => {
  const client = await ensureApiClient();
  const response = await client.put(`/treatment-courses/${courseId}/complete-session`, payload);
  return response.data;
};

export const updateTreatmentSession = async (sessionId: string, data: any) => {
  const client = await ensureApiClient();
  const response = await client.put(`/treatment-sessions/${sessionId}`, data);
  return response.data;
};

export const updateTreatmentCourse = async (courseId: string, data: any) => {
  const client = await ensureApiClient();
  const response = await client.put(`/treatment-courses/${courseId}`, data);
  return response.data;
};

// --- CHATBOT ---
export const getChatbotResponse = async (
  history: ChatMessage[],
  services: Service[] = [],
  treatmentCourses: TreatmentCourse[] = []
): Promise<string> => {
  try {
    const client = await ensureApiClient();
    const response = await client.post('/chatbot/chat', {
      history,
      services,
      treatmentCourses,
    });

    return response.data.reply || response.data.message || 'Xin lỗi, không nhận được phản hồi từ chatbot.';
  } catch (error: any) {
    console.error('Error calling chatbot API:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    return errorMessage || 'Xin lỗi, không thể kết nối đến dịch vụ chatbot. Vui lòng thử lại sau hoặc liên hệ với chúng tôi qua hotline: 098-765-4321.';
  }
};
