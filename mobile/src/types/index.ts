// Mobile Types - Dùng chung với web
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Staff' | 'Client';
  profilePictureUrl?: string;
  birthday?: string;
  gender?: string;
  address?: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  averageRating?: number;
  categoryId?: number;
  isActive?: boolean;
  ServiceCategory?: ServiceCategory;
}

export interface Promotion {
  id: number;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  minPurchase?: number;
  maxDiscount?: number;
}

export interface Review {
  id: number;
  userId: string;
  serviceId: string;
  appointmentId?: string;
  rating: number;
  comment: string;
  createdAt: string;
  User?: User;
  Service?: Service;
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  date: string;
  time: string;
  status: 'pending' | 'upcoming' | 'completed' | 'cancelled' | 'in-progress' | 'scheduled' | 'confirmed';
  paymentStatus?: 'Paid' | 'Unpaid';
  therapist?: string;
  therapistId?: string;
  staffId?: string;
  notes?: string;
  reviewRating?: number;
  price?: number;
  totalPrice?: number;
  appointmentDate?: string;
  User?: User;
  Service?: Service;
  Staff?: User;
  TreatmentSession?: {
    id: string;
    sessionNumber: number;
    status: string;
    treatmentCourseId?: string;
    TreatmentCourse?: {
      id: string;
      totalSessions: number;
      completedSessions: number;
      serviceName: string;
    };
  };
}

export interface TreatmentSession {
  id: string;
  treatmentCourseId: string;
  appointmentId?: string;
  sessionNumber: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  sessionDate: string;
  sessionTime: string;
  staffId?: string;
  customerStatusNotes?: string;
  adminNotes?: string;
  completedAt?: string;
  Staff?: User;
  Appointment?: Appointment;
}

export interface TreatmentCourse {
  id: string;
  serviceId: string;
  serviceName: string;
  clientId: string;
  totalSessions: number;
  completedSessions: number;
  startDate: string;
  durationWeeks: number;
  expiryDate: string;
  frequencyType?: 'weeks_per_session' | 'sessions_per_week' | null;
  frequencyValue?: number | null;
  therapistId?: string | null;
  status: 'active' | 'completed' | 'expired' | 'cancelled' | 'pending';
  paymentStatus: 'Paid' | 'Unpaid';
  notes?: string;
  Service?: Service;
  Client?: User;
  Therapist?: User;
  sessions?: TreatmentSession[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  birthday?: string;
  gender?: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}