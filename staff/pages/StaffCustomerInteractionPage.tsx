import React, { useState, useMemo } from 'react';
import type { User, Appointment, Review } from '../../types';
// FIX: Replaced missing icons `UserCircleIcon`, `ChatBubbleLeftRightIcon`, `MailOpenIcon`, `BellAlertIcon`, and `CakeIcon` with available icons from the shared icons file.
import { ChatBubbleBottomCenterTextIcon, MailIcon, BellIcon, HeartIcon, StarIcon, CakeIcon, UsersIcon } from '../../shared/icons';
// Icons

interface StaffCustomerInteractionPageProps {
    currentUser: User;
    allUsers: User[];
    allAppointments: Appointment[];
    allReviews: Review[];
}

const StaffCustomerInteractionPage: React.FC<StaffCustomerInteractionPageProps> = ({ currentUser, allUsers, allAppointments, allReviews }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<User | null>(null);
    const [messageContent, setMessageContent] = useState('');

    const myClients = useMemo(() => {
        const clientIds = new Set(
            allAppointments
                .filter(app => app.therapistId === currentUser.id && app.status === 'completed')
                .map(app => app.userId)
        );
        return allUsers.filter(user => clientIds.has(user.id))
                         .filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.email.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [currentUser.id, searchTerm, allUsers, allAppointments]);

    const handleSendMessage = (client: User) => {
        setSelectedClient(client);
        setIsMessageModalOpen(true);
    };

    const handleSendActualMessage = () => {
        if (selectedClient && messageContent.trim()) {
            alert(`Đã gửi tin nhắn đến ${selectedClient.name}: "${messageContent}"`);
            // In a real app, this would integrate with a messaging service
            setIsMessageModalOpen(false);
            setMessageContent('');
            setSelectedClient(null);
        }
    };

    const getClientReviews = (clientId: string) => {
        return allReviews.filter(review => review.userId === clientId);
    };

    const isClientBirthdayToday = (client: User) => {
        if (!client.birthday) return false;
        const today = new Date();
        const [month, day] = client.birthday.split('-');
        return parseInt(month) === (today.getMonth() + 1) && parseInt(day) === today.getDate();
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Tư vấn & Chăm sóc khách hàng</h1>
            <p className="text-gray-600 mb-8">Quản lý danh sách khách hàng đã phục vụ và tương tác với họ.</p>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
            </div>

            <div className="space-y-6">
                {myClients.length > 0 ? (
                    myClients.map(client => {
                        const clientReviews = getClientReviews(client.id);
                        const isBirthday = isClientBirthdayToday(client);

                        return (
                            <div key={client.id} className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <img src={client.profilePictureUrl} alt={client.name} className="w-16 h-16 rounded-full object-cover" />
                                    <div>
                                        <p className="font-bold text-lg text-gray-800">{client.name}</p>
                                        <p className="text-sm text-gray-600">{client.email}</p>
                                        <p className="text-sm text-gray-500">SĐT: {client.phone}</p>
                                        {isBirthday && (
                                            <p className="text-xs font-semibold text-pink-600 mt-1 flex items-center gap-1">
                                                <CakeIcon className="w-4 h-4" /> Sinh nhật hôm nay!
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSendMessage(client)} className="bg-brand-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-brand-dark transition-colors flex items-center gap-2">
                                            {/* FIX: Replaced missing ChatBubbleOvalLeftEllipsisIcon with ChatBubbleBottomCenterTextIcon */}
                                            <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> Gửi tin nhắn
                                        </button>
                                        <button className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-200 transition-colors flex items-center gap-2">
                                            <HeartIcon className="w-5 h-5" /> Theo dõi
                                        </button>
                                    </div>
                                    {clientReviews.length > 0 && (
                                        <button onClick={() => alert('Chức năng xem lịch sử đánh giá chi tiết đang phát triển.')} className="text-sm text-gray-500 hover:underline mt-2">
                                            Xem {clientReviews.length} đánh giá
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg shadow-md">
                        <p className="text-lg text-gray-500">Bạn chưa phục vụ khách hàng nào hoặc không tìm thấy.</p>
                    </div>
                )}
            </div>

            {isMessageModalOpen && selectedClient && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsMessageModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gửi tin nhắn cho {selectedClient.name}</h2>
                            <p className="text-gray-600 mb-4">Email: {selectedClient.email} | SĐT: {selectedClient.phone}</p>
                            <textarea
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                                rows={6}
                                className="w-full p-2 border rounded-md focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="Nhập nội dung tin nhắn tư vấn, chúc mừng sinh nhật, giới thiệu ưu đãi..."
                            ></textarea>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                            <button onClick={() => setIsMessageModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Hủy</button>
                            <button onClick={handleSendActualMessage} disabled={!messageContent.trim()} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed">Gửi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffCustomerInteractionPage;