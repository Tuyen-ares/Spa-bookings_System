import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as apiService from '../../services/apiService';
import { getImageUrl } from '../../services/apiService';
import { Service, Promotion, Review } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { getCurrentUser, getUnreadNotificationsCount } from '../../services/apiService';
import { notificationPolling } from '../../services/notificationPollingService';

type Props = NativeStackScreenProps<any, 'HomeMain'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    title: 'Nơi Vẻ Đẹp Thăng Hoa',
    subtitle: 'Trải nghiệm dịch vụ spa 5 sao',
  },
  {
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    title: 'Ưu Đãi Đặc Biệt',
    subtitle: 'Giảm giá lên đến 30%',
  },
  {
    image: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800',
    title: 'Đội Ngũ Chuyên Viên',
    subtitle: 'Kinh nghiệm và tận tâm',
  },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadData();
    loadUnreadCount();
    
    // Subscribe to notification count updates
    const unsubscribe = notificationPolling.subscribe((count) => {
      setUnreadCount(count);
    });
    
    // Start polling if not already started
    notificationPolling.start();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadUnreadCount = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const count = await getUnreadNotificationsCount(user.id);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Auto-slide hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to slide when currentSlide changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: currentSlide * SCREEN_WIDTH,
      animated: true,
    });
  }, [currentSlide]);

  // Set header notification button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, unreadCount]);

  const loadData = async () => {
    try {
      const [servicesData, promotionsData, reviewsData] = await Promise.all([
        apiService.getServices(),
        apiService.getPromotions(),
        apiService.getReviews(),
      ]);
      console.log('Loaded services:', servicesData.length);
      console.log('First service:', servicesData[0]);
      console.log('First service imageUrl:', servicesData[0]?.imageUrl);
      setServices(servicesData.slice(0, 6)); // Featured services
      setPromotions(promotionsData.filter((p: Promotion) => p.isActive).slice(0, 4));
      setReviews(reviewsData.slice(0, 5));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slideIndex !== currentSlide) {
      setCurrentSlide(slideIndex);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      {/* Hero Slider */}
      <View style={styles.heroContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {HERO_SLIDES.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <Image source={{ uri: slide.image }} style={styles.slideImage} />
              <View style={styles.slideOverlay}>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                <TouchableOpacity
                  style={styles.slideButton}
                  onPress={() => navigation.navigate('ServicesTab')}
                >
                  <Text style={styles.slideButtonText}>Khám Phá</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {/* Slide Indicators */}
        <View style={styles.indicators}>
          {HERO_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentSlide === index && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Featured Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dịch Vụ Nổi Bật</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ServicesTab')}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        {services.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesScrollContent}
          >
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate('ServiceDetail', { id: service.id })}
              >
                <Image
                  source={{ uri: getImageUrl(service.imageUrl) }}
                  style={styles.serviceImage}
                  onLoad={() => console.log('Image loaded successfully:', service.name)}
                  onError={(error) => {
                    console.log('Image load error for service:', service.id, service.name);
                    console.log('Image URL:', getImageUrl(service.imageUrl));
                  }}
                  resizeMode="cover"
                />
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {service.name}
                  </Text>
                  <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
                  <View style={styles.serviceRating}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {service.averageRating?.toFixed(1) || '5.0'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyServices}>
            <Ionicons name="flower-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có dịch vụ nào</Text>
          </View>
        )}
      </View>

      {/* Promotions */}
      {promotions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Khuyến Mãi Hot</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PromotionsTab')}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {promotions.map((promo) => (
            <View key={promo.id} style={styles.promoCard}>
              <View style={styles.promoHeader}>
                <Ionicons name="pricetag" size={24} color="#E91E63" />
                <Text style={styles.promoCode}>{promo.code}</Text>
              </View>
              <Text style={styles.promoDescription}>{promo.description}</Text>
              <View style={styles.promoFooter}>
                <Text style={styles.promoDiscount}>
                  {promo.discountType === 'percentage'
                    ? `${promo.discountValue}%`
                    : formatCurrency(promo.discountValue)}
                </Text>
                <Text style={styles.promoExpiry}>
                  HSD: {new Date(promo.expiryDate).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh Giá Từ Khách Hàng</Text>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>
                    {review.User?.name || 'Khách hàng'}
                  </Text>
                  <View style={styles.reviewStars}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < review.rating ? 'star' : 'star-outline'}
                        size={16}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
      
      {/* Floating Chatbot Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={() => navigation.navigate('ChatbotTab')}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  slideButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  slideButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  indicators: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 24,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  serviceCard: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  serviceInfo: {
    padding: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 4,
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  servicesScrollContent: {
    paddingRight: 16,
  },
  emptyServices: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  promoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginLeft: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  promoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoDiscount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  promoExpiry: {
    fontSize: 12,
    color: '#999',
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  floatingChatButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationButton: {
    marginRight: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
