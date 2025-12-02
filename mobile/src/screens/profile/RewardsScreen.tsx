import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getWallet, 
  getRedeemableVouchers, 
  getRedeemedVouchers,
  redeemVoucher,
  getCurrentUser 
} from '../../services/apiService';
import { Wallet, RedeemableVoucher, Tier } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

// Define tiers (same as web)
const TIERS: Tier[] = [
  { level: 0, name: 'Thành viên', pointsRequired: 0, minSpendingRequired: 0, color: '#A8A29E', textColor: '#FFFFFF' },
  { level: 1, name: 'Đồng', pointsRequired: 0, minSpendingRequired: 10000000, color: '#CD7F32', textColor: '#FFFFFF' }, // Bronze - 10 triệu
  { level: 2, name: 'Bạc', pointsRequired: 0, minSpendingRequired: 30000000, color: '#C0C0C0', textColor: '#000000' }, // Silver - 30 triệu
  { level: 3, name: 'Kim cương', pointsRequired: 0, minSpendingRequired: 50000000, color: '#B9F2FF', textColor: '#000000' }, // Diamond - 50 triệu
];

export const RewardsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<RedeemableVoucher[]>([]);
  const [redeemedVouchers, setRedeemedVouchers] = useState<RedeemableVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'available' | 'redeemed'>('available');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<RedeemableVoucher | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const [walletData, vouchersData, redeemedData] = await Promise.all([
        getWallet(user.id),
        getRedeemableVouchers(),
        getRedeemedVouchers(user.id)
      ]);
      setWallet(walletData);
      setAvailableVouchers(vouchersData);
      setRedeemedVouchers(redeemedData);
    } catch (error) {
      console.error('Error loading rewards:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin điểm thưởng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Get tier from wallet.tierLevel (synced from backend), fallback to calculation if not available (same as web)
  const currentTier = useMemo(() => {
    if (!wallet) {
      // Return default tier (Thành viên - level 0)
      return TIERS.find(t => t.level === 0) || TIERS[0];
    }
    
    // Use tierLevel from wallet if available (synced from backend)
    if (wallet.tierLevel !== undefined && wallet.tierLevel !== null) {
      const tier = TIERS.find(t => t.level === wallet.tierLevel);
      if (tier) return tier;
    }
    
    // Fallback: Calculate tier from totalSpent if tierLevel is not available
    const totalSpent = parseFloat(wallet.totalSpent?.toString() || '0') || 0;
    const sortedTiers = [...TIERS].sort((a, b) => (b.minSpendingRequired || 0) - (a.minSpendingRequired || 0));
    let tierLevel = 0; // Default to tier 0 (Thành viên)
    for (const tier of sortedTiers) {
      if (totalSpent >= (tier.minSpendingRequired || 0)) {
        tierLevel = tier.level;
        break;
      }
    }
    return TIERS.find(t => t.level === tierLevel) || TIERS.find(t => t.level === 0) || TIERS[0];
  }, [wallet]);

  const handleRedeemVoucher = async (voucher: RedeemableVoucher) => {
    if (!wallet || !voucher.pointsRequired) return;

    if (wallet.points < voucher.pointsRequired) {
      Alert.alert('Không đủ điểm', `Bạn cần ${voucher.pointsRequired} điểm để đổi voucher này`);
      return;
    }

    Alert.alert(
      'Xác nhận đổi điểm',
      `Bạn muốn dùng ${voucher.pointsRequired} điểm để đổi voucher "${voucher.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              const user = await getCurrentUser();
              if (!user) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
                return;
              }
              await redeemVoucher(voucher.id, user.id);
              Alert.alert('Thành công', 'Đã đổi voucher thành công!');
              loadData(); // Reload to update points and vouchers
              setShowDetailModal(false);
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đổi voucher');
            }
          }
        }
      ]
    );
  };

  const openVoucherDetail = (voucher: RedeemableVoucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
  };

  const renderVoucherCard = (voucher: RedeemableVoucher, isRedeemed: boolean = false) => {
    const redeemedCount = (voucher as any).redeemedCount || 0;
    return (
      <TouchableOpacity
        key={voucher.id}
        style={styles.voucherCard}
        onPress={() => openVoucherDetail(voucher)}
      >
        <View style={styles.voucherHeader}>
          <View style={[styles.voucherIcon, { backgroundColor: isRedeemed ? '#10b98120' : '#d6297620' }]}>
            <Ionicons 
              name={isRedeemed ? 'checkmark-circle' : 'gift'} 
              size={28} 
              color={isRedeemed ? '#10b981' : '#d62976'} 
            />
          </View>
          <View style={styles.voucherInfo}>
            <Text style={styles.voucherTitle} numberOfLines={2}>{voucher.title}</Text>
            <Text style={styles.voucherCode}>Mã: {voucher.code}</Text>
          </View>
        </View>

      <Text style={styles.voucherDescription} numberOfLines={2}>{voucher.description}</Text>

      <View style={styles.voucherFooter}>
        <View style={styles.voucherValue}>
          <Ionicons name="pricetag" size={16} color="#d62976" />
          <Text style={styles.voucherValueText}>
            {voucher.discountType === 'percentage' 
              ? `Giảm ${voucher.discountValue}%`
              : `Giảm ${formatCurrency(voucher.discountValue)}`}
          </Text>
        </View>
        {!isRedeemed && voucher.pointsRequired && (
          <View style={styles.pointsRequired}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.pointsText}>{voucher.pointsRequired} điểm</Text>
          </View>
        )}
        {isRedeemed && (
          <View style={[styles.redeemedBadge, redeemedCount === 1 && styles.lastOneBadge]}>
            <Text style={[styles.redeemedText, redeemedCount === 1 && styles.lastOneText]}>
              {redeemedCount === 1 ? 'Còn 1 lượt' : `Còn ${redeemedCount} lượt`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.expiryContainer}>
        <Ionicons name="time-outline" size={14} color="#999" />
        <Text style={styles.expiryText}>
          HSD: {new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}
        </Text>
      </View>
    </TouchableOpacity>
  );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Điểm thưởng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
      >
        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Ionicons name="star" size={48} color="#f59e0b" />
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsLabel}>Điểm hiện có</Text>
              <Text style={styles.pointsValue}>{wallet?.points || 0}</Text>
            </View>
          </View>
          <View style={styles.pointsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tổng chi tiêu</Text>
              <Text style={styles.statValue}>{formatCurrency(wallet?.totalSpent || 0)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Hạng thành viên</Text>
              <Text style={[styles.statValue, { color: currentTier.color }]}>{currentTier.name}</Text>
            </View>
          </View>
          <Text style={styles.pointsNote}>
            💡 1000 VNĐ chi tiêu = 1 điểm thưởng
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'available' && styles.activeTab]}
            onPress={() => setSelectedTab('available')}
          >
            <Text style={[styles.tabText, selectedTab === 'available' && styles.activeTabText]}>
              Có thể đổi ({availableVouchers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'redeemed' && styles.activeTab]}
            onPress={() => setSelectedTab('redeemed')}
          >
            <Text style={[styles.tabText, selectedTab === 'redeemed' && styles.activeTabText]}>
              Đã đổi ({redeemedVouchers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vouchers List */}
        <View style={styles.vouchersList}>
          {selectedTab === 'available' ? (
            availableVouchers.length > 0 ? (
              availableVouchers.map(v => renderVoucherCard(v, false))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có voucher nào</Text>
              </View>
            )
          ) : (
            redeemedVouchers.length > 0 ? (
              redeemedVouchers.map(v => renderVoucherCard(v, true))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Bạn chưa đổi voucher nào</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Voucher Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeModal}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            {selectedVoucher && (
              <>
                <Text style={styles.modalTitle}>{selectedVoucher.title}</Text>
                <View style={styles.modalCode}>
                  <Text style={styles.modalCodeText}>{selectedVoucher.code}</Text>
                </View>

                <Text style={styles.modalDescription}>{selectedVoucher.description}</Text>

                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="pricetag" size={20} color="#d62976" />
                    <Text style={styles.modalDetailLabel}>Giảm giá:</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedVoucher.discountType === 'percentage'
                        ? `${selectedVoucher.discountValue}%`
                        : formatCurrency(selectedVoucher.discountValue)}
                    </Text>
                  </View>
                  {selectedVoucher.minOrderValue && (
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="cash-outline" size={20} color="#999" />
                      <Text style={styles.modalDetailLabel}>Đơn tối thiểu:</Text>
                      <Text style={styles.modalDetailValue}>
                        {formatCurrency(selectedVoucher.minOrderValue)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="time-outline" size={20} color="#999" />
                    <Text style={styles.modalDetailLabel}>Hạn sử dụng:</Text>
                    <Text style={styles.modalDetailValue}>
                      {new Date(selectedVoucher.expiryDate).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  {selectedVoucher.pointsRequired && (
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="star" size={20} color="#f59e0b" />
                      <Text style={styles.modalDetailLabel}>Điểm cần:</Text>
                      <Text style={styles.modalDetailValue}>
                        {selectedVoucher.pointsRequired} điểm
                      </Text>
                    </View>
                  )}
                  {(selectedVoucher as any).redeemedCount && (
                    <View style={styles.modalDetailRow}>
                      <Ionicons name="ticket-outline" size={20} color="#10b981" />
                      <Text style={styles.modalDetailLabel}>Số lượng đã đổi:</Text>
                      <Text style={styles.modalDetailValue}>
                        {(selectedVoucher as any).redeemedCount}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedVoucher.termsAndConditions && (
                  <View style={styles.modalTerms}>
                    <Text style={styles.modalTermsTitle}>Điều kiện:</Text>
                    <Text style={styles.modalTermsText}>
                      {selectedVoucher.termsAndConditions}
                    </Text>
                  </View>
                )}

                {selectedTab === 'available' && selectedVoucher.pointsRequired && (
                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      (!wallet || wallet.points < selectedVoucher.pointsRequired) &&
                        styles.redeemButtonDisabled
                    ]}
                    onPress={() => handleRedeemVoucher(selectedVoucher)}
                    disabled={!wallet || wallet.points < selectedVoucher.pointsRequired}
                  >
                    <Ionicons name="gift" size={20} color="#fff" />
                    <Text style={styles.redeemButtonText}>
                      Đổi {selectedVoucher.pointsRequired} điểm
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d62976',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },
  pointsCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  pointsInfo: {
    marginLeft: 16,
    flex: 1
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#d62976'
  },
  pointsStats: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  statItem: {
    flex: 1
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  pointsNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#d62976'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  activeTabText: {
    color: '#fff'
  },
  vouchersList: {
    padding: 16,
    paddingTop: 0
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  voucherHeader: {
    flexDirection: 'row',
    marginBottom: 12
  },
  voucherIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  voucherInfo: {
    flex: 1
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4
  },
  voucherCode: {
    fontSize: 13,
    color: '#d62976',
    fontWeight: '600',
    backgroundColor: '#fce4ec',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  voucherDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  voucherValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  voucherValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#d62976'
  },
  pointsRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e'
  },
  redeemedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  redeemedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46'
  },
  lastOneBadge: {
    backgroundColor: '#fff3e0',
  },
  lastOneText: {
    color: '#f57c00',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  expiryText: {
    fontSize: 12,
    color: '#999'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%'
  },
  closeModal: {
    alignSelf: 'flex-end',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12
  },
  modalCode: {
    backgroundColor: '#fce4ec',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center'
  },
  modalCodeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d62976',
    letterSpacing: 2
  },
  modalDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20
  },
  modalDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  modalTerms: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20
  },
  modalTermsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6
  },
  modalTermsText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18
  },
  redeemButton: {
    flexDirection: 'row',
    backgroundColor: '#d62976',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  redeemButtonDisabled: {
    backgroundColor: '#ccc'
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  }
});
