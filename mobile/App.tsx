import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, SafeAreaView, StatusBar as RNStatusBar } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApi } from './src/services/apiService';

export default function App() {
  const [isReady, setIsReady] = useState(false);

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
      } catch (error) {
        console.error('Error preparing app:', error);
        // Still set ready even if there's an error
        setIsReady(true);
      }
    };

    prepareApp();
  }, []);

  if (!isReady) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <RNStatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Đang tải ứng dụng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <RootNavigator />
    </SafeAreaView>
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
});
