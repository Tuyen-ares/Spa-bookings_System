import React, { useMemo } from 'react';
import type { User, Appointment, Service, Product, Sale } from '../../types';
// FIX: Replaced missing icon `CakeIcon` with the newly added `CakeIcon` to resolve import error.
import { HistoryIcon, PencilIcon, ShoppingCartIcon, StarIcon, CakeIcon } from '../../shared/icons';

interface ClientProfileModalProps {
    client: User;
    onClose: () => void;
    allAppointments: Appointment[];
    allUsers: User[];
    allServices: Service[];
    allProducts: Product[];
    allSales: Sale[];
}

const ClientProfileModal: React.FC<ClientProfileModalProps> = ({ client, onClose, allAppointments, allUsers, allServices, allProducts, allSales }) => {
    
    const clientHistory = useMemo(() => {
        const appointments = allAppointments
            .filter(app => app.userId === client.id && app.status === 'completed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const notes = appointments
            .map(app => ({
                date: app.date,
                note: app.staffNotesAfterSession,
                therapist: allUsers.find(u => u.id === app.therapistId)?.name || 'N/A'
            }))
            .filter(n => n.note);

        const purchases = allSales
            .filter(sale => sale.clientId === client.id && sale.status === 'completed')
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
        return { appointments, notes, purchases };
    }, [client.id, allAppointments, allUsers, allSales]);

    const isBirthdaySoon = () => {
        if (!client.birthday) return false;
        const today = new Date();
        const birthDate = new Date(client.birthday);
        birthDate.setFullYear(today.getFullYear()); // Set to current year to compare
        const diffTime = birthDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <img src={client.profilePictureUrl} alt={client.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-brand-primary/30"/>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{client.name}</h2>
                                <p className="text-gray-500">{client.email}</p>
                                {isBirthdaySoon() && <p className="text-sm font-semibold text-pink-600 mt-1 flex items-center gap-1"><CakeIcon className="w-4 h-4" /> Sắp đến sinh nhật!</p>}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light">&times;</button>
                    </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Appointment History */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><HistoryIcon className="w-5 h-5 text-brand-primary"/> Lịch sử Dịch vụ</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {clientHistory.appointments.length > 0 ? clientHistory.appointments.slice(0,10).map(app => (
                                <div key={app.id} className="text-sm p-2 bg-white rounded-md border">
                                    <p className="font-semibold text-gray-800">{app.serviceName}</p>
                                    <p className="text-xs text-gray-500">{new Date(app.date).toLocaleDateString('vi-VN')} - KTV: {app.therapist}</p>
                                </div>
                            )) : <p className="text-sm text-gray-500 italic">Chưa có lịch sử.</p>}
                        </div>
                    </div>
                    
                    {/* Technician Notes */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><PencilIcon className="w-5 h-5 text-green-600"/> Ghi chú từ KTV</h3>
                         <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {clientHistory.notes.length > 0 ? clientHistory.notes.map((note, index) => (
                                <div key={index} className="text-sm p-2 bg-white rounded-md border">
                                    <p className="text-gray-700 italic">"{note.note}"</p>
                                    <p className="text-xs text-gray-500 text-right mt-1">- {note.therapist} on {new Date(note.date).toLocaleDateString('vi-VN')}</p>
                                </div>
                            )) : <p className="text-sm text-gray-500 italic">Chưa có ghi chú nào.</p>}
                        </div>
                    </div>

                    {/* Purchase History */}
                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><ShoppingCartIcon className="w-5 h-5 text-purple-600"/> Lịch sử Mua hàng</h3>
                         <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                            {clientHistory.purchases.length > 0 ? clientHistory.purchases.map(sale => (
                                <div key={sale.id} className="text-sm p-2 bg-white rounded-md border flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">{sale.productName} (x{sale.quantity})</p>
                                        <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                    <p className="font-semibold text-brand-primary">{new Intl.NumberFormat('vi-VN').format(sale.totalAmount)}đ</p>
                                </div>
                            )) : <p className="text-sm text-gray-500 italic">Chưa có lịch sử mua hàng.</p>}
                        </div>
                    </div>

                </div>

                 <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default ClientProfileModal;