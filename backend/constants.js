// backend/constants.js
// Static constants for the application

const AVAILABLE_SPECIALTIES = ['Massage trị liệu', 'Chăm sóc da', 'Nail art', 'Trang điểm', 'Spa toàn thân'];
const PROMOTION_TARGET_AUDIENCES = ['All', 'New Clients', 'Birthday', 'Group', 'VIP', 'Tier Level 1', 'Tier Level 2', 'Tier Level 3'];
const AVAILABLE_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const STANDARD_WORK_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const LUCKY_WHEEL_PRIZES = [
  { type: 'points', value: 100, label: '100 Điểm' },
  { type: 'spin', value: 1, label: 'Thêm 1 lượt quay' },
  { type: 'voucher_fixed', value: 50000, label: 'Voucher 50k' },
  { type: 'points', value: 20, label: '20 Điểm' },
  { type: 'voucher', value: 10, label: 'Voucher 10%' },
  { type: 'points', value: 50, label: '50 Điểm' },
  { type: 'spin', value: 2, label: 'Thêm 2 lượt quay' },
  { type: 'points', value: 200, label: '200 Điểm' },
];

const STAFF_TIERS = [
  { id: 'Mới', name: 'Mới', minAppointments: 0, minRating: 0, commissionBoost: 0, color: '#9CA3AF', badgeImageUrl: 'https://picsum.photos/seed/staff-tier-new/50/50' },
  { id: 'Thành thạo', name: 'Thành thạo', minAppointments: 50, minRating: 4.3, commissionBoost: 0.05, color: '#3B82F6', badgeImageUrl: 'https://picsum.photos/seed/staff-tier-proficient/50/50' },
  { id: 'Chuyên gia', name: 'Chuyên gia', minAppointments: 150, minRating: 4.7, commissionBoost: 0.1, color: '#10B981', badgeImageUrl: 'https://picsum.photos/seed/staff-tier-expert/50/50' },
];

module.exports = {
  AVAILABLE_SPECIALTIES,
  PROMOTION_TARGET_AUDIENCES,
  AVAILABLE_TIMES,
  STANDARD_WORK_TIMES,
  LUCKY_WHEEL_PRIZES,
  STAFF_TIERS,
};
