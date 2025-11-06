



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
import ServiceDetailPage from './client/pages/ServiceDetailPage';
import { BookingPage } from './client/pages/BookingPage';
import { AppointmentsPage } from './client/pages/AppointmentsPage';
import ProfilePage from './client/pages/ProfilePage';
import LoginPage from './client/pages/LoginPage';
import RegisterPage from './client/pages/RegisterPage';
import QAPage from './client/pages/QAPage';
import ContactPage from './client/pages/ContactPage';
import ForgotPasswordPage from './client/pages/ForgotPasswordPage';
import { PromotionsPage } from './client/pages/PromotionsPage';
import PolicyPage from './client/pages/PolicyPage'; // Import the new PolicyPage

// Admin Pages
import AdminLayout from './admin/components/AdminLayout';
import { OverviewPage } from './admin/pages/OverviewPage';
import UsersPage from './admin/pages/UsersPage';
import ServicesPage from './admin/pages/ServicesPage';
import AdminAppointmentsPage from './admin/pages/AppointmentsPage';
import PaymentsPage from './admin/pages/PaymentsPage';
import StaffPage from './admin/pages/StaffPage';
import { AdminPromotionsPage } from './admin/pages/PromotionsPage';
import { LoyaltyShopPage } from './admin/pages/LoyaltyShopPage';
import PlaceholderPage from './admin/pages/PlaceholderPage';
import ReportsPage from './admin/pages/ReportsPage';
import { MarketingPage } from './admin/pages/MarketingPage';
import SettingsPage from './admin/pages/SettingsPage';
import ContentPage from './admin/pages/ContentPage'; // Import the new ContentPage
import JobManagementPage from './admin/pages/JobManagementPage'; // New: Job Management

// Staff Pages
import StaffLayout from './staff/components/StaffLayout';
import StaffDashboardPage from './staff/pages/StaffDashboardPage';
import StaffSchedulePage from './staff/pages/StaffSchedulePage';
import { StaffAppointmentsPage } from './staff/pages/StaffAppointmentsPage';
import StaffTreatmentProgressPage from './staff/pages/StaffTreatmentProgressPage';
import StaffCustomerInteractionPage from './staff/pages/StaffCustomerInteractionPage';
import StaffRewardsPage from './staff/pages/StaffRewardsPage';
import { StaffUpsellingPage } from './staff/pages/StaffUpsellingPage';
import StaffPersonalReportsPage from './staff/pages/StaffPersonalReportsPage';
import { StaffNotificationsPage } from './staff/pages/StaffNotificationsPage';
import StaffProfilePage from './staff/pages/StaffProfilePage';
import { StaffTransactionHistoryPage } from './staff/pages/StaffTransactionHistoryPage';
import MyTasksPage from './staff/pages/MyTasksPage'; // New: Staff Tasks
import MyClientsPage from './staff/pages/MyClientsPage'; // New: Staff Clients page


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
    const [userVouchers, setUserVouchers] = useState<Promotion[]>([]);
    
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
                tiers, services, users, appointments, reviews, promotions, 
                courses, notifications, news, payments, products, sales
            ] = await Promise.all([
                apiService.getTiers(),
                apiService.getServices(),
                apiService.getUsers(),
                apiService.getAppointments(),
                apiService.getReviews({}),
                apiService.getPromotions(),
                apiService.getTreatmentCourses(),
                apiService.getInternalNotifications('all'), // Fetch for all initially
                apiService.getInternalNews(),
                apiService.getPayments(),
                apiService.getProducts(),
                apiService.getSales()
            ]);
            setAllTiers(tiers);
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
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                setUserVouchers([]);
            }
        };
        fetchUserData();
    }, [currentUser]);

     useEffect(() => {
        // This effect handles navigation AFTER the user state has been updated.
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            const redirectPath = sessionStorage.getItem('redirectPath');

            if (redirectPath) {
                sessionStorage.removeItem('redirectPath');
                navigate(redirectPath, { replace: true });
                return; // Stop further navigation logic
            }

            // After login or registration, redirect based on role.
            if (location.pathname === '/login' || location.pathname === '/register') {
                if (currentUser.role === 'Admin') {
                    navigate('/admin', { replace: true });
                } else if (currentUser.role === 'Staff') {
                    navigate('/staff', { replace: true });
                } else { // 'Client'
                    navigate('/', { replace: true });
                }
            }
        } else {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
        }
    }, [currentUser, navigate]);


    const handleLogin = (loginResponse: { user: User, token: string }) => {
        const { user, token } = loginResponse;
        localStorage.setItem('token', token);
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        navigate('/', { replace: true });
    };
    
    const handleRegister = (registerResponse: { user: User, token: string }) => {
        const { user, token } = registerResponse;
        localStorage.setItem('token', token);
        // Set a flag to show a welcome/profile update message
        sessionStorage.setItem('isNewRegistration', 'true');
        setCurrentUser(user);
    };

    const handleUpdateUser = (updatedUser: User) => {
        setCurrentUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const isClientLayout = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/staff');

    if(isLoading) {
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
                    <Route path="/service/:id" element={<ServiceDetailPage allServices={allServices} currentUser={currentUser} allPromotions={allPromotions} />} />
                    <Route path="/promotions" element={<PromotionsPage currentUser={currentUser} wallet={wallet!} setWallet={setWallet} userVouchers={userVouchers} setUserVouchers={setUserVouchers} allTiers={allTiers} />} />
                    <Route path="/qa" element={<QAPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/policy" element={<PolicyPage />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />
                    <Route path="/register" element={currentUser ? <Navigate to="/" /> : <RegisterPage onRegister={handleRegister} />} />
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
                        <Route path="overview" element={<OverviewPage allServices={allServices} allAppointments={allAppointments} allUsers={allUsers} allReviews={allReviews} allPromotions={allPromotions} allInternalNotifications={allInternalNotifications} />} />
                        <Route path="users" element={<UsersPage allUsers={allUsers} allTiers={allTiers} />} />
                        <Route path="services" element={<ServicesPage allServices={allServices} />} />
                        <Route path="appointments" element={<AdminAppointmentsPage allUsers={allUsers} allServices={allServices} allAppointments={allAppointments} />} />
                        <Route path="payments" element={<PaymentsPage allUsers={allUsers} />} />
                        <Route path="staff" element={<StaffPage allUsers={allUsers} allServices={allServices} allAppointments={allAppointments} />} />
                        <Route path="jobs" element={<JobManagementPage allUsers={allUsers} allServices={allServices} allAppointments={allAppointments} />} />
                        <Route path="promotions" element={<AdminPromotionsPage allServices={allServices} allTiers={allTiers} allUsers={allUsers} allAppointments={allAppointments} allReviews={allReviews} />} />
                        <Route path="loyalty-shop" element={<LoyaltyShopPage allTiers={allTiers} allServices={allServices} />} />
                        <Route path="marketing" element={<MarketingPage />} />
                        <Route path="content" element={<ContentPage currentUser={currentUser!} allInternalNews={allInternalNews} setAllInternalNews={setAllInternalNews} allUsers={allUsers} />} />
                        <Route path="reports" element={<ReportsPage allAppointments={allAppointments} allServices={allServices} allUsers={allUsers} allTiers={allTiers} />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="security" element={<PlaceholderPage />} />
                    </Route>
                    
                    {/* Staff Routes */}
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
                        <Route path="my-tasks" element={<MyTasksPage currentUser={currentUser!} />} />
                        <Route path="my-clients" element={<MyClientsPage currentUser={currentUser!} allUsers={allUsers} allAppointments={allAppointments} allServices={allServices} allProducts={allProducts} allSales={allSales} />} />
                        <Route path="treatment-progress" element={<StaffTreatmentProgressPage currentUser={currentUser!} allServices={allServices} allUsers={allUsers} allTreatmentCourses={allTreatmentCourses} />} />
                        <Route path="customer-interaction" element={<StaffCustomerInteractionPage currentUser={currentUser!} allUsers={allUsers} allAppointments={allAppointments} allReviews={allReviews} />} />
                        <Route path="rewards" element={<StaffRewardsPage currentUser={currentUser!} allServices={allServices} allUsers={allUsers} allAppointments={allAppointments} />} />
                        <Route path="upselling" element={<StaffUpsellingPage currentUser={currentUser!} allServices={allServices} allUsers={allUsers} allAppointments={allAppointments} allProducts={allProducts} />} />
                        <Route path="personal-reports" element={<StaffPersonalReportsPage currentUser={currentUser!} allServices={allServices} allUsers={allUsers} allAppointments={allAppointments} />} />
                        <Route path="notifications" element={<StaffNotificationsPage currentUser={currentUser!} allUsers={allUsers} allInternalNotifications={allInternalNotifications} allInternalNews={allInternalNews} />} />
                        <Route path="profile" element={<StaffProfilePage currentUser={currentUser!} onUpdateUser={handleUpdateUser} />} />
                        <Route path="transaction-history" element={<StaffTransactionHistoryPage currentUser={currentUser!} allServices={allServices} allUsers={allUsers} allAppointments={allAppointments} allPayments={allPayments} />} />
                    </Route>

                    {/* Fallback Route */}
                    <Route path="*" element={<div className="text-center p-20"><h2>404: Không tìm thấy trang</h2></div>} />
                </Routes>
            </main>
            {isClientLayout && <Chatbot />}
            {isClientLayout && <Footer />}
        </div>
    );
};

const App: React.FC = () => (
    <HashRouter>
        <AppContent/>
    </HashRouter>
);

export default App;