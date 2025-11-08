import React, { useMemo } from 'react';
import type { User, Appointment, Review } from '../../types';
import { TrophyIcon } from '../../shared/icons';

interface EmployeeOfMonthProps {
    allUsers: User[];
    allAppointments: Appointment[];
    allReviews?: Review[];
}

const EmployeeOfMonth: React.FC<EmployeeOfMonthProps> = ({ allUsers, allAppointments, allReviews = [] }) => {
    const employeeOfMonth = useMemo(() => {
        if (!allAppointments || allAppointments.length === 0 || !allUsers || allUsers.length === 0) {
            return null;
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const completedAppointmentsThisMonth = allAppointments.filter(app => {
            const appDate = new Date(app.date);
            return app.status === 'completed' &&
                   appDate.getMonth() === currentMonth &&
                   appDate.getFullYear() === currentYear &&
                   app.therapistId;
        });

        if (completedAppointmentsThisMonth.length === 0) {
            return null;
        }

        const performanceCount: { [key: string]: number } = {};

        completedAppointmentsThisMonth.forEach(app => {
            if (app.therapistId) {
                performanceCount[app.therapistId] = (performanceCount[app.therapistId] || 0) + 1;
            }
        });

        let topEmployeeId: string | null = null;
        let maxAppointments = 0;

        for (const staffId in performanceCount) {
            if (performanceCount[staffId] > maxAppointments) {
                maxAppointments = performanceCount[staffId];
                topEmployeeId = staffId;
            }
        }

        if (!topEmployeeId) {
            return null;
        }

        const topEmployee = allUsers.find(user => user.id === topEmployeeId);

        if (!topEmployee) {
            return null;
        }

        return {
            ...topEmployee,
            completedAppointments: maxAppointments,
        };

    }, [allAppointments, allUsers]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4">
                <TrophyIcon className="w-6 h-6 mr-2 text-yellow-500"/>
                Nhân viên xuất sắc của tháng
            </h2>
            {employeeOfMonth ? (
                <div className="flex items-center gap-4">
                    <img
                        src={employeeOfMonth.profilePictureUrl}
                        alt={employeeOfMonth.name}
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-yellow-300"
                    />
                    <div>
                        <p className="text-lg font-bold text-brand-dark">{employeeOfMonth.name}</p>
                        <p className="text-sm text-gray-500">{employeeOfMonth.role}</p>
                        <p className="text-md font-semibold text-green-600 mt-1">
                            {employeeOfMonth.completedAppointments} lịch hẹn hoàn thành
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Chưa có đủ dữ liệu cho tháng này.</p>
                </div>
            )}
        </div>
    );
};

export default EmployeeOfMonth;
