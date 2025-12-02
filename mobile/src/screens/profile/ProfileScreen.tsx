import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout, getCurrentUser, getWallet, getUnreadNotificationsCount } from '../../services/apiService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import type { User, Wallet, Tier } from '../../types';
import { Ionicons } from '@expo/vector-icons';

// Define tiers (same as web)
const TIERS: Tier[] = [
  { level: 0, name: 'Thành viên', pointsRequired: 0, minSpendingRequired: 0, color: '#A8A29E', textColor: '#FFFFFF' },
  { level: 1, name: 'Đồng', pointsRequired: 0, minSpendingRequired: 10000000, color: '#CD7F32', textColor: '#FFFFFF' }, // Bronze - 10 triệu
  { level: 2, name: 'Bạc', pointsRequired: 0, minSpendingRequired: 30000000, color: '#C0C0C0', textColor: '#000000' }, // Silver - 30 triệu
  { level: 3, name: 'Kim cương', pointsRequired: 0, minSpendingRequired: 50000000, color: '#B9F2FF', textColor: '#000000' }, // Diamond - 50 triệu
];

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        
        setUser(currentUser);
        
        // Load wallet and notifications count
        const [walletData, unreadNotifs] = await Promise.all([
          getWallet(currentUser.id).catch(() => null),
          getUnreadNotificationsCount(currentUser.id).catch(() => 0)
        ]);
        setWallet(walletData);
        setUnreadCount(unreadNotifs);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

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

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            // Navigation sẽ tự động quay lại Auth screen
            // vì RootNavigator sẽ detect token không tồn tại
          } catch (error) {
            Alert.alert('Lỗi', 'Đăng xuất thất bại');
          }
        }
      }
    ]);
  };

  const refreshProfile = React.useCallback(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        
        setUser(currentUser);
        
        // Refresh wallet and notifications
        const [walletData, unreadNotifs] = await Promise.all([
          getWallet(currentUser.id).catch(() => null),
          getUnreadNotificationsCount(currentUser.id).catch(() => 0)
        ]);
        setWallet(walletData);
        setUnreadCount(unreadNotifs);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    };
    loadUser();
  }, []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refreshProfile);
    return unsubscribe;
  }, [navigation, refreshProfile]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d62976" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#d62976" />
        </View>
        <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        {wallet && currentTier && (
          <View style={[styles.tierBadge, { backgroundColor: `${currentTier.color}20`, borderColor: currentTier.color }]}>
            <Ionicons name="trophy" size={16} color={currentTier.color} />
            <Text style={[styles.tierBadgeText, { color: currentTier.color }]}>Hạng {currentTier.name}</Text>
          </View>
        )}
      </View>

      {/* Rewards Card */}
      {wallet && (
        <TouchableOpacity 
          style={styles.rewardsCard}
          onPress={() => navigation.navigate('Rewards')}
        >
          <View style={styles.rewardsLeft}>
            <View style={styles.rewardsIconContainer}>
              <Ionicons name="star" size={32} color="#f59e0b" />
            </View>
            <View>
              <Text style={styles.rewardsLabel}>Điểm thưởng</Text>
              <Text style={styles.rewardsPoints}>{wallet.points} điểm</Text>
            </View>
          </View>
          <View style={styles.rewardsRight}>
            <Text style={styles.rewardsAction}>Đổi quà</Text>
            <Ionicons name="chevron-forward" size={20} color="#d62976" />
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color="#d62976" />
            <Text style={styles.editButtonText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#8b5cf6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {user?.phone && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#d62976" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
          </View>
        )}

        {user?.birthday && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#d62976" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày sinh</Text>
                <Text style={styles.infoValue}>{user.birthday}</Text>
              </View>
            </View>
          </View>
        )}

        {user?.gender && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#d62976" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Giới tính</Text>
                <Text style={styles.infoValue}>{user.gender}</Text>
              </View>
            </View>
          </View>
        )}

        {user?.address && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#d62976" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{user.address}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tùy chọn</Text>

        <TouchableOpacity 
          style={styles.optionButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color="#d62976" />
          <Text style={styles.optionText}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionButton}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#d62976" />
          <Text style={styles.optionText}>Đổi mật khẩu</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton}>
          <Ionicons name="help-circle-outline" size={20} color="#d62976" />
          <Text style={styles.optionText}>Hỗ trợ</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: '#d62976',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center'
  },
  avatarContainer: {
    marginBottom: 16
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333'
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fce4ec'
  },
  editButtonText: {
    fontSize: 12,
    color: '#d62976',
    fontWeight: '600'
  },
  infoCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  infoContent: {
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32
  },
  version: {
    fontSize: 12,
    color: '#999'
  },
  rewardsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#d62976'
  },
  rewardsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  rewardsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  rewardsLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4
  },
  rewardsPoints: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff'
  },
  rewardsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  rewardsAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff'
  }
});
