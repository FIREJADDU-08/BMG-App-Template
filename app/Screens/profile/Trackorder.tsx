import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View, Text, Image, SafeAreaView, Platform, ScrollView, StyleSheet } from 'react-native';
import Header from '../../layout/Header';
import { FONTS, COLORS } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import CardStyle3 from '../../components/Card/CardStyle3';
import { IMAGES } from '../../constants/Images';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import Icon from 'react-native-vector-icons/MaterialIcons';

type TrackOrderScreenProps = StackScreenProps<RootStackParamList, 'Trackorder'>;

// Define status order for tracking timeline
const STATUS_ORDER = [
  "PENDING",
  "PLACED",
  "IN_PROCESSING",
  "PACKED",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED"
];

const CANCELLED_STATUSES = ["CANCELLED", "RETURNED", "REFUNDED"];

const Trackorder = ({ route, navigation }: TrackOrderScreenProps) => {
  const { order } = route.params;
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  // Function to get status index for timeline
  const getStatusIndex = (status: string) => {
    const upperStatus = status.toUpperCase();
    if (CANCELLED_STATUSES.includes(upperStatus)) return -1;
    
    return STATUS_ORDER.findIndex(s => s === upperStatus);
  };

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = CANCELLED_STATUSES.includes(order.status.toUpperCase());

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get status display text
  const getStatusDisplayText = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return "Payment Pending";
      case "PLACED": return "Order Placed";
      case "IN_PROCESSING": return "Order Processing";
      case "PACKED": return "Order Packed";
      case "SHIPPED": return "Order Shipped";
      case "IN_TRANSIT": return "In Transit";
      case "DELIVERED": return "Delivered";
      case "CANCELLED": return "Cancelled";
      case "RETURNED": return "Returned";
      case "REFUNDED": return "Refunded";
      default: return status;
    }
  };

  // Get estimated dates for each status (this would ideally come from the API)
  const getEstimatedDate = (statusIndex: number) => {
    if (!order.orderTime) return "Date not available";
    
    try {
      const orderDate = new Date(order.orderTime);
      // Add days based on status index for estimation
      const estimatedDate = new Date(orderDate);
      estimatedDate.setDate(orderDate.getDate() + statusIndex * 2);
      
      return formatDate(estimatedDate.toISOString());
    } catch (error) {
      return "Date not available";
    }
  };

  // Get status description
  const getStatusDescription = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return "Waiting for payment confirmation";
      case "PLACED": return "We have received your order";
      case "IN_PROCESSING": return "We are preparing your order";
      case "PACKED": return "Your order has been packed";
      case "SHIPPED": return "Your order has been shipped";
      case "IN_TRANSIT": return "Your order is in transit";
      case "DELIVERED": return "Your order has been delivered";
      case "CANCELLED": return "Your order has been cancelled";
      case "RETURNED": return "Your order has been returned";
      case "REFUNDED": return "Your refund has been processed";
      default: return "Status update";
    }
  };

  // Render timeline step
  const renderTimelineStep = (status: string, index: number) => {
    const isCompleted = index < currentStatusIndex;
    const isActive = index === currentStatusIndex;
    const isFuture = index > currentStatusIndex;
    
    return (
      <View key={index} style={styles.timelineStep}>
        <View style={styles.timelineIconContainer}>
          {isCompleted ? (
            <Image
              style={styles.checkIcon}
              source={IMAGES.check}
            />
          ) : (
            <View style={[
              styles.statusIcon,
              isActive && styles.activeIcon,
              isFuture && styles.futureIcon
            ]}>
              {isActive && <View style={styles.activeInnerDot} />}
            </View>
          )}
        </View>
        <View style={styles.timelineContent}>
          <View style={[
            styles.timelineCard,
            { backgroundColor: colors.card },
            (isActive || isCompleted) ? {} : { opacity: 0.4 }
          ]}>
            <Text style={[
              styles.timelineTitle,
              { color: (isActive || isCompleted) ? COLORS.primary : colors.title }
            ]}>
              {getStatusDisplayText(status)}
              <Text style={styles.timelineDate}>
                {isCompleted || isActive ? `  ${getEstimatedDate(index)}` : `  ${getEstimatedDate(index)}`}
              </Text>
            </Text>
            <Text style={[styles.timelineDescription, { color: colors.title }]}>
              {getStatusDescription(status)}
            </Text>
          </View>
        </View>
        {index < STATUS_ORDER.length - 1 && (
          <View style={[
            styles.timelineConnector,
            { backgroundColor: (isCompleted || isActive) ? COLORS.primary : colors.card }
          ]} />
        )}
      </View>
    );
  };

  // Render cancelled status
  const renderCancelledStatus = () => {
    return (
      <View style={styles.cancelledContainer}>
        <View style={styles.timelineStep}>
          <View style={styles.timelineIconContainer}>
            <View style={[styles.statusIcon, styles.cancelledIcon]}>
              <Icon name="close" size={16} color={COLORS.white} />
            </View>
          </View>
          <View style={styles.timelineContent}>
            <View style={[styles.timelineCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.timelineTitle, { color: COLORS.danger }]}>
                {getStatusDisplayText(order.status)}
                <Text style={styles.timelineDate}>  {formatDate(order.orderTime)}</Text>
              </Text>
              <Text style={[styles.timelineDescription, { color: colors.title }]}>
                {getStatusDescription(order.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <Header
        title={"Track Order"}
        leftIcon={"back"}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={GlobalStyleSheet.container}>
          {/* Order Items */}
          <View style={{ marginHorizontal: -15 }}>
            {order.orderItems && order.orderItems.map((item, index) => {
              // Process image paths (same as in OrderDetails)
              const processImagePaths = (imagePath: any): string => {
                if (!imagePath) return '';
                
                try {
                  let paths: string[] = [];
                  
                  if (Array.isArray(imagePath)) {
                    paths = imagePath;
                  } 
                  else if (typeof imagePath === 'string' && imagePath.trim().startsWith('[')) {
                    paths = JSON.parse(imagePath);
                  }
                  else if (typeof imagePath === 'string') {
                    paths = [imagePath];
                  }
                  
                  const firstPath = paths.length > 0 ? paths[0] : '';
                  
                  if (firstPath && firstPath.startsWith('http')) {
                    return firstPath;
                  }
                  
                  if (firstPath && firstPath.startsWith('/')) {
                    return `https://app.bmgjewellers.com${firstPath}`;
                  }
                  
                  return firstPath ? `https://app.bmgjewellers.com/${firstPath}` : '';
                } catch (error) {
                  console.warn('Error processing image paths:', error);
                  return '';
                }
              };

              const imageUrl = processImagePaths(item.image_path);
              
              return (
                <View key={item.id || index} style={{ marginBottom: 15 }}>
                  <CardStyle3
                    id={item.id.toString()}
                    title={item.productName}
                    price={`₹${item.price}`}
                    image={imageUrl} // Pass the URL string directly
                    discount={''} 
                    removebtn={true}
                    status={order.status}
                    review={''}
                    grid={true}
                    offer={''}
                  />
                </View>
              );
            })}
          </View>
          
          {/* Tracking Header */}
          <View style={styles.trackingHeader}>
            <Text style={[styles.trackingTitle, { color: colors.title }]}>Track Order</Text>
            <View style={styles.orderInfo}>
              <Text style={[styles.orderId, { color: colors.text }]}>Order #: {order.orderId}</Text>
              <View style={[styles.statusBadge, { backgroundColor: 
                order.status.toUpperCase() === 'DELIVERED' ? COLORS.success :
                order.status.toUpperCase() === 'CANCELLED' ? COLORS.danger :
                order.status.toUpperCase() === 'RETURNED' ? COLORS.warning :
                order.status.toUpperCase() === 'REFUNDED' ? COLORS.info : COLORS.primary
              }]}>
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>
          </View>
          
          {/* Tracking Timeline */}
          <View style={styles.timelineContainer}>
            {isCancelled ? (
              renderCancelledStatus()
            ) : (
              STATUS_ORDER.map((status, index) => renderTimelineStep(status, index))
            )}
          </View>
          
          {/* Courier Information (if available) */}
          {order.courierName && order.courierTrackingId && (
            <View style={[styles.courierContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.courierTitle, { color: colors.title }]}>Courier Information</Text>
              <View style={styles.courierInfo}>
                <View style={styles.courierRow}>
                  <Text style={[styles.courierLabel, { color: colors.text }]}>Courier:</Text>
                  <Text style={[styles.courierValue, { color: colors.title }]}>{order.courierName}</Text>
                </View>
                <View style={styles.courierRow}>
                  <Text style={[styles.courierLabel, { color: colors.text }]}>Tracking ID:</Text>
                  <Text style={[styles.courierValue, { color: colors.title }]}>{order.courierTrackingId}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  trackingHeader: {
    marginTop: 20,
    marginBottom: 10,
  },
  trackingTitle: {
    ...FONTS.Marcellus,
    fontSize: 20,
    marginBottom: 10,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderId: {
    ...FONTS.fontRegular,
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    ...FONTS.fontRegular,
    fontSize: 12,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  timelineContainer: {
    marginBottom: 20,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineIconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    height: 24,
    width: 24,
    resizeMode: 'contain',
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  activeIcon: {
    backgroundColor: COLORS.primary,
  },
  futureIcon: {
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.lightGray,
  },
  activeInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  cancelledIcon: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 20,
  },
  timelineCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  timelineTitle: {
    ...FONTS.Marcellus,
    fontSize: 16,
    marginBottom: 5,
  },
  timelineDate: {
    ...FONTS.fontRegular,
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  timelineDescription: {
    ...FONTS.fontRegular,
    fontSize: 14,
  },
  timelineConnector: {
    position: 'absolute',
    left: 19,
    top: 24,
    bottom: -20,
    width: 2,
    zIndex: -1,
  },
  cancelledContainer: {
    marginTop: 10,
  },
  courierContainer: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  courierTitle: {
    ...FONTS.fontSemiBold,
    fontSize: 16,
    marginBottom: 15,
  },
  courierInfo: {
    gap: 10,
  },
  courierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  courierLabel: {
    ...FONTS.fontRegular,
    fontSize: 14,
  },
  courierValue: {
    ...FONTS.fontMedium,
    fontSize: 14,
  },
});

export default Trackorder;