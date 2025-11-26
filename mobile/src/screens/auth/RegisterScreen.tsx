import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { register, initializeApi } from '../../services/apiService';
import type { RegisterData } from '../../types';

type Props = NativeStackScreenProps<any, 'Register'>;

const COLORS = {
  brandPrimary: '#d62976',
  brandAccent: '#f472b6',
  brandDark: '#1f2937',
  brandMuted: '#6b7280',
  background: '#fff5f8'
};

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    birthday: '',
    gender: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1)); // Default to Jan 1, 2000

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên, email và mật khẩu');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await initializeApi();
      await register(formData);
      setConfirmPassword('');
      navigation.replace('Main');
    } catch (error: any) {
      console.error('Register error:', error);
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof RegisterData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      // Format to YYYY-MM-DD for backend
      const formattedDate = date.toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, birthday: formattedDate }));
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.blurCircle, styles.blurTopRight]} />
      <View style={[styles.blurCircle, styles.blurBottomLeft]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TouchableOpacity
              style={styles.backChip}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.backChipText}>←</Text>
            </TouchableOpacity>
            <View style={styles.logoWrapper}>
              <Text style={styles.logoIcon}>🌸</Text>
              <Text style={styles.cardTitle}>Đăng Ký Thành Viên</Text>
            </View>
            <View style={styles.backChipSpacer} />
          </View>

          <Text style={styles.subtitle}>
            Chỉ mất vài bước để cập nhật thông tin và đặt lịch nhanh chóng.
          </Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flexItem]}>
              <Text style={styles.label}>HỌ VÀ TÊN</Text>
              <TextInput
                style={styles.input}
                placeholder="Nguyễn Văn A"
                placeholderTextColor="#d1d5db"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                editable={!loading}
              />
            </View>
            <View style={[styles.inputGroup, styles.flexItem]}>
              <Text style={styles.label}>SỐ ĐIỆN THOẠI</Text>
              <TextInput
                style={styles.input}
                placeholder="09xxxxxxxxxx"
                placeholderTextColor="#d1d5db"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                editable={!loading}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor="#d1d5db"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flexItem]}>
              <Text style={styles.label}>GIỚI TÍNH</Text>
              <View style={styles.genderRow}>
                {['Nam', 'Nữ', 'Khác'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.genderChip, formData.gender === option && styles.genderChipActive]}
                    onPress={() => handleChange('gender', option)}
                    disabled={loading}
                  >
                    <Text style={[styles.genderChipText, formData.gender === option && styles.genderChipTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.inputGroup, styles.flexItem]}>
              <Text style={styles.label}>NGÀY SINH</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Text style={[styles.dateText, !formData.birthday && styles.placeholderText]}>
                  {formData.birthday ? formatDisplayDate(formData.birthday) : 'Chọn ngày sinh'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flexItem]}>
              <Text style={styles.label}>MẬT KHẨU</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#d1d5db"
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                editable={!loading}
                secureTextEntry
              />
            </View>
            <View style={[styles.inputGroup, styles.flexItem]}>
              <Text style={styles.label}>XÁC NHẬN MK</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#d1d5db"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Đăng Ký Ngay</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
            <Text style={styles.footerLink}>Đăng nhập ngay</Text>
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
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.18
  },
  blurTopRight: {
    top: -40,
    right: -50,
    backgroundColor: COLORS.brandPrimary
  },
  blurBottomLeft: {
    bottom: -60,
    left: -30,
    backgroundColor: COLORS.brandAccent
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#f4f0ff'
  },
  backChipSpacer: {
    width: 64
  },
  backChipText: {
    fontSize: 12,
    color: COLORS.brandPrimary,
    fontWeight: '700'
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center'
  },
  logoIcon: {
    fontSize: 32,
    marginBottom: 4
  },
  logoTop: {
    fontSize: 12,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: COLORS.brandMuted
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.brandPrimary,
    marginTop: 4
  },
  subtitle: {
    textAlign: 'center',
    color: COLORS.brandMuted,
    marginVertical: 18,
    lineHeight: 20,
    fontSize: 14
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap'
  },
  flexItem: {
    flex: 1,
    minWidth: '48%'
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brandMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  input: {
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    fontSize: 15,
    color: COLORS.brandDark
  },
  dateText: {
    fontSize: 15,
    color: COLORS.brandDark
  },
  placeholderText: {
    color: '#d1d5db'
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0d7ff'
  },
  genderChipActive: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary
  },
  genderChipText: {
    fontSize: 13,
    color: COLORS.brandMuted,
    fontWeight: '600'
  },
  genderChipTextActive: {
    color: '#fff'
  },
  submitButton: {
    backgroundColor: COLORS.brandPrimary,
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.brandPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4
  },
  disabledButton: {
    opacity: 0.6
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  footerRow: {
    marginTop: 20,
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
