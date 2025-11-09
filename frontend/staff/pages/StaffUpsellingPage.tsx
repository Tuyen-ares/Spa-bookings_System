
import React, { useState, useMemo } from 'react';
import type { User, Product, Sale, Service, Appointment } from '../../types';
// FIX: Replaced CheckCircleOutlineIcon with CheckCircleIcon to fix import error.
import { LightBulbIcon, ShoppingCartIcon, CurrencyDollarIcon, CheckCircleIcon } from '../../shared/icons';


interface StaffUpsellingPageProps {
    currentUser: User;
    allServices: Service[];
    allUsers: User[];
    allAppointments: Appointment[];
    allProducts: Product[];
}

export const StaffUpsellingPage: React.FC<StaffUpsellingPageProps> = ({ currentUser, allServices, allUsers, allAppointments, allProducts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<User | null>(null);
    const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const staffClients = useMemo(() => {
        // Get unique client IDs that this staff has served and filter by search term
        const clientIds = new Set(
            allAppointments
                .filter(app => app.therapistId === currentUser.id && app.status === 'completed')
                .map(app => app.userId)
        );
        return allUsers.filter(user => clientIds.has(user.id))
                         .filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.email.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [currentUser.id, searchTerm, allUsers, allAppointments]);

    const handleClientSelect = (client: User) => {
        setSelectedClient(client);
        setSuggestedProducts([]);
        // Simulate AI product suggestion based on client's past services
        const clientAppointments = allAppointments.filter(app => app.userId === client.id && app.status === 'completed');
        const servicesUsed = clientAppointments.map(app => allServices.find(s => s.id === app.serviceId));
        
        const suggestions: (Product | undefined)[] = [];
        servicesUsed.forEach(service => {
            if (service?.category === 'Facial' || service?.category === 'Skincare') {
                suggestions.push(allProducts.find(p => p.name.toLowerCase().includes('serum') || p.name.toLowerCase().includes('kem chống nắng'))!);
            } else if (service?.category === 'Body Care') {
                 suggestions.push(allProducts.find(p => p.name.toLowerCase().includes('sữa tắm') || p.name.toLowerCase().includes('tẩy tế bào chết'))!);
            }
        });
        setSuggestedProducts([...new Set(suggestions.filter(Boolean) as Product[])]); // Unique suggestions
    };

    const handleOpenSaleModal = (product: Product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setIsSaleModalOpen(true);
    };

    const handleRecordSale = () => {
        if (!selectedClient || !selectedProduct || quantity <= 0) return;

        const newSale: Sale = {
            id: `sale-${Date.now()}`,
            staffId: currentUser.id,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: quantity,
            totalAmount: selectedProduct.price * quantity,
            date: new Date().toISOString(),
            status: 'completed',
            clientId: selectedClient.id,
        };

        // TODO: Implement product sale recording via API
        // This would create a sale record in the database
        console.log('Recording new sale:', newSale);
        
        try {
            // await apiService.createSale(newSale);
            setToastMessage(`Đã ghi nhận bán ${quantity} ${selectedProduct.name} cho ${selectedClient.name}!`);
        } catch (error) {
            console.error('Error recording sale:', error);
            setToastMessage('Không thể ghi nhận bán hàng. Vui lòng thử lại.');
        } finally {
            setTimeout(() => setToastMessage(null), 3000);
        }
        setIsSaleModalOpen(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div>
            {toastMessage && (
                <div className="fixed top-24 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-fadeInUp">
                    {toastMessage}
                </div>
            )}

            <h1 className="text-3xl font-bold text-gray-800 mb-6">Bán thêm sản phẩm & dịch vụ</h1>
            <p className="text-gray-600 mb-8">Gợi ý và bán sản phẩm/dịch vụ phù hợp cho khách hàng đã từng được bạn phục vụ.</p>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client List */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><LightBulbIcon className="w-5 h-5 text-brand-primary" /> Chọn khách hàng</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {staffClients.length > 0 ? (
                            staffClients.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => handleClientSelect(client)}
                                    className={`p-4 border rounded-lg cursor-pointer flex items-center gap-4 transition-all ${selectedClient?.id === client.id ? 'border-brand-primary ring-2 ring-brand-primary shadow-lg' : 'border-gray-200 hover:shadow-md'}`}
                                >
                                    <img src={client.profilePictureUrl} alt={client.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <p className="font-semibold text-gray-800">{client.name}</p>
                                        <p className="text-sm text-gray-500">{client.email}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 italic">Không tìm thấy khách hàng nào.</p>
                        )}
                    </div>
                </div>

                {/* Product Suggestions */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingCartIcon className="w-5 h-5 text-green-600" /> Gợi ý sản phẩm ({selectedClient ? selectedClient.name : 'Vui lòng chọn khách'})</h3>
                    {selectedClient ? (
                        suggestedProducts.length > 0 ? (
                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                {suggestedProducts.map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                                            <div>
                                                <p className="font-semibold text-gray-800">{product.name}</p>
                                                <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleOpenSaleModal(product)} className="bg-brand-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-brand-dark transition-colors">
                                            Bán ngay
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 italic">Không có gợi ý sản phẩm cho khách hàng này.</p>
                        )
                    ) : (
                        <p className="text-center text-gray-500 italic">Chọn một khách hàng để xem gợi ý sản phẩm.</p>
                    )}
                </div>
            </div>

            {/* Sale Modal */}
            {isSaleModalOpen && selectedClient && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsSaleModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ghi nhận bán sản phẩm</h2>
                            <p className="text-gray-600 mb-4">
                                Khách hàng: <strong className="text-brand-dark">{selectedClient.name}</strong> <br/>
                                Sản phẩm: <strong className="text-brand-primary">{selectedProduct.name}</strong> ({formatCurrency(selectedProduct.price)})
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Số lượng</label>
                                    <input
                                        type="number"
                                        id="quantity"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        className="mt-1 w-full p-2 border rounded-md focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>
                                <p className="text-lg font-bold text-gray-800">
                                    Tổng cộng: <span className="text-brand-primary">{formatCurrency(selectedProduct.price * quantity)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                            <button onClick={() => setIsSaleModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Hủy</button>
                            <button onClick={handleRecordSale} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Xác nhận bán</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};