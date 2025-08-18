import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { COLORS, FONTS } from '../../constants/theme';
import { ScrollView } from 'react-native-gesture-handler';
import Button from '../../components/Button/Button';
import { IMAGES } from '../../constants/Images';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { createOrder } from '../../Services/OrderCreateService';
import { initiatePayment, getPaymentRedirectUrl } from '../../Services/PaymentService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define CartItemWithDetails type locally
type CartItemWithDetails = {
    sno: number;
    itemTagSno: string;
    fullDetails: {
        MaterialFinish: string;
        Description: string;
        TAGNO: string;
        Occasion: string;
        RATE: string;
        GSTAmount: string;
        TAGKEY: string;
        Gender: string;
        SIZEID: number;
        Best_Design: boolean;
        SNO: string;
        CollectionType: string;
        ImagePath: string;
        NewArrival: boolean;
        GrossAmount: string;
        Featured_Products: boolean;
        SIZENAME: string | null;
        Rate: string;
        StoneType: string | null;
        SUBITEMNAME: string;
        CATNAME: string;
        NETWT: string;
        GSTPer: string;
        GrandTotal: string;
        ColorAccents: string;
        ITEMID: string;
        ITEMNAME: string;
    };
};

type PaymentMethod = {
    id: string;
    name: string;
    icon: string;
    description: string;
    enabled: boolean;
};

type PaymentScreenProps = StackScreenProps<RootStackParamList, 'Payment'>;

const Payment = ({ navigation, route }: PaymentScreenProps) => {
    const theme = useTheme();
    const { colors }: { colors: any } = theme;
    const [loading, setLoading] = React.useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('razorpay');

    // Get data from navigation params
    const { products, selectedAddress, orderSummary } = route.params || {};

    const paymentMethods: PaymentMethod[] = [
        // {
        //     id: 'razorpay',
        //     name: 'Razorpay Gateway',
        //     icon: 'credit-card',
        //     description: 'Pay with Credit/Debit Card, UPI, Net Banking',
        //     enabled: true
        // },
        // {
        //     id: 'upi',
        //     name: 'UPI Payment',
        //     icon: 'smartphone',
        //     description: 'Pay with Google Pay, PhonePe, Paytm',
        //     enabled: true
        // },
        {
            id: 'netbanking',
            name: 'Net Banking',
            icon: 'smartphone',
            description: 'Pay directly from your bank account',
            enabled: true
        },
        // {
        //     id: 'wallet',
        //     name: 'Digital Wallet',
        //     icon: 'credit-card',
        //     description: 'Paytm, PhonePe, Amazon Pay',
        //     enabled: true
        // },
        {
            id: 'cod',
            name: 'Cash on Delivery',
            icon: 'truck',
            description: 'Pay when your order is delivered',
            enabled: true // Disabled for jewelry
        }
    ];

    const formatAddress = (address: any) => {
        if (!address) return "No address selected";
        return `${address.addressLine}, ${address.locality}, ${address.city}, ${address.state} - ${address.pincode}`;
    };

    const prepareOrderData = () => {
        return {
            totalAmount: parseFloat(orderSummary.total),
            address: formatAddress(selectedAddress),
            items: products.map((item: CartItemWithDetails) => ({
                productName: item.fullDetails?.SUBITEMNAME || 'Unnamed Product',
                price: parseFloat(item.fullDetails?.GrandTotal || '0'),
                sno: item.itemTagSno,
                itemId: item.fullDetails?.ITEMID || 0,
                tagNo: item.fullDetails?.TAGKEY || '',
                imagePath: item.fullDetails?.ImagePath || ''
            })),
            email: selectedAddress?.email || '',
            contact: selectedAddress?.phone || '',
            paymentMethod: selectedPaymentMethod
        };
    };

    const handlePaymentInitiation = async (orderId: string, totalAmount: string, email: string, contact: string) => {
        try {
            // Get user details from AsyncStorage
            const emailid = await AsyncStorage.getItem('user_email');
            const contactNumber = await AsyncStorage.getItem('user_contact');

            // Prepare payment data
            const paymentData = {
                merchantTxnNo: orderId,
                amount: parseFloat(totalAmount),
                currencyCode: 356, // INR
                payType: 0,
                transactionType: "SALE",
                addlParam1: '',
                addlParam2: '',
                returnURL: "https://bmgjewellers.com",
                customerEmailID: emailid || email,
                customerMobileNo: contactNumber || contact
            };

            // Step 1: Initiate payment
            const paymentResponse = await initiatePayment(paymentData);
            console.log('Payment initiation response:', paymentResponse);

            if (paymentResponse.responseCode !== "R1000") {
                throw new Error(`Payment failed with code: ${paymentResponse.responseCode}`);
            }

            // Step 2: Get redirect URL
            const paymentRedirectUrl = await getPaymentRedirectUrl(
                paymentResponse.redirectURI,
                paymentResponse.tranCtx,
                paymentResponse.merchantTxnNo
            );
            console.log('Payment redirect URL:', paymentRedirectUrl);

            return {
                paymentResponse,
                paymentRedirectUrl
            };

        } catch (error) {
            console.error('Payment initiation failed:', error);
            throw error;
        }
    };

    const handleSubmitOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('Error', 'Please select a delivery address');
            return;
        }

        if (products.length === 0) {
            Alert.alert('Error', 'Your cart is empty');
            return;
        }

        if (!selectedPaymentMethod) {
            Alert.alert('Error', 'Please select a payment method');
            return;
        }

        try {
            setLoading(true);
            
            // Prepare order data
            const orderData = prepareOrderData();
            console.log('📦 Order Create Service:', JSON.stringify(orderData, null, 2));
            
            // Call the order service
            const response = await createOrder(orderData);
            console.log('🔄 Order Service Response:', response);

            // Check if response contains orderId (success case)
            if (response && response.orderId) {
                // Handle different payment methods
                if (selectedPaymentMethod === 'cod') {
                    // For COD, directly navigate to success screen
                    navigation.navigate('Myorder', {
                        orderDetails: {
                            orderId: response.orderId,
                            items: products,
                            total: parseFloat(orderSummary.total),
                            date: response.orderTime || new Date().toISOString(),
                            status: 'Processing',
                            address: selectedAddress,
                            paymentMethod: 'Cash on Delivery'
                        }
                    });
                } else {
                    // For online payments, initiate payment gateway
                    const paymentResult = await handlePaymentInitiation(
                        response.orderId, 
                        orderSummary.total
                    );

                    // Navigate to payment screen with the redirect URL
                    navigation.navigate('PaymentGateway', {
                        paymentUrl: paymentResult.paymentRedirectUrl,
                        orderDetails: {
                            orderId: response.orderId,
                            items: products,
                            total: parseFloat(orderSummary.total),
                            date: response.orderTime || new Date().toISOString(),
                            status: 'Processing',
                            address: selectedAddress,
                            paymentMethod: paymentMethods.find(m => m.id === selectedPaymentMethod)?.name || selectedPaymentMethod
                        }
                    });
                }

            } else {
                // Handle case where response exists but no orderId
                throw new Error(response?.message || 'Order created but no order ID received');
            }
        } catch (error) {
            console.error('❌ Order submission error:', error);
            
            let errorMessage = 'Failed to place order. Please try again.';
            
            if (error.response) {
                // Handle HTTP error responses
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.message) {
                // Handle custom error messages
                errorMessage = error.message;
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderPaymentMethod = (method: PaymentMethod) => (
        <TouchableOpacity
            key={method.id}
            onPress={() => method.enabled && setSelectedPaymentMethod(method.id)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: selectedPaymentMethod === method.id ? `${COLORS.primary}15` : colors.card,
                borderWidth: selectedPaymentMethod === method.id ? 2 : 1,
                borderColor: selectedPaymentMethod === method.id ? COLORS.primary : colors.border,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                opacity: method.enabled ? 1 : 0.5,
            }}
            disabled={!method.enabled}
        >
            <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: selectedPaymentMethod === method.id ? COLORS.primary : colors.background,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 15
            }}>
                <Feather
                    name={method.icon as any}
                    size={24}
                    color={selectedPaymentMethod === method.id ? 'white' : COLORS.primary}
                />
            </View>
            
            <View style={{ flex: 1 }}>
                <Text style={{
                    ...FONTS.fontSemiBold,
                    fontSize: 16,
                    color: method.enabled ? colors.title : colors.text,
                    marginBottom: 4
                }}>
                    {method.name}
                </Text>
                <Text style={{
                    ...FONTS.fontRegular,
                    fontSize: 12,
                    color: method.enabled ? colors.text : colors.text,
                    opacity: 0.7
                }}>
                    {method.description}
                </Text>
                {!method.enabled && (
                    <Text style={{
                        ...FONTS.fontMedium,
                        fontSize: 11,
                        color: '#FF6B6B',
                        marginTop: 4
                    }}>
                        Not available for jewelry orders
                    </Text>
                )}
            </View>

            <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selectedPaymentMethod === method.id ? COLORS.primary : colors.border,
                backgroundColor: selectedPaymentMethod === method.id ? COLORS.primary : 'transparent',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {selectedPaymentMethod === method.id && (
                    <Feather name="check" size={12} color="white" />
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
            <Header
                title="Payment"
                leftIcon="back"
                onPressLeft={() => navigation.goBack()}
            />

            <View style={{ flex: 1 }}>
                <ScrollView 
                    contentContainerStyle={{ 
                        paddingBottom: 200,
                        paddingTop: 10
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={GlobalStyleSheet.container}>
                        {/* Order Summary Card */}
                        <View style={{
                            backgroundColor: colors.card,
                            borderRadius: 15,
                            padding: 20,
                            marginBottom: 20,
                            shadowColor: 'rgba(0,0,0,0.1)',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.8,
                            shadowRadius: 4,
                            elevation: 3,
                        }}>
                            <Text style={{ ...FONTS.fontSemiBold, fontSize: 18, color: colors.title, marginBottom: 15 }}>
                                Payment Summary
                            </Text>

                            <View style={{ backgroundColor: colors.background, borderRadius: 10, padding: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text }}>
                                        Items ({orderSummary?.itemCount || 0})
                                    </Text>
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: colors.title }}>
                                        ₹{orderSummary?.subtotal || '0.00'}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text }}>Discount</Text>
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: COLORS.success }}>
                                        -₹{orderSummary?.discount || '0.00'}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text }}>GST (18%)</Text>
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: colors.title }}>
                                        ₹{orderSummary?.tax || '0.00'}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text }}>Shipping</Text>
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: colors.title }}>
                                        ₹{orderSummary?.shipping || '0.00'}
                                    </Text>
                                </View>

                                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ ...FONTS.fontBold, fontSize: 18, color: colors.title }}>Total Amount</Text>
                                    <Text style={{ ...FONTS.fontBold, fontSize: 20, color: COLORS.primary }}>
                                        ₹{orderSummary?.total || '0.00'}
                                    </Text>
                                </View>
                            </View>

                        </View>

                        {/* Delivery Address Summary */}
                        <View style={{
                            backgroundColor: colors.card,
                            borderRadius: 15,
                            padding: 20,
                            marginBottom: 20,
                            shadowColor: 'rgba(0,0,0,0.1)',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.8,
                            shadowRadius: 4,
                            elevation: 3,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <Feather name="map-pin" size={18} color={COLORS.primary} />
                                <Text style={{ ...FONTS.fontSemiBold, fontSize: 16, color: colors.title, marginLeft: 8 }}>
                                    Delivery Address
                                </Text>
                            </View>
                            
                            <View style={{ backgroundColor: colors.background, borderRadius: 10, padding: 15 }}>
                                <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: colors.title, marginBottom: 4 }}>
                                    {selectedAddress?.name} • {selectedAddress?.type}
                                </Text>
                                <Text style={{ ...FONTS.fontRegular, fontSize: 13, color: colors.text, lineHeight: 18 }}>
                                    {formatAddress(selectedAddress)}
                                </Text>
                                {selectedAddress?.phone && (
                                    <Text style={{ ...FONTS.fontRegular, fontSize: 12, color: colors.text, marginTop: 8 }}>
                                        📞 {selectedAddress.phone}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Payment Methods */}
                        <View style={{
                            backgroundColor: colors.card,
                            borderRadius: 15,
                            padding: 20,
                            shadowColor: 'rgba(0,0,0,0.1)',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.8,
                            shadowRadius: 4,
                            elevation: 3,
                        }}>
                            <Text style={{ ...FONTS.fontSemiBold, fontSize: 18, color: colors.title, marginBottom: 15 }}>
                                Choose Payment Method
                            </Text>

                            {paymentMethods.map(renderPaymentMethod)}

                            {/* Security Info */}
                            <View style={{
                                backgroundColor: colors.background,
                                borderRadius: 10,
                                padding: 15,
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 10
                            }}>
                                <MaterialIcons name="security" size={20} color={COLORS.success} />
                                <Text style={{
                                    ...FONTS.fontRegular,
                                    fontSize: 12,
                                    color: colors.text,
                                    marginLeft: 10,
                                    flex: 1,
                                    lineHeight: 16
                                }}>
                                    Your payment information is secure and encrypted. We don't store your card details.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Fixed Bottom Payment Button */}
                <View style={[{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    shadowColor: 'rgba(195, 123, 95, 0.25)',
                    shadowOffset: { width: 2, height: -20 },
                    shadowOpacity: .1,
                    shadowRadius: 5,
                }, Platform.OS === "ios" && {
                    backgroundColor: colors.card,
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    bottom: 30
                }]}
                >
                    <View style={{
                        backgroundColor: colors.card,
                        borderTopLeftRadius: 25,
                        borderTopRightRadius: 25,
                        paddingHorizontal: 20,
                        paddingTop: 20,
                        paddingBottom: Platform.OS === 'ios' ? 40 : 20
                    }}>
                        {/* Selected Payment Method Display */}
                        {selectedPaymentMethod && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 15,
                                paddingBottom: 15,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border
                            }}>
                                <Feather
                                    name={paymentMethods.find(m => m.id === selectedPaymentMethod)?.icon as any || 'credit-card'}
                                    size={20}
                                    color={COLORS.primary}
                                />
                                <Text style={{
                                    ...FONTS.fontMedium,
                                    fontSize: 14,
                                    color: colors.title,
                                    marginLeft: 10,
                                    flex: 1
                                }}>
                                    {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                                </Text>
                                <Text style={{
                                    ...FONTS.fontBold,
                                    fontSize: 16,
                                    color: COLORS.primary
                                }}>
                                    ₹{orderSummary?.total || '0.00'}
                                </Text>
                            </View>
                        )}

                        <Button
                            title={loading ? "Processing Payment..." : `Pay ₹${orderSummary?.total || '0.00'}`}
                            onPress={handleSubmitOrder}
                            color={COLORS.primary}
                            btnRounded
                            disabled={loading || !selectedPaymentMethod || (products?.length || 0) === 0 || !selectedAddress}
                            icon={loading && (
                                <ActivityIndicator
                                    color="#fff"
                                    size="small"
                                    style={{ marginRight: 10 }}
                                />
                            )}
                        />
                        
                        {(!selectedPaymentMethod || !selectedAddress || (products?.length || 0) === 0) && (
                            <Text style={{ 
                                ...FONTS.fontRegular, 
                                fontSize: 12, 
                                color: colors.text, 
                                textAlign: 'center', 
                                marginTop: 8,
                                opacity: 0.7 
                            }}>
                                {!selectedPaymentMethod ? 'Please select a payment method' : 
                                 !selectedAddress ? 'Address required' : 
                                 'No items to pay for'}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Payment;