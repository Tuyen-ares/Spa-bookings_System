import React, { useEffect, useState } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApi } from './src/services/apiService';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Initialize AsyncStorage
        await AsyncStorage.getItem('token');
        // Initialize API client
        await initializeApi();
        setIsReady(true);
      } catch (error) {
        console.error('Error preparing app:', error);
        setIsReady(true);
      }
    };

    prepareApp();
  }, []);

  if (!isReady) {
    return null;
  }

  return <RootNavigator />;
}
