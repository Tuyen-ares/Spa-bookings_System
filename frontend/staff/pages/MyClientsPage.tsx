import React, { useState, useMemo } from 'react';
import type { User, Appointment, Service, Product, Sale } from '../../types';
import { UsersIcon, SearchIcon } from '../../shared/icons';
import ClientProfileModal from '../components/ClientProfileModal';

interface MyClientsPageProps {
    currentUser: User;
    allUsers: User[];
    allAppointments: Appointment[];
    allServices: Service[];
    allProducts: Product[];
    allSales: Sale[];
}

const MyClientsPage: React.FC<MyClientsPageProps> = ({ currentUser, allUsers, allAppointments, allServices, allProducts, allSales }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingClient, setViewingClient] = useState<User | null>(null);

    const myServedClients = useMemo(() => {
        // Find all completed appointments for the current staff member
        const myCompletedAppointments = allAppointments.filter(
            app => app.therapistId === currentUser.id && app.status === 'completed'
        );

        // Count appointments per client
        const clientServiceCount = myCompletedAppointments.reduce((acc, app) => {
            acc[app.userId] = (acc[app.userId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Get unique client IDs
        const clientIds = Object.keys(clientServiceCount);

        // Map to client data with the service count
        return allUsers
            .filter(user => clientIds.includes(user.id))
            .map(client => ({
                ...client,
                serviceCount: clientServiceCount[client.id] || 0,
            }))
            .sort((a, b) => b.serviceCount - a.serviceCount); // Sort by most served
    }, [currentUser.id, allUsers, allAppointments]);

    const filteredClients = useMemo(() => {
        if (!searchTerm) {
            return myServedClients;
        }
        const lowercasedSearch = searchTerm.toLowerCase();
        return myServedClients.filter(
            client =>
                client.name.toLowerCase().includes(lowercasedSearch) ||
                client.email.toLowerCase().includes(lowercasedSearch)
        );
    }, [myServedClients, searchTerm]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <UsersIcon className="w-8 h-8 text-brand-primary" />
                Khách hàng của tôi
            </h1>
            <p className="text-gray-600 mb-8">
                Danh sách các khách hàng bạn đã từng hoàn thành dịch vụ.
            </p>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 sticky top-0 z-10">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm khách hàng theo tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>

            {filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map(client => (
                        <div 
                            key={client.id} 
                            className="bg-white p-5 rounded-lg shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                            onClick={() => setViewingClient(client)}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <img src={client.profilePictureUrl} alt={client.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-secondary" />
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{client.name}</h3>
                                    <p className="text-sm text-gray-500">{client.email}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md text-center">
                                <p className="text-sm font-medium text-gray-600">Số lần đã phục vụ</p>
                                <p className="text-2xl font-bold text-brand-primary">{client.serviceCount}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <p className="text-lg text-gray-500">
                        {searchTerm ? 'Không tìm thấy khách hàng nào.' : 'Bạn chưa phục vụ khách hàng nào.'}
                    </p>
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

export default MyClientsPage;
