import React, { useState, useMemo } from 'react';
import type { User, TreatmentCourse, TreatmentSession, Service, Product } from '../../types';
// FIX: Replaced CheckCircleOutlineIcon with CheckCircleIcon to fix import error.
import { BookOpenIcon, UserGroupIcon, PhotoIcon, PencilIcon, CheckCircleIcon, ProductSuggestIcon,ChevronRightIcon } from '../../shared/icons';
// Icons

interface StaffTreatmentProgressPageProps {
    currentUser: User;
    allServices: Service[];
    allUsers: User[];
    allTreatmentCourses: TreatmentCourse[];
}

const TreatmentProgressPage: React.FC<StaffTreatmentProgressPageProps> = ({ currentUser, allServices, allUsers, allTreatmentCourses }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | TreatmentCourse['status']>('all');
    const [selectedCourse, setSelectedCourse] = useState<TreatmentCourse | null>(null);
    const [isUpdateSessionModalOpen, setIsUpdateSessionModalOpen] = useState(false);
    const [sessionToUpdate, setSessionToUpdate] = useState<{ courseId: string; sessionIndex: number } | null>(null);
    const [updatedSessionData, setUpdatedSessionData] = useState<Partial<TreatmentSession>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const myTreatmentCourses = useMemo(() => {
        return allTreatmentCourses.filter(course =>
            course.therapistId === currentUser.id &&
            course.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (filterStatus === 'all' || course.status === filterStatus)
        );
    }, [currentUser.id, searchTerm, filterStatus, allTreatmentCourses]);

    const handleUpdateSession = (courseId: string, sessionIndex: number, session: TreatmentSession) => {
        const course = allTreatmentCourses.find(c => c.id === courseId);
        if (course) {
            const updatedSessions = [...course.sessions];
            updatedSessions[sessionIndex] = { ...updatedSessions[sessionIndex], ...session };
            // In a real app, you'd update this in a global state or send to backend
            console.log('Updated session:', updatedSessions[sessionIndex]);
        }
        setIsUpdateSessionModalOpen(false);
        setSessionToUpdate(null);
        setUpdatedSessionData({});
        setImagePreview(null);
    };

    const handleOpenUpdateModal = (courseId: string, sessionIndex: number) => {
        const course = allTreatmentCourses.find(c => c.id === courseId);
        if (course) {
            const session = course.sessions[sessionIndex]; // This `session` could be undefined if it's the next session
            setSessionToUpdate({ courseId, sessionIndex });
            setUpdatedSessionData({
                // Safely access properties or provide default values
                therapistNotes: session?.therapistNotes || '',
                afterSessionImageUrl: session?.afterSessionImageUrl || '',
                status: session?.status || 'completed' // Default to 'completed' for a new session
            });
            setImagePreview(session?.afterSessionImageUrl || null);
            setIsUpdateSessionModalOpen(true);
        }
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setUpdatedSessionData(prev => ({ ...prev, afterSessionImageUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSuggestProduct = (serviceId: string) => {
        const service = allServices.find(s => s.id === serviceId);
        if (service) {
            // A real app might fetch product suggestions from an API
            const products: Product[] = []; // Assuming Product type exists
            const suggestion = products.find(p => p.category === service.category);
            alert(`AI gợi ý: Khách hàng sử dụng dịch vụ "${service.name}" có thể quan tâm đến sản phẩm "${suggestion?.name || `${service.category} Booster Serum`}".`);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Liệu trình Khách hàng</h1>
            <p className="text-gray-600 mb-8">Theo dõi tiến độ, cập nhật kết quả và gợi ý sản phẩm cho khách hàng của bạn.</p>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm liệu trình hoặc khách hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded-md"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'all' | TreatmentCourse['status'])}
                        className="w-full p-2 border rounded-md bg-white"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang thực hiện</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="paused">Tạm dừng</option>
                    </select>
                </div>
            </div>

            <div className="space-y-6">
                {myTreatmentCourses.length > 0 ? (
                    myTreatmentCourses.map(course => {
                        const client = allUsers.find(u => u.id === course.clientId);
                        const progress = (course.sessions.length / course.totalSessions) * 100;

                        return (
                            <div key={course.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-brand-primary">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{course.serviceName}</h3>
                                        <p className="text-gray-600 text-sm">Khách hàng: {client?.name}</p>
                                        <p className={`text-sm font-semibold ${course.status === 'active' ? 'text-green-600' : course.status === 'completed' ? 'text-blue-600' : 'text-orange-600'}`}>
                                            Trạng thái: {course.status === 'active' ? 'Đang thực hiện' : course.status === 'completed' ? 'Đã hoàn thành' : 'Tạm dừng'}
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedCourse(course)} className="bg-brand-secondary text-brand-dark px-4 py-2 rounded-md text-sm font-semibold hover:bg-brand-primary hover:text-white transition-colors">
                                        Xem chi tiết <ChevronRightIcon className="inline-block w-4 h-4 ml-1" />
                                    </button>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                    <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-sm text-gray-700 mb-4">Hoàn thành: {course.sessions.length}/{course.totalSessions} buổi</p>

                                <div className="flex justify-end gap-3">
                                    <button onClick={() => handleSuggestProduct(course.serviceId)} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-200 transition-colors flex items-center gap-2">
                                        <ProductSuggestIcon className="w-5 h-5" /> Gợi ý sản phẩm
                                    </button>
                                    {course.sessions.length < course.totalSessions && (
                                        <button
                                            onClick={() => handleOpenUpdateModal(course.id, course.sessions.length)} // Next session index
                                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <PencilIcon className="w-5 h-5" /> Cập nhật buổi tiếp theo
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg shadow-md">
                        <p className="text-lg text-gray-500">Bạn chưa có liệu trình nào được phân công.</p>
                    </div>
                )}
            </div>

            {selectedCourse && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCourse(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Chi tiết Liệu trình</h2>
                                    <p className="text-brand-primary text-lg">{selectedCourse.serviceName}</p>
                                </div>
                                <button onClick={() => setSelectedCourse(null)} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
                            </div>
                            <p className="text-gray-600 mb-4">Khách hàng: {allUsers.find(u => u.id === selectedCourse.clientId)?.name}</p>

                            <div className="space-y-6">
                                {selectedCourse.sessions.map((session, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-md border-l-4 border-blue-400">
                                        <p className="font-bold text-lg text-gray-800">Buổi {index + 1} - {new Date(session.date).toLocaleDateString('vi-VN')}</p>
                                        <p className="text-gray-600 text-sm">Kỹ thuật viên: {session.therapist}</p>
                                        <p className="mt-2 text-gray-700 italic">Ghi chú: "{session.notes}"</p>
                                        {session.therapistNotes && <p className="mt-1 text-gray-700"><strong>Ghi chú chuyên môn:</strong> {session.therapistNotes}</p>}
                                        {session.afterSessionImageUrl && (
                                            <div className="mt-3">
                                                <p className="text-sm font-semibold text-gray-700 mb-2">Ảnh sau buổi:</p>
                                                <img src={session.afterSessionImageUrl} alt={`Buổi ${index + 1} sau`} className="w-48 h-auto object-cover rounded-md shadow-sm" />
                                            </div>
                                        )}
                                        <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-700">
                                            <CheckCircleIcon className="w-5 h-5" /> Đã hoàn thành
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-lg">
                            <button onClick={() => setSelectedCourse(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {isUpdateSessionModalOpen && sessionToUpdate && (
                <div className="fixed inset-0 bg-black/50 z-[51] flex items-center justify-center p-4" onClick={() => setIsUpdateSessionModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateSession(sessionToUpdate.courseId, sessionToUpdate.sessionIndex, updatedSessionData as TreatmentSession); }}>
                            <div className="p-6 max-h-[80vh] overflow-y-auto">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Cập nhật buổi {sessionToUpdate.sessionIndex + 1}</h2>
                                <p className="text-gray-600 mb-4">Liệu trình: {allTreatmentCourses.find(c => c.id === sessionToUpdate.courseId)?.serviceName}</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ghi chú chuyên môn</label>
                                        <textarea
                                            value={updatedSessionData.therapistNotes || ''}
                                            onChange={(e) => setUpdatedSessionData(prev => ({ ...prev, therapistNotes: e.target.value }))}
                                            rows={4}
                                            className="w-full p-2 border rounded-md focus:ring-brand-primary focus:border-brand-primary"
                                            placeholder="Tình trạng da, cảm nhận khách, đề xuất tiếp theo..."
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Hình ảnh sau liệu trình (tùy chọn)</label>
                                        <div className="mt-1 flex items-center gap-4">
                                            <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center">
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="Xem trước" className="w-full h-full object-cover rounded-md" />
                                                ) : (
                                                    <span className="text-xs text-gray-500 text-center">Ảnh</span>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <label htmlFor="afterSessionImageUrl" className="block text-xs font-medium text-gray-500">Dán liên kết ảnh</label>
                                                <input type="text" name="afterSessionImageUrl" id="afterSessionImageUrl" value={updatedSessionData.afterSessionImageUrl || ''} onChange={(e) => { setImagePreview(e.target.value); setUpdatedSessionData(prev => ({ ...prev, afterSessionImageUrl: e.target.value })); }} className="mt-1 w-full p-2 border rounded text-sm" placeholder="https://..." />
                                                <div className="relative text-center my-2">
                                                    <div className="absolute inset-y-1/2 left-0 w-full h-px bg-gray-200"></div>
                                                    <span className="relative text-xs text-gray-400 bg-white px-2">hoặc</span>
                                                </div>
                                                <label htmlFor="file-upload-session" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 w-full text-center block">Tải lên từ máy</label>
                                                <input id="file-upload-session" name="file-upload-session" type="file" className="sr-only" onChange={handleImageFileChange} accept="image/*" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                                <button type="button" onClick={() => setIsUpdateSessionModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">Lưu cập nhật</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreatmentProgressPage;