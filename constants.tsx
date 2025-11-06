
import type { 
    PromotionTargetAudience, Prize, User, Service, ServiceCategory, Appointment, 
    Promotion, Review, TreatmentCourse, RedeemableVoucher, PointsHistory, Tier, 
    RedeemedReward, Mission, StaffDailyAvailability, StaffShift, Product, Sale, 
    InternalNotification, InternalNews, Payment, StaffTier, StaffTask 
} from './types';


export const AVAILABLE_SPECIALTIES: string[] = ['Facial', 'Massage', 'Body Care', 'Hair Removal', 'Nail Care', 'Skincare', 'Clinic', 'Relax'];
export const PROMOTION_TARGET_AUDIENCES: PromotionTargetAudience[] = ['All', 'New Clients', 'Birthday', 'VIP', 'Tier Level 1', 'Tier Level 2', 'Tier Level 3'];
export const AVAILABLE_TIMES: string[] = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
export const STANDARD_WORK_TIMES: string[] = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
export const LUCKY_WHEEL_PRIZES: Prize[] = [
  { type: 'points', value: 100, label: '100 Điểm' },
  { type: 'spin', value: 1, label: 'Thêm 1 lượt quay' },
  { type: 'voucher_fixed', value: 50000, label: 'Voucher 50k' },
  { type: 'points', value: 20, label: '20 Điểm' },
  { type: 'voucher', value: 10, label: 'Voucher 10%' },
  { type: 'points', value: 50, label: '50 Điểm' },
  { type: 'spin', value: 2, label: 'Thêm 2 lượt quay' },
  { type: 'points', value: 200, label: '200 Điểm' },
];

// All MOCK data arrays have been removed as the app now fetches data from the backend.
