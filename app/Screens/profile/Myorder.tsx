import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTheme } from '@react-navigation/native';
import { 
  View, 
  Text, 
  SafeAreaView, 
  Animated, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
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

const Myorder = ({ navigation }: MyorderScreenProps) => {
  const scrollRef = useRef<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [ongoingOrders, setOngoingOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  /** Load Orders API */
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const orders = await fetchOrderHistory();

      const ongoing = orders.filter((o: any) => o.status !== 'COMPLETED');
      const completed = orders.filter((o: any) => o.status === 'COMPLETED');

      setOngoingOrders(ongoing);
      setCompletedOrders(completed);
    } catch (err: any) {
      console.error('Order load error:', err);
      setError(err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onPressTouch = (val: number) => {
    setCurrentIndex(val);
    scrollRef.current?.scrollTo({
      x: SIZES.width * val,
      animated: true,
    });
  };

  const renderImageSource = (imageUrl: string | null) => {
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '' && (imageUrl.startsWith('http') || imageUrl.startsWith('file'))) {
      return { uri: imageUrl, cache: 'force-cache' as const };
    }
    return IMAGES.fallbackImage;
  };

  const renderOrderItems = (
    orders: any[],
    buttonTitle: string,
    navigateTo: string
  ) => {
    if (orders.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ ...FONTS.fontRegular, color: colors.text }}>
            No {currentIndex === 0 ? 'ongoing' : 'completed'} orders found
          </Text>
        </View>
      );
    }

    return orders.flatMap((order) =>
      order.orderItems.map((item: any, i: number) => {
        const imagePath = item.imageUrls?.[0] ?? null;
        const img = renderImageSource(imagePath);
        console.log("Image Path:", imagePath);
        console.log("Image Type:", imagePath ? "remote" : "fallback");
        console.log("Final Image Source:", JSON.stringify(img));

        return (
          <CardStyle3
            id={item.id?.toString() || `${order.orderId}-${i}`}
            key={`${order.orderId}-${i}`}
            title={item.productName || 'Unknown Product'}
            price={`₹${item.price || '0'}`}
            image={img}
            discount={null}
            btntitel={buttonTitle}
            review=""
            offer=""
            onPress={() =>
              navigation.navigate(navigateTo, {
                orderId: order.orderId,
                orderItem: item,
              })
            }
            grid
          />
        );
      })
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ ...FONTS.fontRegular, marginTop: 10, color: colors.text }}>
          Loading orders...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ ...FONTS.fontRegular, marginBottom: 20, color: colors.text, textAlign: 'center', padding: 20 }}>
          {error}
        </Text>
        <TouchableOpacity
          style={{
            padding: 15,
            backgroundColor: COLORS.primary,
            borderRadius: SIZES.radius,
          }}
          onPress={loadOrders}
        >
          <Text style={{ ...FONTS.fontMedium, color: COLORS.white }}>Retry</Text>
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
                <Text style={{ ...FONTS.fontRegular, fontSize: 15, color: currentIndex === 0 ? colors.card : colors.text }}>
                  Ongoing
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
                <Text style={{ ...FONTS.fontRegular, fontSize: 15, color: currentIndex === 1 ? colors.card : colors.text }}>
                  Completed
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
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          onMomentumScrollEnd={(e: any) => {
            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SIZES.width);
            setCurrentIndex(pageIndex);
          }}
        >
          {/* Ongoing Orders */}
          <View style={{ width: SIZES.width }}>
            <View style={[GlobalStyleSheet.container, { paddingTop: 0, paddingBottom: 0 }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {renderOrderItems(ongoingOrders, 'Track Order', 'Trackorder')}
              </ScrollView>
            </View>
          </View>

          {/* Completed Orders */}
          <View style={{ width: SIZES.width }}>
            <View style={[GlobalStyleSheet.container, { paddingTop: 0, paddingBottom: 0 }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {renderOrderItems(completedOrders, 'Write Review', 'WriteReview')}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Myorder;