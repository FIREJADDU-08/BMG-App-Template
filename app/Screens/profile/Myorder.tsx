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
  Image
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
  id: number;
  sno: string;
  itemid: number;
  tagno: string;
  productName: string;
  quantity: number;
  price: number;
  image_path: string;
  imageUrls?: string[];
  priceFormatted?: string;
}

interface Order {
  id: number | null;
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
  courierName: string | null;
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

  /** Load Orders API */
  const loadOrders = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(!forceRefresh);
      setRefreshing(forceRefresh);
      setError(null);

      const orders = await fetchOrderHistory({
        forceRefresh,
        useCache: !forceRefresh,
        timeout: 30000
      });

      console.log('Fetched orders:', orders);

      // Filter orders based on status
      const ongoing = orders.filter((order: Order) => 
        order.status && !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(order.status.toUpperCase())
      );
      
      const completed = orders.filter((order: Order) => 
        order.status && ['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(order.status.toUpperCase())
      );

      setOngoingOrders(ongoing);
      setCompletedOrders(completed);

      console.log(`Loaded ${ongoing.length} ongoing and ${completed.length} completed orders`);

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

  // Function to process image paths from API
  const processImagePaths = (imagePath: any): string[] => {
    if (!imagePath) return [];
    
    try {
      // Handle different formats
      let paths: string[] = [];
      
      // Case 1: Already an array
      if (Array.isArray(imagePath)) {
        paths = imagePath;
      } 
      // Case 2: String that looks like a JSON array
      else if (typeof imagePath === 'string' && imagePath.trim().startsWith('[')) {
        paths = JSON.parse(imagePath);
      }
      // Case 3: Single URL string
      else if (typeof imagePath === 'string') {
        paths = [imagePath];
      }
      
      // Process each path to ensure it's a valid URL
      return paths
        .filter(path => path && typeof path === 'string')
        .map(path => {
          const cleanPath = path.trim();
          
          // If it's already a full URL, return as is
          if (cleanPath.startsWith('http')) {
            return cleanPath;
          }
          
          // If it's a relative path, prepend the base URL
          if (cleanPath.startsWith('/')) {
            return `https://app.bmgjewellers.com${cleanPath}`;
          }
          
          return `https://app.bmgjewellers.com/${cleanPath}`;
        });
    } catch (error) {
      console.warn('Error processing image paths:', error);
      return [];
    }
  };

  const renderImageSource = (imageUrls: string[] | null | undefined) => {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return IMAGES.fallbackImage;
    }

    // Try to find a valid image URL from the array
    for (const imageUrl of imageUrls) {
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        const cleanUrl = imageUrl.trim();
        if (cleanUrl.startsWith('http') || cleanUrl.startsWith('file')) {
          return { uri: cleanUrl };
        }
      }
    }

    return IMAGES.fallbackImage;
  };

  const getOrderDisplayItem = (order: Order): OrderItem | null => {
    if (!order.orderItems || order.orderItems.length === 0) {
      return null;
    }
    
    // Return the first item for display
    return order.orderItems[0];
  };

  const getOrderTitle = (order: Order): string => {
    const displayItem = getOrderDisplayItem(order);
    const itemCount = order.orderItems?.length || 0;
    
    if (!displayItem) {
      return `Order ${order.orderId}`;
    }
    
    const productName = displayItem.productName || 'Unknown Product';
    
    if (itemCount > 1) {
      return `${productName} (+${itemCount - 1} more)`;
    }
    
    return productName;
  };

  const getOrderPrice = (order: Order): string => {
    if (order.totalFormatted) {
      return order.totalFormatted;
    }
    
    if (order.totalAmount) {
      return `₹${order.totalAmount.toFixed(2)}`;
    }
    
    // Fallback to first item price if total not available
    const displayItem = getOrderDisplayItem(order);
    if (displayItem?.price) {
      return displayItem.priceFormatted || `₹${displayItem.price.toFixed(2)}`;
    }
    
    return '₹0.00';
  };

  const renderOrderCards = (
    orders: Order[],
    buttonTitle: string,
    navigateTo: string
  ) => {
    if (orders.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 400 }}>
          <Text style={{ ...FONTS.fontRegular, color: colors.text, textAlign: 'center' }}>
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
      // Process image paths for the first item to display
      const displayItem = getOrderDisplayItem(order);
      let imageUrls: string[] = [];
      
      if (displayItem && displayItem.image_path) {
        imageUrls = processImagePaths(displayItem.image_path);
      }
      
      const imageSource = renderImageSource(imageUrls);

      return (
        <CardStyle3
          id={order.orderId}
          key={`${order.orderId}-${index}`}
          title={getOrderTitle(order)}
          price={getOrderPrice(order)}
          image={imageSource}
          discount={null}
          btntitel={buttonTitle}
          status={order.statusInfo?.label || order.status || ''}
          offer={order.formattedDate || ''}
          onPress={() =>
            navigation.navigate('OrderDetails', {
              order: order,
            })
          }
          grid
          removebtn={true}
        />
      );
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ ...FONTS.fontRegular, marginTop: 10, color: colors.text }}>
          Loading orders...
        </Text>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ 
          ...FONTS.fontRegular, 
          marginBottom: 20, 
          color: colors.text, 
          textAlign: 'center', 
          padding: 20 
        }}>
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
          <View style={[GlobalStyleSheet.container, { paddingTop: 20, paddingHorizontal: 60 }]}>
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
                    backgroundColor: currentIndex === 0 ? COLORS.primary : colors.card,
                    borderColor: currentIndex === 0 ? COLORS.primary : colors.title,
                  },
                ]}
              >
                <Text style={{ 
                  ...FONTS.fontRegular, 
                  fontSize: 15, 
                  color: currentIndex === 0 ? colors.card : colors.text 
                }}>
                  Ongoing ({ongoingOrders.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onPressTouch(1)}
                style={[
                  GlobalStyleSheet.TouchableOpacity2,
                  {
                    backgroundColor: currentIndex === 1 ? COLORS.primary : colors.card,
                    borderColor: currentIndex === 1 ? COLORS.primary : colors.title,
                  },
                ]}
              >
                <Text style={{ 
                  ...FONTS.fontRegular, 
                  fontSize: 15, 
                  color: currentIndex === 1 ? colors.card : colors.text 
                }}>
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
            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SIZES.width);
            setCurrentIndex(pageIndex);
          }}
        >
          {/* Ongoing Orders */}
          <View style={{ width: SIZES.width }}>
            <View style={[GlobalStyleSheet.container, { paddingTop: 0, paddingBottom: 0 }]}>
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
            <View style={[GlobalStyleSheet.container, { paddingTop: 0, paddingBottom: 0 }]}>
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