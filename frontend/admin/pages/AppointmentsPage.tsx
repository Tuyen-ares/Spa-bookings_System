import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Appointment, User, Service, TreatmentCourse, StaffShift } from '../../types';
import * as apiService from '../../client/services/apiService';
import { formatDateDDMMYYYY, parseDDMMYYYYToYYYYMMDD } from '../../shared/dateUtils';

// --- ICONS ---
import {
    CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon,
    ChevronLeftIcon, ChevronRightIcon,
    PlusIcon, EditIcon, PhoneIcon, ProfileIcon, ChevronDownIcon, CloseIcon, SearchIcon, TrashIcon
} from '../../shared/icons';

const STATUS_CONFIG: Record<Appointment['status'], { text: string; color: string; bgColor: string; borderColor: string; }> = {
    pending: { text: 'Chờ xác nhận', color: 'text-yellow-800', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-500' },
    scheduled: { text: 'Đã lên lịch', color: 'text-blue-800', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' },
    upcoming: { text: 'Đã xác nhận', color: 'text-green-800', bgColor: 'bg-green-100', borderColor: 'border-green-500' },
    completed: { text: 'Hoàn thành', color: 'text-blue-800', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' },
    cancelled: { text: 'Đã hủy', color: 'text-red-800', bgColor: 'bg-red-100', borderColor: 'border-red-500' },
    'in-progress': { text: 'Đang tiến hành', color: 'text-purple-800', bgColor: 'bg-purple-100', borderColor: 'border-purple-500' },
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string; isLoading?: boolean }> = ({ title, value, icon, color, isLoading = false }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse mt-1"></div>
            ) : (
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            )}
        </div>
    </div>
);

type View = 'month' | 'week' | 'day';
type Tab = 'calendar' | 'pending';

interface AdminAppointmentsPageProps {
    allUsers: User[];
    allServices: Service[];
    allAppointments: Appointment[];
}

const AdminAppointmentsPage: React.FC<AdminAppointmentsPageProps> = ({ allUsers, allServices, allAppointments: initialAppointments }) => {
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    const [activeTab, setActiveTab] = useState<Tab>('calendar');
    const [view, setView] = useState<View>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState<Appointment | null>(null);
    const handleAppointmentSelect = useCallback(async (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        // Fetch fresh appointment detail from API to get latest payment status
        try {
            setIsLoadingModalData(true);
            const detail = await apiService.getAppointmentById(appointment.id);
            setSelectedAppointmentDetail(detail);
        } catch (error) {
            console.error('Error fetching appointment detail:', error);
            // Fallback to using appointment from list
            setSelectedAppointmentDetail(appointment);
        } finally {
            setIsLoadingModalData(false);
        }
    }, []);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Local states for users and services (fallback if props are empty)
    const [localUsers, setLocalUsers] = useState<User[]>(allUsers);
    const [localServices, setLocalServices] = useState<Service[]>(allServices);
    const [isLoadingModalData, setIsLoadingModalData] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStaff, setFilterStaff] = useState('all');
    const [filterCustomer, setFilterCustomer] = useState('all');
    const [filterService, setFilterService] = useState('all');
    const [filterStatus, setFilterStatus] = useState<Appointment['status'] | 'all'>('all');
    const [showStaffDropdown, setShowStaffDropdown] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [staffSearch, setStaffSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');

    // New state for cancellation reason
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // State for assigning therapist when approving appointment
    const [appointmentToApprove, setAppointmentToApprove] = useState<Appointment | null>(null);
    const [selectedTherapistId, setSelectedTherapistId] = useState<string>('');

    // Sync localUsers with allUsers when allUsers changes
    useEffect(() => {
        if (allUsers.length > 0) {
            setLocalUsers(allUsers);
        }
    }, [allUsers]);

    // Get staff members
    const staffMembers = useMemo(() => {
        return localUsers.filter(u => (u.role === 'Staff' || u.role === 'Admin') && u.status === 'Active');
    }, [localUsers]);

    // Get customers who have appointments from today onwards
    const allCustomers = useMemo(() => {
        const clients = localUsers.filter(u => u.role === 'Client');
        
        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        // Only return customers who have at least one appointment from today onwards
        const customerIdsWithAppointments = new Set(
            appointments
                .filter(apt => apt.status !== 'cancelled' && apt.date >= todayStr)
                .map(apt => apt.userId)
        );
        
        return clients.filter(client => customerIdsWithAppointments.has(client.id));
    }, [localUsers, appointments]);

    // Filter staff for dropdown search
    const filteredStaffForDropdown = useMemo(() => {
        if (!staffSearch.trim()) {
            return staffMembers;
        }
        const searchLower = staffSearch.toLowerCase();
        return staffMembers.filter(staff => 
            (staff.name?.toLowerCase().includes(searchLower) || '') ||
            (staff.phone?.toLowerCase().includes(searchLower) || '')
        );
    }, [staffMembers, staffSearch]);

    // Filter customers for dropdown search
    const filteredCustomersForDropdown = useMemo(() => {
        if (!customerSearch.trim()) {
            return allCustomers;
        }
        const searchLower = customerSearch.toLowerCase();
        return allCustomers.filter(customer => 
            (customer.name?.toLowerCase().includes(searchLower) || '') ||
            (customer.phone?.toLowerCase().includes(searchLower) || '')
        );
    }, [allCustomers, customerSearch]);

    // Handle customer select and navigate to nearest appointment
    const handleCustomerSelect = (customerId: string) => {
        setFilterCustomer(customerId);
        setCustomerSearch('');
        setShowCustomerDropdown(false);

        if (customerId === 'all') {
            return;
        }

        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Find all appointments for this customer from today onwards
        const customerAppointments = appointments.filter(
            apt => apt.userId === customerId && apt.status !== 'cancelled' && apt.date >= todayStr
        );

        if (customerAppointments.length === 0) {
            return;
        }

        // Find the nearest upcoming appointment
        const now = new Date();
        const upcomingAppointments = customerAppointments.filter(apt => {
            const aptDate = new Date(apt.date + 'T' + (apt.time || '00:00'));
            return aptDate >= now;
        });

        if (upcomingAppointments.length === 0) {
            // If no upcoming appointments, use the earliest future appointment (same day but later time)
            const sameDayAppointments = customerAppointments.filter(apt => apt.date === todayStr);
            if (sameDayAppointments.length > 0) {
                const nearestAppointment = sameDayAppointments.reduce((nearest, apt) => {
                    const nearestTime = nearest.time || '23:59';
                    const aptTime = apt.time || '23:59';
                    return aptTime < nearestTime ? apt : nearest;
                });
                // Navigate to today
                setCurrentDate(new Date());
                return;
            }
            return;
        }

        // Get the nearest upcoming appointment
        const nearestAppointment = upcomingAppointments.reduce((nearest, apt) => {
            const nearestDate = new Date(nearest.date + 'T' + (nearest.time || '00:00'));
            const aptDate = new Date(apt.date + 'T' + (apt.time || '00:00'));
            return aptDate < nearestDate ? apt : nearest;
        });

        // Navigate to the date of this appointment
        const appointmentDate = new Date(nearestAppointment.date);
        setCurrentDate(appointmentDate);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.staff-dropdown-container') && !target.closest('.customer-dropdown-container')) {
                setShowStaffDropdown(false);
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch users when appointment detail modal opens if needed
    useEffect(() => {
        if (selectedAppointment) {
            const fetchUsersIfNeeded = async () => {
                // If we don't have users data, fetch it
                if (localUsers.length === 0 && allUsers.length === 0) {
                    try {
                        const users = await apiService.getUsers();
                        setLocalUsers(users);
                    } catch (error) {
                        console.error('Error fetching users for appointment detail:', error);
                    }
                }
            };
            fetchUsersIfNeeded();
        }
    }, [selectedAppointment, localUsers.length, allUsers.length]);

    // Fetch users when opening approve modal if needed
    useEffect(() => {
        if (appointmentToApprove) {
            const fetchUsers = async () => {
                // Only fetch if we don't have users at all
                if (localUsers.length === 0 && allUsers.length === 0) {
                    try {
                        console.log('Fetching users for approve modal...');
                        const users = await apiService.getUsers();
                        console.log('Fetched users:', users.length, 'Staff:', users.filter(u => u.role === 'Staff' && u.status === 'Active').length);
                        setLocalUsers(users);
                    } catch (error) {
                        console.error('Error fetching users for approve modal:', error);
                    }
                }
            };
            fetchUsers();
        }
    }, [appointmentToApprove]);

    // State for Add Appointment Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAppointmentForm, setNewAppointmentForm] = useState<{
        customerSearch: string;
        selectedCustomerId: string | null;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        date: string;
        time: string; // HH:mm format
        serviceId: string;
        serviceQuantity: number; // Quantity for selected service
        therapistId: string;
        notes: string;
        durationWeeks?: number; // For treatment course
        frequencyType?: 'weeks_per_session' | 'sessions_per_week' | null; // For treatment course
        frequencyValue?: number; // For treatment course
    }>({
        customerSearch: '',
        selectedCustomerId: null,
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        date: formatDateDDMMYYYY(new Date()),
        time: '09:00',
        serviceId: '',
        serviceQuantity: 1,
        therapistId: '',
        notes: '',
        durationWeeks: undefined,
        frequencyType: null,
        frequencyValue: undefined,
    });

    // State for selected services (for table display)
    const [selectedServices, setSelectedServices] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);

    // State for dropdown visibility (for add appointment modal)
    const [showAddModalCustomerDropdown, setShowAddModalCustomerDropdown] = useState(false);
    const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);

    // State for expanded dates in calendar
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

    const toggleDateExpand = (dateKey: string) => {
        setExpandedDates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dateKey)) {
                newSet.delete(dateKey);
            } else {
                newSet.add(dateKey);
            }
            return newSet;
        });
    };

    useEffect(() => {
        setAppointments(initialAppointments);
        setIsLoading(false);
    }, [initialAppointments]);

    // Sync local users and services with props
    useEffect(() => {
        if (allUsers && allUsers.length > 0) {
            setLocalUsers(allUsers);
        }
    }, [allUsers]);

    useEffect(() => {
        if (allServices && allServices.length > 0) {
            setLocalServices(allServices);
        }
    }, [allServices]);

    // Fetch appointments if needed and listen for refresh events
    useEffect(() => {
        const fetchAppointments = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getAppointments();
                setAppointments(data);
            } catch (err: any) {
                setError(err.message || 'Không thể tải lịch hẹn');
            } finally {
                setIsLoading(false);
            }
        };
        
        // Fetch on mount if needed
        if (initialAppointments.length === 0) {
            fetchAppointments();
        }

        // Listen for refresh events
        const handleRefresh = () => {
            fetchAppointments();
        };
        window.addEventListener('refresh-appointments', handleRefresh);
        window.addEventListener('appointments-updated', handleRefresh);

        return () => {
            window.removeEventListener('refresh-appointments', handleRefresh);
            window.removeEventListener('appointments-updated', handleRefresh);
        };
    }, []);

    // Handle confirm appointment
    const handleConfirm = async (appointment: Appointment) => {
        const client = (appointment as any).Client || localUsers.find(u => u.id === appointment.userId) || allUsers.find(u => u.id === appointment.userId);
        const clientName = client?.name || 'khách hàng';
        if (!confirm(`Xác nhận lịch hẹn của ${clientName}?`)) return;

        try {
            setAppointments(prev =>
                prev.map(apt =>
                    apt.id === appointment.id
                        ? { ...apt, status: 'in-progress' }
                        : apt
                )
            );

            await apiService.updateAppointment(appointment.id, {
                status: 'in-progress',
            });

            alert('Đã xác nhận lịch hẹn thành công!');

            setTimeout(() => {
                const fetchLatest = async () => {
                    const data = await apiService.getAppointments();
                    setAppointments(data);
                };
                fetchLatest();
            }, 300);
        } catch (error) {
            console.error('Error confirming appointment:', error);
            alert('Có lỗi xảy ra khi xác nhận lịch hẹn');
        }
    };

    // Handle reject appointment
    const handleReject = (appointment: Appointment) => {
        setAppointmentToCancel(appointment);
    };

    const handleRejectConfirm = async () => {
        if (!appointmentToCancel) return;
        if (!rejectionReason.trim()) {
            alert('Vui lòng nhập lý do hủy');
            return;
        }

        try {
            setAppointments(prev =>
                prev.map(apt =>
                    apt.id === appointmentToCancel.id
                        ? { ...apt, status: 'cancelled', rejectionReason: rejectionReason }
                        : apt
                )
            );

            await apiService.updateAppointment(appointmentToCancel.id, {
                status: 'cancelled',
                rejectionReason: rejectionReason,
            });

            setAppointmentToCancel(null);
            setRejectionReason('');

            alert('Đã hủy lịch hẹn thành công!');

            setTimeout(() => {
                const fetchLatest = async () => {
                    const data = await apiService.getAppointments();
                    setAppointments(data);
                };
                fetchLatest();
            }, 300);
        } catch (error) {
            console.error('Error rejecting appointment:', error);
            alert('Có lỗi xảy ra khi hủy lịch hẹn');
        }
    };

    // Fetch treatment courses and staff shifts when modal opens
    useEffect(() => {
        if (showAddModal) {
            const fetchModalData = async () => {
                setIsLoadingModalData(true);
                try {
                    // Always fetch users and services to ensure we have latest data
                    // Fetch in parallel for better performance
                    const fetchPromises = [
                        apiService.getUsers(),
                        apiService.getServices(),
                    ];

                    const results = await Promise.allSettled(fetchPromises);

                    // Handle users
                    const usersResult = results[0];
                    if (usersResult.status === 'fulfilled' && Array.isArray(usersResult.value) && usersResult.value.length > 0) {
                        setLocalUsers(usersResult.value as User[]);
                    } else if (usersResult.status === 'rejected') {
                        console.error('Error fetching users:', usersResult.reason);
                        // Keep existing localUsers or use props
                        if (localUsers.length === 0 && allUsers.length > 0) {
                            setLocalUsers(allUsers);
                        }
                    }

                    // Handle services
                    const servicesResult = results[1];
                    if (servicesResult.status === 'fulfilled' && Array.isArray(servicesResult.value) && servicesResult.value.length > 0) {
                        setLocalServices(servicesResult.value as Service[]);
                    } else if (servicesResult.status === 'rejected') {
                        console.error('Error fetching services:', servicesResult.reason);
                        // Keep existing localServices or use props
                        if (localServices.length === 0 && allServices.length > 0) {
                            setLocalServices(allServices);
                        }
                    }
                } catch (err: any) {
                    console.error('Error fetching modal data:', err);
                    // Don't show alert here, let individual fetch errors be logged
                } finally {
                    setIsLoadingModalData(false);
                }
            };
            fetchModalData();
        }
    }, [showAddModal]);

    const stats = useMemo(() => {
        if (isLoading || error) return { pending: 0, upcoming: 0, completed: 0, cancelled: 0, inProgress: 0 };
        
        // "Đã xác nhận" = số lần admin xác nhận, không phải số appointments
        // Logic: Mỗi bookingGroupId (liệu trình) chỉ đếm 1 lần, dù có nhiều buổi
        // Appointments không có bookingGroupId (single appointments) đếm từng cái một
        
        // Lấy tất cả appointments đã được xác nhận (status: 'upcoming' hoặc 'scheduled')
        const confirmedAppointments = appointments.filter(a => 
            (a.status === 'upcoming' || a.status === 'scheduled')
        );
        
        // Nhóm các appointments đã xác nhận theo bookingGroupId
        const confirmedBookingGroups = new Set<string>();
        let singleConfirmedAppointments = 0; // Appointments không có bookingGroupId
        
        confirmedAppointments.forEach(apt => {
            if (apt.bookingGroupId) {
                // Có bookingGroupId: nhóm lại, mỗi group chỉ đếm 1 lần
                confirmedBookingGroups.add(apt.bookingGroupId);
            } else {
                // Không có bookingGroupId: đếm từng appointment
                singleConfirmedAppointments++;
            }
        });
        
        // Tổng số lần xác nhận = số booking groups + số single appointments
        const totalConfirmed = confirmedBookingGroups.size + singleConfirmedAppointments;
        
        return {
            pending: appointments.filter(a => a.status === 'pending').length,
            upcoming: totalConfirmed, // Số lần admin xác nhận (mỗi booking group = 1 lần)
            completed: appointments.filter(a => a.status === 'completed').length,
            cancelled: appointments.filter(a => a.status === 'cancelled').length,
            inProgress: appointments.filter(a => a.status === 'in-progress').length,
        };
    }, [appointments, isLoading, error]);

    const handleAction = async (appointmentToUpdate: Appointment, newStatus: Appointment['status'], reason?: string, therapistId?: string) => {
        try {
            const payload: Partial<Appointment> = { status: newStatus };
            if (newStatus === 'cancelled' && reason && reason.trim()) {
                payload.rejectionReason = reason;
            }
            // If approving and therapist is selected, assign therapist
            if (newStatus === 'upcoming' && therapistId) {
                payload.therapistId = therapistId;
            }
            const updatedAppointment = await apiService.updateAppointment(appointmentToUpdate.id, payload);

            // Update local state immediately for better UX
            setAppointments(prev => prev.map(app => app.id === updatedAppointment.id ? updatedAppointment : app));

            // Reload appointments from server to ensure data is fresh
            setTimeout(async () => {
                try {
                    const freshData = await apiService.getAppointments();
                    setAppointments(freshData);
                    // Emit event to update App.tsx state
                    window.dispatchEvent(new CustomEvent('appointments-updated', {
                        detail: { appointments: freshData }
                    }));
                } catch (reloadErr) {
                    console.error('Error reloading appointments:', reloadErr);
                }
            }, 300);

            setSelectedAppointment(null);
            setAppointmentToCancel(null);
            setRejectionReason('');
            setAppointmentToApprove(null);
            setSelectedTherapistId('');
            
            // Show success message
            if (newStatus === 'upcoming' && therapistId) {
                alert('Đã xác nhận lịch hẹn và phân công nhân viên thành công!');
            }
        } catch (err: any) {
            console.error(`Error updating appointment ${appointmentToUpdate.id} status to ${newStatus}:`, err);
            
            // Check if error is about schedule conflict
            const errorMessage = err.response?.data?.message || err.message || String(err);
            if (errorMessage.includes('đã được phân công') || errorMessage.includes('trùng lịch') || errorMessage.includes('conflict')) {
                alert(`⚠️ ${errorMessage}\n\nVui lòng chọn nhân viên khác hoặc thay đổi thời gian.`);
            } else {
                alert(`Cập nhật lịch hẹn thất bại: ${errorMessage}`);
            }
        }
    };

    const handleConfirmCancellation = () => {
        if (appointmentToCancel) {
            handleAction(appointmentToCancel, 'cancelled', rejectionReason);
        }
    };

    const handleConfirmPayment = async (appointment: Appointment) => {
        try {
            const updatedAppointment = await apiService.updateAppointment(appointment.id, {
                paymentStatus: 'Paid'
            });

            // Update local state
            setAppointments(prev => prev.map(app =>
                app.id === updatedAppointment.id ? updatedAppointment : app
            ));

            // Update selected appointment if it's open
            if (selectedAppointment?.id === appointment.id) {
                setSelectedAppointment(updatedAppointment);
            }

            // Emit event to update App.tsx state
            window.dispatchEvent(new CustomEvent('appointments-updated', {
                detail: { appointments: appointments.map(a => a.id === updatedAppointment.id ? updatedAppointment : a) }
            }));

            alert('Đã xác nhận thanh toán thành công!');
        } catch (error) {
            console.error('Error confirming payment:', error);
            alert('Có lỗi xảy ra khi xác nhận thanh toán');
        }
    };

    // Get all customers for add appointment modal dropdown
    const allCustomersForModal = useMemo(() => {
        return localUsers.filter(u => u.role === 'Client');
    }, [localUsers]);

    // Filter customers based on search for add appointment modal
    const filteredCustomersForModalDropdown = useMemo(() => {
        if (!newAppointmentForm.customerSearch) return allCustomersForModal.slice(0, 10);
        const search = newAppointmentForm.customerSearch.toLowerCase();
        return allCustomersForModal.filter(u =>
            u.name?.toLowerCase().includes(search) ||
            u.phone?.includes(search)
        ).slice(0, 10);
    }, [newAppointmentForm.customerSearch, allCustomersForModal]);

    // Get pending appointments for "Lịch hẹn chưa xác nhận" tab
    const pendingAppointments = useMemo(() => {
        return appointments.filter(app => app.status === 'pending');
    }, [appointments]);

    // Helper function to filter week appointments
    const filterWeekAppointments = (
        apps: Appointment[],
        startWeek: Date,
        endWeek: Date,
        users: User[],
        search: string,
        staffFilter: string,
        serviceFilter: string,
        statusFilter: string
    ): Appointment[] => {
        const result: Appointment[] = [];
        for (let i = 0; i < apps.length; i++) {
            const app = apps[i];
            if (app.status === 'cancelled') {
                continue;
            }
            const appDate = new Date(app.date);
            const dateMatch = appDate >= startWeek && appDate <= endWeek;
            if (!dateMatch) {
                continue;
            }
            let user = null;
            for (let j = 0; j < users.length; j++) {
                if (users[j].id === app.userId) {
                    user = users[j];
                    break;
                }
            }
            const searchMatch = search === '' ||
                app.serviceName.toLowerCase().includes(search.toLowerCase()) ||
                (user && user.name.toLowerCase().includes(search.toLowerCase()));
            const staffMatch = staffFilter === 'all' || app.therapistId === staffFilter;
            const customerMatch = filterCustomer === 'all' || app.userId === filterCustomer;
            const serviceMatch = serviceFilter === 'all' || app.serviceId === serviceFilter;
            const statusMatch = statusFilter === 'all' || app.status === statusFilter;
            if (searchMatch && staffMatch && customerMatch && serviceMatch && statusMatch) {
                result.push(app);
            }
        }
        return result;
    };

    // Handle quick add customer
    const handleQuickAddCustomer = async () => {
        if (!newAppointmentForm.customerName || !newAppointmentForm.customerPhone) {
            alert('Vui lòng nhập tên và số điện thoại');
            return;
        }

        try {
            // Check if customer already exists
            const existingCustomer = allCustomers.find(c => c.phone === newAppointmentForm.customerPhone);
            if (existingCustomer) {
                setNewAppointmentForm(prev => ({
                    ...prev,
                    selectedCustomerId: existingCustomer.id,
                    customerName: existingCustomer.name || '',
                    customerPhone: existingCustomer.phone || '',
                    customerEmail: existingCustomer.email || '',
                    customerSearch: existingCustomer.name || '',
                }));
                setShowQuickAddCustomer(false);
                alert('Khách hàng đã tồn tại, đã tự động chọn');
                return;
            }

            // Create new user via API
            const newUser = await apiService.createUser({
                name: newAppointmentForm.customerName,
                phone: newAppointmentForm.customerPhone,
                email: newAppointmentForm.customerEmail || `${newAppointmentForm.customerPhone}@temp.com`,
                role: 'Client',
                status: 'Active',
            });

            // Select the newly created customer
            setNewAppointmentForm(prev => ({
                ...prev,
                selectedCustomerId: newUser.id,
                customerSearch: newUser.name || '',
            }));
            setShowQuickAddCustomer(false);
            alert('Thêm khách hàng thành công!');
        } catch (err: any) {
            console.error('Error creating customer:', err);
            alert(`Thêm khách hàng thất bại: ${err.message || String(err)}`);
        }
    };

    // Handle add service to table
    const handleAddService = () => {
        if (!newAppointmentForm.serviceId) {
            alert('Vui lòng chọn dịch vụ');
            return;
        }

        const service = localServices.find(s => s.id === newAppointmentForm.serviceId);
        if (!service) return;

        const quantity = newAppointmentForm.serviceQuantity || 1;

        // Check if service already in table
        if (selectedServices.find(s => s.id === service.id)) {
            setSelectedServices(prev => prev.map(s =>
                s.id === service.id ? { ...s, quantity: s.quantity + quantity } : s
            ));
        } else {
            setSelectedServices(prev => [...prev, {
                id: service.id,
                name: service.name,
                price: service.price || 0,
                quantity: quantity,
            }]);
        }

        // Reset service selection
        setNewAppointmentForm(prev => ({ ...prev, serviceId: '', serviceQuantity: 1 }));
    };

    // Get available staff for selected date
    const availableStaff = useMemo(() => {
        // Return all active staff (admin can assign any staff)
        return localUsers.filter(u =>
            u.role === 'Staff' &&
            u.status === 'Active'
        );
    }, [localUsers]);

    // Handle form submission
    const handleAddAppointment = async () => {
        try {
            // Validation
            if (!newAppointmentForm.selectedCustomerId && (!newAppointmentForm.customerName || !newAppointmentForm.customerPhone)) {
                alert('Vui lòng chọn khách hàng hoặc nhập thông tin khách hàng mới');
                return;
            }

            if (!newAppointmentForm.date) {
                alert('Vui lòng chọn ngày hẹn');
                return;
            }

            if (selectedServices.length === 0) {
                alert('Vui lòng chọn ít nhất một dịch vụ');
                return;
            }

            if (!newAppointmentForm.therapistId) {
                alert('Vui lòng chọn nhân viên');
                return;
            }

            const selectedDate = parseDDMMYYYYToYYYYMMDD(newAppointmentForm.date);
            if (!selectedDate) {
                alert('Ngày không hợp lệ');
                return;
            }

            // Get therapist name
            const selectedTherapist = localUsers.find(u => u.id === newAppointmentForm.therapistId);
            if (!selectedTherapist) {
                alert('Nhân viên không hợp lệ');
                return;
            }

            // Get time from form
            const appointmentTime = newAppointmentForm.time || '09:00';

            // Create appointments for each selected service/treatment course
            const appointmentsToCreate = [];

            // Add services
            for (const serviceItem of selectedServices) {
                const service = localServices.find(s => s.id === serviceItem.id);
                if (service) {
                    // All bookings create treatment courses (quantity >= 1)
                    // Backend will handle treatment course creation automatically
                    appointmentsToCreate.push({
                        userId: newAppointmentForm.selectedCustomerId || '',
                        customerName: newAppointmentForm.customerName,
                        phone: newAppointmentForm.customerPhone,
                        email: newAppointmentForm.customerEmail || undefined,
                        date: selectedDate,
                        time: appointmentTime,
                        serviceId: service.id,
                        serviceName: service.name,
                        therapistId: newAppointmentForm.therapistId,
                        notesForTherapist: newAppointmentForm.notes || '',
                        status: 'upcoming' as const,
                        quantity: serviceItem.quantity || 1, // Default to 1 if not specified
                        durationWeeks: newAppointmentForm.durationWeeks || ((serviceItem.quantity || 1) + 1),
                        frequencyType: newAppointmentForm.frequencyType || null,
                        frequencyValue: newAppointmentForm.frequencyValue || null,
                    });
                }
            }

            if (appointmentsToCreate.length === 0) {
                alert('Vui lòng chọn ít nhất một dịch vụ');
                return;
            }

            // Create all appointments
            const createdAppointments = await Promise.all(
                appointmentsToCreate.map(data => apiService.createAppointment(data))
            );

            // Update appointments list
            setAppointments(prev => [...prev, ...createdAppointments]);

            // Reset form and close modal
            setNewAppointmentForm({
                customerSearch: '',
                selectedCustomerId: null,
                customerName: '',
                customerPhone: '',
                customerEmail: '',
                date: formatDateDDMMYYYY(new Date()),
                time: '09:00',
                serviceId: '',
                serviceQuantity: 1,
                therapistId: '',
                notes: '',
                durationWeeks: undefined,
                frequencyType: null,
                frequencyValue: undefined,
            });
            setSelectedServices([]);
            setShowAddModalCustomerDropdown(false);
            setShowQuickAddCustomer(false);
            setShowAddModal(false);

            alert(`Thêm ${createdAppointments.length} lịch hẹn thành công!`);
        } catch (err: any) {
            console.error('Error creating appointment:', err);
            alert(`Thêm lịch hẹn thất bại: ${err.message || String(err)}`);
        }
    };

    // Render calendar month view
    const renderMonthCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Get first day of month and how many days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Adjust for Monday as first day (0 = Monday, 6 = Sunday)
        const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

        const days: (Date | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < adjustedStartingDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        // Get appointments for this month with filters (exclude cancelled)
        const monthAppointments = appointments.filter(app => {
            // Exclude cancelled appointments from calendar view
            if (app.status === 'cancelled') return false;

            const appDate = new Date(app.date);
            const dateMatch = appDate.getMonth() === month && appDate.getFullYear() === year;

            if (!dateMatch) return false;

            // Apply filters
            const user = localUsers.find(u => u.id === app.userId);
            const searchMatch = searchTerm === '' ||
                app.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
            const staffMatch = filterStaff === 'all' || app.therapistId === filterStaff;
            const customerMatch = filterCustomer === 'all' || app.userId === filterCustomer;
            const serviceMatch = filterService === 'all' || app.serviceId === filterService;
            const statusMatch = filterStatus === 'all' || app.status === filterStatus;

            return searchMatch && staffMatch && customerMatch && serviceMatch && statusMatch;
        });

        // Group appointments by date
        const appointmentsByDate = new Map<string, Appointment[]>();
        monthAppointments.forEach(app => {
            const dateKey = app.date;
            if (!appointmentsByDate.has(dateKey)) {
                appointmentsByDate.set(dateKey, []);
            }
            appointmentsByDate.get(dateKey)!.push(app);
        });

        const weekDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

        return (
            <div className="grid grid-cols-7 gap-2">
                {/* Week day headers */}
                {weekDays.map(day => (
                    <div key={day} className="p-2 text-center font-semibold text-gray-700 bg-gray-50 rounded">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {days.map((date, index) => {
                    if (!date) {
                        return <div key={`empty-${index}`} className="p-2 min-h-[120px] border border-gray-200 rounded bg-gray-50"></div>;
                    }

                    // Format date as YYYY-MM-DD in local timezone
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${day}`;
                    
                    const dayAppointments = appointmentsByDate.get(dateKey) || [];
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isExpanded = expandedDates.has(dateKey);
                    const maxDisplay = isExpanded ? dayAppointments.length : 3;

                    return (
                        <div
                            key={dateKey}
                            className={`p-2 min-h-[120px] border rounded ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} hover:bg-gray-50 transition-colors`}
                        >
                            <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                                {date.getDate()}
                            </div>
                            <div className="space-y-1">
                                {dayAppointments.slice(0, maxDisplay).map(app => {
                                    const client = (app as any).Client || localUsers.find(u => u.id === app.userId);
                                    const therapist = (app as any).Therapist || (app.therapistId ? localUsers.find(u => u.id === app.therapistId) : null);
                                    const clientName = client?.name || (app as any).userName || 'N/A';
                                    const clientPhone = client?.phone || '';
                                    const therapistName = therapist?.name || 'Chưa phân công';

                                    return (
                                        <div
                                            key={app.id}
                                            onClick={() => handleAppointmentSelect(app)}
                                            className={`relative text-xs p-1.5 rounded cursor-pointer transition-shadow hover:shadow-md ${STATUS_CONFIG[app.status].bgColor} ${STATUS_CONFIG[app.status].color}`}
                                            title={`${app.time} - ${app.serviceName} - ${clientName}`}
                                        >
                                            {/* Status badge ở góc trên bên phải cho month view */}
                                            <span className={`absolute top-0.5 right-0.5 text-[9px] px-1 py-0.5 rounded font-semibold ${STATUS_CONFIG[app.status].bgColor} ${STATUS_CONFIG[app.status].color} opacity-90`}>
                                                {STATUS_CONFIG[app.status].text}
                                            </span>
                                            <div className="font-semibold truncate pr-8">{app.time}</div>
                                            <div className="truncate font-medium">{clientName}</div>
                                            {clientPhone && (
                                                <div className="truncate text-[10px] flex items-center gap-1">
                                                    <PhoneIcon className="w-3 h-3" />
                                                    {clientPhone}
                                                </div>
                                            )}
                                            <div className="truncate text-[10px] mt-0.5">
                                                NV: {therapistName}
                                            </div>
                                        </div>
                                    );
                                })}
                                {dayAppointments.length > 3 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDateExpand(dateKey);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold text-center w-full py-1 hover:bg-blue-50 rounded transition-colors"
                                    >
                                        {isExpanded ? 'Thu gọn' : `+${dayAppointments.length - 3} lịch khác`}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render week view
    const renderWeekView = () => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weekAppointments = filterWeekAppointments(
            appointments,
            startOfWeek,
            endOfWeek,
            localUsers,
            searchTerm,
            filterStaff,
            filterService,
            filterStatus
        );

        // Group appointments by date
        const appointmentsByDate = new Map<string, Appointment[]>();
        weekAppointments.forEach(app => {
            const dateKey = app.date;
            if (!appointmentsByDate.has(dateKey)) {
                appointmentsByDate.set(dateKey, []);
            }
            appointmentsByDate.get(dateKey)!.push(app);
        });

        // Generate week days
        const weekDays: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            weekDays.push(date);
        }

        const weekDayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return (
            <div className="grid grid-cols-7 gap-4">
                {weekDays.map((date, index) => {
                    // Format date as YYYY-MM-DD in local timezone
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${day}`;
                    
                    const dayAppointments = (appointmentsByDate.get(dateKey) || []).sort((a, b) => {
                        // Sort by time
                        const timeA = a.time.split(':').map(Number);
                        const timeB = b.time.split(':').map(Number);
                        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
                    });
                    const isToday = date.toDateString() === today.toDateString();

                    return (
                        <div
                            key={dateKey}
                            className={`border rounded-lg ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                        >
                            {/* Day header */}
                            <div className={`p-3 border-b text-center ${isToday ? 'bg-blue-100' : 'bg-gray-50'}`}>
                                <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                                    {weekDayNames[index]}
                                </div>
                                <div className={`text-xl font-bold mt-1 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                                    {date.getDate()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {date.toLocaleDateString('vi-VN', { month: 'short' })}
                                </div>
                            </div>

                            {/* Appointments list */}
                            <div className="p-2 space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto">
                                {dayAppointments.length === 0 ? (
                                    <div className="text-center text-gray-400 text-sm py-8">
                                        Không có lịch hẹn
                                    </div>
                                ) : (
                                    dayAppointments.map(app => {
                                        const client = (app as any).Client || localUsers.find(u => u.id === app.userId);
                                        const therapist = (app as any).Therapist || (app.therapistId ? localUsers.find(u => u.id === app.therapistId) : null);
                                        const clientName = client?.name || (app as any).userName || 'N/A';
                                        const clientPhone = client?.phone || '';
                                        const therapistName = therapist?.name || 'Chưa phân công';

                                        return (
                                            <div
                                                key={app.id}
                                                onClick={() => handleAppointmentSelect(app)}
                                                className={`relative p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border-l-4 ${STATUS_CONFIG[app.status].bgColor} ${STATUS_CONFIG[app.status].color} ${STATUS_CONFIG[app.status].borderColor}`}
                                            >
                                                {/* Status badge ở góc trên bên phải */}
                                                <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CONFIG[app.status].bgColor} ${STATUS_CONFIG[app.status].color}`}>
                                                    {STATUS_CONFIG[app.status].text}
                                                </span>
                                                <div className="mb-1 pr-16">
                                                    <span className="font-bold text-sm">{app.time}</span>
                                                </div>
                                                <div className="text-xs font-semibold text-gray-800 mb-1">
                                                    {clientName}
                                                </div>
                                                {clientPhone && (
                                                    <div className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                                                        <PhoneIcon className="w-3 h-3" />
                                                        {clientPhone}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-700 font-medium mb-1">
                                                    {app.serviceName}
                                                </div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    NV: {therapistName}
                                                </div>
                                                {app.notesForTherapist && (
                                                    <div className="text-xs text-gray-500 italic mt-1 pt-1 border-t border-gray-200 truncate" title={app.notesForTherapist}>
                                                        Ghi chú: {app.notesForTherapist}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render day view with timeline
    const renderDayView = () => {
        // Format current date as YYYY-MM-DD in local timezone
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const selectedDay = `${year}-${month}-${day}`;

        // Get appointments for this day with filters (exclude cancelled)
        const dayAppointments = appointments
            .filter(app => {
                // Exclude cancelled appointments from calendar view
                if (app.status === 'cancelled') return false;

                if (app.date !== selectedDay) return false;

                // Apply filters
                const user = localUsers.find(u => u.id === app.userId);
                const searchMatch = searchTerm === '' ||
                    app.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
                const staffMatch = filterStaff === 'all' || app.therapistId === filterStaff;
                const customerMatch = filterCustomer === 'all' || app.userId === filterCustomer;
                const serviceMatch = filterService === 'all' || app.serviceId === filterService;
                const statusMatch = filterStatus === 'all' || app.status === filterStatus;

                return searchMatch && staffMatch && serviceMatch && statusMatch;
            })
            .sort((a, b) => {
                // Sort by time
                const timeA = a.time.split(':').map(Number);
                const timeB = b.time.split(':').map(Number);
                return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
            });

        // Generate time slots (8:00 to 21:00)
        const timeSlots: number[] = [];
        for (let hour = 8; hour <= 21; hour++) {
            timeSlots.push(hour);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = currentDate.toDateString() === today.toDateString();

        return (
            <div className="space-y-4">
                {/* Day header */}
                <div className={`p-4 rounded-lg border ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                                {currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Tổng cộng: {dayAppointments.length} lịch hẹn
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_CONFIG.pending.bgColor} ${STATUS_CONFIG.pending.color}`}>
                                Chờ xác nhận: {dayAppointments.filter(a => a.status === 'pending').length}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_CONFIG.upcoming.bgColor} ${STATUS_CONFIG.upcoming.color}`}>
                                Đã xác nhận: {dayAppointments.filter(a => a.status === 'upcoming').length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline view */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-4">
                        {/* Time column */}
                        <div className="col-span-2">
                            <div className="space-y-4">
                                {timeSlots.map(hour => (
                                    <div key={hour} className="text-right text-sm text-gray-600 font-medium" style={{ height: '60px' }}>
                                        {String(hour).padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Appointments column */}
                        <div className="col-span-10">
                            <div className="relative" style={{ minHeight: `${timeSlots.length * 60}px` }}>
                                {/* Time grid lines */}
                                <div className="absolute inset-0">
                                    {timeSlots.map(hour => (
                                        <div
                                            key={hour}
                                            className="border-t border-gray-100"
                                            style={{ height: '60px' }}
                                        />
                                    ))}
                                </div>

                                {/* Appointments */}
                                <div className="relative">
                                    {dayAppointments.length === 0 ? (
                                        <div className="text-center text-gray-400 py-16">
                                            <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                            <p>Không có lịch hẹn nào trong ngày này</p>
                                        </div>
                                    ) : (
                                        dayAppointments.map(app => {
                                            const client = (app as any).Client || localUsers.find(u => u.id === app.userId);
                                            const therapist = (app as any).Therapist || (app.therapistId ? localUsers.find(u => u.id === app.therapistId) : null);
                                            const clientName = client?.name || (app as any).userName || 'N/A';
                                            const clientPhone = client?.phone || '';
                                            const therapistName = therapist?.name || 'Chưa phân công';

                                            const [hours, minutes] = app.time.split(':').map(Number);
                                            // Calculate position: each hour = 60px, minutes = minutes/60 * 60px
                                            const topPosition = (hours - 8) * 60 + (minutes / 60) * 60;

                                            return (
                                                <div
                                                    key={app.id}
                                                    onClick={() => handleAppointmentSelect(app)}
                                                    className={`relative absolute left-0 right-0 p-3 rounded-lg cursor-pointer transition-all hover:shadow-lg border-l-4 ${STATUS_CONFIG[app.status].bgColor} ${STATUS_CONFIG[app.status].color} ${STATUS_CONFIG[app.status].borderColor}`}
                                                    style={{
                                                        top: `${topPosition}px`,
                                                        minHeight: '100px',
                                                        width: '95%',
                                                    }}
                                                >
                                                    {/* Status badge ở góc trên bên phải */}
                                                    <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-semibold ${STATUS_CONFIG[app.status].bgColor} ${STATUS_CONFIG[app.status].color}`}>
                                                        {STATUS_CONFIG[app.status].text}
                                                    </span>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 pr-20">
                                                            <div className="mb-2">
                                                                <span className="font-bold text-base">{app.time}</span>
                                                            </div>
                                                            <div className="font-semibold text-gray-800 text-sm mb-1">
                                                                {clientName}
                                                            </div>
                                                            {clientPhone && (
                                                                <div className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                                                                    <PhoneIcon className="w-4 h-4" />
                                                                    {clientPhone}
                                                                </div>
                                                            )}
                                                            <div className="text-xs font-medium text-gray-700 mb-1">
                                                                {app.serviceName}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mb-1">
                                                                NV: {therapistName}
                                                            </div>
                                                            {app.notesForTherapist && (
                                                                <div className="text-xs text-gray-500 italic mt-2 pt-2 border-t border-gray-200">
                                                                    Ghi chú: {app.notesForTherapist}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List view (alternative compact view) */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Danh sách lịch hẹn trong ngày</h4>
                    <div className="space-y-3">
                        {dayAppointments.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                                Không có lịch hẹn nào trong ngày này
                            </div>
                        ) : (
                            dayAppointments.map(app => {
                                const client = (app as any).Client || localUsers.find(u => u.id === app.userId);
                                const therapist = (app as any).Therapist || (app.therapistId ? localUsers.find(u => u.id === app.therapistId) : null);
                                const clientName = client?.name || (app as any).userName || 'N/A';
                                const clientPhone = client?.phone || '';
                                const therapistName = therapist?.name || 'Chưa phân công';

                                return (
                                    <div
                                        key={app.id}
                                        onClick={() => handleAppointmentSelect(app)}
                                        className={`relative p-4 rounded-lg cursor-pointer transition-all hover:shadow-md border-l-4 ${STATUS_CONFIG[app.status].bgColor} ${STATUS_CONFIG[app.status].color} ${STATUS_CONFIG[app.status].borderColor}`}
                                    >
                                        {/* Status badge ở góc trên bên phải */}
                                        <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-semibold ${STATUS_CONFIG[app.status].bgColor} ${STATUS_CONFIG[app.status].color}`}>
                                            {STATUS_CONFIG[app.status].text}
                                        </span>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 pr-20">
                                                <div className="mb-2">
                                                    <span className="font-bold text-base">{app.time}</span>
                                                </div>
                                                <div className="font-semibold text-gray-800 text-sm mb-1">
                                                    {clientName}
                                                </div>
                                                {clientPhone && (
                                                    <div className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                                                        <PhoneIcon className="w-4 h-4" />
                                                        {clientPhone}
                                                    </div>
                                                )}
                                                <div className="text-xs font-medium text-gray-700 mb-1">
                                                    {app.serviceName}
                                                </div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    NV: {therapistName}
                                                </div>
                                                {app.notesForTherapist && (
                                                    <div className="text-xs text-gray-500 italic mt-2 pt-2 border-t border-gray-200">
                                                        Ghi chú: {app.notesForTherapist}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Render pending appointments list
    const renderPendingAppointments = () => {
        if (isLoading) {
            return <p className="text-center text-gray-500 py-8">Đang tải lịch hẹn...</p>;
        }

        if (pendingAppointments.length === 0) {
            return <p className="text-center text-gray-500 py-8">Không có lịch hẹn chưa xác nhận.</p>;
        }

        return (
            <div className="space-y-4">
                {pendingAppointments.map(app => {
                    // Try to get client from appointment's Client association first, then fallback to localUsers/allUsers
                    const client = app.Client || localUsers.find(u => u.id === app.userId) || allUsers.find(u => u.id === app.userId);
                    const clientName = client?.name || (app as any).userName || 'N/A';
                    const clientPhone = client?.phone || (app as any).customerPhone;

                    return (
                        <div
                            key={app.id}
                            className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[app.status].bgColor} ${STATUS_CONFIG[app.status].color}`}>
                                            {STATUS_CONFIG[app.status].text}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(app.date).toLocaleDateString('vi-VN')} - {app.time}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="font-semibold text-gray-800">
                                            {clientName}
                                        </p>
                                        {clientPhone && (
                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                <PhoneIcon className="w-4 h-4" />
                                                {clientPhone}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-600">
                                            <span className="text-gray-500">Dịch vụ:</span> {app.serviceName}
                                        </p>
                                        {app.notesForTherapist && (
                                            <p className="text-sm text-gray-500 italic mt-2">
                                                Ghi chú: {app.notesForTherapist}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => {
                                            setAppointmentToApprove(app);
                                            setSelectedTherapistId(app.therapistId || '');
                                        }}
                                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-semibold transition-colors"
                                    >
                                        Xác nhận
                                    </button>
                                    <button
                                        onClick={() => { setAppointmentToCancel(app); }}
                                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-semibold transition-colors"
                                    >
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => handleAppointmentSelect(app)}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-semibold transition-colors"
                                    >
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const calendarHeader = useMemo(() => {
        if (view === 'month') return currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
        if (view === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('vi-VN')} - ${endOfWeek.toLocaleDateString('vi-VN')}`;
        }
        return currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }, [view, currentDate]);

    const changeDate = (amount: number) => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(currentDate.getMonth() + amount);
        else if (view === 'week') newDate.setDate(currentDate.getDate() + (amount * 7));
        else newDate.setDate(currentDate.getDate() + amount);
        setCurrentDate(newDate);
    };

    // Get staff list for therapist assignment with conflict checking
    const staffList = useMemo(() => {
        // Use localUsers first, fallback to allUsers if localUsers is empty
        const usersToSearch = localUsers.length > 0 ? localUsers : allUsers;
        const staff = usersToSearch.filter(u => u.role === 'Staff' && u.status === 'Active');
        
        // If we have an appointment to approve, check for conflicts
        if (appointmentToApprove) {
            const appointmentDate = appointmentToApprove.date;
            const appointmentTime = appointmentToApprove.time;
            
            // Map staff with conflict information
            return staff.map(s => {
                // Check if this staff has a conflicting appointment (same date, same time, different appointment)
                const conflictingAppointment = appointments.find(apt => 
                    apt.therapistId === s.id &&
                    apt.date === appointmentDate &&
                    apt.time === appointmentTime &&
                    apt.id !== appointmentToApprove.id && // Exclude current appointment
                    (apt.status === 'pending' || apt.status === 'upcoming' || apt.status === 'scheduled' || apt.status === 'in-progress')
                );
                
                return {
                    ...s,
                    hasConflict: !!conflictingAppointment,
                    conflictingAppointment: conflictingAppointment || null
                };
            });
        }
        
        return staff;
    }, [localUsers, allUsers, appointmentToApprove, appointments]);

    return (
        <div>
            {/* Modals */}
            {/* Approve Appointment Modal with Therapist Selection */}
            {appointmentToApprove && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => {
                    setAppointmentToApprove(null);
                    setSelectedTherapistId('');
                }}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Xác nhận lịch hẹn và phân công nhân viên</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Khách hàng:</strong> {(() => {
                                            const client = appointmentToApprove.Client || localUsers.find(u => u.id === appointmentToApprove.userId) || allUsers.find(u => u.id === appointmentToApprove.userId);
                                            return client?.name || 'N/A';
                                        })()}
                                    </p>
                                    {(() => {
                                        const client = appointmentToApprove.Client || localUsers.find(u => u.id === appointmentToApprove.userId) || allUsers.find(u => u.id === appointmentToApprove.userId);
                                        return client?.phone ? (
                                            <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                                                <PhoneIcon className="w-4 h-4" />
                                                {client.phone}
                                            </p>
                                        ) : null;
                                    })()}
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Dịch vụ:</strong> {appointmentToApprove.serviceName}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-4">
                                        <strong>Thời gian:</strong> {new Date(appointmentToApprove.date).toLocaleDateString('vi-VN')} - {appointmentToApprove.time}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Chọn nhân viên phụ trách <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedTherapistId}
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const selectedStaff = staffList.find(s => s.id === selectedId);
                                            if (selectedStaff && (selectedStaff as any).hasConflict) {
                                                const conflict = (selectedStaff as any).conflictingAppointment;
                                                const conflictClient = conflict?.Client || localUsers.find(u => u.id === conflict?.userId) || allUsers.find(u => u.id === conflict?.userId);
                                                const conflictClientName = conflictClient?.name || 'khách hàng';
                                                const conflictDate = conflict?.date ? new Date(conflict.date).toLocaleDateString('vi-VN') : '';
                                                if (confirm(`⚠️ Cảnh báo: Nhân viên này đã được phân công cho lịch hẹn khác vào ${conflictDate} lúc ${conflict?.time} (khách hàng: ${conflictClientName}).\n\nBạn có chắc chắn muốn chọn nhân viên này? Hệ thống sẽ từ chối nếu trùng lịch.`)) {
                                                    setSelectedTherapistId(selectedId);
                                                }
                                            } else {
                                                setSelectedTherapistId(selectedId);
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="">-- Chọn nhân viên --</option>
                                        {staffList.length > 0 ? (
                                            staffList.map(staff => {
                                                const hasConflict = (staff as any).hasConflict;
                                                const conflict = (staff as any).conflictingAppointment;
                                                const conflictClient = conflict?.Client || localUsers.find(u => u.id === conflict?.userId) || allUsers.find(u => u.id === conflict?.userId);
                                                const conflictClientName = conflictClient?.name || 'khách hàng';
                                                const conflictDate = conflict?.date ? new Date(conflict.date).toLocaleDateString('vi-VN') : '';
                                                return (
                                                    <option 
                                                        key={staff.id} 
                                                        value={staff.id}
                                                        style={hasConflict ? { color: '#dc2626', fontWeight: 'bold' } : {}}
                                                    >
                                                        {staff.name} {staff.phone ? `(${staff.phone})` : ''} 
                                                        {hasConflict ? ` ⚠️ Đã bận (${conflictDate} ${conflict?.time} - ${conflictClientName})` : ''}
                                                    </option>
                                                );
                                            })
                                        ) : (
                                            <option value="" disabled>Đang tải danh sách nhân viên...</option>
                                        )}
                                    </select>
                                    {staffList.some(s => (s as any).hasConflict) && (
                                        <p className="text-sm text-red-600 mt-1">
                                            ⚠️ Nhân viên có dấu ⚠️ đã được phân công cho lịch hẹn khác vào cùng thời gian. Vui lòng chọn nhân viên khác.
                                        </p>
                                    )}
                                    {staffList.length === 0 && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {localUsers.length === 0 && allUsers.length === 0
                                                ? 'Đang tải danh sách nhân viên...'
                                                : 'Không có nhân viên nào khả dụng'}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            setAppointmentToApprove(null);
                                            setSelectedTherapistId('');
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!selectedTherapistId) {
                                                alert('Vui lòng chọn nhân viên phụ trách');
                                                return;
                                            }
                                            handleAction(appointmentToApprove, 'upcoming', undefined, selectedTherapistId);
                                        }}
                                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold"
                                    >
                                        Xác nhận và phân công
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedAppointment(null); setSelectedAppointmentDetail(null); }}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Chi tiết lịch hẹn</h3>
                            {isLoadingModalData ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                    <p className="mt-2 text-gray-600">Đang tải...</p>
                                </div>
                            ) : (() => {
                                // Use selectedAppointmentDetail if available, otherwise fallback to selectedAppointment
                                const appointmentToDisplay = selectedAppointmentDetail || selectedAppointment;
                                
                                // Combine allUsers and localUsers for lookup - prioritize localUsers
                                const allUsersList = [...localUsers, ...allUsers.filter(u => !localUsers.find(lu => lu.id === u.id))];

                                // Debug log
                                console.log('Appointment detail modal - Debug info:', {
                                    appointmentId: appointmentToDisplay.id,
                                    userId: appointmentToDisplay.userId,
                                    therapistId: appointmentToDisplay.therapistId,
                                    paymentStatus: appointmentToDisplay.paymentStatus,
                                    allUsersListLength: allUsersList.length,
                                    localUsersLength: localUsers.length,
                                    allUsersLength: allUsers.length,
                                    appointmentData: appointmentToDisplay,
                                    usingDetail: !!selectedAppointmentDetail
                                });

                                // Get client information - try multiple sources
                                let client = (appointmentToDisplay as any).Client;
                                if (!client && appointmentToDisplay.userId) {
                                    client = allUsersList.find(u => u.id === appointmentToDisplay.userId);
                                }

                                const clientName = client?.name ||
                                    (appointmentToDisplay as any).userName ||
                                    (appointmentToDisplay as any).customerName ||
                                    'N/A';
                                const clientPhone = client?.phone ||
                                    (appointmentToDisplay as any).phone ||
                                    (appointmentToDisplay as any).customerPhone ||
                                    '';

                                // Get therapist information - try multiple sources
                                let therapist = (appointmentToDisplay as any).Therapist;
                                if (!therapist && appointmentToDisplay.therapistId) {
                                    therapist = allUsersList.find(u => u.id === appointmentToDisplay.therapistId);
                                }

                                const therapistName = therapist?.name ||
                                    (appointmentToDisplay as any).therapist ||
                                    (appointmentToDisplay as any).therapistName ||
                                    'Chưa phân công';

                                console.log('Resolved info:', {
                                    clientName,
                                    clientPhone,
                                    therapistName,
                                    clientFound: !!client,
                                    therapistFound: !!therapist,
                                    paymentStatus: appointmentToDisplay.paymentStatus
                                });

                                return (
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Dịch vụ:</strong> {appointmentToDisplay.serviceName}</p>
                                        <p><strong>Khách hàng:</strong> {clientName}</p>
                                        <p><strong>Số điện thoại:</strong> {clientPhone || 'N/A'}</p>
                                        <p><strong>Thời gian:</strong> {appointmentToDisplay.time}, {new Date(appointmentToDisplay.date).toLocaleDateString('vi-VN')}</p>
                                        <p><strong>Kỹ thuật viên:</strong> {therapistName}</p>
                                        <p><strong>Trạng thái:</strong> <span className={`font-semibold ${STATUS_CONFIG[appointmentToDisplay.status].color}`}>{STATUS_CONFIG[appointmentToDisplay.status].text}</span></p>
                                        <p><strong>Thanh toán:</strong> <span className={`font-semibold ${appointmentToDisplay.paymentStatus === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {appointmentToDisplay.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </span></p>
                                        {appointmentToDisplay.notesForTherapist && (
                                            <p><strong>Ghi chú:</strong> {appointmentToDisplay.notesForTherapist}</p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                            {selectedAppointment.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setAppointmentToApprove(selectedAppointment);
                                            setSelectedTherapistId(selectedAppointment.therapistId || '');
                                            setSelectedAppointment(null);
                                            setSelectedAppointmentDetail(null);
                                        }}
                                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-semibold"
                                    >
                                        Xác nhận
                                    </button>
                                    <button onClick={() => { setAppointmentToCancel(selectedAppointment); setSelectedAppointment(null); setSelectedAppointmentDetail(null); }} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-semibold">Từ chối</button>
                                </>
                            )}
                            {(selectedAppointment.status === 'upcoming' || selectedAppointment.status === 'in-progress') && (
                                <button onClick={() => { setAppointmentToCancel(selectedAppointment); setSelectedAppointment(null); setSelectedAppointmentDetail(null); }} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-semibold">Hủy lịch</button>
                            )}
                            <button onClick={() => { setSelectedAppointment(null); setSelectedAppointmentDetail(null); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-semibold">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {appointmentToCancel && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAppointmentToCancel(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Lý do Từ chối / Hủy lịch</h3>
                            <p className="text-sm text-gray-600 mb-4">Vui lòng nhập lý do từ chối lịch hẹn này. Khách hàng sẽ thấy thông báo này.</p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                className="w-full p-2 border rounded-md focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="VD: Khung giờ đã có khách đặt, kỹ thuật viên không có lịch làm việc..."
                            />
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                            <button onClick={() => setAppointmentToCancel(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-semibold">Hủy bỏ</button>
                            <button onClick={handleConfirmCancellation} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-semibold">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Appointment Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Thêm lịch hẹn mới</h3>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Left Column - Customer Information */}
                                <div className="space-y-4">
                                    {/* Customer Selection */}
                                    <div className="relative customer-dropdown-container">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Họ và tên <span className="text-red-500">*</span>
                                        </label>
                                        <div
                                            className="relative w-full min-h-[42px] border border-gray-300 rounded-md bg-white"
                                            onClick={(e) => {
                                                if (!newAppointmentForm.selectedCustomerId) {
                                                    setShowAddModalCustomerDropdown(!showAddModalCustomerDropdown);
                                                }
                                            }}
                                        >
                                            {newAppointmentForm.selectedCustomerId ? (
                                                <div className="flex items-center gap-2 p-2 flex-wrap">
                                                    {/* Name Chip */}
                                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                                                        <ProfileIcon className="w-4 h-4" />
                                                        <span>{newAppointmentForm.customerName}</span>
                                                    </div>
                                                    {/* Phone Chip */}
                                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                                                        <PhoneIcon className="w-4 h-4" />
                                                        <span>{newAppointmentForm.customerPhone}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setNewAppointmentForm(prev => ({
                                                                ...prev,
                                                                selectedCustomerId: null,
                                                                customerName: '',
                                                                customerPhone: '',
                                                                customerEmail: '',
                                                                customerSearch: '',
                                                            }));
                                                            setShowAddModalCustomerDropdown(false);
                                                        }}
                                                        className="ml-auto text-gray-400 hover:text-gray-600"
                                                    >
                                                        <CloseIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={newAppointmentForm.customerSearch}
                                                        onChange={(e) => {
                                                            setNewAppointmentForm(prev => ({ ...prev, customerSearch: e.target.value }));
                                                            setShowAddModalCustomerDropdown(true);
                                                        }}
                                                        onFocus={() => setShowAddModalCustomerDropdown(true)}
                                                        className="w-full p-2 pr-8 border-0 rounded-md focus:ring-0 focus:outline-none bg-transparent"
                                                        placeholder="Chọn khách hàng..."
                                                    />
                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {showAddModalCustomerDropdown && !newAppointmentForm.selectedCustomerId && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {filteredCustomersForModalDropdown.length > 0 ? (
                                                    filteredCustomersForModalDropdown.map(customer => (
                                                        <div
                                                            key={customer.id}
                                                            onClick={() => {
                                                                setNewAppointmentForm(prev => ({
                                                                    ...prev,
                                                                    selectedCustomerId: customer.id,
                                                                    customerName: customer.name || '',
                                                                    customerPhone: customer.phone || '',
                                                                    customerEmail: customer.email || '',
                                                                    customerSearch: customer.name || '',
                                                                }));
                                                                setShowAddModalCustomerDropdown(false);
                                                            }}
                                                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                                                                    <ProfileIcon className="w-3 h-3" />
                                                                    <span className="font-medium">{customer.name}</span>
                                                                </div>
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                                                                    <PhoneIcon className="w-3 h-3" />
                                                                    <span>{customer.phone}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-sm text-gray-500 text-center">
                                                        {newAppointmentForm.customerSearch ? 'Không tìm thấy khách hàng' : 'Nhập tên hoặc số điện thoại để tìm kiếm'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Add Customer */}
                                    <div className="border-t pt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Thêm nhanh khách hàng
                                        </label>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={newAppointmentForm.customerName}
                                                onChange={(e) => setNewAppointmentForm(prev => ({ ...prev, customerName: e.target.value }))}
                                                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                placeholder="Nhập tên khách hàng"
                                            />
                                            <input
                                                type="tel"
                                                value={newAppointmentForm.customerPhone}
                                                onChange={(e) => setNewAppointmentForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                                                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                placeholder="Nhập Số điện thoại"
                                            />
                                            <input
                                                type="email"
                                                value={newAppointmentForm.customerEmail}
                                                onChange={(e) => setNewAppointmentForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                                                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                placeholder="Nhập Email"
                                            />
                                            <button
                                                onClick={handleQuickAddCustomer}
                                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Thêm nhanh khách hàng
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Appointment Details */}
                                <div className="space-y-4">
                                    {/* Date & Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ngày hẹn <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Date Input */}
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={newAppointmentForm.date}
                                                    onChange={(e) => {
                                                        let value = e.target.value;
                                                        value = value.replace(/[^\d-]/g, '');
                                                        if (value.length <= 10) {
                                                            const digits = value.replace(/-/g, '');
                                                            let formatted = '';
                                                            for (let i = 0; i < digits.length; i++) {
                                                                if (i === 2 || i === 4) {
                                                                    formatted += '-';
                                                                }
                                                                formatted += digits[i];
                                                            }
                                                            setNewAppointmentForm(prev => ({ ...prev, date: formatted }));
                                                        }
                                                    }}
                                                    onFocus={(e) => {
                                                        const hiddenInput = e.currentTarget.nextElementSibling as HTMLInputElement;
                                                        if (hiddenInput) {
                                                            setTimeout(() => {
                                                                try {
                                                                    if (hiddenInput.showPicker) {
                                                                        const result = hiddenInput.showPicker() as unknown;
                                                                        if (result && typeof result === 'object' && 'catch' in result) {
                                                                            (result as Promise<void>).catch(() => {
                                                                                hiddenInput.click();
                                                                            });
                                                                        }
                                                                    } else {
                                                                        hiddenInput.click();
                                                                    }
                                                                } catch {
                                                                    hiddenInput.click();
                                                                }
                                                            }, 10);
                                                        }
                                                    }}
                                                    placeholder="DD-MM-YYYY"
                                                    className="w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 cursor-text"
                                                />
                                                <input
                                                    type="date"
                                                    value={parseDDMMYYYYToYYYYMMDD(newAppointmentForm.date) || ''}
                                                    onChange={(e) => {
                                                        const yyyymmdd = e.target.value;
                                                        if (yyyymmdd) {
                                                            const [year, month, day] = yyyymmdd.split('-');
                                                            setNewAppointmentForm(prev => ({ ...prev, date: `${day}-${month}-${year}` }));
                                                        }
                                                    }}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    style={{ pointerEvents: 'none' }}
                                                />
                                                <div
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const hiddenInput = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                        if (hiddenInput) {
                                                            setTimeout(() => {
                                                                try {
                                                                    if (hiddenInput.showPicker) {
                                                                        const result = hiddenInput.showPicker() as unknown;
                                                                        if (result && typeof result === 'object' && 'catch' in result) {
                                                                            (result as Promise<void>).catch(() => {
                                                                                hiddenInput.click();
                                                                            });
                                                                        }
                                                                    } else {
                                                                        hiddenInput.click();
                                                                    }
                                                                } catch {
                                                                    hiddenInput.click();
                                                                }
                                                            }, 10);
                                                        }
                                                    }}
                                                >
                                                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>
                                            {/* Time Input */}
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={newAppointmentForm.time}
                                                    onChange={(e) => setNewAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>


                                    {/* Service */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dịch vụ <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <select
                                                        value={newAppointmentForm.serviceId}
                                                        onChange={(e) => setNewAppointmentForm(prev => ({ ...prev, serviceId: e.target.value }))}
                                                        className="w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
                                                    >
                                                        <option value="">Chọn dịch vụ</option>
                                                        {isLoadingModalData ? (
                                                            <option value="" disabled>Đang tải dịch vụ...</option>
                                                        ) : localServices.length > 0 ? (
                                                            localServices.map(service => (
                                                                <option key={service.id} value={service.id}>{service.name}</option>
                                                            ))
                                                        ) : (
                                                            <option value="" disabled>Không có dịch vụ</option>
                                                        )}
                                                    </select>
                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            {newAppointmentForm.serviceId && (
                                                <div className="flex items-center gap-3">
                                                    <label className="text-sm font-medium text-gray-700">Số lượng:</label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (newAppointmentForm.serviceQuantity > 1) {
                                                                    setNewAppointmentForm(prev => ({ ...prev, serviceQuantity: prev.serviceQuantity - 1 }));
                                                                }
                                                            }}
                                                            disabled={newAppointmentForm.serviceQuantity <= 1}
                                                            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-3 py-1 border border-gray-300 rounded-md min-w-[50px] text-center">
                                                            {newAppointmentForm.serviceQuantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setNewAppointmentForm(prev => ({ ...prev, serviceQuantity: prev.serviceQuantity + 1 }));
                                                            }}
                                                            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={handleAddService}
                                                disabled={!newAppointmentForm.serviceId}
                                                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                                Thêm dịch vụ
                                            </button>
                                        </div>
                                    </div>

                                    {/* Staff/Therapist */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Chọn nhân viên <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={newAppointmentForm.therapistId}
                                                onChange={(e) => setNewAppointmentForm(prev => ({ ...prev, therapistId: e.target.value }))}
                                                className="w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
                                            >
                                                <option value="">Chọn nhân viên</option>
                                                {isLoadingModalData ? (
                                                    <option value="" disabled>Đang tải nhân viên...</option>
                                                ) : availableStaff.length > 0 ? (
                                                    availableStaff.map(staff => (
                                                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                                                    ))
                                                ) : (
                                                    localUsers.filter(u => u.role === 'Staff' && u.status === 'Active').length > 0 ? (
                                                        localUsers.filter(u => u.role === 'Staff' && u.status === 'Active').map(staff => (
                                                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                                                        ))
                                                    ) : (
                                                        <option value="" disabled>Không có nhân viên</option>
                                                    )
                                                )}
                                            </select>
                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ghi chú
                                        </label>
                                        <textarea
                                            value={newAppointmentForm.notes}
                                            onChange={(e) => setNewAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                                            rows={3}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Ghi chú"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Services Table */}
                            {selectedServices.length > 0 && (
                                <div className="mt-6 border-t pt-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Danh sách dịch vụ</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 border-b">
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">STT</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Dịch vụ</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Giá</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Số lượng</th>
                                                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedServices.map((item, index) => (
                                                    <tr key={`service-${item.id}`} className="border-b hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-sm">{index + 1}</td>
                                                        <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                                                        <td className="px-4 py-2 text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</td>
                                                        <td className="px-4 py-2 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        if (item.quantity > 1) {
                                                                            setSelectedServices(prev => prev.map(s =>
                                                                                s.id === item.id ? { ...s, quantity: s.quantity - 1 } : s
                                                                            ));
                                                                        }
                                                                    }}
                                                                    className="px-2 py-1 border rounded hover:bg-gray-100"
                                                                    disabled={item.quantity <= 1}
                                                                >
                                                                    -
                                                                </button>
                                                                <span>{item.quantity}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedServices(prev => prev.map(s =>
                                                                            s.id === item.id ? { ...s, quantity: s.quantity + 1 } : s
                                                                        ));
                                                                    }}
                                                                    className="px-2 py-1 border rounded hover:bg-gray-100"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedServices(prev => prev.filter(s => s.id !== item.id));
                                                                }}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setShowAddModalCustomerDropdown(false);
                                    setShowQuickAddCustomer(false);
                                    setSelectedServices([]);
                                    setNewAppointmentForm({
                                        customerSearch: '',
                                        selectedCustomerId: null,
                                        customerName: '',
                                        customerPhone: '',
                                        customerEmail: '',
                                        date: formatDateDDMMYYYY(new Date()),
                                        time: '09:00',
                                        serviceId: '',
                                        serviceQuantity: 1,
                                        therapistId: '',
                                        notes: '',
                                    });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-semibold"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleAddAppointment}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-semibold"
                            >
                                Lưu lịch hẹn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý Lịch hẹn</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    Thêm lịch hẹn
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Chờ xác nhận" value={stats.pending} icon={<ClockIcon className="w-6 h-6" />} color="bg-yellow-100 text-yellow-600" isLoading={isLoading} />
                <StatCard title="Đã xác nhận" value={stats.upcoming} icon={<CalendarIcon className="w-6 h-6" />} color="bg-green-100 text-green-600" isLoading={isLoading} />
                <StatCard title="Hoàn thành" value={stats.completed} icon={<CheckCircleIcon className="w-6 h-6" />} color="bg-blue-100 text-blue-600" isLoading={isLoading} />
                <StatCard title="Đã hủy" value={stats.cancelled} icon={<XCircleIcon className="w-6 h-6" />} color="bg-red-100 text-red-600" isLoading={isLoading} />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'calendar'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Lịch hẹn
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${activeTab === 'pending'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Lịch hẹn chưa xác nhận
                            {stats.pending > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {stats.pending}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'calendar' ? (
                        <>
                            {/* Filters */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    />
                                    
                                    {/* Staff Filter Dropdown */}
                                    <div className="relative staff-dropdown-container">
                                        <div
                                            className="relative w-full min-h-[42px] border border-gray-300 rounded-md bg-white cursor-pointer"
                                            onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                                        >
                                            {filterStaff !== 'all' ? (
                                                <div className="flex items-center gap-2 p-2 flex-wrap">
                                                    {(() => {
                                                        const selectedStaff = staffMembers.find(s => s.id === filterStaff);
                                                        if (!selectedStaff) return null;
                                                        return (
                                                            <>
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                                                                    <ProfileIcon className="w-4 h-4" />
                                                                    <span>{selectedStaff.name}</span>
                                                                </div>
                                                                {selectedStaff.phone && (
                                                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                                                                        <PhoneIcon className="w-4 h-4" />
                                                                        <span>{selectedStaff.phone}</span>
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFilterStaff('all');
                                                                        setShowStaffDropdown(false);
                                                                    }}
                                                                    className="ml-auto text-gray-400 hover:text-gray-600"
                                                                >
                                                                    <CloseIcon className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={staffSearch}
                                                        onChange={(e) => {
                                                            setStaffSearch(e.target.value);
                                                            setShowStaffDropdown(true);
                                                        }}
                                                        onFocus={() => setShowStaffDropdown(true)}
                                                        className="w-full p-2 pr-8 border-0 rounded-md focus:ring-0 focus:outline-none bg-transparent"
                                                        placeholder="Chọn nhân viên..."
                                                    />
                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {showStaffDropdown && filterStaff === 'all' && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                <div
                                                    onClick={() => {
                                                        setFilterStaff('all');
                                                        setStaffSearch('');
                                                        setShowStaffDropdown(false);
                                                    }}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b font-medium text-gray-700 bg-gray-50"
                                                >
                                                    Tất cả nhân viên
                                                </div>
                                                {filteredStaffForDropdown.length > 0 ? (
                                                    filteredStaffForDropdown.map(staff => (
                                                        <div
                                                            key={staff.id}
                                                            onClick={() => {
                                                                setFilterStaff(staff.id);
                                                                setStaffSearch(staff.name || '');
                                                                setShowStaffDropdown(false);
                                                            }}
                                                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                                                                    <ProfileIcon className="w-3 h-3" />
                                                                    <span className="font-medium">{staff.name}</span>
                                                                </div>
                                                                {staff.phone && (
                                                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                                                                        <PhoneIcon className="w-3 h-3" />
                                                                        <span>{staff.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-sm text-gray-500 text-center">
                                                        {staffSearch ? 'Không tìm thấy nhân viên' : 'Nhập tên hoặc số điện thoại để tìm kiếm'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Customer Filter Dropdown */}
                                    <div className="relative customer-dropdown-container">
                                        <div
                                            className="relative w-full min-h-[42px] border border-gray-300 rounded-md bg-white cursor-pointer"
                                            onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                                        >
                                            {filterCustomer !== 'all' ? (
                                                <div className="flex items-center gap-2 p-2 flex-wrap">
                                                    {(() => {
                                                        const selectedCustomer = allCustomers.find(c => c.id === filterCustomer);
                                                        if (!selectedCustomer) return null;
                                                        return (
                                                            <>
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                                                                    <ProfileIcon className="w-4 h-4" />
                                                                    <span>{selectedCustomer.name}</span>
                                                                </div>
                                                                {selectedCustomer.phone && (
                                                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                                                                        <PhoneIcon className="w-4 h-4" />
                                                                        <span>{selectedCustomer.phone}</span>
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCustomerSelect('all');
                                                                    }}
                                                                    className="ml-auto text-gray-400 hover:text-gray-600"
                                                                >
                                                                    <CloseIcon className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={customerSearch}
                                                        onChange={(e) => {
                                                            setCustomerSearch(e.target.value);
                                                            setShowCustomerDropdown(true);
                                                        }}
                                                        onFocus={() => setShowCustomerDropdown(true)}
                                                        className="w-full p-2 pr-8 border-0 rounded-md focus:ring-0 focus:outline-none bg-transparent"
                                                        placeholder="Chọn khách hàng..."
                                                    />
                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {showCustomerDropdown && filterCustomer === 'all' && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                <div
                                                    onClick={() => {
                                                        handleCustomerSelect('all');
                                                    }}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b font-medium text-gray-700 bg-gray-50"
                                                >
                                                    Tất cả khách hàng
                                                </div>
                                                {filteredCustomersForDropdown.length > 0 ? (
                                                    filteredCustomersForDropdown.map(customer => (
                                                        <div
                                                            key={customer.id}
                                                            onClick={() => {
                                                                handleCustomerSelect(customer.id);
                                                            }}
                                                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                                                                    <ProfileIcon className="w-3 h-3" />
                                                                    <span className="font-medium">{customer.name}</span>
                                                                </div>
                                                                {customer.phone && (
                                                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                                                                        <PhoneIcon className="w-3 h-3" />
                                                                        <span>{customer.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-sm text-gray-500 text-center">
                                                        {customerSearch ? 'Không tìm thấy khách hàng' : 'Nhập tên hoặc số điện thoại để tìm kiếm'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <select
                                        value={filterService}
                                        onChange={e => setFilterService(e.target.value)}
                                        className="w-full p-2 border rounded-md bg-white"
                                    >
                                        <option value="all">Tất cả dịch vụ</option>
                                        {allServices.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterStatus}
                                        onChange={e => setFilterStatus(e.target.value as any)}
                                        className="w-full p-2 border rounded-md bg-white"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        {Object.entries(STATUS_CONFIG).map(([key, { text }]) => (
                                            <option key={key} value={key}>{text}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Calendar Navigation */}
                            <div className="bg-white rounded-lg shadow-sm mb-6">
                                <div className="p-4 flex justify-between items-center border-b">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => changeDate(-1)}
                                            disabled={isLoading}
                                            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeftIcon className="w-6 h-6 text-gray-500" />
                                        </button>
                                        <h2 className="text-lg font-bold text-gray-800 w-64 text-center capitalize">
                                            {calendarHeader}
                                        </h2>
                                        <button
                                            onClick={() => changeDate(1)}
                                            disabled={isLoading}
                                            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRightIcon className="w-6 h-6 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setView('month')}
                                            className={`px-3 py-1 text-sm rounded-md ${view === 'month' ? 'bg-white shadow' : ''}`}
                                            disabled={isLoading}
                                        >
                                            Tháng
                                        </button>
                                        <button
                                            onClick={() => setView('week')}
                                            className={`px-3 py-1 text-sm rounded-md ${view === 'week' ? 'bg-white shadow' : ''}`}
                                            disabled={isLoading}
                                        >
                                            Tuần
                                        </button>
                                        <button
                                            onClick={() => setView('day')}
                                            className={`px-3 py-1 text-sm rounded-md ${view === 'day' ? 'bg-white shadow' : ''}`}
                                            disabled={isLoading}
                                        >
                                            Ngày
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    {view === 'month' && renderMonthCalendar()}
                                    {view === 'week' && renderWeekView()}
                                    {view === 'day' && renderDayView()}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Lịch hẹn chưa xác nhận</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Các lịch hẹn này đang chờ bạn xác nhận. Sau khi xác nhận, chúng sẽ xuất hiện trong tab "Lịch hẹn".
                            </p>
                            {renderPendingAppointments()}
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {appointmentToCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Hủy lịch hẹn</h2>
                        <p className="text-gray-600 mb-4">
                            Bạn có chắc muốn hủy lịch hẹn của <strong>{(appointmentToCancel as any).userName || 'khách hàng'}</strong>?
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lý do hủy <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="Nhập lý do hủy lịch..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setAppointmentToCancel(null);
                                    setRejectionReason('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAppointmentsPage;
