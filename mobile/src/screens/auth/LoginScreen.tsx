import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { login, initializeApi } from '../../services/apiService';
import type { LoginCredentials } from '../../types';

type Props = NativeStackScreenProps<any, 'Login'>;

const COLORS = {
  brandPrimary: '#d62976',
  brandAccent: '#c91860',
  brandDark: '#1f2937',
  brandMuted: '#6b7280',
  background: '#fff5f8'
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!credentials.email || !credentials.password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      // Initialize API client
      await initializeApi();
      
      // Login
      await login(credentials);
      
      // Reset form
      setCredentials({ email: '', password: '' });
      
      // RootNavigator will automatically navigate based on user role
      // No need to manually navigate
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.blurCircle, styles.blurTopLeft]} />
      <View style={[styles.blurCircle, styles.blurBottomRight]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            {navigation.canGoBack() ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}
            <View style={styles.logoWrapper}>
              <Text style={styles.logoIcon}>🌸</Text>
            </View>
            <View style={styles.backButtonPlaceholder} />
          </View>

          <Text style={styles.heroTitle}>Chào Mừng</Text>
          <Text style={styles.heroSubtitle}>
            Đăng nhập để tận hưởng không gian thư giãn
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Vui lòng nhập email của bạn"
              placeholderTextColor="#d1d5db"
              value={credentials.email}
              onChangeText={(text) => setCredentials({ ...credentials, email: text })}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TouchableOpacity
                disabled={loading}
                onPress={() => Alert.alert('Thông báo', 'Chức năng quên mật khẩu đang được bổ sung.')}>
                <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Vui lòng nhập mật khẩu của bạn"
              placeholderTextColor="#d1d5db"
              value={credentials.password}
              onChangeText={(text) => setCredentials({ ...credentials, password: text })}
              editable={!loading}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng Nhập Ngay</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
          >
            <Text style={styles.footerLink}>Đăng ký miễn phí</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  blurCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.25
  },
  blurTopLeft: {
    top: -40,
    left: -50,
    backgroundColor: COLORS.brandPrimary
  },
  blurBottomRight: {
    bottom: -60,
    right: -50,
    backgroundColor: COLORS.brandAccent
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center'
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 32,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e8ff'
  },
  backButtonText: {
    fontSize: 18,
    color: COLORS.brandPrimary,
    fontWeight: '700'
  },
  backButtonPlaceholder: {
    width: 40
  },
  logoWrapper: {
    alignItems: 'center'
  },
  logoIcon: {
    fontSize: 48,
    textAlign: 'center'
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.brandPrimary,
    letterSpacing: 2
  },
  logoSubText: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: COLORS.brandMuted,
    letterSpacing: 4
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.brandPrimary,
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center'
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.brandMuted,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brandPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.brandDark,
    backgroundColor: '#ffffff'
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brandPrimary
  },
  loginButton: {
    backgroundColor: COLORS.brandPrimary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.brandPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  disabledButton: {
    opacity: 0.6
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  footerRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: COLORS.brandMuted,
    fontSize: 14
  },
  footerLink: {
    color: COLORS.brandPrimary,
    fontWeight: '700'
  }
});
