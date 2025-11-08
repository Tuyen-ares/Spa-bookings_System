
import React from 'react';
import { Link } from 'react-router-dom';
import type { Service } from '../types';
import { StarIcon } from '../shared/icons';

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
      className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative overflow-hidden">
        <img
          className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-300"
          src={service.imageUrl}
          alt={service.name}
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {service.discountPrice && (
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              ƯU ĐÃI -{discountPercent}%
            </span>
          )}
          {service.isHot && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              HOT
            </span>
          )}
          {service.isNew && (
            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              MỚI
            </span>
          )}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="relative text-lg font-bold font-serif text-brand-dark mb-2 h-14 group/tooltip">
          {service.name}
          <span className="absolute hidden group-hover/tooltip:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1.5 px-3 z-10 transition-opacity duration-300">
            {service.description}
          </span>
        </h3>
        <p className="text-brand-text text-sm mb-4 h-10 overflow-hidden">{service.description}</p>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4 text-sm">
            <span className="text-brand-text">
              <strong>Giá: </strong>
              {service.discountPrice ? (
                <span className="text-red-600 font-bold">{formatPrice(service.discountPrice)}</span>
              ) : (
                <span className="text-brand-primary font-bold">{formatPrice(service.price)}</span>
              )}
            </span>
            <span className="text-brand-text">
              <strong>Thời gian: </strong>{service.duration} phút
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 mb-5">
            <div className="flex items-center">
              <span> {/* Wrap StarIcon for semantic correctness */}
                <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
                <span>{service.rating} ({service.reviewCount})</span>
              </span>
            </div>
            {service.discountPrice && (
              <span className="text-gray-400 line-through">{formatPrice(service.price)}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to={`/service/${service.id}`} className="text-center block bg-brand-secondary text-brand-dark font-semibold py-2 px-4 rounded-md hover:bg-brand-primary hover:text-white transition-colors duration-300 text-sm">
              Chi tiết
            </Link>
            <Link to={`/booking?serviceId=${service.id}`} className="text-center block bg-brand-dark text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary transition-colors duration-300 text-sm">
              Đặt ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
