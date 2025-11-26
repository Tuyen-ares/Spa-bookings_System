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
  TreatmentCourse
} from '../types';

// Auto-detect API URL based on platform
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api';
  }
  // For Android emulator/device or physical device, the mobile app should call the
  // backend server (Express) which runs on port 3001 by default in this project.
  // Note: port 8081 is used by the Metro/Expo bundler (exp://...) and is NOT the
  // backend API port. Use your machine LAN IP + backend port (3001).
  return 'http://192.168.1.16:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to convert relative image URLs to full URLs for mobile
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    console.log('getImageUrl: No image path, using fallback');
    return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop';
  }
  
  // If already a full URL (including picsum, unsplash, etc.), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('getImageUrl: Full URL detected:', imagePath);
    return imagePath;
  }
  
  // Convert relative path to full URL using backend server
  const baseUrl = API_BASE_URL.replace('/api', ''); // Remove /api suffix
  const fullUrl = `${baseUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  console.log('getImageUrl: Converting relative path:', imagePath, '-> Full URL:', fullUrl);
  return fullUrl;
};

let apiClient: AxiosInstance;

// Initialize API client
export const initializeApi = async () => {
  const token = await AsyncStorage.getItem('token');
  
  apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  // Add response interceptor for error handling
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired, clear storage
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// --- AUTHENTICATION ---
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', credentials);
  const data = response.data;
  
  // Save token & user to AsyncStorage
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', data);
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
  const response = await apiClient.post('/auth/change-password', data);
  return response.data;
};

// --- APPOINTMENTS ---
export const getUserAppointments = async (userId: string): Promise<Appointment[]> => {
  const response = await apiClient.get(`/appointments/user/${userId}`);
  return response.data;
};

export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await apiClient.get('/appointments');
  return response.data;
};

export const getAppointmentById = async (id: string): Promise<Appointment> => {
  const response = await apiClient.get(`/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (data: Partial<Appointment>) => {
  const response = await apiClient.post('/appointments', data);
  return response.data;
};

export const updateAppointment = async (id: string, data: Partial<Appointment>) => {
  const response = await apiClient.put(`/appointments/${id}`, data);
  return response.data;
};

export const cancelAppointment = async (id: string) => {
  const response = await apiClient.put(`/appointments/${id}`, { status: 'cancelled' });
  return response.data;
};

// --- SERVICES ---
export const getServices = async (): Promise<Service[]> => {
  const response = await apiClient.get('/services');
  return response.data;
};

export const getServiceById = async (id: string): Promise<Service> => {
  const response = await apiClient.get(`/services/${id}`);
  return response.data;
};

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  const response = await apiClient.get('/services/categories');
  return response.data;
};

// --- PROMOTIONS ---
export const getPromotions = async (): Promise<Promotion[]> => {
  const response = await apiClient.get('/promotions');
  return response.data;
};

export const applyPromotion = async (code: string): Promise<{ success: boolean; message: string; promotion: Promotion }> => {
  const response = await apiClient.post(`/promotions/apply/${code}`);
  return response.data;
};

// --- REVIEWS ---
export const getReviews = async (): Promise<Review[]> => {
  const response = await apiClient.get('/reviews');
  return response.data;
};

export const createReview = async (data: Partial<Review>) => {
  const response = await apiClient.post('/reviews', data);
  return response.data;
};

// --- USERS ---
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get('/users');
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id: string, data: Partial<User>) => {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
};

// --- PAYMENTS ---
export const processPayment = async (
  appointmentId: string, 
  method: string, 
  amount: number,
  promotionCode?: string
) => {
  const response = await apiClient.post('/payments/process', {
    appointmentId,
    method,
    amount,
    promotionCode: promotionCode || undefined
  });
  return response.data;
};

// --- SERVICES (ADMIN CRUD) ---
export const createService = async (data: Partial<Service>) => {
  const response = await apiClient.post('/services', data);
  return response.data;
};

export const updateService = async (id: string, data: Partial<Service>) => {
  const response = await apiClient.put(`/services/${id}`, data);
  return response.data;
};

export const deleteService = async (id: string) => {
  const response = await apiClient.delete(`/services/${id}`);
  return response.data;
};

// --- TREATMENT COURSES ---
export const getTreatmentCourses = async (params?: { clientId?: string; status?: string }) => {
  const response = await apiClient.get('/treatment-courses', { params });
  return response.data as TreatmentCourse[];
};

export const getTreatmentCourseById = async (id: string) => {
  const response = await apiClient.get(`/treatment-courses/${id}`);
  return response.data as TreatmentCourse;
};

export const confirmTreatmentCoursePayment = async (id: string) => {
  const response = await apiClient.put(`/treatment-courses/${id}/confirm-payment`);
  return response.data;
};

export const completeTreatmentSession = async (
  courseId: string,
  payload: { sessionNumber: number; customerStatusNotes?: string; adminNotes?: string }
) => {
  const response = await apiClient.put(`/treatment-courses/${courseId}/complete-session`, payload);
  return response.data;
};

export const updateTreatmentSession = async (sessionId: string, data: any) => {
  const response = await apiClient.put(`/treatment-sessions/${sessionId}`, data);
  return response.data;
};

export const updateTreatmentCourse = async (courseId: string, data: any) => {
  const response = await apiClient.put(`/treatment-courses/${courseId}`, data);
  return response.data;
};

// --- NOTIFICATIONS ---
export const getNotifications = async (userId: string) => {
  const response = await apiClient.get(`/notifications/user/${userId}`);
  return response.data;
};

export const getUnreadNotificationsCount = async (userId: string) => {
  const response = await apiClient.get(`/notifications/unread/${userId}`);
  return response.data.count;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const response = await apiClient.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const response = await apiClient.put(`/notifications/read-all/${userId}`);
  return response.data;
};

// --- WALLET & REWARDS ---
export const getWallet = async (userId: string) => {
  const response = await apiClient.get(`/wallets/${userId}`);
  return response.data;
};

export const getRedeemableVouchers = async () => {
  const response = await apiClient.get('/promotions?redeemableOnly=true');
  return response.data;
};

export const redeemVoucher = async (promotionId: string, userId: string) => {
  const response = await apiClient.post(`/promotions/${promotionId}/redeem`, { userId });
  return response.data;
};

export const getRedeemedVouchers = async (userId: string) => {
  const response = await apiClient.get(`/promotions/my-redeemed/${userId}`);
  return response.data;
};
