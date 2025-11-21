import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title?: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<Props> = ({ 
  title,
  message, 
  icon,
  iconName = 'alert-circle-outline' 
}) => {
  const displayIcon = icon || iconName;
  
  return (
    <View style={styles.container}>
      <Ionicons name={displayIcon} size={64} color="#ccc" />
      {title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  message: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  }
});
