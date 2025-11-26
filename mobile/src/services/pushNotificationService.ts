import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
// Wrap in try-catch to handle Expo Go limitations
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.warn('expo-notifications not fully supported in Expo Go (this is expected)');
}

class PushNotificationService {
  private isSupported: boolean = true;

  async requestPermissions() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#d62976',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        this.isSupported = false;
        return false;
      }
      
      console.log('Push notification permissions granted');
      return true;
    } catch (error) {
      console.warn('Push notifications not available (Expo Go limitation)');
      this.isSupported = false;
      return false;
    }
  }

  async showLocalNotification(title: string, body: string, data?: any) {
    if (!this.isSupported) {
      console.log('Push notification skipped (not supported in Expo Go):', title);
      return;
    }
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // Show immediately
      });
      console.log('Push notification sent:', title);
    } catch (error) {
      console.warn('Error showing notification:', error);
    }
  }

  async showAppointmentConfirmedNotification(appointmentId: number) {
    await this.showLocalNotification(
      '✅ Lịch hẹn đã được xác nhận',
      'Lịch hẹn của bạn đã được admin xác nhận. Nhấn để xem chi tiết.',
      { type: 'appointment_confirmed', appointmentId }
    );
  }

  async showAppointmentReminderNotification(appointmentId: number, time: string) {
    await this.showLocalNotification(
      '⏰ Nhắc nhở lịch hẹn',
      `Bạn có lịch hẹn vào ${time}. Vui lòng đến đúng giờ!`,
      { type: 'appointment_reminder', appointmentId }
    );
  }

  async showVoucherNotification() {
    await this.showLocalNotification(
      '🎁 Voucher mới',
      'Bạn có voucher mới! Nhấn để xem chi tiết.',
      { type: 'voucher' }
    );
  }

  async cancelAllNotifications() {
    if (!this.isSupported) {
      return;
    }
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('Error canceling notifications:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
