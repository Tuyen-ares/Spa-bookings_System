import React, { useState, useMemo, useEffect } from 'react';
import type { User, Appointment, Service, Product, Sale } from '../../types';
import { ClockIcon, CheckCircleIcon, XCircleIcon, PlayIcon, PauseIcon, ClipboardDocumentCheckIcon } from '../../shared/icons';
import ClientProfileModal from '../components/ClientProfileModal';
import * as apiService from '../../client/services/apiService';


interface AppointmentsPageProps {
    currentUser: User;
    allAppointments: Appointment[];
    allServices: Service[];
    allUsers: User[];
    allProducts: Product[];
    allSales: Sale[];
}

export const StaffAppointmentsPage: React.FC<AppointmentsPageProps> = ({ currentUser, allAppointments, allServices, allUsers, allProducts, allSales }) => {
    const [appointments, setAppointments] = useState<Appointment[]>(allAppointments);
    const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [viewingClient, setViewingClient] = useState<User | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterService, setFilterService] = useState('all');
    const [filterClient, setFilterClient] = useState('all');

    useEffect(() => {
        setAppointments(allAppointments);
    }, [allAppointments]);

    const today = new Date().toISOString().split('T')[0];

    const myAppointments = useMemo(() => {
        return appointments.filter(app => app.therapistId === currentUser.id);
    }, [appointments, currentUser.id]);

    const filteredAppointments = useMemo(() => {
        return myAppointments.filter(app => {
            const client = allUsers.find(u => u.id === app.userId);
            
            const matchesSearch = searchTerm === '' ||
                                  app.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (client && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (client && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesService = filterService === 'all' || app.serviceId === filterService;
            const matchesClient = filterClient === 'all' || app.userId === filterClient;

            return matchesSearch && matchesService && matchesClient;
        });
    }, [myAppointments, searchTerm, filterService, filterClient, allUsers]);

    const todayAppointments = useMemo(() => {
        return filteredAppointments.filter(app => app.date === today && (app.status === 'upcoming' || app.status === 'in-progress' || app.status === 'pending'))
                                   .sort((a,b) => a.time.localeCompare(b.time));
    }, [filteredAppointments, today]);

    const upcomingAppointments = useMemo(() => {
        return filteredAppointments.filter(app => app.date > today && (app.status === 'upcoming' || app.status === 'pending'))
                                   .sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
    }, [filteredAppointments, today]);

    const pastAppointments = useMemo(() => {
        return filteredAppointments.filter(app => app.date < today || app.status === 'completed' || app.status === 'cancelled')
                                   .sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
    }, [filteredAppointments, today]);

    const availableServices = useMemo(() => {
        const serviceIds = new Set(myAppointments.map(app => app.serviceId));
        return allServices.filter(service => serviceIds.has(service.id));
    }, [myAppointments, allServices]);

    const availableClients = useMemo(() => {
        const clientIds = new Set(myAppointments.map(app => app.userId));
        return allUsers.filter(user => clientIds.has(user.id));
    }, [myAppointments, allUsers]);

    const getStatusBadge = (status: Appointment['status']) => {
        switch (status) {
            case 'pending': return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ xác nhận</span>;
            case 'upcoming': return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">Đã xác nhận</span>;
            case 'in-progress': return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">Đang tiến hành</span>;
            case 'completed': return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">Hoàn thành</span>;
            case 'cancelled': return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">Đã hủy</span>;
            default: return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">Không rõ</span>;
        }
    };

    const handleAction = async (app: Appointment, newStatus: Appointment['status']) => {
        const originalAppointments = appointments;
        // Optimistic UI update
        setAppointments(prev =>
            prev.map(item => (item.id === app.id ? { ...item, status: newStatus } : item))
        );
        
        // Close modals immediately
        setSelectedAppointment(null);
        setAppointmentToComplete(null);
        setAppointmentToCancel(null);

        try {
            const updatedAppointment = await apiService.updateAppointment(app.id, { status: newStatus });
    
            // If completed, award points
            if (newStatus === 'completed') {
                const service = allServices.find(s => s.id === app.serviceId);
                const client = allUsers.find(u => u.id === app.userId);
    
                if (service && client) {
                    const price = service.discountPrice || service.price;
                    const pointsEarned = Math.floor(price / 1000);
                    
                    if (pointsEarned > 0) {
                        const clientWallet = await apiService.getUserWallet(client.id);
                        await apiService.updateUserWallet(client.id, { points: clientWallet.points + pointsEarned });
                        
                        await apiService.createPointsHistoryEntry(client.id, {
                            description: `Điểm thưởng từ dịch vụ: ${service.name}`,
                            pointsChange: pointsEarned,
                            type: 'earned',
                            source: 'service_completion',
                        });
                        
                        setToastMessage(`Đã hoàn thành dịch vụ cho ${client.name}. Khách hàng nhận được ${pointsEarned} điểm.`);
                    } else {
                        setToastMessage(`Đã hoàn thành dịch vụ "${app.serviceName}" cho ${client.name}.`);
                    }
                } else {
                     setToastMessage(`Đã hoàn thành dịch vụ "${app.serviceName}".`);
                }
            } else {
                setToastMessage(`Đã cập nhật trạng thái lịch hẹn "${app.serviceName}".`);
            }
            
            // Sync local state with server response in case of any discrepancies
            setAppointments(prev => prev.map(item => (item.id === updatedAppointment.id ? updatedAppointment : item)));
    
        } catch (error) {
            console.error("Failed to update appointment:", error);
            setToastMessage(`Lỗi: Không thể cập nhật lịch hẹn.`);
            // Revert UI on error
            setAppointments(originalAppointments); 
        } finally {
            setTimeout(() => setToastMessage(null), 4000);
        }
    };

    const appointmentsToRender = useMemo(() => {
        if (activeTab === 'today') {
            return todayAppointments;
        }
        if (activeTab === 'upcoming') {
            return upcomingAppointments;
        }
        if (activeTab === 'past') {
            return pastAppointments;
        }
        return [];
    }, [activeTab, todayAppointments, upcomingAppointments, pastAppointments]);

    return (
        <div>
            {toastMessage && (
                <div className="fixed top-24 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeInUp">
                    {toastMessage}
                </div>
            )}

            <h1 className="text-3xl font-bold text-gray-800 mb-6">Lịch hẹn của bạn</h1>
            <p className="text-gray-600 mb-8">Quản lý các lịch hẹn đã được phân công và cập nhật trạng thái.</p>

            <div className="mb-8 flex justify-start border-b border-gray-200">
                <button onClick={() => setActiveTab('today')} className={`px-6 py-3 font-medium text-lg transition-colors ${activeTab === 'today' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Hôm nay</button>
                <button onClick={() => setActiveTab('upcoming')} className={`px-6 py-3 font-medium text-lg transition-colors ${activeTab === 'upcoming' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Sắp tới</button>
                <button onClick={() => setActiveTab('past')} className={`px-6 py-3 font-medium text-lg transition-colors ${activeTab === 'past' ? 'border-b-2 border-brand-primary text-brand-dark' : 'text-gray-500 hover:text-brand-dark'}`}>Lịch sử</button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Tìm kiếm dịch vụ hoặc khách hàng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-md" />
                    <select value={filterService} onChange={e => setFilterService(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                        <option value="all">Tất cả dịch vụ</option>
                        {availableServices.map(service => (<option key={service.id} value={service.id}>{service.name}</option>))}
                    </select>
                    <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                        <option value="all">Tất cả khách hàng</option>
                        {availableClients.map(client => (<option key={client.id} value={client.id}>{client.name}</option>))}
                    </select>
                </div>
            </div>

            <div className="space-y-6">
                {appointmentsToRender.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg shadow-md">
                        <p className="text-lg text-gray-500">
                            {activeTab === 'today' && 'Không có lịch hẹn nào cho hôm nay.'}
                            {activeTab === 'upcoming' && 'Không có lịch hẹn sắp tới.'}
                            {activeTab === 'past' && 'Không có lịch sử hẹn nào.'}
                        </p>
                    </div>
                ) : (
                    appointmentsToRender.map(app => {
                        const client = allUsers.find(u => u.id === app.userId);
                        
                        return (
                            <div key={app.id} className="bg-white p-5 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-500">{new Date(app.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {app.time}</p>
                                    <h3 className="text-xl font-bold text-gray-800 mt-1">{app.serviceName}</h3>
                                    {client && <p className="text-gray-600 text-sm">Khách hàng: <button onClick={() => setViewingClient(client)} className="font-semibold text-brand-primary hover:underline">{client.name}</button> - {client.phone}</p>}
                                    {app.notesForTherapist && <p className="text-xs text-gray-500 mt-1 italic">Ghi chú cho KTV: "{app.notesForTherapist}"</p>}
                                </div>
                                <div className="flex flex-col items-end gap-3 self-end sm:self-center flex-shrink-0 sm:ml-4">
                                    {getStatusBadge(app.status)}
                                    <div className="flex gap-2">
                                        <button onClick={() => setSelectedAppointment(app)} className="bg-brand-secondary text-brand-dark hover:bg-brand-primary hover:text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors">Xem Chi Tiết</button>
                                        {app.date === today && app.status === 'upcoming' && (
                                            <button onClick={() => handleAction(app, 'in-progress')} className="bg-green-600 text-white hover:bg-green-700 font-semibold px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2">
                                                <PlayIcon className="w-5 h-5" /> Bắt đầu
                                            </button>
                                        )}
                                        {app.status === 'in-progress' && (
                                            <button onClick={() => setAppointmentToComplete(app)} className="bg-green-600 text-white hover:bg-green-700 font-semibold px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2">
                                                <ClipboardDocumentCheckIcon className="w-5 h-5" /> Hoàn thành
                                            </button>
                                        )}
                                        {(app.status === 'pending' || app.status === 'upcoming') && (
                                            <button onClick={() => setAppointmentToCancel(app)} className="bg-red-100 text-red-700 hover:bg-red-200 font-semibold px-4 py-2 rounded-md text-sm transition-colors">Hủy lịch</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" onClick={() => setSelectedAppointment(null)}>
                    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-lg w-full transform transition-all animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-serif font-bold text-brand-dark">Chi Tiết Lịch Hẹn</h2>
                            <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-800 text-3xl font-light leading-none">&times;</button>
                        </div>
                        <div className="space-y-5 text-sm sm:text-base">
                            <div className="pb-3 border-b"><p className="text-sm text-gray-500">Dịch vụ</p><p className="text-lg font-bold text-brand-primary">{selectedAppointment.serviceName}</p></div>
                            <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                                <div><p className="text-sm text-gray-500">Ngày hẹn</p><p className="font-semibold text-gray-800">{new Date(selectedAppointment.date).toLocaleDateString('vi-VN')}</p></div>
                                <div><p className="text-sm text-gray-500">Giờ hẹn</p><p className="font-semibold text-gray-800">{selectedAppointment.time}</p></div>
                                <div><p className="text-sm text-gray-500">Khách hàng</p><p className="font-semibold text-gray-800">{allUsers.find(u => u.id === selectedAppointment.userId)?.name}</p></div>
                                <div><p className="text-sm text-gray-500">SĐT Khách hàng</p><p className="font-semibold text-gray-800">{allUsers.find(u => u.id === selectedAppointment.userId)?.phone}</p></div>
                                {selectedAppointment.notesForTherapist && <div><p className="text-sm text-gray-500">Ghi chú cho KTV</p><p className="font-semibold text-gray-800">{selectedAppointment.notesForTherapist}</p></div>}
                            </div>
                            <div><p className="text-sm text-gray-500">Trạng thái</p>{getStatusBadge(selectedAppointment.status)}</div>
                        </div>
                        <div className="mt-6 text-right">
                             {selectedAppointment.date === today && selectedAppointment.status === 'upcoming' && (
                                <button onClick={() => handleAction(selectedAppointment, 'in-progress')} className="bg-green-600 text-white hover:bg-green-700 font-semibold px-4 py-2 rounded-md text-sm transition-colors mr-3">
                                    Bắt đầu dịch vụ
                                </button>
                            )}
                            {selectedAppointment.status === 'in-progress' && (
                                <button onClick={() => setAppointmentToComplete(selectedAppointment)} className="bg-green-600 text-white hover:bg-green-700 font-semibold px-4 py-2 rounded-md text-sm transition-colors mr-3">
                                    Hoàn thành
                                </button>
                            )}
                            {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'upcoming') && (
                                <button onClick={() => setAppointmentToCancel(selectedAppointment)} className="bg-red-500 text-white hover:bg-red-600 font-semibold px-4 py-2 rounded-md text-sm transition-colors mr-3">
                                    Hủy lịch
                                </button>
                            )}
                            <button onClick={() => setSelectedAppointment(null)} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-300">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
            
            {appointmentToComplete && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" onClick={() => setAppointmentToComplete(null)}>
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center transform transition-all animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"><CheckCircleIcon className="w-10 h-10 text-green-600" /></div>
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">Xác nhận Hoàn thành</h2>
                        <p className="text-md text-brand-text mb-6">Bạn có chắc chắn muốn đánh dấu dịch vụ <br /><strong className="text-brand-primary">{appointmentToComplete.serviceName}</strong> <br />của khách hàng {allUsers.find(u => u.id === appointmentToComplete.userId)?.name} là hoàn thành?</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => setAppointmentToComplete(null)} className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-300">Không</button>
                            <button onClick={() => handleAction(appointmentToComplete, 'completed')} className="w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300">Xác nhận Hoàn thành</button>
                        </div>
                    </div>
                </div>
            )}

            {appointmentToCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" onClick={() => setAppointmentToCancel(null)}>
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center transform transition-all animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"><XCircleIcon className="w-10 h-10 text-red-600" /></div>
                        <h2 className="text-2xl font-bold text-brand-dark mb-4">Xác nhận Hủy Lịch hẹn</h2>
                        <p className="text-md text-brand-text mb-6">Bạn có chắc chắn muốn hủy lịch hẹn cho dịch vụ <br /><strong className="text-brand-primary">{appointmentToCancel.serviceName}</strong> <br />của khách hàng {allUsers.find(u => u.id === appointmentToCancel.userId)?.name}?</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => setAppointmentToCancel(null)} className="w-full sm:w-auto bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-300">Không</button>
                            <button onClick={() => handleAction(appointmentToCancel, 'cancelled')} className="w-full sm:w-auto bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-300">Xác nhận Hủy</button>
                        </div>
                    </div>
                </div>
            )}
            
            {viewingClient && (
                <ClientProfileModal
                    client={viewingClient}
                    onClose={() => setViewingClient(null)}
                    allAppointments={allAppointments}
                    allUsers={allUsers}
                    allServices={allServices}
                    allProducts={allProducts}
                    allSales={allSales}
                />
            )}
        </div>
    );
};