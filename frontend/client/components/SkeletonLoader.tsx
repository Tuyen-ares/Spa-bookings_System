import React from 'react';

export const ServiceCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col animate-pulse">
      <div className="w-full h-48 bg-gray-200"></div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex items-center justify-between mb-5">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-gray-200 rounded-md"></div>
            <div className="h-10 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
