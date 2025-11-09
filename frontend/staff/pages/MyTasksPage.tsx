import React, { useState, useEffect, useMemo } from 'react';
import type { StaffTask, User } from '../../types';
import * as apiService from '../../client/services/apiService';
import { ClockIcon, CheckCircleIcon } from '../../shared/icons';

const STATUS_CONFIG: Record<StaffTask['status'], { text: string; color: string; bgColor: string; }> = {
    pending: { text: 'Chờ', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    'in-progress': { text: 'Đang làm', color: 'text-blue-800', bgColor: 'bg-blue-100' },
    completed: { text: 'Hoàn thành', color: 'text-green-800', bgColor: 'bg-green-100' },
    overdue: { text: 'Quá hạn', color: 'text-red-800', bgColor: 'bg-red-100' },
};

interface MyTasksPageProps {
    currentUser: User;
}

const MyTasksPage: React.FC<MyTasksPageProps> = ({ currentUser }) => {
    const [tasks, setTasks] = useState<StaffTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<StaffTask['status'] | 'all'>('all');
    const [toast, setToast] = useState<{ visible: boolean, message: string } | null>(null);

    const fetchTasks = async () => {
        try {
            setIsLoading(true);
            const allTasks = await apiService.getStaffTasks();
            setTasks(allTasks.filter(t => t.assignedToId === currentUser.id));
        } catch (err: any) {
            setError(err.message || "Failed to fetch tasks.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [currentUser.id]);
    
    const filteredTasks = useMemo(() => {
        return tasks
            .filter(task => filterStatus === 'all' || task.status === filterStatus)
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [tasks, filterStatus]);

    const showToast = (message: string) => {
        setToast({ visible: true, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpdateStatus = async (task: StaffTask, newStatus: StaffTask['status']) => {
        if (task.status === newStatus) return;
        try {
            await apiService.updateStaffTask(task.id, { status: newStatus });
            await fetchTasks();
            showToast(`Đã cập nhật trạng thái công việc "${task.title}".`);
        } catch (err) {
            showToast("Cập nhật thất bại!");
        }
    };

    return (
        <div>
            {toast && <div className="fixed top-24 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[100] animate-fadeInDown">{toast.message}</div>}

            <h1 className="text-3xl font-bold text-gray-800 mb-6">Công việc của tôi</h1>
            <p className="text-gray-600 mb-8">Danh sách các công việc được giao cho bạn. Hãy cập nhật trạng thái khi bạn làm việc.</p>

            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <label className="font-medium">Lọc theo trạng thái:</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="p-2 border rounded-md bg-white">
                        <option value="all">Tất cả</option>
                        {Object.entries(STATUS_CONFIG).map(([key, { text }]) => <option key={key} value={key}>{text}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center p-8 text-gray-500">Đang tải công việc...</div>
                ) : error ? (
                    <div className="text-center p-8 text-red-500">Lỗi: {error}</div>
                ) : filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                        <div key={task.id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                        <span>Ngày hết hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-4 text-right">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[task.status].bgColor} ${STATUS_CONFIG[task.status].color}`}>{STATUS_CONFIG[task.status].text}</span>
                                </div>
                            </div>
                             {task.status !== 'completed' && (
                                <div className="mt-4 border-t pt-3 flex items-center gap-2">
                                    <span className="text-sm font-medium">Cập nhật trạng thái:</span>
                                    {task.status === 'pending' && (
                                        <button onClick={() => handleUpdateStatus(task, 'in-progress')} className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200">
                                            <ClockIcon className="w-4 h-4" /> Bắt đầu làm
                                        </button>
                                    )}
                                    {task.status === 'in-progress' && (
                                         <button onClick={() => handleUpdateStatus(task, 'completed')} className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 hover:bg-green-200">
                                            <CheckCircleIcon className="w-4 h-4" /> Hoàn thành
                                        </button>
                                    )}
                                     {task.status === 'overdue' && (
                                         <button onClick={() => handleUpdateStatus(task, 'completed')} className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 hover:bg-green-200">
                                            <CheckCircleIcon className="w-4 h-4" /> Hoàn thành
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                     <div className="text-center py-10 bg-white rounded-lg shadow-md">
                        <p className="text-lg text-gray-500">Không có công việc nào được giao.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTasksPage;