import React from 'react';
import { Link } from 'react-router-dom';
import type { TreatmentCourse } from '../../types';
import { StarIcon } from '../../shared/icons';

interface TreatmentCourseCardProps {
  treatmentCourse: TreatmentCourse;
}

const TreatmentCourseCard: React.FC<TreatmentCourseCardProps> = ({ treatmentCourse }) => {
  // Format week days
  const formatWeekDays = (weekDays: number[]) => {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return weekDays.map(day => dayNames[day]).join(', ');
  };

  // Get treatment course image or use placeholder
  const imageUrl = treatmentCourse.imageUrl || `https://picsum.photos/seed/${treatmentCourse.id}/400/300`;

  return (
    <div 
      className="bg-white rounded-lg shadow-soft-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-soft-xl hover:-translate-y-1 border border-gray-200/50"
    >
      <div className="relative overflow-hidden">
        <img 
          className="w-full h-44 object-cover transform group-hover:scale-110 transition-transform duration-500 ease-out" 
          src={imageUrl} 
          alt={treatmentCourse.serviceName} 
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            LIỆU TRÌNH
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold font-serif text-brand-text mb-4 line-clamp-2 min-h-[56px]">
          {treatmentCourse.serviceName}
        </h3>
        
        {treatmentCourse.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {treatmentCourse.description}
          </p>
        )}
        
        <div className="mt-auto">
          <div className="flex justify-between items-start mb-4 text-sm">
            {/* Left Column: Sessions info */}
            <div className="flex flex-col gap-1">
              <span className="text-brand-text">
                <strong>Tổng số buổi: </strong>
                <span className="text-brand-primary font-bold">{treatmentCourse.totalSessions} buổi</span>
              </span>
              <div className="text-gray-500">
                <span>{treatmentCourse.sessionsPerWeek} buổi/tuần</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="text-right">
              <span className="text-brand-text">
                <strong>Thời gian/buổi: </strong>{treatmentCourse.sessionDuration} phút
              </span>
              {treatmentCourse.weekDays && treatmentCourse.weekDays.length > 0 && (
                <div className="text-gray-500 text-xs mt-1">
                  {formatWeekDays(treatmentCourse.weekDays)}
                </div>
              )}
            </div>
          </div>

          {treatmentCourse.sessionTime && (
            <div className="mb-4 text-sm text-gray-600">
              <strong>Giờ cố định: </strong>{treatmentCourse.sessionTime}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link 
              to={`/treatment-courses/${treatmentCourse.id}`} 
              className="text-center block bg-brand-secondary text-brand-text font-semibold py-2 px-4 rounded-lg hover:bg-brand-primary hover:text-white transition-colors duration-300 text-sm"
            >
              Đọc thêm
            </Link>
            <Link 
              to={`/booking?treatmentCourseId=${treatmentCourse.id}`} 
              className="text-center block bg-brand-dark text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-primary transition-colors duration-300 text-sm"
            >
              Đặt ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentCourseCard;

