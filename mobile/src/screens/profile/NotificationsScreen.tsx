 import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getCurrentUser 
} from '../../services/apiService';
import { Notification } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { notificationPolling } from '../../services/notificationPollingService';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        // Update polling service
        notificationPolling.checkNow();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    if (notification.type === 'booking_confirmed' || notification.type === 'booking_reminder') {
      if (notification.relatedId) {
        navigation.navigate('AppointmentDetail', { id: notification.relatedId });
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // Update polling service
      notificationPolling.checkNow();
      Alert.alert('Thành công', 'Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả đã đọc');
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    // Check for birthday notification
    if (notification.title && notification.title.includes('🎉 Chúc mừng sinh nhật')) {
      return 'gift';
    }
    // Check for new client notification
    if (notification.title && notification.title.includes('🎁 Chào mừng khách hàng mới')) {
      return 'gift';
    }
    // Check for tier voucher notification
    if (notification.title && (notification.title.includes('Voucher hạng') || notification.title.includes('Voucher VIP'))) {
      return 'gift';
    }
    
    switch (notification.type) {
      case 'booking_confirmed':
      case 'appointment_confirmed':
        return 'checkmark-circle';
      case 'booking_reminder':
      case 'appointment_reminder':
        return 'alarm';
      case 'booking_cancelled':
      case 'appointment_cancelled':
        return 'close-circle';
      case 'payment_success':
      case 'payment_received':
        return 'card';
      case 'promotion':
      case 'promo_alert':
      case 'birthday_gift':
        return 'gift';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (notification: Notification) => {
    // Check for birthday notification
    if (notification.title && notification.title.includes('🎉 Chúc mừng sinh nhật')) {
      return { icon: '#9333ea', bg: '#f3e8ff' }; // Purple
    }
    // Check for new client notification
    if (notification.title && notification.title.includes('🎁 Chào mừng khách hàng mới')) {
      return { icon: '#9333ea', bg: '#f3e8ff' }; // Purple
    }
    // Check for tier voucher notification
    if (notification.title && (notification.title.includes('Voucher hạng') || notification.title.includes('Voucher VIP'))) {
      return { icon: '#9333ea', bg: '#f3e8ff' }; // Purple
    }
    
    switch (notification.type) {
      case 'booking_confirmed':
      case 'appointment_confirmed':
        return { icon: '#10b981', bg: '#d1fae5' }; // Green
      case 'booking_reminder':
      case 'appointment_reminder':
        return { icon: '#f59e0b', bg: '#fef3c7' }; // Amber
      case 'booking_cancelled':
      case 'appointment_cancelled':
        return { icon: '#ef4444', bg: '#fee2e2' }; // Red
      case 'payment_success':
      case 'payment_received':
        return { icon: '#3b82f6', bg: '#dbeafe' }; // Blue
      case 'promotion':
      case 'promo_alert':
      case 'birthday_gift':
        return { icon: '#9333ea', bg: '#f3e8ff' }; // Purple
      default:
        return { icon: '#6b7280', bg: '#f3f4f6' }; // Gray
    }
  };

  const getNotificationTitle = (notification: Notification) => {
    // Return title as-is if it already has emoji or special formatting
    if (notification.title && (notification.title.includes('🎉') || notification.title.includes('🎁'))) {
      return notification.title;
    }
    
    switch (notification.type) {
      case 'booking_confirmed':
      case 'appointment_confirmed':
        return 'Lịch hẹn đã được xác nhận';
      case 'booking_cancelled':
      case 'appointment_cancelled':
        return 'Lịch hẹn đã hủy';
      case 'booking_reminder':
      case 'appointment_reminder':
        return 'Nhắc nhở lịch hẹn';
      case 'payment_success':
      case 'payment_received':
        return 'Thanh toán thành công';
      case 'promotion':
      case 'promo_alert':
        return '🎁 Ưu đãi mới';
      case 'birthday_gift':
        return '🎉 Chúc mừng sinh nhật!';
      default:
        return notification.title || 'Thông báo';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const colorConfig = getNotificationColor(item);
    const iconName = getNotificationIcon(item);
    const displayTitle = getNotificationTitle(item);
    
    // Check if message contains cancellation reason
    const hasCancellationReason = item.type === 'booking_cancelled' || item.type === 'appointment_cancelled';
    const reasonMatch = item.message && item.message.includes('Lý do:');
    const messageParts = reasonMatch ? item.message.split('Lý do:') : [item.message];
    const mainMessage = messageParts[0]?.trim() || item.message;
    const cancellationReason = reasonMatch ? messageParts[1]?.trim() : null;

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: colorConfig.bg }]}>
          <Ionicons 
            name={iconName as any} 
            size={24} 
            color={colorConfig.icon} 
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
              {displayTitle}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={reasonMatch ? 3 : 2}>
            {mainMessage}
          </Text>
          {cancellationReason && (
            <View style={styles.cancellationReasonBox}>
              <Text style={styles.cancellationReasonLabel}>Lý do hủy:</Text>
              <Text style={styles.cancellationReasonText}>{cancellationReason}</Text>
            </View>
          )}
          <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>Bạn có {unreadCount} thông báo chưa đọc</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} />
        }
        ListEmptyComponent={
          <EmptyState 
            icon="notifications-off-outline"
            title="Chưa có thông báo"
            message="Bạn sẽ nhận được thông báo về lịch hẹn và ưu đãi tại đây"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d62976',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center'
  },
  markAllButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  unreadBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24'
  },
  unreadText: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '600'
  },
  listContent: {
    padding: 16
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  unreadCard: {
    backgroundColor: '#fef2f7',
    borderWidth: 1,
    borderColor: '#fce4ec'
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  notificationContent: {
    flex: 1
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#d62976'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d62976',
    marginLeft: 8
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  cancellationReasonBox: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    marginBottom: 4
  },
  cancellationReasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4
  },
  cancellationReasonText: {
    fontSize: 13,
    color: '#b91c1c',
    lineHeight: 18
  }
});
