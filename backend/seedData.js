
// backend/seedData.js
// This file contains mock data for database seeding, converted from the frontend constants.tsx file.

// Load backend-local constants (was incorrectly requiring ../constants.js at project root)
const { MOCK_STAFF_TIERS } = require('./constants.js');

const MOCK_USERS = [
    // Admins & Staff
    { id: 'user-admin', name: 'Trần Thị Hạnh', email: 'admin@spa.vn', password: 'password123', phone: '0901112233', profilePictureUrl: 'https://picsum.photos/seed/U001/200', joinDate: '2024-01-05', birthday: '1992-02-10', gender: 'Nữ', role: 'Admin', status: 'Active', lastLogin: new Date().toISOString(), staffProfile: { staffRole: 'Manager' } },
    { id: 'user-manager', name: 'Nguyễn Quang Minh', email: 'manager@spa.vn', password: 'password123', phone: '0908889999', profilePictureUrl: 'https://picsum.photos/seed/U002/200', joinDate: '2024-01-20', birthday: '1990-03-14', gender: 'Nam', role: 'Staff', status: 'Active', lastLogin: new Date().toISOString(), staffProfile: { staffRole: 'Manager', commissionRate: 0 } },
    { id: 'user-tech-1', name: 'Lê Phương Anh', email: 'tech1@spa.vn', password: 'password123', phone: '0907778888', profilePictureUrl: 'https://picsum.photos/seed/U003/200', joinDate: '2024-02-01', birthday: '1995-06-20', gender: 'Nữ', role: 'Staff', status: 'Active', lastLogin: new Date().toISOString(), staffProfile: { staffRole: 'Technician', specialty: ['Skincare', 'Clinic', 'Nail Care', 'Facial'], experience: '5 năm', staffTierId: 'Chuyên gia', commissionRate: 0.1, kpiGoals: { monthlyRevenue: 25000000, monthlySessions: 50, monthlySales: 5000000 } } },
    { id: 'user-tech-2', name: 'Phạm Văn Tài', email: 'tech2@spa.vn', password: 'password123', phone: '0903334444', profilePictureUrl: 'https://picsum.photos/seed/U004/200', joinDate: '2024-02-10', birthday: '1994-09-25', gender: 'Nam', role: 'Staff', status: 'Active', lastLogin: new Date().toISOString(), staffProfile: { staffRole: 'Technician', specialty: ['Massage', 'Body Care', 'Relax'], experience: '3 năm', staffTierId: 'Thành thạo', commissionRate: 0.05, kpiGoals: { monthlyRevenue: 20000000, monthlySessions: 40, monthlySales: 2000000 } } },
    { id: 'user-recep-1', name: 'Trần Bích Ngọc', email: 'recep1@spa.vn', password: 'password123', phone: '0905556666', profilePictureUrl: 'https://picsum.photos/seed/U005/200', joinDate: '2024-03-02', birthday: '1998-12-12', gender: 'Nữ', role: 'Staff', status: 'Active', lastLogin: new Date().toISOString(), staffProfile: { staffRole: 'Receptionist', commissionRate: 0 } },
    // Clients
    { id: 'user-client-1', name: 'Nguyễn Thu Hằng', email: 'client1@spa.vn', password: 'password123', phone: '0900001111', profilePictureUrl: 'https://picsum.photos/seed/C001/200', joinDate: '2024-03-15', birthday: '1996-07-21', gender: 'Nữ', role: 'Client', status: 'Active', lastLogin: '2024-07-20T10:00:00.000Z', customerProfile: { tierLevel: 1, selfCareIndex: 60, totalSpending: 900000 } },
    { id: 'user-client-2', name: 'Lưu Hữu Nam', email: 'client2@spa.vn', password: 'password123', phone: '0901112222', profilePictureUrl: 'https://picsum.photos/seed/C002/200', joinDate: '2024-04-01', birthday: '1998-10-02', gender: 'Nam', role: 'Client', status: 'Active', lastLogin: new Date().toISOString(), customerProfile: { tierLevel: 2, selfCareIndex: 75, totalSpending: 2200000 } },
    { id: 'user-client-3', name: 'Phan Mai Chi', email: 'client3@spa.vn', password: 'password123', phone: '0902223333', profilePictureUrl: 'https://picsum.photos/seed/C003/200', joinDate: '2024-05-12', birthday: '2000-05-05', gender: 'Nữ', role: 'Client', status: 'Active', lastLogin: new Date().toISOString(), customerProfile: { tierLevel: 3, selfCareIndex: 85, totalSpending: 5500000 } },
];

const MOCK_SERVICE_CATEGORIES = [
    { id: 1, name: 'Massage' }, { id: 2, name: 'Skincare' }, { id: 3, name: 'Body Care' },
    { id: 4, name: 'Relax' }, { id: 5, name: 'Spa Package' }, { id: 6, name: 'Triệt Lông' },
    { id: 7, name: 'Clinic' }, { id: 8, name: 'Nail' }, { id: 9, name: 'Khác' },
];

const MOCK_SERVICES = [
  { id: 'svc-facial-basic', name: 'Chăm sóc da mặt cơ bản', description: 'Làm sạch sâu, cấp ẩm cho da.', longDescription: 'Liệu trình làm sạch sâu, loại bỏ bụi bẩn, tế bào chết và cung cấp độ ẩm cần thiết, mang lại làn da tươi sáng và mịn màng.', price: 500000, duration: 60, categoryId: 2, category: 'Skincare', imageUrl: 'https://picsum.photos/seed/facial-basic/400/300', rating: 4.8, reviewCount: 120, isHot: true, isActive: true },
  { id: 'svc-massage-body', name: 'Massage body thảo dược', description: 'Thư giãn toàn thân, giảm căng thẳng.', longDescription: 'Sử dụng các loại thảo dược tự nhiên kết hợp kỹ thuật massage chuyên nghiệp giúp giảm căng cơ, lưu thông khí huyết và thư giãn tinh thần.', price: 700000, discountPrice: 600000, duration: 90, categoryId: 1, category: 'Massage', imageUrl: 'https://picsum.photos/seed/massage-body/400/300', rating: 4.9, reviewCount: 250, isHot: true, isNew: true, isActive: true },
  { id: 'svc-hair-removal', name: 'Triệt lông nách Diode Laser', description: 'Triệt lông vĩnh viễn, an toàn.', longDescription: 'Công nghệ Diode Laser hiện đại giúp loại bỏ lông tận gốc, an toàn cho da, không đau rát và mang lại hiệu quả lâu dài.', price: 800000, duration: 30, categoryId: 6, category: 'Triệt Lông', imageUrl: 'https://picsum.photos/seed/hair-removal/400/300', rating: 4.7, reviewCount: 95, isActive: true },
  { id: 'svc-combo-relax', name: 'Gói Thư Giãn Toàn Diện', description: 'Combo massage body và chăm sóc da mặt chuyên sâu.', longDescription: 'Trải nghiệm gói dịch vụ kết hợp hoàn hảo giữa 90 phút massage body thảo dược giúp xua tan mệt mỏi và 60 phút chăm sóc da mặt cơ bản, mang lại sự thư thái từ trong ra ngoài.', price: 1200000, discountPrice: 999000, duration: 150, categoryId: 5, category: 'Spa Package', imageUrl: 'https://picsum.photos/seed/combo-relax/400/300', rating: 4.9, reviewCount: 75, isHot: true, isActive: true },
  { id: 'svc-combo-detox', name: 'Gói Thanh Lọc & Tái Tạo Da', description: 'Kết hợp xông hơi thải độc và liệu trình cấy tảo xoắn.', longDescription: 'Gói dịch vụ thanh lọc cơ thể toàn diện với xông hơi thảo dược giúp đào thải độc tố, kết hợp cùng liệu trình cấy tảo xoắn trẻ hóa làn da, mang lại vẻ ngoài rạng rỡ và đầy sức sống.', price: 1500000, discountPrice: 1199000, duration: 120, categoryId: 5, category: 'Spa Package', imageUrl: 'https://picsum.photos/seed/combo-detox/400/300', rating: 4.8, reviewCount: 45, isNew: true, isActive: true },
  { id: 'svc-combo-royal', name: 'Gói Chăm Sóc Toàn Thân Hoàng Gia', description: 'Trải nghiệm đẳng cấp hoàng gia với tẩy tế bào chết, ủ dưỡng thể và massage đá nóng.', longDescription: 'Một liệu trình sang trọng bao gồm tẩy tế bào chết toàn thân bằng cafe, ủ dưỡng thể collagen vàng 24k và kết thúc bằng 90 phút massage thư giãn với đá nóng Himalaya, mang lại làn da mịn màng và tinh thần sảng khoái.', price: 2500000, discountPrice: 1999000, duration: 180, categoryId: 5, category: 'Spa Package', imageUrl: 'https://picsum.photos/seed/combo-royal/400/300', rating: 5.0, reviewCount: 30, isHot: true, isActive: true },
];

const MOCK_APPOINTMENTS = [
    { id: 'apt-1', serviceId: 'svc-facial-basic', serviceName: 'Chăm sóc da mặt cơ bản', userId: 'user-client-1', date: '2024-07-28', time: '10:00', status: 'completed', therapistId: 'user-tech-1', therapist: 'Lê Phương Anh' },
    { id: 'apt-2', serviceId: 'svc-massage-body', serviceName: 'Massage body thảo dược', userId: 'user-client-2', date: '2024-08-05', time: '14:00', status: 'upcoming', therapistId: 'user-tech-2', therapist: 'Phạm Văn Tài' },
];

const MOCK_PROMOTIONS = [
    { id: 'promo-1', title: 'Giảm 20% cho dịch vụ Facial', description: 'Ưu đãi đặc biệt cho tất cả các dịch vụ chăm sóc da mặt.', code: 'FACIAL20', expiryDate: '2024-12-31', imageUrl: 'https://picsum.photos/seed/promo-facial/500/300', discountType: 'percentage', discountValue: 20, termsAndConditions: 'Áp dụng cho tất cả khách hàng.', applicableServiceIds: ['svc-facial-basic'], usageCount: 50 },
];

const MOCK_REVIEWS = [
    { id: 'rev-1', serviceId: 'svc-facial-basic', serviceName: 'Chăm sóc da mặt cơ bản', userName: 'Nguyễn Thu Hằng', userImageUrl: 'https://picsum.photos/seed/C001/100', rating: 5, comment: 'Dịch vụ rất tốt, nhân viên nhiệt tình.', date: '2024-07-29', appointmentId: 'apt-1', userId: 'user-client-1' },
];

const MOCK_TREATMENT_COURSES = [];
const MOCK_REDEEMABLE_VOUCHERS = [];
const MOCK_POINTS_HISTORY = [];
const MOCK_TIERS = [
    { level: 1, name: 'Đồng', pointsRequired: 0, minSpendingRequired: 0, color: '#CD7F32', textColor: 'text-orange-900' },
    { level: 2, name: 'Bạc', pointsRequired: 500, minSpendingRequired: 5000000, color: '#C0C0C0', textColor: 'text-gray-500' },
    { level: 3, name: 'Vàng', pointsRequired: 1500, minSpendingRequired: 15000000, color: '#FFD700', textColor: 'text-yellow-600' },
];
const MOCK_REDEEMED_REWARDS = [];

const MOCK_MISSIONS = [];
const MOCK_PAYMENTS = [];
const MOCK_STAFF_AVAILABILITY = [];
const MOCK_STAFF_SHIFTS = [];
const MOCK_PRODUCTS = [];
const MOCK_SALES = [];
const MOCK_INTERNAL_NOTIFICATIONS = [
    { id: 'in-1', recipientId: 'user-client-1', recipientType: 'client', type: 'promo_alert', message: 'Ưu đãi 20% cho tất cả dịch vụ Facial sắp hết hạn!', date: new Date().toISOString(), isRead: true, link: '/promotions' },
    { id: 'in-2', recipientId: 'all', recipientType: 'client', type: 'system_news', message: 'Chào mừng bạn đến với phiên bản mới của app Anh Thơ Spa!', date: new Date().toISOString(), isRead: false, link: '/' },
];
const MOCK_INTERNAL_NEWS = [];

const LUCKY_WHEEL_PRIZES = [];

module.exports = {
    MOCK_USERS,
    MOCK_SERVICES,
    MOCK_SERVICE_CATEGORIES,
    MOCK_APPOINTMENTS,
    MOCK_PROMOTIONS,
    MOCK_REVIEWS,
    MOCK_TREATMENT_COURSES,
    MOCK_REDEEMABLE_VOUCHERS,
    MOCK_POINTS_HISTORY,
    MOCK_TIERS,
    MOCK_REDEEMED_REWARDS,
    MOCK_MISSIONS,
    MOCK_PAYMENTS,
    MOCK_STAFF_AVAILABILITY,
    MOCK_STAFF_SHIFTS,
    MOCK_PRODUCTS,
    MOCK_SALES,
    MOCK_INTERNAL_NOTIFICATIONS,
    MOCK_INTERNAL_NEWS,
    LUCKY_WHEEL_PRIZES,
    MOCK_STAFF_TIERS,
};
