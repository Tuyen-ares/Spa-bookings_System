

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Promotion } from '../../types';
import { ClockIcon } from '../../shared/icons';

interface PromotionCardProps {
  promotion: Promotion;
}

// Countdown Hook
const useCountdown = (targetDate: string) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    return timeLeft;
};


const PromotionCard: React.FC<PromotionCardProps> = ({ promotion }) => {
  const timeLeft = useCountdown(promotion.expiryDate);
  const isExpired = timeLeft.days <= 0 && timeLeft.hours <= 0 && timeLeft.minutes <= 0 && timeLeft.seconds <= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  
  const discountDisplay = promotion.discountType === 'percentage' 
    ? `${promotion.discountValue}%` 
    : formatPrice(promotion.discountValue);

  const bookingLink = `/booking?promoCode=${promotion.code}${
    promotion.applicableServiceIds && promotion.applicableServiceIds.length > 0
      ? `&serviceId=${promotion.applicableServiceIds[0]}`
      : ''
  }`;

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col group transition-all duration-300 ease-out ${isExpired ? 'opacity-60 grayscale' : ''}`}>
      <div className="relative overflow-hidden">
        <img 
            className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-300" 
            src={promotion.imageUrl} 
            alt={promotion.title} 
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                ƯU ĐÃI -{discountDisplay}
            </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold font-serif text-brand-dark mb-2 h-14 line-clamp-2">
            {promotion.title}
        </h3>
        <p className="text-brand-text text-sm mb-4 h-10 overflow-hidden line-clamp-2">{promotion.description}</p>
        
        <div className="mt-auto">
            <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-brand-text">
                    <strong>Giảm giá: </strong>
                    <span className="text-red-600 font-bold">{discountDisplay}</span>
                </span>
                 <span className="text-brand-text flex items-center gap-1">
                    <ClockIcon className="w-4 h-4 text-gray-500"/>
                    <strong>Hạn: </strong>
                    {isExpired ? 'Hết hạn' : `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`}
                </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
                <Link to={bookingLink} className="text-center block bg-brand-dark text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary transition-colors duration-300 text-sm">
                    Áp dụng & Đặt lịch
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionCard;