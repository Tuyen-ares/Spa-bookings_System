


export interface Prize {
  type: 'points' | 'spin' | 'voucher' | 'voucher_fixed';
  value: number;
  label: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPercent?: number; // Phần trăm giảm giá (0-100)
  discountPrice?: number; // Giá sau khi giảm (được tính tự động từ backend)
  duration: number; // in minutes
  categoryId?: number; // The actual foreign key (nullable)
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  isActive?: boolean;
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending' | 'in-progress' | 'scheduled';
  paymentStatus?: 'Paid' | 'Unpaid';
  therapistId?: string; // ID of the therapist
  notesForTherapist?: string;
  staffNotesAfterSession?: string;
  rejectionReason?: string;
  bookingGroupId?: string;
  Client?: { // Client association from backend
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  Therapist?: { // Therapist association from backend
    id: string;
    name: string;
    email: string;
  };
}

export type UserRole = 'Admin' | 'Staff' | 'Client';
export type StaffRole = 'Manager' | 'Technician' | 'Receptionist';
export type UserStatus = 'Active' | 'Inactive' | 'Locked';
export type StaffTierName = 'Mới' | 'Thành thạo' | 'Chuyên gia'; // New: Staff tiers

export interface LoginAttempt {
  date: string;
  ip: string;
  device: string;
  isUnusual: boolean;
}

// Note: CustomerProfile and StaffProfile interfaces removed
// All user information is now stored in the users table
// These interfaces are kept for backward compatibility but should not be used
export interface CustomerProfile {
  tierLevel: number;
  selfCareIndex?: number;
  address?: string;
  totalSpending?: number;
  lastTierUpgradeDate?: string;
  Tier?: Tier;
  qrCodeUrl?: string;
  preferences?: {
    favoriteServices?: string[];
    skinType?: string;
    concerns?: string[];
  };
}

export interface StaffProfile {
  staffRole: StaffRole;
  specialty?: string[];
  experience?: string;
  staffTierId?: string;
  commissionRate?: number;
  qrCodeUrl?: string;
  kpiGoals?: {
    appointments?: number;
    revenue?: number;
    rating?: number;
  };
  StaffTier?: StaffTier;
}


export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  profilePictureUrl: string;
  joinDate: string;
  birthday?: string;
  gender?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string;
  // Note: CustomerProfile and StaffProfile removed - all info in users table
}

export type PromotionTargetAudience = 'All' | 'New Clients' | 'Birthday' | 'Group' | 'VIP' | 'Tier Level 1' | 'Tier Level 2' | 'Tier Level 3';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  expiryDate: string;
  imageUrl?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  termsAndConditions?: string;
  targetAudience?: PromotionTargetAudience;
  applicableServiceIds?: string[];
  minOrderValue?: number;
  stock?: number | null; // Số lượng còn lại (NULL = không giới hạn)
  isActive?: boolean;
}

export interface Review {
  id: string;
  serviceId: string;
  serviceName?: string; // Added to Review interface
  userName: string;
  userImageUrl: string;
  rating: number;
  comment: string;
  images?: string[]; // New: Array of image URLs
  date: string;
  appointmentId?: string; // New: Link to a specific appointment
  userId: string; // New: Link to the user who made the review
  managerReply?: string;
  isHidden?: boolean;
}

export interface Wallet {
  balance: number;
  points: number;
  totalEarned?: number;
  totalSpent?: number;
  pointsHistory?: Array<{
    date: string;
    pointsChange: number;
    type: 'earned' | 'spent' | 'expired';
    source: string;
    description: string;
  }>;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface TreatmentSession {
  id?: string;
  sessionNumber?: number;
  date: string;
  therapist: string;
  notes: string;
  beforeAfterImages?: string[];
  therapistNotes?: string;
  afterSessionImageUrl?: string;
  status?: 'completed' | 'in-progress' | 'upcoming' | 'pending' | 'scheduled' | 'cancelled';
  // Additional fields for session detail
  serviceId?: string;
  serviceName?: string;
  appointmentId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  therapistId?: string;
  therapistName?: string;
  treatmentNotes?: string;
  nextSessionAdvice?: string;
  skinConditionBefore?: string;
  skinConditionAfter?: string;
}

export interface TreatmentCourse {
  id: string;
  name: string;
  description?: string;
  price: number;
  totalSessions: number;
  services: Array<{
    serviceId: string;
    serviceName: string;
    order?: number;
    price?: number;
    duration?: number;
  }>;
  imageUrl?: string;
  
  // Thông tin đăng ký của khách hàng
  clientId?: string;
  therapistId?: string;
  completedSessions: number;
  sessions?: TreatmentSession[];
  
  // Trạng thái
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired' | 'cancelled' | 'pending';
  paymentStatus?: 'Paid' | 'Unpaid';
  
  // Thời gian
  startDate?: string;
  expiryDate?: string;
  actualCompletionDate?: string;
  nextAppointmentDate?: string;
  lastCompletedDate?: string;
  
  // Tính toán
  progressPercentage: number;
  
  // Thông tin bổ sung
  treatmentGoals?: string;
  initialSkinCondition?: string;
  consultantId?: string;
  consultantName?: string;
  isPaused: boolean;
  pauseReason?: string;
  pausedDate?: string;
  resumedDate?: string;
  remindersSent?: Array<{type: string; date: string; status: string}>;
  treatmentHistory?: Array<{
    sessionNumber: number;
    date: string;
    notes: string;
    skinCondition?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  
  // Computed fields
  daysUntilExpiry?: number;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  
  // Associations
  Client?: User;
  Service?: Service;
}

export interface TreatmentSessionDetail {
  id: string;
  treatmentCourseId: string;
  sessionNumber: number;
  appointmentId?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  therapistId?: string;
  therapistName?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed' | 'pending';
  notes?: string;
  therapistNotes?: string;
  skinCondition?: string;
  productsUsed?: any;
  nextSessionRecommendation?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_appointment' | 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder' | 'treatment_course_reminder' | 'promotion' | 'payment_success' | 'payment_received' | 'system';
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  sentVia: 'app' | 'email' | 'both';
  emailSent: boolean;
  createdAt: string;
}

export interface Therapist {
  id: string;
  name: string;
  specialty: string[]; // Changed to string[]
  imageUrl: string;
  rating: number;
  reviewCount: number;
  experience?: string; // Added for staff details
}

// Note: PointsHistory table removed - points history is now stored in wallets.pointsHistory as JSON
// This interface is kept for backward compatibility
export interface PointsHistory {
  id: string;
  userId: string;
  date: string;
  description: string;
  pointsChange: number;
}

// Note: RedeemableVoucher and RedeemedReward tables removed - merged into promotions table
// These interfaces are kept for backward compatibility
export interface RedeemableVoucher {
  id: string;
  description: string;
  pointsRequired: number;
  value: number;
  applicableServiceIds?: string[];
  targetAudience?: 'All' | 'VIP' | 'Tier Level 1' | 'Tier Level 2' | 'Tier Level 3';
}

export interface Tier {
  level: number;
  name: string;
  pointsRequired: number;
  minSpendingRequired: number;
  color: string;
  textColor: string;
}

export interface RedeemedReward {
  id: string;
  userId: string;
  rewardDescription: string;
  pointsUsed: number;
  dateRedeemed: string;
}

// Note: Mission table removed
export interface Mission {
  id: string;
  title: string;
  description?: string;
  points: number;
  isCompleted: boolean;
  userId: string;
  type?: 'service_count' | 'service_variety' | 'review_count' | 'login';
  required?: number;
  serviceCategory?: string;
}

export type PaymentStatus = 'Completed' | 'Pending' | 'Refunded' | 'Failed';
export type PaymentMethod = 'Cash' | 'Card' | 'Momo' | 'VNPay' | 'ZaloPay';

export interface Payment {
  id: string;
  transactionId?: string;
  userId: string;
  appointmentId?: string;
  serviceName?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string; // ISO string
  therapistId?: string; // Therapist who performed the service for commission tracking
  // Note: productId removed - Product table removed
}

export interface StaffScheduleSlot {
  id: string;
  therapistId: string;
  date: string;
  time: string;
  serviceName: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface StaffDailyAvailability {
  id: string;
  staffId: string;
  date?: string; // NULL nếu là lịch định kỳ
  dayOfWeek?: number; // 0=CN, 1=T2, ..., 6=T7 (NULL nếu là lịch cụ thể)
  startTime?: string; // Giờ bắt đầu (HH:MM) cho lịch định kỳ
  endTime?: string; // Giờ kết thúc (HH:MM) cho lịch định kỳ
  isAvailable?: boolean; // Có sẵn sàng không (cho lịch định kỳ)
  timeSlots?: Array<{
    time: string; // e.g., '09:00'
    availableServiceIds: string[]; // Service IDs this staff can perform at this time
  }>; // Cho lịch cụ thể
}

// NEW INTERFACES FOR STAFF PORTAL
export interface StaffTier {
  id: StaffTierName;
  name: string;
  minAppointments: number; // Minimum completed appointments for this tier
  minRating: number; // Minimum average rating for this tier
  commissionBoost?: number; // Optional: % boost to commission rate
  color: string;
  badgeImageUrl: string;
}

// Note: Product, Sale, InternalNotification, and InternalNews tables removed
// These interfaces are kept for backward compatibility
export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  stock: number;
}

export interface Sale {
  id: string;
  staffId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  date: string;
  status: 'completed' | 'pending' | 'returned';
  clientId?: string;
  paymentId?: string;
}

export interface InternalNotification {
  id: string;
  recipientId: string;
  recipientType: 'staff' | 'client' | 'all';
  type: 'appointment_new' | 'appointment_cancelled' | 'shift_change' | 'admin_message' | 'promo_alert' | 'system_news' | 'client_feedback';
  message: string;
  date: string;
  isRead: boolean;
  link?: string;
  relatedAppointmentId?: string;
}

export interface InternalNews {
  id: string;
  title: string;
  content: string;
  authorId: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface StaffShift {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  shiftType: 'morning' | 'afternoon' | 'evening' | 'leave' | 'custom';
  status: 'approved' | 'pending' | 'rejected';
  requestedBy?: string;
  notes?: string;
  assignedManagerId?: string;
  shiftHours: { start: string; end: string };
  isUpForSwap?: boolean;
  swapClaimedBy?: string;
  managerApprovalStatus?: 'pending_approval' | 'approved' | 'rejected';
}


// NEW INTERFACE FOR JOB MANAGEMENT
export interface StaffTask {
  id: string;
  title: string;
  description?: string;
  assignedToId: string;
  assignedById: string; // Admin/Manager User ID
  dueDate: string; // ISO Date string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  createdAt: string; // ISO DateTime string
  completedAt?: string; // ISO DateTime string
}
