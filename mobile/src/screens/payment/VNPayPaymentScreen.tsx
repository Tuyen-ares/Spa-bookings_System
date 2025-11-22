import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type VNPayPaymentRouteParams = {
  paymentUrl: string;
  appointmentId: string;
  amount: number;
};

type RootStackParamList = {
  VNPayPayment: VNPayPaymentRouteParams;
};

type VNPayPaymentRouteProp = RouteProp<RootStackParamList, 'VNPayPayment'>;
type VNPayPaymentNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VNPayPayment'>;

// Keep browser session alive
WebBrowser.maybeCompleteAuthSession();

export const VNPayPaymentScreen: React.FC = () => {
  const navigation = useNavigation<VNPayPaymentNavigationProp>();
  const route = useRoute<VNPayPaymentRouteProp>();
  const { paymentUrl, appointmentId, amount } = route.params;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Open VNPay payment URL in browser
    const openPayment = async () => {
      try {
        setLoading(true);
        
        // Open browser with payment URL
        const result = await WebBrowser.openBrowserAsync(paymentUrl, {
          showTitle: true,
          toolbarColor: '#8b5cf6',
          enableBarCollapsing: false,
          showInRecents: true,
        });

        // Check result type
        if (result.type === 'cancel') {
          // User cancelled
          Alert.alert(
            'Đã hủy',
            'Bạn đã hủy thanh toán.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else if (result.type === 'dismiss') {
          // Browser was dismissed - check if payment was completed
          // We'll handle this via deep linking
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error opening payment browser:', error);
        Alert.alert('Lỗi', 'Không thể mở trang thanh toán. Vui lòng thử lại.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    openPayment();
  }, [paymentUrl, navigation]);

  // This function will be called from deep linking handler
  const handleVNPayReturn = (url: string) => {
    try {
      // Parse URL parameters using expo-linking
      const parsedUrl = Linking.parse(url);
      const params = parsedUrl.queryParams || {};
      
      const responseCode = params.vnp_ResponseCode as string;
      const transactionNo = params.vnp_TransactionNo as string;
      const orderId = params.vnp_TxnRef as string;

      if (responseCode === '00') {
        // Payment successful
        Alert.alert(
          'Thanh toán thành công!',
          `Giao dịch: ${transactionNo || 'N/A'}\nMã đơn hàng: ${orderId || 'N/A'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        // Payment failed
        const errorMessage = getVNPayErrorMessage(responseCode);
        Alert.alert(
          'Thanh toán thất bại',
          errorMessage,
          [
            {
              text: 'OK',
              onPress: () => {

                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error handling VNPay return:', error);
      Alert.alert('Lỗi', 'Không thể xử lý kết quả thanh toán');
    }
  };

  // Get VNPay error message
  const getVNPayErrorMessage = (responseCode: string | null): string => {
    const errorMessages: Record<string, string> = {
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
      '12': 'Thẻ/Tài khoản bị khóa.',
      '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch.',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Lỗi không xác định.',
    };

    return errorMessages[responseCode || ''] || `Mã lỗi: ${responseCode || 'Không xác định'}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Loading screen */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Đang mở trang thanh toán VNPay...</Text>
        <Text style={styles.loadingSubtext}>
          Vui lòng hoàn tất thanh toán trên trình duyệt.{'\n'}
          Sau khi thanh toán xong, bạn sẽ được chuyển về ứng dụng.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});



