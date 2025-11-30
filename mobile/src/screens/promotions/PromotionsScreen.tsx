import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as apiService from '../../services/apiService';
import { Promotion, RedeemableVoucher } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatters';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<any, 'PromotionsMain'>;

export const PromotionsScreen: React.FC<Props> = ({ navigation }) => {
  const [vouchers, setVouchers] = useState<RedeemableVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<RedeemableVoucher | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'redeemed'>('all');

  useFocusEffect(
    React.useCallback(() => {
      loadVouchers();
    }, [activeTab])
  );

  const loadVouchers = async () => {
    try {
      if (activeTab === 'all') {
        const data = await apiService.getPromotions();
        setVouchers(data.filter((p: Promotion) => p.isActive));
      } else {
        const user = await apiService.getCurrentUser();
        if (!user) return;
        const data = await apiService.getRedeemedVouchers(user.id);
        setVouchers(data);
      }
    } catch (error) {
      console.error('Failed to load vouchers:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVouchers();
  };

  const openVoucherDetail = (voucher: RedeemableVoucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
  };

  const renderVoucher = ({ item }: { item: RedeemableVoucher }) => {
    const expiry = item.expiryDate || (item as any).endDate;
    const isExpiringSoon =
      new Date(expiry).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
    const isUsed = (item as any).isUsed || false;
    const isRedeemed = activeTab === 'redeemed';
    const redeemedCount = (item as any).redeemedCount || 0;

    return (
      <TouchableOpacity 
        style={[styles.promoCard, isUsed && styles.usedCard]} 
        onPress={() => openVoucherDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.promoHeader}>
          <View style={[styles.iconContainer, isUsed && styles.usedIconContainer]}>
            <Ionicons 
              name={isUsed ? "checkmark-circle" : "ticket"} 
              size={32} 
              color={isUsed ? "#999" : "#d62976"} 
            />
          </View>
          <View style={styles.promoHeaderText}>
            <Text style={[styles.promoCode, isUsed && styles.usedText]}>{item.code}</Text>
            {isUsed ? (
              <View style={styles.usedBadge}>
                <Text style={styles.usedBadgeText}>Đã sử dụng</Text>
              </View>
            ) : isExpiringSoon ? (
              <View style={styles.expiringBadge}>
                <Ionicons name="time-outline" size={12} color="#FF5722" />
                <Text style={styles.expiringText}>Sắp hết hạn</Text>
              </View>
            ) : isRedeemed ? (
              <View style={[styles.availableBadge, redeemedCount === 1 && styles.lastOneBadge]}>
                <Text style={[styles.availableBadgeText, redeemedCount === 1 && styles.lastOneText]}>
                  {redeemedCount === 1 ? 'Còn 1 lượt' : `Còn ${redeemedCount} lượt`}
                </Text>
              </View>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>

        <Text style={[styles.promoDescription, isUsed && styles.usedText]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.promoDivider} />

        <View style={styles.voucherFooter}>
          <View style={styles.discountInfo}>
            <Text style={styles.discountLabel}>Giảm giá</Text>
            <Text style={[styles.discountValue, isUsed && styles.usedText]}>
              {item.discountType === 'percentage'
                ? `${item.discountValue}%`
                : formatCurrency(item.discountValue)}
            </Text>
          </View>
          <View style={styles.expiryInfo}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.expiryText}>
              HSD: {new Date(expiry).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tất cả voucher
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'redeemed' && styles.activeTab]}
          onPress={() => setActiveTab('redeemed')}
        >
          <Text style={[styles.tabText, activeTab === 'redeemed' && styles.activeTabText]}>
            Đã đổi
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={vouchers}
        renderItem={renderVoucher}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="ticket-outline"
            title="Chưa có voucher"
            message={
              activeTab === 'all'
                ? "Hiện tại không có voucher nào khả dụng"
                : "Bạn chưa đổi voucher nào. Hãy tích điểm để đổi voucher nhé!"
            }
          />
        }
        ListHeaderComponent={
          vouchers.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {activeTab === 'all' ? 'Voucher Khả Dụng' : 'Voucher Đã Đổi'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {vouchers.length} voucher {activeTab === 'all' ? 'có thể sử dụng' : 'đã đổi'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Voucher Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết voucher</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedVoucher && (
                <>
                  <View style={styles.voucherCodeSection}>
                    <View style={styles.voucherCodeBox}>
                      <Ionicons name="ticket" size={40} color="#d62976" />
                      <Text style={styles.voucherCode}>{selectedVoucher.code}</Text>
                    </View>
                    {(selectedVoucher as any).isUsed && (
                      <View style={styles.usedStamp}>
                        <Text style={styles.usedStampText}>ĐÃ SỬ DỤNG</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Thông tin ưu đãi</Text>
                    <Text style={styles.voucherDescription}>{selectedVoucher.description}</Text>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="gift-outline" size={20} color="#d62976" />
                      <Text style={styles.detailLabel}>Giảm giá:</Text>
                      <Text style={styles.detailValue}>
                        {selectedVoucher.discountType === 'percentage'
                          ? `${selectedVoucher.discountValue}%`
                          : formatCurrency(selectedVoucher.discountValue)}
                      </Text>
                    </View>

                    {selectedVoucher.minOrderValue && selectedVoucher.minOrderValue > 0 && (
                      <View style={styles.detailRow}>
                        <Ionicons name="cart-outline" size={20} color="#d62976" />
                        <Text style={styles.detailLabel}>Đơn tối thiểu:</Text>
                        <Text style={styles.detailValue}>
                          {formatCurrency(selectedVoucher.minOrderValue)}
                        </Text>
                      </View>
                    )}

                    {(selectedVoucher as any).maxDiscount && (selectedVoucher as any).maxDiscount > 0 && (
                      <View style={styles.detailRow}>
                        <Ionicons name="trending-down-outline" size={20} color="#d62976" />
                        <Text style={styles.detailLabel}>Giảm tối đa:</Text>
                        <Text style={styles.detailValue}>
                          {formatCurrency((selectedVoucher as any).maxDiscount)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={20} color="#d62976" />
                      <Text style={styles.detailLabel}>Hạn sử dụng:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedVoucher.expiryDate || (selectedVoucher as any).endDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>

                    {(selectedVoucher as any).redeemedCount && (
                      <View style={styles.detailRow}>
                        <Ionicons name="ticket-outline" size={20} color="#10b981" />
                        <Text style={styles.detailLabel}>Số lượng đã đổi:</Text>
                        <Text style={styles.detailValue}>
                          {(selectedVoucher as any).redeemedCount}
                        </Text>
                      </View>
                    )}
                  </View>

                  {!(selectedVoucher as any).isUsed && (
                    <TouchableOpacity
                      style={styles.useVoucherButton}
                      onPress={() => {
                        setShowDetailModal(false);
                        navigation.navigate('ServicesTab');
                      }}
                    >
                      <Text style={styles.useVoucherButtonText}>Sử Dụng Ngay</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#d62976',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#d62976',
    fontWeight: '700',
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
    borderLeftColor: '#d62976',
  },
  usedCard: {
    backgroundColor: '#f5f5f5',
    borderLeftColor: '#999',
    opacity: 0.7,
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
    backgroundColor: '#fff0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  usedIconContainer: {
    backgroundColor: '#f0f0f0',
  },
  promoHeaderText: {
    flex: 1,
  },
  promoCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d62976',
    marginBottom: 4,
  },
  usedText: {
    color: '#999',
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
  usedBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  usedBadgeText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  availableBadgeText: {
    fontSize: 11,
    color: '#4caf50',
    fontWeight: '600',
  },
  lastOneBadge: {
    backgroundColor: '#fff3e0',
  },
  lastOneText: {
    color: '#f57c00',
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
    backgroundColor: '#d62976',
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
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountInfo: {
    flex: 1,
  },
  discountLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  discountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d62976',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  voucherCodeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  voucherCodeBox: {
    backgroundColor: '#fff0f5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d62976',
    borderStyle: 'dashed',
  },
  voucherCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d62976',
    marginTop: 12,
    letterSpacing: 2,
  },
  usedStamp: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }, { rotate: '-15deg' }],
    backgroundColor: 'rgba(153, 153, 153, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  usedStampText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  detailSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  voucherDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  useVoucherButton: {
    backgroundColor: '#d62976',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  useVoucherButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
