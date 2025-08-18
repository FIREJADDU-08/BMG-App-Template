import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Platform,
    Dimensions
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
import { Feather } from '@expo/vector-icons';
import { useAddress } from '../../Context/AddressContext';

const { height } = Dimensions.get('window');

// Define CartItemWithDetails type locally since it's imported from Shopping
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

type CheckoutScreenProps = StackScreenProps<RootStackParamList, 'Checkout'>;

const Checkout = ({ navigation, route }: CheckoutScreenProps) => {
    const theme = useTheme();
    const { colors }: { colors: any } = theme;
    
    const discount = 50; // Fixed discount of ₹50
    const shippingFee = 50; // Fixed shipping fee of ₹50
    const taxRate = 0.18; // 18% GST

    // Get selected address ID from navigation params
    const { selectedAddressId, products: initialProducts } = route.params || {};
    const { addresses, getAddresses } = useAddress();

    // Ensure addresses are fetched when the screen mounts
    React.useEffect(() => {
        getAddresses();
    }, []);

    // Find the selected or default address
    const selectedAddress = React.useMemo(() => {
        if (selectedAddressId) {
            return addresses.find(addr => addr.id === selectedAddressId);
        }
        return addresses.find(addr => addr.isDefault) || null;
    }, [addresses, selectedAddressId]);

    // Get products from navigation params (from Shopping cart)
    const products: CartItemWithDetails[] = initialProducts || [];
    
    // Calculate order summary with enhanced calculations
    const orderSummary = React.useMemo(() => {
        const subtotal = products.reduce((acc, item) => {
            return acc + parseFloat(item?.fullDetails?.GrandTotal || '0');
        }, 0);

        const discountAmount = discount;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const taxAmount = subtotalAfterDiscount * taxRate;
        const total = subtotalAfterDiscount + taxAmount + shippingFee;

        return { 
            subtotal: subtotal.toFixed(2),
            discount: discountAmount.toFixed(2),
            tax: taxAmount.toFixed(2),
            shipping: shippingFee.toFixed(2),
            total: total.toFixed(2),
            itemCount: products.length
        };
    }, [products]);

    const getImageUrl = (imagePath?: string): string => {
        if (!imagePath || imagePath.length < 5) return 'https://via.placeholder.com/150';
        try {
            const parsed = JSON.parse(imagePath);
            let image = parsed?.[0] || '';
            if (!image || typeof image !== 'string') return 'https://via.placeholder.com/150';
            if (!image.startsWith('http')) {
                image = `https://app.bmgjewellers.com${image}`;
            }
            return image;
        } catch (err) {
            return 'https://via.placeholder.com/150';
        }
    };

    const formatAddress = (address: any) => {
        if (!address) return "No address selected";
        return `${address.addressLine}, ${address.locality}, ${address.city}, ${address.state} - ${address.pincode}`;
    };

    const getAddressIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'home': return IMAGES.home;
            case 'office': return IMAGES.map;
            case 'shop': return IMAGES.shop;
            default: return IMAGES.home;
        }
    };

    const handleProceedToPayment = () => {
        if (!selectedAddress) {
            // Navigate to address selection if no address is selected
            navigation.navigate('SaveAddress', {
                products,
                selectedAddressId: selectedAddress?.id,
                fromCheckout: true // Indicate coming from Checkout
            });
            return;
        }

        if (products.length === 0) {
            navigation.goBack();
            return;
        }

        // Navigate to Payment page with all necessary data
        navigation.navigate('PaymentPage', {
            products,
            selectedAddress,
            orderSummary,
            fromCheckout: true
        });
    };

    return (
        <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
            <Header
                title="Checkout"
                leftIcon="back"
                onPressLeft={() => navigation.goBack()}
            />

            <View style={{ flex: 1 }}>
                {/* Scrollable content area */}
                <ScrollView 
                    contentContainerStyle={{ 
                        paddingBottom: 200, // Extra space for fixed order summary
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
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={{ ...FONTS.fontSemiBold, fontSize: 18, color: colors.title }}>
                                    Order Summary
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Feather name="shopping-bag" size={16} color={COLORS.primary} />
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: COLORS.primary, marginLeft: 5 }}>
                                        {orderSummary.itemCount} {orderSummary.itemCount === 1 ? 'item' : 'items'}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ backgroundColor: colors.background, borderRadius: 10, padding: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text }}>Subtotal</Text>
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: colors.title }}>
                                        ₹{orderSummary.subtotal}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text }}>Discount</Text>
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: COLORS.success }}>
                                        -₹{orderSummary.discount}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text }}>GST (18%)</Text>
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: colors.title }}>
                                        ₹{orderSummary.tax}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.text }}>Shipping</Text>
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: colors.title }}>
                                        ₹{orderSummary.shipping}
                                    </Text>
                                </View>

                                <View style={{
                                    height: 1,
                                    backgroundColor: colors.border,
                                    marginVertical: 10
                                }} />

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ ...FONTS.fontBold, fontSize: 16, color: colors.title }}>Total Amount</Text>
                                    <Text style={{ ...FONTS.fontBold, fontSize: 18, color: COLORS.primary }}>
                                        ₹{orderSummary.total}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Delivery Address Section */}
                        <View style={{
                            backgroundColor: colors.card,
                            borderRadius: 15,
                            marginBottom: 20,
                            shadowColor: 'rgba(0,0,0,0.1)',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.8,
                            shadowRadius: 4,
                            elevation: 3,
                        }}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('SaveAddress', {
                                    products,
                                    selectedAddressId: selectedAddress?.id,
                                    fromCheckout: true // Indicate coming from Checkout
                                })}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 20,
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 }}>
                                    <View style={{
                                        height: 50,
                                        width: 50,
                                        borderRadius: 12,
                                        backgroundColor: selectedAddress ? COLORS.primary : colors.border,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Image
                                            style={{
                                                height: 24,
                                                width: 24,
                                                tintColor: selectedAddress ? 'white' : colors.text,
                                                resizeMode: 'contain'
                                            }}
                                            source={selectedAddress ? getAddressIcon(selectedAddress.name) : IMAGES.map}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ ...FONTS.fontSemiBold, fontSize: 16, color: colors.title, marginBottom: 4 }}>
                                            {selectedAddress ? 'Delivery Address' : 'Select Delivery Address'}
                                        </Text>
                                        {selectedAddress ? (
                                            <>
                                                <Text style={{
                                                    ...FONTS.fontMedium,
                                                    fontSize: 14,
                                                    color: COLORS.primary,
                                                    marginBottom: 4
                                                }}>
                                                    {selectedAddress.name} • {selectedAddress.type}
                                                </Text>
                                                <Text style={{
                                                    ...FONTS.fontRegular,
                                                    fontSize: 12,
                                                    color: colors.text,
                                                    lineHeight: 16
                                                }}>
                                                    {formatAddress(selectedAddress)}
                                                </Text>
                                                {selectedAddress.phone && (
                                                    <Text style={{
                                                        ...FONTS.fontRegular,
                                                        fontSize: 12,
                                                        color: colors.text,
                                                        marginTop: 4
                                                    }}>
                                                        📞 {selectedAddress.phone}
                                                    </Text>
                                                )}
                                            </>
                                        ) : (
                                            <Text style={{
                                                ...FONTS.fontRegular,
                                                fontSize: 14,
                                                color: colors.text,
                                                fontStyle: 'italic'
                                            }}>
                                                Tap to add or select an address
                                            </Text>
                                        )}
                                    </View>
                                </View>
                                <View style={{
                                    backgroundColor: colors.background,
                                    borderRadius: 8,
                                    padding: 8
                                }}>
                                    <Image
                                        style={{
                                            height: 16,
                                            width: 16,
                                            resizeMode: 'contain',
                                            tintColor: colors.title
                                        }}
                                        source={IMAGES.rightarrow}
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Order Items Section */}
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
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                <Text style={{ ...FONTS.fontSemiBold, fontSize: 16, color: colors.title }}>
                                    Your Items
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.goBack()}
                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <Text style={{ ...FONTS.fontMedium, fontSize: 12, color: COLORS.primary, marginRight: 4 }}>
                                        Edit Cart
                                    </Text>
                                    <Feather name="edit-2" size={12} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>

                            {products.length === 0 ? (
                                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                                    <Feather name="shopping-cart" size={40} color={colors.text} />
                                    <Text style={{ ...FONTS.fontRegular, color: colors.text, marginTop: 10 }}>
                                        No items in your cart
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ maxHeight: height * 0.3 }}>
                                    <ScrollView showsVerticalScrollIndicator={false}>
                                        {products.map((item, index) => (
                                            <View
                                                key={`${item.sno}-${index}`}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginBottom: index === products.length - 1 ? 0 : 15,
                                                    backgroundColor: colors.background,
                                                    borderRadius: 10,
                                                    padding: 12,
                                                }}
                                            >
                                                <Image
                                                    source={{ uri: getImageUrl(item.fullDetails?.ImagePath) }}
                                                    style={{
                                                        width: 70,
                                                        height: 70,
                                                        borderRadius: 8,
                                                        marginRight: 12,
                                                        resizeMode: 'cover',
                                                    }}
                                                />
                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        style={{ ...FONTS.fontMedium, fontSize: 14, color: colors.title, marginBottom: 4 }}
                                                        numberOfLines={2}
                                                    >
                                                        {item.fullDetails?.SUBITEMNAME || 'Unnamed Product'}
                                                    </Text>
                                                    <Text style={{ ...FONTS.fontRegular, fontSize: 12, color: colors.text, marginBottom: 2 }}>
                                                        {item.fullDetails?.CATNAME}
                                                    </Text>
                                                    <Text style={{ ...FONTS.fontRegular, fontSize: 11, color: colors.text, opacity: 0.7 }}>
                                                        SKU: {item.fullDetails?.TAGKEY || 'N/A'}
                                                    </Text>
                                                </View>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={{ ...FONTS.fontBold, fontSize: 16, color: COLORS.primary }}>
                                                        ₹{parseFloat(item.fullDetails?.GrandTotal || '0').toFixed(2)}
                                                    </Text>
                                                    {item.fullDetails?.NewArrival && (
                                                        <View style={{
                                                            backgroundColor: '#4ECDC4',
                                                            paddingHorizontal: 6,
                                                            paddingVertical: 2,
                                                            borderRadius: 4,
                                                            marginTop: 4
                                                        }}>
                                                            <Text style={{ ...FONTS.fontMedium, fontSize: 8, color: 'white' }}>NEW</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Fixed Bottom Button */}
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
                        height: 88,
                        backgroundColor: colors.card,
                        borderTopLeftRadius: 25,
                        borderTopRightRadius: 25,
                        paddingHorizontal: 15,
                        justifyContent: 'center'
                    }}>
                        <Button
                            title={!selectedAddress ? "Select Address First" : `Proceed to Payment • ₹${orderSummary.total}`}
                            onPress={handleProceedToPayment}
                            color={!selectedAddress ? colors.border : COLORS.primary}
                            btnRounded
                            disabled={products.length === 0}
                        />
                        {!selectedAddress && (
                            <Text style={{ 
                                ...FONTS.fontRegular, 
                                fontSize: 12, 
                                color: colors.text, 
                                textAlign: 'center', 
                                marginTop: 5,
                                opacity: 0.7 
                            }}>
                                Please add a delivery address to continue
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Checkout;