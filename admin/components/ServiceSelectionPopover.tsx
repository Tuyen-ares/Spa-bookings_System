import React, { useRef, useEffect, useMemo } from 'react';
import type { Service } from '../../types';

interface ServiceSelectionPopoverProps {
    time: string;
    currentServiceIds: string[];
    onClose: () => void;
    onServiceChange: (serviceId: string, checked: boolean) => void;
    onUpdateAllServices: (serviceIds: string[]) => void; // New prop for bulk updates
    anchorEl: HTMLButtonElement | null;
    availableServices: Service[];
    parentRect: DOMRect; // Rect of the scrollable parent modal content
    buttonRect: DOMRect; // Rect of the button that opened it
}

const ServiceSelectionPopover: React.FC<ServiceSelectionPopoverProps> = ({
    time,
    currentServiceIds,
    onClose,
    onServiceChange,
    onUpdateAllServices,
    anchorEl,
    availableServices,
    parentRect,
    buttonRect,
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && anchorEl && !anchorEl.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, anchorEl]);

    const style: React.CSSProperties = useMemo(() => {
        if (!buttonRect || !parentRect) return {};

        const popoverWidth = 220; // Approx width of the popover
        const contentHeight = Math.min(availableServices.length * 28 + 80, 250); // Adjusted for buttons
        const popoverHeight = contentHeight;

        let top = buttonRect.top - parentRect.top;
        let left = buttonRect.right - parentRect.left + 8; // Default to right of button

        if (left + popoverWidth > parentRect.width - 20) {
            left = buttonRect.left - parentRect.left - popoverWidth - 8;
        }
        if (left < 10) {
            left = 10;
        }
        
        if (top + popoverHeight > parentRect.height - 10) {
            top = parentRect.height - popoverHeight - 10;
        }
        if (top < 10) {
             top = 10;
        }

        return { top: `${top}px`, left: `${left}px` };
    }, [buttonRect, parentRect, availableServices.length]);

    const handleSelectAll = () => {
        const allServiceIds = availableServices.map(s => s.id);
        onUpdateAllServices(allServiceIds);
    };
    
    const handleDeselectAll = () => {
        onUpdateAllServices([]);
    };

    return (
        <div
            ref={popoverRef}
            className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[220px]"
            style={style}
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-selection-title"
        >
            <h4 id="service-selection-title" className="font-semibold text-gray-800 mb-3 text-sm">Dịch vụ cho {time}</h4>
            
            <div className="flex items-center gap-2 mb-2">
                <button onClick={handleSelectAll} className="text-xs text-blue-600 hover:underline">Chọn tất cả</button>
                <span className="text-gray-300">|</span>
                <button onClick={handleDeselectAll} className="text-xs text-blue-600 hover:underline">Bỏ chọn tất cả</button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 border-t pt-2">
                {availableServices.length > 0 ? (
                    availableServices.map(service => (
                        <label key={service.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                                type="checkbox"
                                checked={currentServiceIds.includes(service.id)}
                                onChange={(e) => onServiceChange(service.id, e.target.checked)}
                                className="rounded text-brand-primary focus:ring-brand-primary"
                            />
                            {service.name}
                        </label>
                    ))
                ) : (
                    <p className="text-xs text-gray-500">Nhân viên này chưa có chuyên môn hoặc không có dịch vụ phù hợp.</p>
                )}
            </div>
            <button
                onClick={onClose}
                className="mt-4 w-full bg-brand-secondary text-brand-dark px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-brand-primary hover:text-white transition-colors"
                aria-label="Đóng chọn dịch vụ"
            >
                Đóng
            </button>
        </div>
    );
};

export default ServiceSelectionPopover;