import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AdminStaffScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin Staff Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});
