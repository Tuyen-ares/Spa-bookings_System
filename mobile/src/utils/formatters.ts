export const formatDate = (date: string): string => {
  try {
    return new Date(date).toLocaleDateString('vi-VN');
  } catch {
    return date;
  }
};

export const formatTime = (date: string): string => {
  try {
    return new Date(date).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return date;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return '#10b981';
    case 'active':
      return '#34d399';
    case 'upcoming':
      return '#3b82f6';
    case 'pending':
      return '#f59e0b';
    case 'cancelled':
      return '#ef4444';
    case 'scheduled':
      return '#8b5cf6';
    case 'expired':
      return '#9ca3af';
    case 'missed':
      return '#f97316';
    default:
      return '#6b7280';
  }
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    completed: 'Hoàn thành',
    active: 'Đang diễn ra',
    upcoming: 'Sắp tới',
    pending: 'Chờ xác nhận',
    cancelled: 'Đã hủy',
    scheduled: 'Đã đặt lịch',
    'in-progress': 'Đang thực hiện',
    expired: 'Hết hạn',
    missed: 'Bỏ lỡ'
  };
  return labels[status] || status;
};
