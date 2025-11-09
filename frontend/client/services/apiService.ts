// client/services/apiService.ts
import type {
    User, Service, Appointment, Promotion, Wallet,
    RedeemableVoucher, PointsHistory, Tier, RedeemedReward,
    StaffDailyAvailability, StaffShift, StaffTier, Product,
    Sale, InternalNotification, InternalNews,
    TreatmentCourse, Review, Payment, Mission, Prize, ServiceCategory, StaffTask, PaymentMethod,
    // FIX: Imported missing types to resolve compilation errors.
    TreatmentSession, UserStatus, Room
} from '../../types';

const API_BASE_URL = 'http://localhost:3001/api'; // Point to the backend server

// Helper to get authorization headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

// Helper to handle API responses
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        const errorMessage = errorData.message || errorData.error || 'An unknown error occurred';
        console.error('API Error:', errorMessage, errorData);
        throw new Error(errorMessage);
    }
    if (response.status === 204) { // No Content
        return;
    }
    return response.json();
};

// --- AUTHENTICATION ---
export const login = async (credentials: Pick<User, 'email' | 'password'>): Promise<{ user: User, token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    return handleResponse(response);
};

export const register = async (userData: Pick<User, 'name' | 'email' | 'password' | 'phone' | 'gender' | 'birthday'>): Promise<{ user: User, token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
    });
    return handleResponse(response);
};


// --- DATA GETTERS ---
export const getUsers = async (): Promise<User[]> => fetch(`${API_BASE_URL}/users`).then(handleResponse);
export const getUserById = async (id: string): Promise<User> => fetch(`${API_BASE_URL}/users/${id}`).then(handleResponse);
export const getServices = async (): Promise<Service[]> => fetch(`${API_BASE_URL}/services`).then(handleResponse);
export const getServiceById = async (id: string): Promise<Service> => fetch(`${API_BASE_URL}/services/${id}`).then(handleResponse);
export const getAppointments = async (): Promise<Appointment[]> => fetch(`${API_BASE_URL}/appointments`).then(handleResponse);
export const getUserAppointments = async (userId: string): Promise<Appointment[]> => fetch(`${API_BASE_URL}/appointments/user/${userId}`).then(handleResponse);
export const getReviews = async (filters?: { serviceId?: string; userId?: string }): Promise<Review[]> => {
    const params = new URLSearchParams(filters as any);
    return fetch(`${API_BASE_URL}/reviews?${params.toString()}`).then(handleResponse);
};
export const getPromotions = async (): Promise<Promotion[]> => fetch(`${API_BASE_URL}/promotions`).then(handleResponse);
// Note: Vouchers, Missions, and RedeemedRewards functionality removed
export const getRedeemableVouchers = async (): Promise<RedeemableVoucher[]> => Promise.resolve([]);
export const getTiers = async (): Promise<Tier[]> => Promise.resolve([]);
export const getUserWallet = async (userId: string): Promise<Wallet> => fetch(`${API_BASE_URL}/wallets/${userId}`).then(handleResponse);
export const getUserPointsHistory = async (userId: string): Promise<Array<{date: string; pointsChange: number; type: string; source: string; description: string}>> => fetch(`${API_BASE_URL}/wallets/${userId}/points-history`).then(handleResponse);
export const getLuckyWheelPrizes = async (): Promise<Prize[]> => fetch(`${API_BASE_URL}/wallets/lucky-wheel-prizes`).then(handleResponse);
export const getRedeemedRewards = async (): Promise<RedeemedReward[]> => Promise.resolve([]);
export const getUserMissions = async (userId: string): Promise<Mission[]> => Promise.resolve([]);
export const getPayments = async (): Promise<Payment[]> => fetch(`${API_BASE_URL}/payments`).then(handleResponse);
export const getStaffAvailability = async (staffId: string): Promise<StaffDailyAvailability[]> => fetch(`${API_BASE_URL}/staff/availability/${staffId}`).then(handleResponse);
export const getStaffShifts = async (staffId: string): Promise<StaffShift[]> => fetch(`${API_BASE_URL}/staff/shifts/${staffId}`).then(handleResponse);
export const getAllStaffShifts = async (): Promise<StaffShift[]> => fetch(`${API_BASE_URL}/staff/shifts`).then(handleResponse);
export const getProducts = async (): Promise<Product[]> => fetch(`${API_BASE_URL}/staff/products`).then(handleResponse);
export const getSales = async (): Promise<Sale[]> => fetch(`${API_BASE_URL}/staff/sales`).then(handleResponse);
export const getInternalNotifications = async (userId: string): Promise<InternalNotification[]> => fetch(`${API_BASE_URL}/staff/notifications/${userId}`).then(handleResponse);
export const getInternalNews = async (): Promise<InternalNews[]> => fetch(`${API_BASE_URL}/staff/news`).then(handleResponse);
export const getServiceCategories = async (): Promise<ServiceCategory[]> => fetch(`${API_BASE_URL}/services/categories`).then(handleResponse);

// --- DATA MUTATIONS ---
const create = <T,>(url: string, data: Partial<T>): Promise<T> => fetch(url, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse);
const update = <T,>(url: string, data: Partial<T>): Promise<T> => fetch(url, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(handleResponse);
const remove = (url: string): Promise<void> => fetch(url, { method: 'DELETE', headers: getAuthHeaders() }).then(handleResponse);

export const createUser = (data: Partial<User>) => create<User>(`${API_BASE_URL}/users`, data);
export const updateUser = (id: string, data: Partial<User>) => update<User>(`${API_BASE_URL}/users/${id}`, data);
export const deleteUser = (id: string) => remove(`${API_BASE_URL}/users/${id}`);
export const resetUserPassword = (id: string, newPassword: string) => update(`${API_BASE_URL}/users/${id}/password-reset`, { newPassword });
// FIX: Added explicit return type to guide TypeScript's generic inference for the `update` function, resolving the error.
export const toggleUserLockStatus = (id: string): Promise<{ message: string; newStatus: UserStatus }> => update(`${API_BASE_URL}/users/${id}/toggle-lock`, {});

export const createService = (data: Partial<Service>) => create<Service>(`${API_BASE_URL}/services`, data);
export const updateService = (id: string, data: Partial<Service>) => update<Service>(`${API_BASE_URL}/services/${id}`, data);
export const deleteService = (id: string) => remove(`${API_BASE_URL}/services/${id}`);

export const createAppointment = (data: Partial<Appointment>) => create<Appointment>(`${API_BASE_URL}/appointments`, data);
export const updateAppointment = (id: string, data: Partial<Appointment>) => update<Appointment>(`${API_BASE_URL}/appointments/${id}`, data);
export const cancelAppointment = (id: string) => update<Appointment>(`${API_BASE_URL}/appointments/${id}`, { status: 'cancelled' });

export const createReview = (data: Partial<Review>) => create<Review>(`${API_BASE_URL}/reviews`, data);
export const updateReview = (id: string, data: Partial<Review>) => update<Review>(`${API_BASE_URL}/reviews/${id}`, data);
export const deleteReview = (id: string) => remove(`${API_BASE_URL}/reviews/${id}`);

export const createPromotion = (data: Partial<Promotion>) => create<Promotion>(`${API_BASE_URL}/promotions`, data);
export const updatePromotion = (id: string, data: Partial<Promotion>) => update<Promotion>(`${API_BASE_URL}/promotions/${id}`, data);
export const deletePromotion = (id: string) => remove(`${API_BASE_URL}/promotions/${id}`);

export const createRedeemableVoucher = (data: Partial<RedeemableVoucher>) => create<RedeemableVoucher>(`${API_BASE_URL}/vouchers`, data);
export const updateRedeemableVoucher = (id: string, data: Partial<RedeemableVoucher>) => update<RedeemableVoucher>(`${API_BASE_URL}/vouchers/${id}`, data);
export const deleteRedeemableVoucher = (id: string) => remove(`${API_BASE_URL}/vouchers/${id}`);

export const createRedeemedReward = (data: Partial<RedeemedReward>) => create<RedeemedReward>(`${API_BASE_URL}/vouchers/redeemed`, data);
export const updateUserWallet = (userId: string, data: Partial<Wallet>) => update<Wallet>(`${API_BASE_URL}/wallets/${userId}`, data);
export const createPointsHistoryEntry = (userId: string, data: {date?: string; pointsChange: number; type?: string; source?: string; description: string}) => create(`${API_BASE_URL}/wallets/${userId}/points-history`, data);

export const updateStaffAvailability = (staffId: string, date: string, timeSlots: StaffDailyAvailability['timeSlots']) => update<StaffDailyAvailability>(`${API_BASE_URL}/staff/availability/${staffId}/${date}`, { timeSlots });
export const deleteStaffAvailability = (staffId: string, date: string) => remove(`${API_BASE_URL}/staff/availability/${staffId}/${date}`);

export const createStaffShift = (data: Partial<StaffShift>) => create<StaffShift>(`${API_BASE_URL}/staff/shifts`, data);
export const updateStaffShift = (id: string, data: Partial<StaffShift>) => update<StaffShift>(`${API_BASE_URL}/staff/shifts/${id}`, data);
export const deleteStaffShift = (id: string) => remove(`${API_BASE_URL}/staff/shifts/${id}`);

export const createSale = (data: Partial<Sale>) => create<Sale>(`${API_BASE_URL}/staff/sales`, data);

export const createInternalNews = (data: Partial<InternalNews>) => create<InternalNews>(`${API_BASE_URL}/staff/news`, data);
export const updateInternalNews = (id: string, data: Partial<InternalNews>) => update<InternalNews>(`${API_BASE_URL}/staff/news/${id}`, data);
export const deleteInternalNews = (id: string) => remove(`${API_BASE_URL}/staff/news/${id}`);

export const createInternalNotification = (data: Partial<InternalNotification>) => create<InternalNotification>(`${API_BASE_URL}/staff/notifications`, data);
// FIX: The backend returns a JSON object, not an empty response. The function signature has been updated to reflect the actual return type of `Promise<{ message: string }>`. The explicit `<void>` generic, which was causing a type conflict, has been removed to allow for correct type inference.
export const markNotificationAsRead = (id: string): Promise<{ message: string }> => update(`${API_BASE_URL}/staff/notifications/${id}/read`, {});

export const createServiceCategory = (data: { name: string }) => create<ServiceCategory>(`${API_BASE_URL}/services/categories`, data);

export const getStaffTasks = async (): Promise<StaffTask[]> => fetch(`${API_BASE_URL}/staff/tasks`).then(handleResponse);
export const createStaffTask = (data: Partial<StaffTask>) => create<StaffTask>(`${API_BASE_URL}/staff/tasks`, data);
export const updateStaffTask = (id: string, data: Partial<StaffTask>) => update<StaffTask>(`${API_BASE_URL}/staff/tasks/${id}`, data);
export const deleteStaffTask = (id: string) => remove(`${API_BASE_URL}/staff/tasks/${id}`);

export const processPayment = async (appointmentId: string, method: PaymentMethod, finalAmount: number): Promise<{ paymentUrl?: string; paymentId?: string; success?: boolean; payment?: Payment }> => {
    // This is a specific action, so we define it separately
    const response = await fetch(`${API_BASE_URL}/payments/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ appointmentId, method, amount: finalAmount })
    });
    return handleResponse(response);
};

export const updatePayment = (id: string, data: Partial<Payment>) => update<Payment>(`${API_BASE_URL}/payments/${id}`, data);

export const getTreatmentCourses = async (templateOnly: boolean = false): Promise<TreatmentCourse[]> => {
  const url = templateOnly 
    ? `${API_BASE_URL}/treatment-courses?template=true`
    : `${API_BASE_URL}/treatment-courses`;
  return fetch(url).then(handleResponse);
};
export const getTreatmentCourseById = async (id: string): Promise<TreatmentCourse> => fetch(`${API_BASE_URL}/treatment-courses/${id}`).then(handleResponse);
export const createTreatmentCourse = (data: Partial<TreatmentCourse>) => create<TreatmentCourse>(`${API_BASE_URL}/treatment-courses`, data);
export const updateTreatmentCourse = (id: string, data: Partial<TreatmentCourse>) => update<TreatmentCourse>(`${API_BASE_URL}/treatment-courses/${id}`, data);
export const deleteTreatmentCourse = (id: string) => remove(`${API_BASE_URL}/treatment-courses/${id}`);
export const updateTier = async (level: number, tierData: Partial<Tier>): Promise<Tier> => update(`${API_BASE_URL}/vouchers/tiers/${level}`, tierData);
export const updateMission = (id: string, data: Partial<Mission>) => update<Mission>(`${API_BASE_URL}/missions/${id}`, data);
// Add other function stubs as needed...
export const getStaffTiers = (): Promise<StaffTier[]> => { throw new Error("Not implemented"); };
export const completePayment = (id: string): Promise<Payment> => update(`${API_BASE_URL}/payments/${id}/complete`, {});
export const updateTreatmentSession = (courseId: string, sessionIndex: number, data: Partial<TreatmentSession>): Promise<TreatmentCourse> => { throw new Error("Not implemented"); };
export const approveAppointment = (id: string): Promise<Appointment> => updateAppointment(id, { status: 'upcoming' });
export const rejectAppointment = (id: string): Promise<Appointment> => updateAppointment(id, { status: 'cancelled' });

// --- ROOMS ---
export const getRooms = async (): Promise<Room[]> => fetch(`${API_BASE_URL}/rooms`).then(handleResponse);
export const getRoomById = async (id: string): Promise<Room> => fetch(`${API_BASE_URL}/rooms/${id}`).then(handleResponse);
export const createRoom = (data: Partial<Room>) => create<Room>(`${API_BASE_URL}/rooms`, data);
export const updateRoom = (id: string, data: Partial<Room>) => update<Room>(`${API_BASE_URL}/rooms/${id}`, data);
export const deleteRoom = (id: string) => remove(`${API_BASE_URL}/rooms/${id}`);