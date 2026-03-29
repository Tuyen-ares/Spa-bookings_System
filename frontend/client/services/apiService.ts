// client/services/apiService.ts
import type {
    User, Service, Appointment, Promotion, Wallet,
    RedeemableVoucher, PointsHistory, Tier, RedeemedReward,
    StaffDailyAvailability, StaffShift, StaffTier, Product,
    Sale, InternalNotification, InternalNews,
    TreatmentCourse, Review, Payment, Mission, Prize, ServiceCategory, StaffTask, PaymentMethod,
    // FIX: Imported missing types to resolve compilation errors.
    TreatmentSession, UserStatus, Notification, TreatmentSessionDetail
} from '../../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'; // Point to the backend server

const CACHE_TTL_MS = 60_000; // Short-lived cache to cut repeated fetches between page switches
type CacheEntry<T> = { expiry: number; data?: T; promise?: Promise<T> };
const responseCache = new Map<string, CacheEntry<any>>();

const cachedGet = async <T,>(url: string, options?: RequestInit, ttlMs: number = CACHE_TTL_MS): Promise<T> => {
    const now = Date.now();
    const cached = responseCache.get(url);
    if (cached && cached.expiry > now) {
        if (cached.data !== undefined) return cached.data as T;
        if (cached.promise) return cached.promise as Promise<T>;
    }

    const fetchPromise = fetch(url, options)
        .then(handleResponse)
        .then((data) => {
            responseCache.set(url, { data, expiry: now + ttlMs });
            return data as T;
        })
        .catch((error) => {
            responseCache.delete(url);
            throw error;
        });

    responseCache.set(url, { expiry: now + ttlMs, promise: fetchPromise });
    return fetchPromise;
};

const clearCache = () => responseCache.clear();

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
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: response.statusText, status: response.status };
        }
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            message: errorMessage,
            data: errorData
        });
        throw new Error(errorMessage);
    }
    if (response.status === 204) { // No Content
        return;
    }
    try {
        return await response.json();
    } catch (error) {
        console.error('Error parsing JSON response:', error);
        throw new Error('Invalid response from server');
    }
};

// Helper to handle network errors gracefully
const handleNetworkError = (error: any, endpoint: string) => {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error(`Network error when calling ${endpoint}:`, error);
        throw new Error(`Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.`);
    }
    throw error;
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

export const register = async (userData: Pick<User, 'name' | 'email' | 'password' | 'phone' | 'gender' | 'birthday'>): Promise<{ message: string; email: string; requiresVerification: boolean } | { user: User, token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};

export const verifyEmail = async (token: string): Promise<{ message: string; user?: User; token?: string; alreadyVerified?: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
};

export const resendVerificationEmail = async (email: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return handleResponse(response);
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return handleResponse(response);
};

export const verifyResetToken = async (token: string): Promise<{ valid: boolean; email?: string; name?: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
};

export const resetPasswordWithToken = async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
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
export const getUsers = async (): Promise<User[]> => cachedGet(`${API_BASE_URL}/users`);
export const getUserById = async (id: string): Promise<User> => cachedGet(`${API_BASE_URL}/users/${id}`);
export const getServices = async (): Promise<Service[]> => cachedGet(`${API_BASE_URL}/services`);
export const getMostBookedServices = async (limit: number = 4): Promise<Service[]> => cachedGet(`${API_BASE_URL}/services/most-booked?limit=${limit}`);
export const getServiceById = async (id: string): Promise<Service> => cachedGet(`${API_BASE_URL}/services/${id}`);
export const getAppointments = async (): Promise<Appointment[]> => cachedGet(`${API_BASE_URL}/appointments`);
export const getAppointmentById = async (id: string): Promise<Appointment> => cachedGet(`${API_BASE_URL}/appointments/${id}`);
export const getUserAppointments = async (userId: string): Promise<Appointment[]> => cachedGet(`${API_BASE_URL}/appointments/user/${userId}`);
export const getReviews = async (filters?: { serviceId?: string; userId?: string }): Promise<Review[]> => {
    const params = new URLSearchParams(filters as any);
    return cachedGet(`${API_BASE_URL}/reviews?${params.toString()}`);
};
export const getPromotions = async (params?: { userId?: string; serviceId?: string; all?: boolean }): Promise<Promotion[]> => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.serviceId) queryParams.append('serviceId', params.serviceId);
    if (params?.all === true) queryParams.append('all', 'true');
    const queryString = queryParams.toString();
    return cachedGet(`${API_BASE_URL}/promotions${queryString ? `?${queryString}` : ''}`);
};
// Get redeemable vouchers (private vouchers that can be redeemed with points)
export const getRedeemableVouchers = async (): Promise<RedeemableVoucher[]> => {
    return cachedGet(`${API_BASE_URL}/promotions?redeemableOnly=true`);
};
export const redeemVoucherWithPoints = async (promotionId: string, userId: string): Promise<{ success: boolean; message: string; promotion: Promotion; remainingPoints: number }> => {
    return fetch(`${API_BASE_URL}/promotions/${promotionId}/redeem`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId })
    }).then(handleResponse);
};

// Get user's redeemed vouchers (vouchers đã đổi bằng điểm, chưa sử dụng)
export const getMyRedeemedVouchers = async (userId: string): Promise<Array<Promotion & { redeemedCount: number }>> => {
    return fetch(`${API_BASE_URL}/promotions/my-redeemed/${userId}`, {
        headers: getAuthHeaders()
    }).then(handleResponse);
};

export const getTiers = async (): Promise<Tier[]> => Promise.resolve([]);
export const getUserWallet = async (userId: string): Promise<Wallet> => cachedGet(`${API_BASE_URL}/wallets/${userId}`);
export const getUserPointsHistory = async (userId: string): Promise<Array<{ date: string; pointsChange: number; type: string; source: string; description: string }>> => cachedGet(`${API_BASE_URL}/wallets/${userId}/points-history`);
export const getLuckyWheelPrizes = async (): Promise<Prize[]> => cachedGet(`${API_BASE_URL}/wallets/lucky-wheel-prizes`);
export const getRedeemedRewards = async (): Promise<RedeemedReward[]> => Promise.resolve([]);
export const getUserMissions = async (userId: string): Promise<Mission[]> => Promise.resolve([]);
export const getPayments = async (): Promise<Payment[]> => cachedGet(`${API_BASE_URL}/payments`);
export const getStaffAvailability = async (staffId: string): Promise<StaffDailyAvailability[]> => cachedGet(`${API_BASE_URL}/staff/availability/${staffId}`);
export const getStaffShifts = async (staffId: string): Promise<StaffShift[]> => cachedGet(`${API_BASE_URL}/staff/shifts/${staffId}`);
export const getAllStaffShifts = async (): Promise<StaffShift[]> => cachedGet(`${API_BASE_URL}/staff/shifts`);
export const getProducts = async (): Promise<Product[]> => cachedGet(`${API_BASE_URL}/staff/products`);
export const getSales = async (): Promise<Sale[]> => cachedGet(`${API_BASE_URL}/staff/sales`);
export const getInternalNotifications = async (userId: string): Promise<InternalNotification[]> => cachedGet(`${API_BASE_URL}/notifications/user/${userId}`, { headers: getAuthHeaders() });
export const getInternalNews = async (): Promise<InternalNews[]> => cachedGet(`${API_BASE_URL}/staff/news`, { headers: getAuthHeaders() });
export const getServiceCategories = async (): Promise<ServiceCategory[]> => cachedGet(`${API_BASE_URL}/services/categories`);

// --- ANALYTICS ---
export interface ServiceAffinityResponse {
    summary: {
        totalAppointments: number;
        transactions: number;
        uniqueServices: number;
        minSupport: number;
        minConfidence: number;
        minLift: number;
    };
    pairs: Array<{
        serviceAId: string;
        serviceAName: string;
        serviceBId: string;
        serviceBName: string;
        counts: { A: number; B: number; AB: number };
        metrics: {
            supportAB: number;
            supportA: number;
            supportB: number;
            confidenceAtoB: number;
            confidenceBtoA: number;
            liftAtoB: number;
            liftBtoA: number;
        };
        recommendation: { title: string; rationale: string; actions: string[] };
    }>;
}

export const getServiceAffinity = async (params: {
    from: string;
    to: string;
    minSupport?: number;
    minConfidence?: number;
    minLift?: number;
    limit?: number;
    useBookingGroupOnly?: boolean;
}): Promise<ServiceAffinityResponse> => {
    const query = new URLSearchParams();
    query.append('from', params.from);
    query.append('to', params.to);
    if (typeof params.minSupport === 'number') query.append('minSupport', String(params.minSupport));
    if (typeof params.minConfidence === 'number') query.append('minConfidence', String(params.minConfidence));
    if (typeof params.minLift === 'number') query.append('minLift', String(params.minLift));
    if (typeof params.limit === 'number') query.append('limit', String(params.limit));
    if (typeof params.useBookingGroupOnly === 'boolean') query.append('useBookingGroupOnly', String(params.useBookingGroupOnly));
    const url = `${API_BASE_URL}/analytics/service-affinity?${query.toString()}`;
    const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    return handleResponse(response);
};

// --- DATA MUTATIONS ---
const create = <T,>(url: string, data: Partial<T>): Promise<T> => {
    console.log(`📤 [apiService.create] Sending to ${url}:`, {
        dataKeys: Object.keys(data),
        dataValues: data,
        stringified: JSON.stringify(data)
    });
    return fetch(url, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) })
        .then(handleResponse)
        .then((result) => {
            clearCache();
            return result;
        });
};
const update = <T,>(url: string, data: Partial<T>): Promise<T> => fetch(url, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) })
    .then(handleResponse)
    .then((result) => {
        clearCache();
        return result;
    });
const remove = (url: string): Promise<void> => fetch(url, { method: 'DELETE', headers: getAuthHeaders() })
    .then(handleResponse)
    .then((result) => {
        clearCache();
        return result;
    });

export const createUser = (data: Partial<User>) => create<User>(`${API_BASE_URL}/users`, data);
export const updateUser = (id: string, data: Partial<User>) => update<User>(`${API_BASE_URL}/users/${id}`, data);
export const getUserTier = async (userId: string): Promise<{ currentTier: Tier; nextTier: Tier | null; discountPercent: number }> => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/tier`, {
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const deleteUser = (id: string) => remove(`${API_BASE_URL}/users/${id}`);
export const resetUserPassword = (id: string, newPassword: string) => update(`${API_BASE_URL}/users/${id}/password-reset`, { newPassword });
// FIX: Added explicit return type to guide TypeScript's generic inference for the `update` function, resolving the error.
export const toggleUserLockStatus = (id: string): Promise<{ message: string; newStatus: UserStatus }> => update(`${API_BASE_URL}/users/${id}/toggle-lock`, {});

export const createService = (data: Partial<Service>) => create<Service>(`${API_BASE_URL}/services`, data);
export const updateService = (id: string, data: Partial<Service>) => update<Service>(`${API_BASE_URL}/services/${id}`, data);
export const deleteService = (id: string) => remove(`${API_BASE_URL}/services/${id}`);

// Flexible create appointment: backend may return a single Appointment OR an object with appointments array
export const createAppointment = (data: Partial<Appointment>): Promise<Appointment | { appointments: Appointment[]; treatmentCourseId?: string; message?: string }> =>
    create(`${API_BASE_URL}/appointments`, data);
export const updateAppointment = (id: string, data: Partial<Appointment>) => update<Appointment>(`${API_BASE_URL}/appointments/${id}`, data);
export const cancelAppointment = (id: string) => update<Appointment>(`${API_BASE_URL}/appointments/${id}`, { status: 'cancelled' });
export const cancelAllAppointmentsByBooking = (appointmentId: string, reason?: string) =>
    fetch(`${API_BASE_URL}/appointments/cancel-all/${appointmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
    }).then(handleResponse) as Promise<{ message: string; cancelledCount: number; cancelledIds: string[] }>;

export const cancelTreatmentCourse = (treatmentCourseId: string, reason?: string) =>
    fetch(`${API_BASE_URL}/appointments/cancel-treatment-course/${treatmentCourseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
    }).then(handleResponse) as Promise<{ message: string; treatmentCourseId: string; cancelledAppointmentCount: number; cancelledAppointmentIds: string[] }>;

export const confirmAppointment = (id: string) => fetch(`${API_BASE_URL}/appointments/${id}/confirm`, {
    method: 'PUT',
    headers: getAuthHeaders()
}).then(handleResponse) as Promise<{ appointment: Appointment; message: string }>;

export const createReview = (data: Partial<Review>) => create<Review>(`${API_BASE_URL}/reviews`, data);
export const updateReview = (id: string, data: Partial<Review>) => update<Review>(`${API_BASE_URL}/reviews/${id}`, data);
export const deleteReview = (id: string) => remove(`${API_BASE_URL}/reviews/${id}`);

export const createPromotion = (data: Partial<Promotion>) => create<Promotion>(`${API_BASE_URL}/promotions`, data);
export const updatePromotion = (id: string, data: Partial<Promotion>) => update<Promotion>(`${API_BASE_URL}/promotions/${id}`, data);
export const deletePromotion = (id: string) => remove(`${API_BASE_URL}/promotions/${id}`);
export const applyPromotion = async (code: string, userId?: string, appointmentId?: string, serviceId?: string): Promise<{ success: boolean; message: string; promotion: Promotion }> => {
    const response = await fetch(`${API_BASE_URL}/promotions/apply/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, appointmentId, serviceId })
    });
    return handleResponse(response);
};

export const getApplicablePromotions = async (userId?: string, serviceId?: string): Promise<Promotion[]> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (serviceId) params.append('serviceId', serviceId);
    const response = await fetch(`${API_BASE_URL}/promotions?${params.toString()}`);
    return handleResponse(response);
};

export const updateUserWallet = (userId: string, data: Partial<Wallet>) => update<Wallet>(`${API_BASE_URL}/wallets/${userId}`, data);
export const createPointsHistoryEntry = (userId: string, data: { date?: string; pointsChange: number; type?: string; source?: string; description: string }) => create(`${API_BASE_URL}/wallets/${userId}/points-history`, data);

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

export const processPayment = async (appointmentId: string, method: PaymentMethod, finalAmount: number): Promise<{
    transactionId: string; paymentUrl?: string; paymentId?: string; success?: boolean; payment?: Payment
}> => {
    // This is a specific action, so we define it separately
    const body = { appointmentId, method, amount: finalAmount };
    const response = await fetch(`${API_BASE_URL}/payments/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
    });
    return handleResponse(response);
};

export const updatePayment = (id: string, data: Partial<Payment>) => update<Payment>(`${API_BASE_URL}/payments/${id}`, data);
export const deletePayment = (id: string) => remove(`${API_BASE_URL}/payments/${id}`);

// --- TREATMENT COURSES ---
export const getTreatmentCourses = async (params?: {
    clientId?: string;
    status?: string;
    templateOnly?: boolean;
    templatesOnly?: boolean;
    includeExpired?: boolean;
    includeCompleted?: boolean;
}): Promise<TreatmentCourse[]> => {
    let url = `${API_BASE_URL}/treatment-courses`;
    const queryParams = new URLSearchParams();

    if (params?.templateOnly || params?.templatesOnly) queryParams.append('templatesOnly', 'true');
    if (params?.clientId) queryParams.append('clientId', params.clientId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.includeExpired) queryParams.append('includeExpired', 'true');
    if (params?.includeCompleted) queryParams.append('includeCompleted', 'true');

    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    return fetch(url).then(handleResponse);
};

// Paginated version used by admin pages. Returns { data: TreatmentCourse[], total: number, page: number, pageSize: number }
export const getTreatmentCoursesPaginated = async (params?: {
    clientId?: string;
    status?: string;
    page?: number;
    limit?: number;
    templatesOnly?: boolean;
}): Promise<{ data: TreatmentCourse[]; total: number; page: number; pageSize: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.clientId) queryParams.append('clientId', params.clientId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.templatesOnly) queryParams.append('templatesOnly', 'true');

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/treatment-courses${queryString ? `?${queryString}` : ''}`;

    return fetch(url, { headers: getAuthHeaders() }).then(handleResponse) as Promise<{ data: TreatmentCourse[]; total: number; page: number; pageSize: number }>;
};

export const getTreatmentCourseById = async (id: string): Promise<TreatmentCourse> =>
    fetch(`${API_BASE_URL}/treatment-courses/${id}`).then(handleResponse);

export const createTreatmentCourse = (data: Partial<TreatmentCourse>) =>
    create<TreatmentCourse>(`${API_BASE_URL}/treatment-courses`, data);

export const registerForTreatmentCourse = (templateId: string, clientId: string) =>
    fetch(`${API_BASE_URL}/treatment-courses/${templateId}/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ clientId })
    }).then(handleResponse) as Promise<{ course: TreatmentCourse; message: string }>;

export const updateTreatmentCourse = (id: string, data: Partial<TreatmentCourse>) =>
    update<TreatmentCourse>(`${API_BASE_URL}/treatment-courses/${id}`, data);

export const deleteTreatmentCourse = (id: string) =>
    remove(`${API_BASE_URL}/treatment-courses/${id}`);

// New Phase 1 APIs
export const pauseTreatmentCourse = (id: string, reason: string) =>
    fetch(`${API_BASE_URL}/treatment-courses/${id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
    }).then(handleResponse);

export const resumeTreatmentCourse = (id: string, extendExpiryDays?: number) =>
    fetch(`${API_BASE_URL}/treatment-courses/${id}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extendExpiryDays })
    }).then(handleResponse);

// Confirm payment for a treatment course
export const confirmTreatmentCoursePayment = async (id: string): Promise<TreatmentCourse> => {
    const response = await fetch(`${API_BASE_URL}/treatment-courses/${id}/confirm-payment`, {
        method: 'PUT',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};

export const getTreatmentCourseProgress = (id: string) =>
    fetch(`${API_BASE_URL}/treatment-courses/${id}/progress`).then(handleResponse);

export const scheduleSessionInCourse = (courseId: string, sessionId: string, data: {
    appointmentDate: string;
    appointmentTime: string;
    serviceId: string;
    staffId?: string;
    notes?: string;
}) =>
    fetch(`${API_BASE_URL}/treatment-courses/${courseId}/sessions/${sessionId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse);

export const completeSessionInCourse = (courseId: string, sessionId: string, data: any) =>
    fetch(`${API_BASE_URL}/treatment-courses/${courseId}/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(handleResponse);

export const updateTier = async (level: number, tierData: Partial<Tier>): Promise<Tier> => update(`${API_BASE_URL}/vouchers/tiers/${level}`, tierData);
export const updateMission = (id: string, data: Partial<Mission>) => update<Mission>(`${API_BASE_URL}/missions/${id}`, data);
// Add other function stubs as needed...
export const getStaffTiers = (): Promise<StaffTier[]> => { throw new Error("Not implemented"); };
export const completePayment = (id: string): Promise<Payment> => update(`${API_BASE_URL}/payments/${id}/complete`, {});
export const updateTreatmentSession = (courseId: string, sessionIndex: number, data: Partial<TreatmentSession>): Promise<TreatmentCourse> => { throw new Error("Not implemented"); };
export const approveAppointment = (id: string): Promise<Appointment> => updateAppointment(id, { status: 'upcoming' });
export const rejectAppointment = (id: string): Promise<Appointment> => updateAppointment(id, { status: 'cancelled' });


// --- NOTIFICATIONS ---
export const getNotifications = async (userId: string): Promise<Notification[]> => fetch(`${API_BASE_URL}/notifications/user/${userId}`).then(handleResponse);
export const getUnreadCount = async (userId: string): Promise<{ count: number }> => fetch(`${API_BASE_URL}/notifications/unread/${userId}`).then(handleResponse);
export const markNotificationRead = (id: string) => update(`${API_BASE_URL}/notifications/${id}/read`, {});
export const markAllNotificationsRead = (userId: string) => update(`${API_BASE_URL}/notifications/read-all/${userId}`, {});
export const deleteNotification = (id: string) => remove(`${API_BASE_URL}/notifications/${id}`);

// --- TREATMENT SESSIONS ---
export const getTreatmentSessions = async (courseId: string): Promise<TreatmentSessionDetail[]> => fetch(`${API_BASE_URL}/treatment-sessions/course/${courseId}`).then(handleResponse);
export const getTreatmentSessionById = async (id: string): Promise<TreatmentSessionDetail> => fetch(`${API_BASE_URL}/treatment-sessions/${id}`).then(handleResponse);
export const createTreatmentSession = (data: Partial<TreatmentSessionDetail>) => create<TreatmentSessionDetail>(`${API_BASE_URL}/treatment-sessions`, data);
export const updateTreatmentSessionDetail = (id: string, data: Partial<TreatmentSessionDetail>) => update<TreatmentSessionDetail>(`${API_BASE_URL}/treatment-sessions/${id}`, data);
export const completeTreatmentSession = (id: string, data: Partial<TreatmentSessionDetail>) => update<TreatmentSessionDetail>(`${API_BASE_URL}/treatment-sessions/${id}/complete`, data);
export const deleteTreatmentSession = (id: string) => remove(`${API_BASE_URL}/treatment-sessions/${id}`);

// --- MONTHLY VOUCHERS ---
export const sendMonthlyVouchersToAll = async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/monthly-vouchers/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({})
    });
    return handleResponse(response);
};

export const sendMonthlyVouchersToTier = async (tierLevel: number, month?: string): Promise<any> => {
    const url = `${API_BASE_URL}/monthly-vouchers/send-tier/${tierLevel}`;
    console.log(`🌐 [API] Calling: POST ${url}`);
    console.log(`   tierLevel: ${tierLevel}, month: ${month || 'current'}`);
    console.log(`   API_BASE_URL: ${API_BASE_URL}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(month ? { month } : {})
    });

    console.log(`📡 [API] Response status: ${response.status} ${response.statusText}`);

    return handleResponse(response);
};

export const sendMonthlyVoucherToUser = async (userId: string, month?: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/monthly-vouchers/send/${userId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(month ? { month } : {})
    });
    return handleResponse(response);
};

export const getMonthlyVoucherStatus = async (month?: string): Promise<any> => {
    const url = month
        ? `${API_BASE_URL}/monthly-vouchers/status?month=${month}`
        : `${API_BASE_URL}/monthly-vouchers/status`;
    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};