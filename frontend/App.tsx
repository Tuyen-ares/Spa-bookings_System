
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';

// Global components and services
import Header from './client/components/Header';
import Footer from './client/components/Footer';
import Chatbot from './client/components/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';
import * as apiService from './client/services/apiService';
import type { User, Wallet, Tier, Promotion, Service, Appointment, Review, TreatmentCourse, InternalNotification, InternalNews, Payment, Product, Sale, UserRole } from './types';

// Client Pages
import { HomePage } from './client/pages/HomePage';
import { ServicesListPage } from './client/pages/ServicesListPage';
import TreatmentPackagesPage from './client/pages/TreatmentPackagesPage';
import TreatmentPackageDetailPage from './client/pages/TreatmentPackageDetailPage';
import ServiceDetailPage from './client/pages/ServiceDetailPage';
import { BookingPage } from './client/pages/BookingPage';
import { AppointmentsPage } from './client/pages/AppointmentsPage';
import TreatmentCourseDetailPage from './client/pages/TreatmentCourseDetailPage';
import ProfilePage from './client/pages/ProfilePage';
import LoginPage from './client/pages/LoginPage';
import RegisterPage from './client/pages/RegisterPage';
import ForgotPasswordPage from './client/pages/ForgotPasswordPage';
import { PromotionsPage } from './client/pages/PromotionsPage';
import PolicyPage from './client/pages/PolicyPage';
import PaymentSuccessPage from './client/pages/PaymentSuccessPage';
import PaymentFailedPage from './client/pages/PaymentFailedPage';

// Admin Pages
import AdminLayout from './admin/components/AdminLayout';
import { OverviewPage } from './admin/pages/OverviewPage';
import UsersPage from './admin/pages/UsersPage';
import ServicesPage from './admin/pages/ServicesPage';
import AdminAppointmentsPage from './admin/pages/AppointmentsPage';
import PaymentsPage from './admin/pages/PaymentsPage';
import StaffPage from './admin/pages/StaffPage';
import { AdminPromotionsPage } from './admin/pages/PromotionsPage';
import JobManagementPage from './admin/pages/JobManagementPage'; // New: Job Management
import RoomsPage from './admin/pages/RoomsPage'; // New: Rooms Management
import AdminTreatmentCoursesPage from './admin/pages/TreatmentCoursesPage'; // New: Treatment Courses
import AdminTreatmentCourseDetailPage from './admin/pages/AdminTreatmentCourseDetailPage';
import AdminProfilePage from './admin/pages/AdminProfilePage';
import ChangePasswordPage from './admin/pages/ChangePasswordPage';

// Staff Pages
import StaffLayout from './staff/components/StaffLayout';
import StaffDashboardPage from './staff/pages/StaffDashboardPage';
import StaffSchedulePage from './staff/pages/StaffSchedulePage';
import { StaffAppointmentsPage } from './staff/pages/StaffAppointmentsPage';
import StaffProfilePage from './staff/pages/StaffProfilePage';


const AppContent: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const userJson = localStorage.getItem('currentUser');
            return userJson ? JSON.parse(userJson) : null;
        } catch (error) {
            console.error("Could not parse user from localStorage", error);
            return null;
        }
    });

    const [wallet, setWallet] = useState<Wallet | null>(null);

    // Global data states
    const [allTiers, setAllTiers] = useState<Tier[]>([]);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [allReviews, setAllReviews] = useState<Review[]>([]);
    const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);
    const [allTreatmentCourses, setAllTreatmentCourses] = useState<TreatmentCourse[]>([]);
    const [allInternalNotifications, setAllInternalNotifications] = useState<InternalNotification[]>([]);
    const [allInternalNews, setAllInternalNews] = useState<InternalNews[]>([]);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                services, users, appointments, reviews, promotions,
                courses, notifications, news, payments, products, sales
            ] = await Promise.all([
                apiService.getServices(),
                apiService.getUsers(),
                apiService.getAppointments(),
                apiService.getReviews({}),
                apiService.getPromotions(),
                apiService.getTreatmentCourses({}), // Get all courses (including client-specific) for App.tsx
                apiService.getInternalNotifications('all'), // Fetch for all initially
                apiService.getInternalNews(),
                apiService.getPayments(),
                apiService.getProducts(),
                apiService.getSales()
            ]);
            // Tiers are calculated dynamically from wallet points, not stored in database
            setAllTiers([]);
            setAllServices(services);
            setAllUsers(users);
            setAllAppointments(appointments);
            setAllReviews(reviews);
            setAllPromotions(promotions);
            setAllTreatmentCourses(courses);
            setAllInternalNotifications(notifications);
            setAllInternalNews(news);
            setAllPayments(payments);
            setAllProducts(products);
            setAllSales(sales);

        } catch (error) {
            console.error("Failed to fetch initial app data:", error);
            // Set empty arrays to prevent undefined errors
            setAllTiers([]); // Tiers are calculated dynamically, not from database
            setAllServices([]);
            setAllUsers([]);
            setAllAppointments([]);
            setAllReviews([]);
            setAllPromotions([]);
            setAllTreatmentCourses([]);
            setAllInternalNotifications([]);
            setAllInternalNews([]);
            setAllPayments([]);
            setAllProducts([]);
            setAllSales([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Listen for refresh-treatment-courses event (e.g., after registration)
    useEffect(() => {
        const handleRefreshTreatmentCourses = async () => {
            try {
                console.log('Refreshing treatment courses after registration...');
                const courses = await apiService.getTreatmentCourses({});
                setAllTreatmentCourses(courses);
                console.log('Treatment courses refreshed:', courses.length);
            } catch (error) {
                console.error('Failed to refresh treatment courses:', error);
            }
        };
        window.addEventListener('refresh-treatment-courses', handleRefreshTreatmentCourses);
        return () => window.removeEventListener('refresh-treatment-courses', handleRefreshTreatmentCourses);
    }, []);

    // Listen for refresh-appointments event (e.g., after payment success)
    useEffect(() => {
        const handleRefreshAppointments = async () => {
            try {
                console.log('Refreshing appointments after payment...');
                const appointments = await apiService.getAppointments();
                setAllAppointments(appointments);
                console.log('Appointments refreshed:', appointments.length);
            } catch (error) {
                console.error('Failed to refresh appointments:', error);
            }
        };

        const handleAppointmentsUpdated = (event: any) => {
            console.log('Received appointments-updated event:', event.detail);
            if (event.detail?.appointments) {
                setAllAppointments(event.detail.appointments);
            }
        };

        window.addEventListener('refresh-appointments', handleRefreshAppointments);
        window.addEventListener('appointments-updated', handleAppointmentsUpdated);
        
        return () => {
            window.removeEventListener('refresh-appointments', handleRefreshAppointments);
            window.removeEventListener('appointments-updated', handleAppointmentsUpdated);
        };
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userWallet = await apiService.getUserWallet(currentUser.id);
                    setWallet(userWallet);
                    // Fetch user specific vouchers if needed
                } catch (error) {
                    console.error("Failed to fetch user-specific data:", error);
                    if (error instanceof Error && error.message.includes('401')) {
                        handleLogout();
                    }
                }
            } else {
                setWallet(null);
            }
        };
        fetchUserData();
    }, [currentUser]);

    useEffect(() => {
        // This effect handles navigation AFTER the user state has been updated.
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            const redirectPath = sessionStorage.getItem('redirectPath');
            const userRole = (currentUser.role || '').toString();
            const normalizedRole = userRole.toLowerCase();
            
            console.log('Navigation check:', {
                pathname: location.pathname,
                userRole: userRole,
                normalizedRole: normalizedRole,
                redirectPath: redirectPath
            });

            // Check if redirectPath is for a different role (prevent staff from accessing admin routes)
            if (redirectPath) {
                const isAdminRoute = redirectPath.startsWith('/admin');
                // Only redirect if the route matches the user's role
                if (isAdminRoute && normalizedRole !== 'admin') {
                    sessionStorage.removeItem('redirectPath');
                    navigate('/', { replace: true });
                    return;
                }

                sessionStorage.removeItem('redirectPath');
                navigate(redirectPath, { replace: true });
                return; // Stop further navigation logic
            }

            // After login or registration, redirect based on role.
            // Also redirect if user is on login/register page after already being logged in
            if (location.pathname === '/login' || location.pathname === '/register') {
                console.log('User on login/register page, redirecting based on role:', normalizedRole);
                if (normalizedRole === 'admin') {
                    navigate('/admin', { replace: true });
                } else if (normalizedRole === 'staff') {
                    navigate('/staff/dashboard', { replace: true });
                } else { // 'Client' or default
                    navigate('/', { replace: true });
                }
                return;
            }
            
            // Define public routes that all users can access
            const isPublicRoute = ['/', '/services', '/promotions', '/treatment-packages', '/policy'].includes(location.pathname) || 
                                 location.pathname.startsWith('/service/') || 
                                 location.pathname.startsWith('/treatment-packages/');
            
            // Redirect staff to /staff/dashboard if they're on client routes (except public routes)
            if (normalizedRole === 'staff') {
                if (!location.pathname.startsWith('/staff') && !location.pathname.startsWith('/admin')) {
                    if (!isPublicRoute) {
                        console.log('Staff user on client route, redirecting to /staff/dashboard:', location.pathname);
                        navigate('/staff/dashboard', { replace: true });
                        return;
                    }
                }
            }
            
            // CRITICAL: Redirect admin to /admin if they're on ANY route outside admin panel
            if (normalizedRole === 'admin') {
                if (!location.pathname.startsWith('/admin')) {
                    console.log('Admin user on non-admin route, redirecting to /admin:', location.pathname);
                    navigate('/admin', { replace: true });
                    return;
                }
            }

        } else {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
        }
    }, [currentUser, navigate, location.pathname]);


    const handleLogin = (loginResponse: { user: User, token: string }) => {
        const { user, token } = loginResponse;
        localStorage.setItem('token', token);
        const userRole = (user.role || '').toString().toLowerCase();
        console.log('User logged in:', { email: user.email, role: user.role, normalizedRole: userRole, id: user.id });
        setCurrentUser(user);
        
        // Immediately redirect based on role after login
        // This ensures staff users go to /staff, not client pages
        const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
            // Check if redirect path is appropriate for user role
            if (redirectPath.startsWith('/admin') && userRole !== 'admin') {
                sessionStorage.removeItem('redirectPath');
                if (userRole === 'staff') {
                    navigate('/staff/dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } else if (redirectPath.startsWith('/staff') && !['admin', 'staff'].includes(userRole)) {
                sessionStorage.removeItem('redirectPath');
                navigate('/', { replace: true });
            }
            // If redirect path is valid, it will be handled by useEffect
        } else {
            // No redirect path, redirect based on role immediately
            if (userRole === 'admin') {
                navigate('/admin', { replace: true });
            } else if (userRole === 'staff') {
                navigate('/staff/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        navigate('/', { replace: true });
    };

    const handleRegister = (registerResponse: { user: User, token: string }) => {
        const { user, token } = registerResponse;
        localStorage.setItem('token', token);
        const userRole = (user.role || '').toString().toLowerCase();
        // Set a flag to show a welcome/profile update message
        sessionStorage.setItem('isNewRegistration', 'true');
        console.log('User registered:', { email: user.email, role: user.role, normalizedRole: userRole, id: user.id });
        setCurrentUser(user);
        
        // Immediately redirect based on role after registration
        if (userRole === 'admin') {
            navigate('/admin', { replace: true });
        } else if (userRole === 'staff') {
            navigate('/staff/dashboard', { replace: true });
        } else {
            navigate('/', { replace: true });
        }
    };

    const handleUpdateUser = (updatedUser: User) => {
        setCurrentUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const isClientLayout = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/staff');

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-brand-light">
            {isClientLayout && <Header currentUser={currentUser} onLogout={handleLogout} />}
            <main className={isClientLayout ? "pt-28 flex-grow" : "flex-grow"}>
                <Routes>
                    {/* Client Routes */}
                    <Route path="/" element={<HomePage allServices={allServices} allPromotions={allPromotions} isLoading={isLoading} />} />
                    <Route path="/services" element={<ServicesListPage allServices={allServices} />} />
                    <Route path="/service/:id" element={<ServiceDetailPage allServices={allServices} currentUser={currentUser} allPromotions={allPromotions} setAllReviews={setAllReviews} setAllAppointments={setAllAppointments} />} />
                    <Route path="/promotions" element={<PromotionsPage currentUser={currentUser} wallet={wallet} setWallet={setWallet} userVouchers={[]} setUserVouchers={() => {}} allTiers={allTiers} />} />
                    <Route path="/treatment-packages" element={<TreatmentPackagesPage currentUser={currentUser} />} />
                    <Route path="/treatment-packages/:id" element={<TreatmentPackageDetailPage currentUser={currentUser} />} />
                    <Route path="/policy" element={<PolicyPage />} />

                    {/* Payment Result Routes */}
                    <Route path="/payment/success" element={<PaymentSuccessPage />} />
                    <Route path="/payment/failed" element={<PaymentFailedPage />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={
                        currentUser ? (
                            (() => {
                                const role = (currentUser.role || '').toString().toLowerCase();
                                if (role === 'admin') return <Navigate to="/admin" replace />;
                                if (role === 'staff') return <Navigate to="/staff/dashboard" replace />;
                                return <Navigate to="/" replace />;
                            })()
                        ) : (
                            <LoginPage onLogin={handleLogin} />
                        )
                    } />
                    <Route path="/register" element={
                        currentUser ? (
                            (() => {
                                const role = (currentUser.role || '').toString().toLowerCase();
                                if (role === 'admin') return <Navigate to="/admin" replace />;
                                if (role === 'staff') return <Navigate to="/staff/dashboard" replace />;
                                return <Navigate to="/" replace />;
                            })()
                        ) : (
                            <RegisterPage onRegister={handleRegister} />
                        )
                    } />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Protected Client Routes */}
                    <Route path="/booking" element={<ProtectedRoute user={currentUser}><BookingPage currentUser={currentUser} /></ProtectedRoute>} />
                    <Route path="/appointments" element={
                        <ProtectedRoute user={currentUser}>
                            <AppointmentsPage
                                currentUser={currentUser!}
                                allServices={allServices}
                                allUsers={allUsers}
                                allAppointments={allAppointments}
                                allTreatmentCourses={allTreatmentCourses}
                            />
                        </ProtectedRoute>
                    } />
                    <Route path="/treatment-course/:id" element={
                        <ProtectedRoute user={currentUser}>
                            <TreatmentCourseDetailPage currentUser={currentUser!} allServices={allServices} />
                        </ProtectedRoute>
                    } />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute user={currentUser}>
                                <ProfilePage
                                    currentUser={currentUser!}
                                    wallet={wallet!}
                                    setWallet={setWallet}
                                    onUpdateUser={handleUpdateUser}
                                    onLogout={handleLogout}
                                    allTiers={allTiers}
                                    allServices={allServices}
                                    setAllServices={setAllServices}
                                    allPayments={allPayments}
                                    allUsers={allUsers}
                                    allAppointments={allAppointments}
                                    setAllAppointments={setAllAppointments}
                                    allReviews={allReviews}
                                    setAllReviews={setAllReviews}
                                />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Routes */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute user={currentUser} adminOnly={true}>
                                <AdminLayout currentUser={currentUser!} onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/admin/overview" replace />} />
                        <Route path="overview" element={<OverviewPage allServices={allServices} allAppointments={allAppointments} allUsers={allUsers} allReviews={allReviews} allPromotions={allPromotions} allInternalNotifications={allInternalNotifications} allPayments={allPayments} />} />
                        <Route path="users" element={<UsersPage allUsers={allUsers} allTiers={allTiers} />} />
                        <Route path="services" element={<ServicesPage />} />
                        <Route path="appointments" element={<AdminAppointmentsPage allUsers={allUsers} allServices={allServices} allAppointments={allAppointments} />} />
                        <Route path="payments" element={<PaymentsPage allUsers={allUsers} />} />
                        <Route path="staff" element={<StaffPage allUsers={allUsers} allServices={allServices} allAppointments={allAppointments} />} />
                        <Route path="jobs" element={<JobManagementPage allUsers={allUsers} allServices={allServices} allAppointments={allAppointments} />} />
                        <Route path="rooms" element={<RoomsPage />} />
                        <Route path="treatment-courses" element={<AdminTreatmentCoursesPage allUsers={allUsers} allServices={allServices} />} />
                        <Route path="treatment-courses/:id" element={<AdminTreatmentCourseDetailPage />} />
                        <Route path="promotions" element={<AdminPromotionsPage allServices={allServices} allTiers={allTiers} allUsers={allUsers} allAppointments={allAppointments} allReviews={allReviews} />} />
                        <Route path="profile" element={<AdminProfilePage currentUser={currentUser!} onUpdateUser={handleUpdateUser} />} />
                        <Route path="change-password" element={<ChangePasswordPage currentUser={currentUser!} />} />
                    </Route>

                    {/* Staff Routes - Chỉ giữ Tổng quan, Lịch hẹn, Quản lý công việc */}
                    <Route
                        path="/staff"
                        element={
                            <ProtectedRoute user={currentUser} staffOnly={true}>
                                <StaffLayout currentUser={currentUser!} onLogout={handleLogout} />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="/staff/dashboard" replace />} />
                        <Route path="dashboard" element={<StaffDashboardPage currentUser={currentUser!} allServices={allServices} allUsers={allUsers} allAppointments={allAppointments} allInternalNotifications={allInternalNotifications} allSales={allSales} />} />
                        <Route path="schedule" element={<StaffSchedulePage currentUser={currentUser!} />} />
                        <Route path="appointments" element={<StaffAppointmentsPage currentUser={currentUser!} allAppointments={allAppointments} allServices={allServices} allUsers={allUsers} allProducts={allProducts} allSales={allSales} />} />
                        <Route path="profile" element={<StaffProfilePage currentUser={currentUser!} onUpdateUser={handleUpdateUser} />} />
                    </Route>

                    {/* Fallback Route */}
                    <Route path="*" element={<div className="text-center p-20"><h2>404: Không tìm thấy trang</h2></div>} />
                </Routes>
            </main>
            {isClientLayout && <Chatbot services={allServices} treatmentCourses={allTreatmentCourses} />}
            {isClientLayout && <Footer />}
        </div>
    );
};

const App: React.FC = () => (
    <HashRouter>
        <AppContent />
    </HashRouter>
);

export default App;