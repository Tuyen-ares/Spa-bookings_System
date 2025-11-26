import React, { useEffect, useState } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApi } from './src/services/apiService';
import { notificationPolling } from './src/services/notificationPollingService';
import { pushNotificationService } from './src/services/pushNotificationService';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Initialize AsyncStorage
        await AsyncStorage.getItem('token');
        // Initialize API client
        await initializeApi();
        
        // Request notification permissions (safe - handles Expo Go gracefully)
        try {
          await pushNotificationService.requestPermissions();
        } catch (notifError) {
          console.warn('Push notifications setup failed (expected in Expo Go):', notifError);
        }
        
        // Start notification polling service
        notificationPolling.start();
        
        setIsReady(true);
      } catch (error) {
        console.error('Error preparing app:', error);
        setIsReady(true);
      }
    };

    prepareApp();

    // Cleanup on unmount
    return () => {
      notificationPolling.stop();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return <RootNavigator />;
}
