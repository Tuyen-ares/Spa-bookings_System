import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApi } from './src/services/apiService';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log('App: Initializing...');
        // Initialize AsyncStorage
        await AsyncStorage.getItem('token');
        console.log('App: AsyncStorage initialized');
        // Initialize API client
        await initializeApi();
        console.log('App: API client initialized');
        setIsReady(true);
        console.log('App: Ready!');
        setError(null);
      } catch (error: any) {
        console.error('Error preparing app:', error);
        // Don't set error state - allow app to continue
        // API initialization failures should not block UI
        console.warn('⚠️ App will continue despite initialization warning');
        setError(null);
        // Still set ready even if there's an error
        setIsReady(true);
      }
    };

    prepareApp();
  }, []);

  // Error boundary - show error if initialization failed
  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
          <RNStatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <View style={styles.loadingContent}>
            <Text style={styles.errorText}>Lỗi khởi tạo ứng dụng</Text>
            <Text style={styles.errorDetail}>{error.message}</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
          <RNStatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Đang tải ứng dụng...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <RNStatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
