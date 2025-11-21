import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<Props> = ({
  label,
  error,
  hint,
  iconName,
  containerStyle,
  style,
  ...textInputProps
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.inputWrapper}>
        {iconName && (
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={20} color="#8b5cf6" />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            iconName && styles.inputWithIcon,
            error && styles.inputError,
            style
          ]}
          placeholderTextColor="#999"
          {...textInputProps}
        />
      </View>

      {hint && !error && (
        <Text style={styles.hint}>{hint}</Text>
      )}

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  inputWrapper: {
    position: 'relative'
  },
  iconContainer: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333'
  },
  inputWithIcon: {
    paddingLeft: 44
  },
  inputError: {
    borderColor: '#ef4444'
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6
  }
});
