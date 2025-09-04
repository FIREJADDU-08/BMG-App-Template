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

const STATUS_ORDER = [
  "PENDING",
  "PLACED",
  "IN_PROCESSING",
  "PACKED",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED"
];

const CANCELLED_STATUSES = ["CANCELLED", "RETURNED", "REFUNDED"];
const FAILED_STATUSES = ["DELIVERY_FAILED"];

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

  // Helper functions
  const getStatusIndex = (status: string) => {
    const upperStatus = status.toUpperCase();
    if (CANCELLED_STATUSES.includes(upperStatus) || FAILED_STATUSES.includes(upperStatus)) return -1;
    return STATUS_ORDER.findIndex(s => s === upperStatus);
  };

  const currentStatusIndex = getStatusIndex(orderData.current_status);
  const isCancelled = CANCELLED_STATUSES.includes(orderData.current_status.toUpperCase());
  const isFailed = FAILED_STATUSES.includes(orderData.current_status.toUpperCase());

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return "Order Confirmed";
      case "PLACED": return "Order Placed";
      case "IN_PROCESSING": return "Processing";
      case "PACKED": return "Packed";
      case "SHIPPED": return "Shipped";
      case "IN_TRANSIT": return "In Transit";
      case "OUT_FOR_DELIVERY": return "Out for Delivery";
      case "DELIVERED": return "Delivered";
      case "CANCELLED": return "Cancelled";
      case "RETURNED": return "Returned";
      case "REFUNDED": return "Refunded";
      case "DELIVERY_FAILED": return "Delivery Failed";
      case "BOOKED": return "Booked";
      case "SHIPPING": return "Shipping";
      default: return status.split('_').map(word => 
        word.charAt(0) + word.slice(1).toLowerCase()
      ).join(' ');
    }
  };

  const getStatusDescription = (status: string, remarks: string = "") => {
    // Show courier updates if available
    if (remarks && remarks.includes("DTDC update:")) {
      const updateText = remarks.replace("DTDC update:", "").trim();
      if (updateText) return updateText;
    }
    
    // Show other remarks if available
    if (remarks && remarks.trim() !== "") {
      return remarks;
    }
    
    // Default descriptions
    switch (status.toUpperCase()) {
      case "PENDING": return "Waiting for payment confirmation";
      case "PLACED": return "We have received your order";
      case "IN_PROCESSING": return "We are preparing your order";
      case "PACKED": return "Your order has been packed and ready for dispatch";
      case "SHIPPED": return "Your order has been shipped";
      case "IN_TRANSIT": return "Your order is in transit";
      case "OUT_FOR_DELIVERY": return "Your order is out for delivery today";
      case "DELIVERED": return "Your order has been delivered successfully";
      case "CANCELLED": return "Your order has been cancelled";
      case "RETURNED": return "Your order has been returned";
      case "REFUNDED": return "Your refund has been processed";
      case "DELIVERY_FAILED": return "Delivery attempt was unsuccessful. We will retry soon.";
      case "BOOKED": return "Your order has been booked with the courier";
      case "SHIPPING": return "Your order is being prepared for shipping";
      default: return "Status update";
    }
  };

  // Get cleaned status history (remove duplicates and sort)
  const getStatusHistory = () => {
    if (!orderData.history || !orderData.history.length) return [];
    
    // Remove duplicate entries and keep only meaningful updates
    const uniqueHistory = orderData.history.reduce((acc: StatusHistoryItem[], current) => {
      const existing = acc.find(item => 
        item.status === current.status && 
        item.updated_at === current.updated_at &&
        item.remarks === current.remarks
      );
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    // Sort by date (newest first)
    return uniqueHistory.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  };

  const getTotalItems = () => {
    return orderData.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const getTotalPrice = () => {
    return orderData.items?.reduce((total: number, item: any) => total + (item.price * item.quantity || 0), 0) || 0;
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    if (CANCELLED_STATUSES.includes(upperStatus) || FAILED_STATUSES.includes(upperStatus)) {
      return COLORS.danger;
    }
    if (upperStatus === 'DELIVERED') {
      return COLORS.success;
    }
    return COLORS.primary;
  };

  const getEstimatedDelivery = () => {
    if (isCancelled || isFailed) return null;
    
    const currentStatus = orderData.current_status.toUpperCase();
    const today = new Date();
    let estimatedDays = 0;
    
    switch (currentStatus) {
      case 'PENDING':
      case 'PLACED':
        estimatedDays = 5;
        break;
      case 'IN_PROCESSING':
      case 'PACKED':
        estimatedDays = 3;
        break;
      case 'SHIPPED':
      case 'IN_TRANSIT':
        estimatedDays = 2;
        break;
      case 'OUT_FOR_DELIVERY':
        estimatedDays = 0;
        break;
      default:
        return null;
    }
    
    const estimatedDate = new Date(today);
    estimatedDate.setDate(today.getDate() + estimatedDays);
    
    return estimatedDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const renderTimelineStep = (statusItem: StatusHistoryItem, index: number, isLast: boolean) => {
    const statusIndex = getStatusIndex(statusItem.status);
    const isCompleted = statusIndex !== -1 && statusIndex < currentStatusIndex;
    const isActive = statusIndex === currentStatusIndex;
    const isFailedStatus = FAILED_STATUSES.includes(statusItem.status.toUpperCase());
    const isCancelledStatus = CANCELLED_STATUSES.includes(statusItem.status.toUpperCase());

    return (
      <View key={`${statusItem.status}-${statusItem.updated_at}-${index}`} style={styles.timelineStep}>
        <View style={styles.timelineIconContainer}>
          {isCompleted ? (
            <View style={[styles.statusIcon, styles.completedIcon]}>
              <Icon name="check" size={16} color={COLORS.white} />
            </View>
          ) : isFailedStatus || isCancelledStatus ? (
            <View style={[styles.statusIcon, styles.failedIcon]}>
              <Icon name={isFailedStatus ? "error" : "cancel"} size={16} color={COLORS.white} />
            </View>
          ) : isActive ? (
            <View style={[styles.statusIcon, styles.activeIcon]}>
              <View style={styles.activeInnerDot} />
            </View>
          ) : (
            <View style={[styles.statusIcon, styles.pendingIcon]} />
          )}
        </View>
        <View style={styles.timelineContent}>
          <View style={[
            styles.timelineCard, 
            { backgroundColor: colors.card },
            (isFailedStatus || isCancelledStatus) && { 
              borderLeftWidth: 3, 
              borderLeftColor: COLORS.danger 
            }
          ]}>
            <Text style={[
              styles.timelineTitle, 
              { 
                color: (isFailedStatus || isCancelledStatus) ? COLORS.danger : 
                       (isActive ? COLORS.primary : 
                       (isCompleted ? COLORS.success : colors.title))
              }
            ]}>
              {getStatusDisplayText(statusItem.status)}
            </Text>
            <Text style={[styles.timelineDate, { color: colors.text, marginBottom: 5 }]}>
              {formatDateTime(statusItem.updated_at)}
            </Text>
            <Text style={[styles.timelineDescription, { color: colors.text }]}>
              {getStatusDescription(statusItem.status, statusItem.remarks)}
            </Text>
          </View>
          {!isLast && <View style={[styles.timelineConnector, { backgroundColor: colors.border }]} />}
        </View>
      </View>
    );
  };

  const estimatedDelivery = getEstimatedDelivery();
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
            <View style={styles.summaryHeader}>
              <Text style={[styles.orderTitle, { color: colors.title }]}>Order Summary</Text>
              {estimatedDelivery && (
                <Text style={[styles.estimatedDelivery, { color: COLORS.primary }]}>
                  Est. delivery: {estimatedDelivery}
                </Text>
              )}
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Order ID</Text>
              <TouchableOpacity onPress={() => showAlert('Order ID', orderData.order_id)}>
                <Text style={[styles.summaryValue, { color: colors.title }]}>{orderData.order_id}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Current Status</Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: `${getStatusColor(orderData.current_status)}20` }
              ]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(orderData.current_status) }]}>
                  {getStatusDisplayText(orderData.current_status)}
                </Text>
              </View>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Items</Text>
              <Text style={[styles.summaryValue, { color: colors.title }]}>{getTotalItems()} items</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Amount</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>₹{getTotalPrice().toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.title }]}>Order Items</Text>
              {orderData.items && orderData.items.length > 2 && (
                <TouchableOpacity onPress={() => setShowAllProducts(!showAllProducts)}>
                  <Text style={[styles.toggleText, { color: COLORS.primary }]}>
                    {showAllProducts ? 'Show Less' : `Show All (${orderData.items.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {displayedProducts.map((item: OrderItem, index: number) => {
              const imageUrl = item.image_path?.startsWith('http') 
                ? item.image_path 
                : item.image_path?.startsWith('/static') 
                  ? IMAGES.placeholder // Use placeholder for static images
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

          {/* Action Buttons */}
          {(isFailed || isCancelled) && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                onPress={() => showAlert('Help & Support', 'Please contact our customer support for assistance with your order.')}
              >
                <Icon name="headset-mic" size={20} color={COLORS.white} />
                <Text style={[styles.actionButtonText, { color: COLORS.white }]}>Contact Support</Text>
              </TouchableOpacity>
              
              {isFailed && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                  onPress={() => showAlert('Retry Delivery', 'We will attempt delivery again. Please ensure someone is available to receive the order.')}
                >
                  <Icon name="refresh" size={20} color={COLORS.white} />
                  <Text style={[styles.actionButtonText, { color: COLORS.white }]}>Retry Delivery</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tracking Timeline */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.title }]}>Order Timeline</Text>
            
            <View style={styles.timelineContainer}>
              {getStatusHistory().map((statusItem, index, array) => 
                renderTimelineStep(statusItem, index, index === array.length - 1)
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  orderSummary: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    marginBottom: 15,
  },
  orderTitle: {
    ...FONTS.fontSemiBold,
    fontSize: 18,
    marginBottom: 5,
  },
  estimatedDelivery: {
    ...FONTS.fontRegular,
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    ...FONTS.fontRegular,
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
  },
  summaryValue: {
    ...FONTS.fontSemiBold,
    fontSize: 14,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    ...FONTS.fontSemiBold,
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    ...FONTS.fontSemiBold,
    fontSize: 18,
  },
  toggleText: {
    ...FONTS.fontRegular,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    ...FONTS.fontSemiBold,
    fontSize: 14,
  },
  timelineContainer: { 
    marginTop: 10,
  },
  timelineStep: { 
    flexDirection: 'row', 
    marginBottom: 4,
  },
  timelineIconContainer: { 
    width: 40, 
    alignItems: 'center', 
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    backgroundColor: COLORS.success,
  },
  activeIcon: {
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: 'rgba(0, 123, 255, 0.3)',
  },
  failedIcon: {
    backgroundColor: COLORS.danger,
  },
  pendingIcon: {
    backgroundColor: COLORS.light,
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  activeInnerDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: COLORS.white,
  },
  timelineContent: { 
    flex: 1, 
    paddingLeft: 15,
    position: 'relative',
  },
  timelineCard: { 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  timelineTitle: { 
    ...FONTS.fontSemiBold, 
    fontSize: 16, 
    marginBottom: 5,
  },
  timelineDate: { 
    ...FONTS.fontRegular, 
    fontSize: 12,
    opacity: 0.8,
  },
  timelineDescription: { 
    ...FONTS.fontRegular, 
    fontSize: 14,
    lineHeight: 20,
  },
  timelineConnector: {
    position: 'absolute',
    left: 0,
    top: 40,
    bottom: -15,
    width: 2,
    zIndex: -1,
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