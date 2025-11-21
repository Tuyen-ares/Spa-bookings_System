import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { AdminNavigator } from './AdminNavigator';
import { StaffNavigator } from './StaffNavigator';
import type { User } from '../types';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');
        
        if (token && userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
        setError(null);
      } catch (error: any) {
        console.error('Error checking auth:', error);
        setError(error);
        setIsLoggedIn(false);
      }
    };

    // Initial check
    checkAuth();

    // Listen for storage changes (login/logout) - check every 2 seconds instead of 1
    // This reduces unnecessary re-renders
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  const getNavigatorByRole = () => {
    if (!user) return MainNavigator;
    
    switch (user.role) {
      case 'Admin':
        return AdminNavigator;
      case 'Staff':
        return StaffNavigator;
      case 'Client':
      default:
        return MainNavigator;
    }
  };

  if (isLoggedIn === null) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <StatusBar style="auto" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          {error && (
            <View style={{ marginTop: 16, padding: 16 }}>
              <Text style={{ color: '#ef4444', fontSize: 12, textAlign: 'center' }}>
                Lỗi: {error.message}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const MainNav = getNavigatorByRole();

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' }
        }}
      >
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={MainNav} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
