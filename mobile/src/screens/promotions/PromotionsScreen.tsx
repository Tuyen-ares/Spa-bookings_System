import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as apiService from '../../services/apiService';
import { Promotion } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<any, 'PromotionsMain'>;

export const PromotionsScreen: React.FC<Props> = ({ navigation }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const data = await apiService.getPromotions();
      setPromotions(data.filter((p: Promotion) => p.isActive));
    } catch (error) {
      console.error('Failed to load promotions:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPromotions();
  };

  const renderPromotion = ({ item }: { item: Promotion }) => {
    const isExpiringSoon =
      new Date(item.endDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

    return (
      <View style={styles.promoCard}>
        <View style={styles.promoHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="pricetag" size={32} color="#E91E63" />
          </View>
          <View style={styles.promoHeaderText}>
            <Text style={styles.promoCode}>{item.code}</Text>
            {isExpiringSoon && (
              <View style={styles.expiringBadge}>
                <Ionicons name="time-outline" size={12} color="#FF5722" />
                <Text style={styles.expiringText}>Sắp hết hạn</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.promoDescription}>{item.description}</Text>

        <View style={styles.promoDivider} />

        <View style={styles.promoDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="gift-outline" size={16} color="#666" />
            <Text style={styles.detailLabel}>Giảm giá:</Text>
            <Text style={styles.detailValue}>
              {item.discountType === 'percentage'
                ? `${item.discountValue}%`
                : formatCurrency(item.discountValue)}
            </Text>
          </View>

          {item.minPurchase && item.minPurchase > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="cart-outline" size={16} color="#666" />
              <Text style={styles.detailLabel}>Đơn tối thiểu:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.minPurchase)}</Text>
            </View>
          )}

          {item.maxDiscount && item.maxDiscount > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="trending-down-outline" size={16} color="#666" />
              <Text style={styles.detailLabel}>Giảm tối đa:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.maxDiscount)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailLabel}>Hết hạn:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.endDate).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.useButton}
          onPress={() => navigation.navigate('ServicesTab')}
        >
          <Text style={styles.useButtonText}>Sử Dụng Ngay</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={promotions}
        renderItem={renderPromotion}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="pricetag-outline"
            title="Chưa có khuyến mãi"
            message="Hiện tại không có chương trình khuyến mãi nào"
          />
        }
        ListHeaderComponent={
          promotions.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Khuyến Mãi Đặc Biệt</Text>
              <Text style={styles.headerSubtitle}>
                {promotions.length} ưu đãi đang có sẵn
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  promoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promoHeaderText: {
    flex: 1,
  },
  promoCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 4,
  },
  expiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  expiringText: {
    fontSize: 11,
    color: '#FF5722',
    fontWeight: '600',
    marginLeft: 4,
  },
  promoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  promoDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  promoDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  useButton: {
    backgroundColor: '#E91E63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  useButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
