import React, { useState, useEffect } from 'react';
import type { Appointment, User } from '../../types';
import { ClockIcon, UserIcon, PhoneIcon, ClipboardDocumentCheckIcon } from '../../shared/icons';
import * as apiService from '../../client/services/apiService';

interface AppointmentDetailModalProps {
    appointment: Appointment;
    allUsers: User[];
    onClose: () => void;
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({ appointment, allUsers, onClose }) => {
    const [previousSessionNotes, setPreviousSessionNotes] = useState<{ adminNotes?: string; customerStatusNotes?: string } | null>(null);
    
    // Get treatment session info from appointment (should be included in API response)
    const session = (appointment as any).TreatmentSession;
    
    // Get client info - prioritize from appointment.Client (from API), then from allUsers
    // Merge data to ensure we have phone number
    const appointmentClient = (appointment as any).Client;
    const clientFromUsers = allUsers.find(u => u.id === appointment.userId);
    
    // Merge client data: use appointmentClient as base, fill in missing data from allUsers
    const client = appointmentClient 
        ? {
            ...appointmentClient,
            // Fill in phone if missing from appointmentClient
            phone: appointmentClient.phone || clientFromUsers?.phone || null
        }
        : clientFromUsers;
    
    // Debug log
    console.log('AppointmentDetailModal - Appointment data:', {
        appointmentId: appointment.id,
        userId: appointment.userId,
        hasClientFromAppointment: !!appointmentClient,
        hasClientFromUsers: !!clientFromUsers,
        clientName: client?.name,
        clientPhone: client?.phone,
        appointmentClientPhone: appointmentClient?.phone,
        clientFromUsersPhone: clientFromUsers?.phone,
        hasSession: !!session,
        sessionAdminNotes: session?.adminNotes
    });

    useEffect(() => {
        // If this is a treatment session, get previous session notes
        if (session && session.sessionNumber > 1) {
            fetchPreviousSessionNotes();
        }
    }, [session]);

    const fetchPreviousSessionNotes = async () => {
        try {
            // Get treatment course to find previous session
            // We need to find the course that contains this session
            // For now, we'll try to get it from the appointment's bookingGroupId or find by serviceId and userId
            const bookingGroupId = (appointment as any).bookingGroupId;
            if (bookingGroupId && bookingGroupId.startsWith('group-')) {
                const courseId = bookingGroupId.replace('group-', '');
                const course = await apiService.getTreatmentCourseById(courseId);
                if (course && course.sessions) {
                    // Find previous session (sessionNumber - 1)
                    const previousSession = (course.sessions as any[]).find(
                        (s: any) => s.sessionNumber === session.sessionNumber - 1
                    );
                    if (previousSession) {
                        setPreviousSessionNotes({
                            adminNotes: previousSession.adminNotes,
                            customerStatusNotes: previousSession.customerStatusNotes
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching previous session notes:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Chi tiết lịch hẹn</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
                    </div>

                    <div className="space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin lịch hẹn</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <ClockIcon className="w-5 h-5 text-gray-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Thời gian</p>
                                        <p className="font-semibold text-gray-800">
                                            {new Date(appointment.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                        <p className="font-semibold text-gray-800">{appointment.time}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Dịch vụ</p>
                                    <p className="font-semibold text-gray-800">{appointment.serviceName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Thông tin khách hàng */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <UserIcon className="w-5 h-5" />
                                Thông tin khách hàng
                            </h3>
                            <div className="space-y-3">
                                {client ? (
                                    <>
                                        <div>
                                            <p className="text-sm text-gray-600">Tên khách hàng</p>
                                            <p className="font-semibold text-gray-800 text-lg">{client.name || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <PhoneIcon className="w-5 h-5 text-gray-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600">Số điện thoại</p>
                                                <p className="font-semibold text-gray-800 text-base">
                                                    {client.phone ? (
                                                        <a href={`tel:${client.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                                            {client.phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-500 italic">Chưa có số điện thoại</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {client.email && (
                                            <div>
                                                <p className="text-sm text-gray-600">Email</p>
                                                <p className="font-semibold text-gray-800">{client.email}</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div>
                                        <p className="text-sm text-gray-600">Tên khách hàng</p>
                                        <p className="text-gray-500 italic">Không tìm thấy thông tin khách hàng (ID: {appointment.userId})</p>
                                        {clientFromUsers && (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-600">Số điện thoại</p>
                                                <p className="font-semibold text-gray-800">
                                                    {clientFromUsers.phone ? (
                                                        <a href={`tel:${clientFromUsers.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                                            {clientFromUsers.phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-500 italic">Chưa có số điện thoại</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thông tin liệu trình (nếu có) */}
                        {session && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin liệu trình</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Buổi số</p>
                                        <p className="font-semibold text-purple-800 text-lg">Buổi {session.sessionNumber}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ghi chú */}
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                Ghi chú
                            </h3>
                            <div className="space-y-3">
                                {/* Ghi chú cho KTV */}
                                {appointment.notesForTherapist && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Ghi chú cho KTV</p>
                                        <p className="text-gray-800 bg-white p-3 rounded border">{appointment.notesForTherapist}</p>
                                    </div>
                                )}
                                
                                {/* Ghi chú từ buổi trước (nếu có) */}
                                {previousSessionNotes && (previousSessionNotes.adminNotes || previousSessionNotes.customerStatusNotes) && (
                                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                        <p className="text-sm font-semibold text-blue-800 mb-2">📝 Ghi chú từ buổi trước (Buổi {session?.sessionNumber ? session.sessionNumber - 1 : 'N/A'})</p>
                                        {previousSessionNotes.adminNotes && (
                                            <div className="mb-2">
                                                <p className="text-xs text-gray-600 mb-1">
                                                    <span className="text-blue-600 font-medium">[Nội bộ]</span> Ghi chú nội bộ từ admin
                                                </p>
                                                <p className="text-gray-800 bg-white p-2 rounded text-sm whitespace-pre-wrap">{previousSessionNotes.adminNotes}</p>
                                            </div>
                                        )}
                                        {previousSessionNotes.customerStatusNotes && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">
                                                    <span className="text-gray-600">[Khách hàng]</span> Ghi chú tình trạng khách hàng
                                                </p>
                                                <p className="text-gray-800 bg-white p-2 rounded text-sm whitespace-pre-wrap">{previousSessionNotes.customerStatusNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Ghi chú nội bộ của buổi hiện tại (adminNotes) */}
                                {session && session.adminNotes && (
                                    <div className="bg-red-50 p-3 rounded border border-red-200">
                                        <p className="text-sm font-semibold text-red-800 mb-2">
                                            <span className="text-blue-600 font-medium">[Nội bộ]</span> Ghi chú nội bộ của buổi này
                                        </p>
                                        <p className="text-gray-800 bg-white p-3 rounded border whitespace-pre-wrap">{session.adminNotes}</p>
                                    </div>
                                )}
                                
                                {/* Ghi chú tình trạng khách hàng của buổi hiện tại */}
                                {session && session.customerStatusNotes && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="text-gray-600">[Khách hàng]</span> Ghi chú tình trạng khách hàng (buổi này)
                                        </p>
                                        <p className="text-gray-800 bg-white p-3 rounded border whitespace-pre-wrap">{session.customerStatusNotes}</p>
                                    </div>
                                )}
                                
                                {/* Hiển thị thông báo nếu không có ghi chú nào */}
                                {!appointment.notesForTherapist && 
                                 (!previousSessionNotes || (!previousSessionNotes.adminNotes && !previousSessionNotes.customerStatusNotes)) &&
                                 (!session || (!session.adminNotes && !session.customerStatusNotes)) && (
                                    <p className="text-gray-500 italic">Không có ghi chú</p>
                                )}
                            </div>
                        </div>

                        {/* Trạng thái */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Trạng thái</p>
                                <p className="font-semibold text-gray-800">
                                    {appointment.status === 'upcoming' ? 'Sắp tới' :
                                     appointment.status === 'in-progress' ? 'Đang thực hiện' :
                                     appointment.status === 'completed' ? 'Đã hoàn thành' :
                                     appointment.status === 'cancelled' ? 'Đã hủy' :
                                     appointment.status === 'pending' ? 'Chờ xác nhận' :
                                     appointment.status}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Thanh toán</p>
                                <p className="font-semibold text-gray-800">
                                    {appointment.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailModal;

