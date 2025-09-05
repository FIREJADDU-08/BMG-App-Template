import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, SafeAreaView, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import Header from '../../layout/Header';
import { FONTS, COLORS } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import CardStyle3 from '../../components/Card/CardStyle3';
import { IMAGES } from '../../constants/Images';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { trackOrder } from '../../Services/OrderTrackService';

type TrackOrderScreenProps = StackScreenProps<RootStackParamList, 'Trackorder'>;

interface StatusHistoryItem {
  status: string;
  updated_at: string;
  remarks?: string;
}

interface OrderItem {
  id: number;
  sno: string;
  itemid: number;
  tagno: string;
  productName: string;
  quantity: number;
  price: number;
  image_path: string;
}

interface OrderData {
  current_status: string;
  history: StatusHistoryItem[];
  order_id: string;
  items: OrderItem[];
}

interface TimelineItem {
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'current' | 'pending' | 'failed' | 'cancelled';
  isLast?: boolean;
}

const Trackorder = ({ route, navigation }: TrackOrderScreenProps) => {
  const { orderId } = route.params;
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch order details
  const fetchOrder = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await trackOrder(orderId);
      console.log('Track order data:', data);
      setOrderData(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch order data. Please try again.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }
    fetchOrder();
  }, [orderId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder(true);
  };

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
  };

  // Create clean timeline based on actual order flow
  const createCleanTimeline = (): TimelineItem[] => {
    if (!orderData?.history) return [];

    const timeline: TimelineItem[] = [];
    const history = [...orderData.history].sort((a, b) => 
      new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    );

    const currentStatus = orderData.current_status.toUpperCase();
    const isRTO = currentStatus.includes('RTO');
    const isDeliveryFailed = currentStatus === 'DELIVERY_FAILED';
    const isCancelled = ['CANCELLED', 'RETURNED', 'REFUNDED'].includes(currentStatus);

    // Find key milestones from history
    const pendingItem = history.find(h => h.status === 'PENDING');
    const placedItem = history.find(h => h.status === 'PLACED');
    const processingItem = history.find(h => h.status === 'IN_PROCESSING');
    const packedItem = history.find(h => h.status === 'PACKED' && h.remarks !== 'DTDC update: ');
    const shippedItem = history.find(h => ['SHIPPED', 'SHIPPING'].includes(h.status));
    const bookedItem = history.find(h => h.status === 'Booked');
    const outForDeliveryItem = history.find(h => h.status === 'OUT_FOR_DELIVERY');
    const deliveredItem = history.find(h => h.status === 'DELIVERED');
    const deliveryFailedItems = history.filter(h => h.status === 'DELIVERY_FAILED');
    const rtoItems = history.filter(h => h.status.includes('RTO'));

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getItemStatus = (step: string): 'completed' | 'current' | 'pending' | 'failed' | 'cancelled' => {
      if (isCancelled) return 'cancelled';
      
      const stepOrder = ['PENDING', 'PLACED', 'IN_PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
      const currentIndex = stepOrder.findIndex(s => s === currentStatus) || 
                          (isRTO ? 4 : (isDeliveryFailed ? 5 : -1));
      const stepIndex = stepOrder.findIndex(s => s === step);
      
      if (isRTO && step === 'OUT_FOR_DELIVERY') return 'failed';
      if (stepIndex < currentIndex) return 'completed';
      if (stepIndex === currentIndex) return 'current';
      return 'pending';
    };

    // 1. Order Confirmed
    if (pendingItem || placedItem) {
      const item = placedItem || pendingItem;
      timeline.push({
        title: 'Order Confirmed',
        description: 'Your order has been placed.',
        date: formatDate(item.updated_at),
        status: getItemStatus('PLACED')
      });
    }

    // 2. Processing
    if (processingItem) {
      timeline.push({
        title: 'Seller has processed your order',
        description: processingItem.remarks || 'Your order is being prepared.',
        date: formatDate(processingItem.updated_at),
        status: getItemStatus('IN_PROCESSING')
      });
    }

    // 3. Packed
    if (packedItem) {
      timeline.push({
        title: 'Your item has been picked up by delivery partner',
        description: 'Package is ready for shipment.',
        date: formatDate(packedItem.updated_at),
        status: getItemStatus('PACKED')
      });
    }

    // 4. Shipped
    if (shippedItem || bookedItem) {
      const item = shippedItem || bookedItem;
      timeline.push({
        title: 'Shipped',
        description: `Your item has been shipped.`,
        date: formatDate(item.updated_at),
        status: getItemStatus('SHIPPED')
      });
    }

    // 5. Out for Delivery (with failure handling)
    if (outForDeliveryItem) {
      const hasMultipleAttempts = deliveryFailedItems.length > 0;
      
      timeline.push({
        title: 'Out For Delivery',
        description: hasMultipleAttempts 
          ? `Multiple delivery attempts made.`
          : 'Your item is out for delivery.',
        date: formatDate(outForDeliveryItem.updated_at),
        status: getItemStatus('OUT_FOR_DELIVERY')
      });
    }

    // 6. Delivery Status
    if (deliveredItem) {
      timeline.push({
        title: 'Delivered',
        description: 'Your item has been delivered.',
        date: formatDate(deliveredItem.updated_at),
        status: 'completed'
      });
    } else if (isRTO) {
      const latestRTO = rtoItems[rtoItems.length - 1];
      let rtoTitle = 'Return Initiated';
      let rtoDescription = 'Your order is being returned due to delivery issues.';
      
      if (currentStatus === 'RTO OUT FOR DELIVERY') {
        rtoTitle = 'Returning to Seller';
        rtoDescription = 'Package is being returned to the seller.';
      } else if (currentStatus === 'RTO DELIVERED') {
        rtoTitle = 'Returned';
        rtoDescription = 'Package has been returned to the seller.';
      }
      
      timeline.push({
        title: rtoTitle,
        description: rtoDescription,
        date: latestRTO ? formatDate(latestRTO.updated_at) : '',
        status: 'cancelled'
      });
    } else if (deliveryFailedItems.length > 0) {
      const latestFailed = deliveryFailedItems[deliveryFailedItems.length - 1];
      let failureReason = 'Delivery attempt failed.';
      
      if (latestFailed.remarks?.includes('ADDRESS INCOMPLETE')) {
        failureReason = 'Delivery failed: Address incomplete or wrong.';
      } else if (latestFailed.remarks?.includes('RECEIVER NOT AVAILABLE')) {
        failureReason = 'Delivery failed: Receiver not available.';
      }
      
      timeline.push({
        title: 'Delivery Attempted',
        description: `${failureReason} Please check again after some time for further updates.`,
        date: formatDate(latestFailed.updated_at),
        status: 'failed'
      });
    }

    // Mark last item
    if (timeline.length > 0) {
      timeline[timeline.length - 1].isLast = true;
    }

    return timeline;
  };

  const getTotalItems = () => {
    return orderData?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const getTotalPrice = () => {
    return orderData?.items?.reduce((total: number, item: any) => total + (item.price * item.quantity || 0), 0) || 0;
  };

  const getCurrentStatusInfo = () => {
    if (!orderData) return { text: 'Unknown', color: COLORS.gray };

    const status = orderData.current_status.toUpperCase();
    
    if (status.includes('RTO')) {
      return { text: 'Being Returned', color: '#FF8C00' };
    }
    if (status === 'DELIVERY_FAILED') {
      return { text: 'Delivery Failed', color: COLORS.danger };
    }
    if (['CANCELLED', 'RETURNED', 'REFUNDED'].includes(status)) {
      return { text: 'Cancelled', color: COLORS.danger };
    }
    if (status === 'DELIVERED') {
      return { text: 'Delivered', color: COLORS.success };
    }
    
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Order Confirmed',
      'PLACED': 'Order Placed',
      'IN_PROCESSING': 'Processing',
      'PACKED': 'Packed',
      'SHIPPED': 'Shipped',
      'SHIPPING': 'Shipped',
      'BOOKED': 'Shipped',
      'OUT_FOR_DELIVERY': 'Out for Delivery'
    };
    
    return { 
      text: statusMap[status] || status, 
      color: COLORS.primary 
    };
  };

  const getStatusIcon = (status: 'completed' | 'current' | 'pending' | 'failed' | 'cancelled') => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'current': return 'radio-button-checked';
      case 'failed': return 'error';
      case 'cancelled': return 'cancel';
      default: return 'radio-button-unchecked';
    }
  };

  const getStatusColor = (status: 'completed' | 'current' | 'pending' | 'failed' | 'cancelled') => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'current': return COLORS.primary;
      case 'failed': return COLORS.danger;
      case 'cancelled': return '#FF8C00';
      default: return COLORS.light;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !orderData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
        <Icon name="error-outline" size={48} color={COLORS.danger} style={{ marginBottom: 15 }} />
        <Text style={{ color: colors.title, fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
          {error || 'Order not found'}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: COLORS.primary }]}
          onPress={() => fetchOrder()}
        >
          <Text style={[styles.retryButtonText, { color: COLORS.white }]}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentStatusInfo = getCurrentStatusInfo();
  const timeline = createCleanTimeline();
  const displayedProducts = showAllProducts ? orderData.items : orderData.items.slice(0, 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Track Order" leftIcon="back" />
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={GlobalStyleSheet.container}>
          {/* Order Summary */}
          <View style={[styles.orderSummary, { backgroundColor: colors.card }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Order ID</Text>
              <Text style={[styles.summaryValue, { color: colors.title }]}>{orderData.order_id}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${currentStatusInfo.color}20` }]}>
                <Text style={[styles.statusBadgeText, { color: currentStatusInfo.color }]}>
                  {currentStatusInfo.text}
                </Text>
              </View>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Items</Text>
              <Text style={[styles.summaryValue, { color: colors.title }]}>{getTotalItems()} items</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>₹{getTotalPrice().toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Timeline - Flipkart Style */}
          <View style={[styles.timelineContainer, { backgroundColor: colors.card }]}>
            {timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIcon,
                    { backgroundColor: getStatusColor(item.status) }
                  ]}>
                    <Icon 
                      name={getStatusIcon(item.status)} 
                      size={16} 
                      color={item.status === 'pending' ? COLORS.gray : COLORS.white} 
                    />
                  </View>
                  {!item.isLast && (
                    <View style={[
                      styles.timelineLine,
                      { backgroundColor: colors.border }
                    ]} />
                  )}
                </View>
                
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineTitle,
                    { color: getStatusColor(item.status) }
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.timelineDate, { color: colors.text }]}>
                    {item.date}
                  </Text>
                  <Text style={[styles.timelineDesc, { color: colors.text }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Contact Support for issues */}
          {(currentStatusInfo.text === 'Delivery Failed' || currentStatusInfo.text === 'Being Returned') && (
            <TouchableOpacity 
              style={[styles.supportButton, { backgroundColor: COLORS.primary }]}
              onPress={() => showAlert('Customer Support', 'Please contact our support team for assistance with your order delivery.')}
            >
              <Icon name="headset-mic" size={20} color={COLORS.white} />
              <Text style={[styles.supportButtonText, { color: COLORS.white }]}>Contact Support</Text>
            </TouchableOpacity>
          )}

          {/* Order Items */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.title }]}>Order Items</Text>
              {orderData.items && orderData.items.length > 2 && (
                <TouchableOpacity onPress={() => setShowAllProducts(!showAllProducts)}>
                  <Text style={[styles.toggleText, { color: COLORS.primary }]}>
                    {showAllProducts ? 'Show Less' : `+${orderData.items.length - 2} more`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {displayedProducts.map((item: OrderItem, index: number) => {
              const imageUrl = item.image_path?.startsWith('http') 
                ? item.image_path 
                : item.image_path?.startsWith('/static') 
                  ? IMAGES.placeholder 
                  : item.image_path;
              
              return (
                <View key={`${item.id}-${index}`} style={{ marginBottom: 15 }}>
                  <CardStyle3
                    id={item.id.toString()}
                    title={item.productName}
                    price={`₹${item.price.toLocaleString('en-IN')} × ${item.quantity}`}
                    image={imageUrl}
                    removebtn={true}
                    status={orderData.current_status}
                    grid={true}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  orderSummary: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    ...FONTS.fontRegular,
    fontSize: 14,
  },
  summaryValue: {
    ...FONTS.fontSemiBold,
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    ...FONTS.fontSemiBold,
    fontSize: 11,
  },
  timelineContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: -8,
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineTitle: {
    ...FONTS.fontSemiBold,
    fontSize: 16,
    marginBottom: 4,
  },
  timelineDate: {
    ...FONTS.fontRegular,
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  timelineDesc: {
    ...FONTS.fontRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  supportButtonText: {
    ...FONTS.fontSemiBold,
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...FONTS.fontSemiBold,
    fontSize: 18,
  },
  toggleText: {
    ...FONTS.fontRegular,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    ...FONTS.fontSemiBold,
    fontSize: 16,
  },
});

export default Trackorder;