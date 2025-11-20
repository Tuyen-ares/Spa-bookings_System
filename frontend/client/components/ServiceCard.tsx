
import React from 'react';
import { Link } from 'react-router-dom';
import type { Service } from '../../types';
import { StarIcon } from '../../shared/icons';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  
  const discountPercent = service.discountPrice 
    ? Math.round(((service.price - service.discountPrice) / service.price) * 100)
    : 0;

  return (
    <div 
        className="bg-white rounded-lg shadow-soft-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-soft-xl hover:-translate-y-1 border border-gray-200/50"
    >
      <div className="relative overflow-hidden bg-gray-100">
        <img 
            className="w-full h-32 object-contain object-center transform group-hover:scale-110 transition-transform duration-500 ease-out" 
            src={service.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'} 
            alt={service.name} 
            loading="lazy"
            style={{ 
                objectFit: 'contain',
                objectPosition: 'center',
                width: '100%',
                height: '100%'
            }}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
            {service.discountPrice && (
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    ƯU ĐÃI -{discountPercent}%
                </span>
            )}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-base font-bold font-serif text-brand-text mb-3 line-clamp-2 min-h-[48px]">
            {service.name}
        </h3>
        
        <div className="mt-auto">
             <div className="flex justify-between items-start mb-3 text-sm">
                {/* Left Column: Price and Rating */}
                <div className="flex flex-col gap-1">
                    <span className="text-brand-text">
                        <strong>Giá: </strong>
                         {service.discountPrice ? (
                            <span className="text-red-600 font-bold">{formatPrice(service.discountPrice)}</span>
                          ) : (
                            <span className="text-brand-primary font-bold">{formatPrice(service.price)}</span>
                          )}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                        <StarIcon className="w-5 h-5 text-yellow-400"/>
                        <span>{service.rating} ({service.reviewCount})</span>
                    </div>
                </div>

                {/* Right Column */}
                <div className="text-right">
                    <span className="text-brand-text">
                        <strong>Thời gian: </strong>{service.duration} phút
                    </span>
                    {service.discountPrice && (
                        <span className="block text-gray-400 line-through text-xs mt-1">{formatPrice(service.price)}</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link to={`/service/${service.id}`} className="text-center block bg-brand-secondary text-brand-text font-semibold py-1.5 px-3 rounded-lg hover:bg-brand-primary hover:text-white transition-colors duration-300 text-xs">
                    Đọc thêm
                </Link>
                <Link to={`/booking?serviceId=${service.id}`} className="text-center block bg-brand-dark text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-brand-primary transition-colors duration-300 text-xs">
                    Đặt ngay
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
