import { getUnreadNotificationsCount, getCurrentUser, getNotifications } from './apiService';
import { pushNotificationService } from './pushNotificationService';
import { Notification } from '../types';

class NotificationPollingService {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(count: number) => void> = new Set();
  private lastCount: number = 0;
  private lastNotificationIds: Set<number> = new Set();

  start() {
    if (this.pollingInterval) {
      return; // Already running
    }

    // Poll every 30 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const count = await getUnreadNotificationsCount(user.id);
        
        // If count increased, check for new notifications
        if (count > this.lastCount) {
          await this.checkForNewNotifications(user.id);
        }
        
        // Only notify if count changed
        if (count !== this.lastCount) {
          this.lastCount = count;
          this.notifyListeners(count);
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000); // 30 seconds

    // Also check immediately on start
    this.checkNow();
  }

  async checkForNewNotifications(userId: number | string) {
    try {
      const notifications = await getNotifications(String(userId));
      const unreadNotifications = notifications.filter((n: Notification) => !n.isRead);
      
      // Find new notifications
      const newNotifications = unreadNotifications.filter(
        (n: Notification) => !this.lastNotificationIds.has(Number(n.id))
      );
      
      // Show push notification for each new notification
      for (const notification of newNotifications) {
        await this.showPushNotificationForType(notification);
        this.lastNotificationIds.add(Number(notification.id));
      }
    } catch (error) {
      console.error('Error checking new notifications:', error);
    }
  }

  async showPushNotificationForType(notification: Notification) {
    const notificationTypeMap: { [key: string]: string } = {
      'booking_confirmed': '✅ Lịch hẹn đã xác nhận',
      'booking_reminder': '⏰ Nhắc nhở lịch hẹn',
      'booking_cancelled': '❌ Lịch hẹn đã hủy',
      'voucher_redeemed': '🎁 Đổi voucher thành công',
      'payment_success': '💳 Thanh toán thành công',
    };

    const title = notificationTypeMap[notification.type] || '🔔 Thông báo mới';
    
    await pushNotificationService.showLocalNotification(
      title,
      notification.message,
      { 
        notificationId: notification.id,
        type: notification.type,
        relatedId: notification.relatedId 
      }
    );
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async checkNow() {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const count = await getUnreadNotificationsCount(user.id);
      
      // If count increased, check for new notifications
      if (count > this.lastCount) {
        await this.checkForNewNotifications(user.id);
      }
      
      this.lastCount = count;
      this.notifyListeners(count);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }

  subscribe(callback: (count: number) => void) {
    this.listeners.add(callback);
    // Immediately call with current count
    callback(this.lastCount);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(count: number) {
    this.listeners.forEach(callback => callback(count));
  }

  reset() {
    this.lastCount = 0;
    this.lastNotificationIds.clear();
    this.notifyListeners(0);
  }
}

export const notificationPolling = new NotificationPollingService();
