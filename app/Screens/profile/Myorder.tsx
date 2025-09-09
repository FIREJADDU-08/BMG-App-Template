import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '@react-navigation/native';
import {
  View,
  Text,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import Header from '../../layout/Header';
import { LinearGradient } from 'expo-linear-gradient';
import CardStyle3 from '../../components/Card/CardStyle3';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import { fetchOrderHistory } from '../../Services/OrderDetailService';
import { IMAGES } from '../../constants/Images';

type MyorderScreenProps = StackScreenProps<RootStackParamList, 'Myorder'>;

interface OrderItem {
  itemid: number;
  sno: string;
  tagno: string;
  productName: string;
  quantity: number;
  price: number;
  imagePath: string;
  imageUrls?: string[];
  priceFormatted?: string;
}

interface Order {
  orderId: string;
  customerName: string;
  contact: string;
  email: string;
  address: string;
  totalAmount: number;
  status: string;
  orderTime: string;
  paymentMode: string | null;
  paymentStatus: string | null;
  courierTrackingId: string | null;
  orderItems: OrderItem[];
  statusInfo?: any;
  formattedDate?: string;
  totalFormatted?: string;
}

const Myorder = ({ navigation }: MyorderScreenProps) => {
  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ongoingOrders, setOngoingOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const FALLBACK_IMAGE = IMAGES.item14; // ✅ local asset fallback

  /** Load Orders API */
  const loadOrders = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(!forceRefresh);
      setRefreshing(forceRefresh);
      setError(null);

      const orders = await fetchOrderHistory();

      const ongoing = orders.filter(
        (order: Order) =>
          order.status &&
          !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(
            order.status.toUpperCase()
          )
      );

      const completed = orders.filter(
        (order: Order) =>
          order.status &&
          ['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(
            order.status.toUpperCase()
          )
      );

      setOngoingOrders(ongoing);
      setCompletedOrders(completed);
    } catch (err: any) {
      console.error('Order load error:', err);
      setError(err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    loadOrders(true);
  }, [loadOrders]);

  const onPressTouch = (val: number) => {
    setCurrentIndex(val);
    scrollRef.current?.scrollTo({
      x: SIZES.width * val,
      animated: true,
    });
  };

  /** Improved Image source helper */
  const renderImageSource = (
    imageUrls?: string[] | string
  ): { uri?: string } | number => {
    // If no image URLs provided, return fallback
    if (!imageUrls) return FALLBACK_IMAGE;

    // Handle string input
    if (typeof imageUrls === 'string') {
      // Empty string case
      if (!imageUrls.trim()) return FALLBACK_IMAGE;
      
      // Already a full URL
      if (imageUrls.startsWith('http')) {
        return { uri: imageUrls };
      }
      
      // Relative path - construct full URL
      return { uri: `https://app.bmgjewellers.com${imageUrls.startsWith('/') ? '' : '/'}${imageUrls}` };
    }

    // Handle array input
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      const first = imageUrls[0];
      
      // Empty string in array
      if (!first || !first.trim()) return FALLBACK_IMAGE;
      
      // Already a full URL
      if (first.startsWith('http')) {
        return { uri: first };
      }
      
      // Relative path in array
      return { uri: `https://app.bmgjewellers.com${first.startsWith('/') ? '' : '/'}${first}` };
    }

    // Default fallback
    return FALLBACK_IMAGE;
  };

  // Custom Card Component with better image handling
  const CustomOrderCard = ({ 
    id, 
    title, 
    price, 
    image, 
    status, 
    offer, 
    onPress, 
    btntitel 
  }: any) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    
    const handleImageError = () => {
      setImageError(true);
      setImageLoading(false);
    };
    
    const handleImageLoad = () => {
      setImageLoading(false);
    };

    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.card,
          borderRadius: SIZES.radius,
          marginBottom: 15,
          padding: 15,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        onPress={onPress}
      >
        {/* Image Container */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: SIZES.radius,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 15,
            overflow: 'hidden',
          }}
        >
          {imageLoading && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
          
          {(imageError || !image) ? (
            <View
              style={{
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.background,
              }}
            >
              <Text
                style={{
                  ...FONTS.fontXs,
                  color: colors.text,
                  textAlign: 'center',
                }}
              >
                No Image
              </Text>
            </View>
          ) : (
            <Image
              source={image}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...FONTS.fontMedium,
              fontSize: 16,
              color: colors.title,
              marginBottom: 5,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          
          <Text
            style={{
              ...FONTS.fontMedium,
              color: COLORS.primary,
              marginBottom: 5,
            }}
          >
            {price}
          </Text>
          
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                ...FONTS.fontXs,
                color: colors.text,
              }}
            >
              {status}
            </Text>
            
            <Text
              style={{
                ...FONTS.fontXs,
                color: colors.text,
              }}
            >
              {offer}
            </Text>
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: COLORS.primary,
            borderRadius: SIZES.radius,
          }}
          onPress={onPress}
        >
          <Text
            style={{
              ...FONTS.fontXs,
              color: COLORS.white,
            }}
          >
            {btntitel}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const getOrderDisplayItem = (order: Order): OrderItem | null => {
    return order.orderItems?.[0] || null;
  };

  const getOrderTitle = (order: Order): string => {
    const displayItem = getOrderDisplayItem(order);
    const itemCount = order.orderItems?.length || 0;
    if (!displayItem) return `Order ${order.orderId}`;
    return itemCount > 1
      ? `${displayItem.productName} (+${itemCount - 1} more)`
      : displayItem.productName;
  };

  const getOrderPrice = (order: Order): string => {
    if (order.totalFormatted) return order.totalFormatted;
    if (order.totalAmount) return `₹${order.totalAmount.toFixed(2)}`;
    const displayItem = getOrderDisplayItem(order);
    return displayItem?.price
      ? displayItem.priceFormatted || `₹${displayItem.price.toFixed(2)}`
      : '₹0.00';
  };

  const renderOrderCards = (
    orders: Order[],
    buttonTitle: string,
    navigateTo: string
  ) => {
    if (orders.length === 0) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            minHeight: 400,
          }}
        >
          <Text
            style={{
              ...FONTS.fontRegular,
              color: colors.text,
              textAlign: 'center',
            }}
          >
            No {currentIndex === 0 ? 'ongoing' : 'completed'} orders found
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 15,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: COLORS.primary,
              borderRadius: SIZES.radius,
            }}
            onPress={() => loadOrders(true)}
          >
            <Text style={{ ...FONTS.fontMedium, color: COLORS.white }}>
              Refresh Orders
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return orders.map((order, index) => {
      const displayItem = getOrderDisplayItem(order);
      const imageSource = renderImageSource(displayItem?.imagePath || displayItem?.imageUrls);

      return (
        <CustomOrderCard
          key={`${order.orderId}-${index}`}
          id={order.orderId}
          title={getOrderTitle(order)}
          price={getOrderPrice(order)}
          image={imageSource}
          status={order.statusInfo?.label || order.status || ''}
          offer={order.formattedDate || ''}
          btntitel={buttonTitle}
          onPress={() =>
            navigation.navigate('OrderDetails', {
              order: order,
            })
          }
        />
      );
    });
  };

  /** Loader */
  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={{
            ...FONTS.fontRegular,
            marginTop: 10,
            color: colors.text,
          }}
        >
          Loading orders...
        </Text>
      </SafeAreaView>
    );
  }

  /** Error */
  if (error && !refreshing) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            ...FONTS.fontRegular,
            marginBottom: 20,
            color: colors.text,
            textAlign: 'center',
            padding: 20,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={{
            padding: 15,
            backgroundColor: COLORS.primary,
            borderRadius: SIZES.radius,
          }}
          onPress={() => loadOrders(true)}
        >
          <Text style={{ ...FONTS.fontMedium, color: COLORS.white }}>
            Retry
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /** Main UI */
  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <Header title="My Order" leftIcon="back" />

      <View style={{ flex: 1 }}>
        {/* Tabs */}
        <LinearGradient
          colors={['rgba(236,245,241,0)', 'rgba(236,245,241,0.80)']}
          style={{
            width: '100%',
            height: 90,
            bottom: 0,
            position: 'absolute',
            zIndex: 10,
            backgroundColor: 'rgba(255,255,255,.1)',
          }}
        >
          <View
            style={[
              GlobalStyleSheet.container,
              { paddingTop: 20, paddingHorizontal: 60 },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.card,
                height: 50,
                borderRadius: 25,
                paddingHorizontal: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => onPressTouch(0)}
                style={[
                  GlobalStyleSheet.TouchableOpacity2,
                  {
                    backgroundColor:
                      currentIndex === 0 ? COLORS.primary : colors.card,
                    borderColor:
                      currentIndex === 0 ? COLORS.primary : colors.title,
                  },
                ]}
              >
                <Text
                  style={{
                    ...FONTS.fontRegular,
                    fontSize: 15,
                    color: currentIndex === 0 ? colors.card : colors.text,
                  }}
                >
                  Ongoing ({ongoingOrders.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onPressTouch(1)}
                style={[
                  GlobalStyleSheet.TouchableOpacity2,
                  {
                    backgroundColor:
                      currentIndex === 1 ? COLORS.primary : colors.card,
                    borderColor:
                      currentIndex === 1 ? COLORS.primary : colors.title,
                  },
                ]}
              >
                <Text
                  style={{
                    ...FONTS.fontRegular,
                    fontSize: 15,
                    color: currentIndex === 1 ? colors.card : colors.text,
                  }}
                >
                  Completed ({completedOrders.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Orders List */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e: any) => {
            const pageIndex = Math.round(
              e.nativeEvent.contentOffset.x / SIZES.width
            );
            setCurrentIndex(pageIndex);
          }}
        >
          {/* Ongoing Orders */}
          <View style={{ width: SIZES.width }}>
            <View
              style={[
                GlobalStyleSheet.container,
                { paddingTop: 0, paddingBottom: 0 },
              ]}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[COLORS.primary]}
                    tintColor={COLORS.primary}
                  />
                }
              >
                {renderOrderCards(ongoingOrders, 'View Details', 'OrderDetails')}
              </ScrollView>
            </View>
          </View>

          {/* Completed Orders */}
          <View style={{ width: SIZES.width }}>
            <View
              style={[
                GlobalStyleSheet.container,
                { paddingTop: 0, paddingBottom: 0 },
              ]}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[COLORS.primary]}
                    tintColor={COLORS.primary}
                  />
                }
              >
                {renderOrderCards(completedOrders, 'View Details', 'OrderDetails')}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Myorder;
