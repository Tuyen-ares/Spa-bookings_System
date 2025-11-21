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
  // For Android emulator, use 10.0.2.2 to access host machine's localhost
  // For Android physical device, use your computer's real IP address (e.g., 192.168.1.158)
  if (Platform.OS === 'android') {
    // Try 10.0.2.2 first (for emulator), fallback to actual IP if needed
    return 'http://10.0.2.2:3001/api';
  }
  // iOS Simulator: can use localhost directly
  if (Platform.OS === 'ios') {
    return 'http://localhost:3001/api';
  }
  // Fallback
  return 'http://10.0.2.2:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

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

// --- STAFF SHIFTS ---
export const getStaffShifts = async (staffId: string) => {
  const response = await apiClient.get(`/staff/shifts/${staffId}`);
  return response.data;
};

export const createStaffShift = async (data: any) => {
  const response = await apiClient.post('/staff/shifts', data);
  return response.data;
};

// --- PAYMENTS ---
export const processPayment = async (appointmentId: string, paymentMethod: string, amount: number) => {
  const response = await apiClient.post('/payments/process-payment', {
    appointmentId,
    paymentMethod,
    amount
  });
  return response.data;
};

export const createVNPayUrl = async (appointmentId: string, amount: number, returnUrl: string) => {
  const response = await apiClient.post('/payments/create-vnpay-url', {
    appointmentId,
    amount,
    returnUrl
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
