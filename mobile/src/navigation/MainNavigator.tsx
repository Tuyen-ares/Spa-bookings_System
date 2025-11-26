import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ServicesListScreen } from '../screens/services/ServicesListScreen';
import { ServiceDetailScreen } from '../screens/services/ServiceDetailScreen';
import { BookingScreen } from '../screens/booking/BookingScreen';
import { AppointmentsScreen } from '../screens/appointments/AppointmentsScreen';
import { AppointmentDetailScreen } from '../screens/appointments/AppointmentDetailScreen';
import { PromotionsScreen } from '../screens/promotions/PromotionsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { RewardsScreen } from '../screens/profile/RewardsScreen';
import { TreatmentCoursesScreen } from '../screens/treatments/TreatmentCoursesScreen';
import { TreatmentCourseDetailScreen } from '../screens/treatments/TreatmentCourseDetailScreen';
import { ChatbotScreen } from '../screens/client/ChatbotScreen';
import { notificationPolling } from '../services/notificationPollingService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Home Stack
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E91E63'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600'
        }
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Trang chủ' }}
      />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ title: 'Chi tiết dịch vụ' }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'Đặt lịch' }}
      />
    </Stack.Navigator>
  );
};

// Services Stack
const ServicesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E91E63'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600'
        }
      }}
    >
      <Stack.Screen
        name="ServicesList"
        component={ServicesListScreen}
        options={{ title: 'Dịch vụ' }}
      />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ title: 'Chi tiết dịch vụ' }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'Đặt lịch' }}
      />
    </Stack.Navigator>
  );
};

// Appointments Stack
const AppointmentsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E91E63'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600'
        }
      }}
    >
      <Stack.Screen
        name="AppointmentsList"
        component={AppointmentsScreen}
        options={{ title: 'Lịch hẹn' }}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ title: 'Chi tiết lịch hẹn' }}
      />
    </Stack.Navigator>
  );
};

// Treatment Courses Stack
const TreatmentsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E91E63'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600'
        }
      }}
    >
      <Stack.Screen
        name="TreatmentCourses"
        component={TreatmentCoursesScreen}
        options={{ title: 'Liệu trình' }}
      />
      <Stack.Screen
        name="TreatmentCourseDetail"
        component={TreatmentCourseDetailScreen}
        options={{ title: 'Chi tiết liệu trình' }}
      />
    </Stack.Navigator>
  );
};

// Promotions Stack
const PromotionsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E91E63'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600'
        }
      }}
    >
      <Stack.Screen
        name="PromotionsMain"
        component={PromotionsScreen}
        options={{ title: 'Voucher của tôi' }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E91E63'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600'
        }
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Hồ sơ' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Chatbot Stack
const ChatbotStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen
        name={"Chatbot" as any}
        component={ChatbotScreen}
        options={{ title: 'Trợ lý ảo' }}
      />
    </Stack.Navigator>
  );
};

export const MainNavigator = () => {
  const [notificationCount, setNotificationCount] = React.useState(0);

  React.useEffect(() => {
    // Subscribe to notification count updates
    const unsubscribe = notificationPolling.subscribe((count) => {
      setNotificationCount(count);
    });

    return unsubscribe;
  }, []);

  // Notification Badge Component
  const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
    if (count === 0) return null;
    
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 4,
          fontWeight: '600'
        }
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesStack}
        options={{
          title: 'Dịch vụ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsStack}
        options={{
          title: 'Lịch hẹn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="TreatmentsTab"
        component={TreatmentsStack}
        options={{
          title: 'Liệu trình',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="PromotionsTab"
        component={PromotionsStack}
        options={{
          title: 'Voucher',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="ChatbotTab"
        component={ChatbotStack}
        options={{
          title: 'Trợ lý',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="person" color={color} size={size} />
              <NotificationBadge count={notificationCount} />
            </View>
          )
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
