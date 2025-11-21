import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Staff Screens
import {
  StaffDashboardScreen,
  StaffAppointmentsScreen,
  StaffScheduleScreen,
  StaffClientsScreen,
  StaffProfileScreen
} from '../screens/staff';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#10B981' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600' }
    }}
  >
    <Stack.Screen name="DashboardMain" component={StaffDashboardScreen} options={{ title: 'Trang chủ' }} />
  </Stack.Navigator>
);

// Appointments Stack
const AppointmentsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#10B981' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600' }
    }}
  >
    <Stack.Screen name="AppointmentsList" component={StaffAppointmentsScreen} options={{ title: 'Lịch hẹn' }} />
  </Stack.Navigator>
);

// Schedule Stack
const ScheduleStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#10B981' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600' }
    }}
  >
    <Stack.Screen name="ScheduleMain" component={StaffScheduleScreen} options={{ title: 'Lịch làm việc' }} />
  </Stack.Navigator>
);

// Clients Stack
const ClientsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#10B981' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600' }
    }}
  >
    <Stack.Screen name="ClientsList" component={StaffClientsScreen} options={{ title: 'Khách hàng' }} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#10B981' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '600' }
    }}
  >
    <Stack.Screen name="ProfileMain" component={StaffProfileScreen} options={{ title: 'Hồ sơ' }} />
  </Stack.Navigator>
);

export const StaffNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 4,
          fontWeight: '600'
        }
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
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
        name="ScheduleTab"
        component={ScheduleStack}
        options={{
          title: 'Lịch làm',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="ClientsTab"
        component={ClientsStack}
        options={{
          title: 'Khách hàng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          )
        }}
      />
    </Tab.Navigator>
  );
};
