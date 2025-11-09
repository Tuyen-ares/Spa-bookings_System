


export interface Prize {
  type: 'points' | 'spin' | 'voucher' | 'voucher_fixed';
  value: number;
  label: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  order?: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  price: number;
  discountPrice?: number;
  duration: number; // in minutes
  category?: string; // The category name, populated from the join
  categoryId?: number; // The actual foreign key (nullable)
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  isHot?: boolean;
  isNew?: boolean;
  promoExpiryDate?: string;
  isActive?: boolean;
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName?: string; // Tên khách hàng (để hiển thị trên lịch)
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending' | 'in-progress';
  paymentStatus?: 'Paid' | 'Unpaid';
  therapist?: string; // Name of the therapist
  therapistId?: string; // ID of the therapist
  notesForTherapist?: string;
  staffNotesAfterSession?: string;
  isStarted?: boolean;
  isCompleted?: boolean;
  reviewRating?: number;
  rejectionReason?: string;
  bookingGroupId?: string;
  roomId?: string;
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
  loginHistory?: LoginAttempt[];
  // Note: CustomerProfile and StaffProfile removed - all info in users table
}

export type PromotionTargetAudience = 'All' | 'New Clients' | 'Birthday' | 'Group' | 'VIP' | 'Tier Level 1' | 'Tier Level 2' | 'Tier Level 3' | 'Tier Level 4' | 'Tier Level 5' | 'Tier Level 6' | 'Tier Level 7' | 'Tier Level 8';

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
  targetAudience?: PromotionTargetAudience; // Who is this promotion for?
  applicableServiceIds?: string[]; // Which services apply? Empty means all.
  minOrderValue?: number; // Minimum order value for discount to apply
  usageCount?: number; // For reporting, how many times used
  usageLimit?: number | null; // NULL = không giới hạn
  pointsRequired?: number; // Điểm cần để đổi (0 = không cần, >0 = voucher đổi điểm)
  isVoucher?: boolean; // 1 = voucher đổi điểm, 0 = khuyến mãi thông thường
  stock?: number | null; // Số lượng voucher còn lại (NULL = không giới hạn)
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
  date: string;
  therapist: string;
  notes: string;
  beforeAfterImages?: string[]; // New: Images for treatment progress
  therapistNotes?: string; // New: Detailed notes from therapist
  afterSessionImageUrl?: string; // New: Single image after session
  status?: 'completed' | 'in-progress' | 'upcoming'; // New: Status of a single session
}

export interface TreatmentCourse {
  id: string;
  serviceId: string;
  serviceName: string;
  totalSessions: number;
  sessionsPerWeek: number; // Số buổi mỗi tuần
  weekDays?: number[]; // Mảng các thứ trong tuần: [1,3,5] = Thứ 2, Thứ 4, Thứ 6 (0=CN, 1=T2, ..., 6=T7)
  sessionDuration: number; // Thời gian mỗi buổi (phút)
  sessionTime?: string; // Giờ cố định cho các buổi (ví dụ: "18:00")
  description?: string; // Mô tả liệu trình
  imageUrl?: string; // URL hình ảnh liệu trình
  sessions?: TreatmentSession[]; // Optional: Array of treatment sessions
  initialAppointmentId?: string; // ID appointment đầu tiên tạo ra liệu trình (để lấy userId từ appointments)
  clientId?: string; // Client associated with this course (có thể NULL cho template)
  therapistId?: string; // Therapist responsible for this course
  status: 'active' | 'completed' | 'paused'; // Status of the course
  expiryDate?: string; // Hạn sử dụng liệu trình
  nextAppointmentDate?: string; // Ngày hẹn tiếp theo (để nhắc nhở)
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
  targetAudience?: 'All' | 'VIP' | 'Tier Level 1' | 'Tier Level 2' | 'Tier Level 3' | 'Tier Level 4' | 'Tier Level 5' | 'Tier Level 6' | 'Tier Level 7' | 'Tier Level 8';
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
  bookingId?: string; // ID đặt lịch
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

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipmentIds?: string[] | null;
  isActive: boolean;
}