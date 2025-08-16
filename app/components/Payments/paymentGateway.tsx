// screens/PaymentGateway.tsx
import React, { useEffect } from 'react';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView, Linking, Alert,ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigations/RootStackParamList';

type PaymentGatewayScreenProps = StackScreenProps<RootStackParamList, 'PaymentGateway'>;

const PaymentGateway = ({ route, navigation }: PaymentGatewayScreenProps) => {
    const { paymentUrl, orderDetails } = route.params;

    // Handle deep linking
    useEffect(() => {
        const deepLinkListener = Linking.addEventListener('url', handleDeepLink);
        return () => deepLinkListener.remove();
    }, []);

    const handleDeepLink = (event: { url: string }) => {
        const url = new URL(event.url);
        if (url.host === 'payment-result') {
            handlePaymentResult(url.searchParams);
        }
    };

    const handlePaymentResult = (params: URLSearchParams) => {
        const status = params.get('status');
        const orderId = params.get('orderId');
        
        if (status === 'success') {
            navigation.replace('Myorder', { 
                success: true,
                orderDetails: {
                    ...orderDetails,
                    orderId: orderId || orderDetails.orderId
                }
            });
        } else {
            navigation.replace('Myorder', { 
                success: false,
                orderDetails
            });
        }
    };

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        // Check for both web and deep link URLs
        if (navState.url.includes('payment-success') || 
            navState.url.includes('bmgjewellers://payment-result?status=success')) {
            handlePaymentSuccess();
        } else if (navState.url.includes('payment-failure') || 
                 navState.url.includes('bmgjewellers://payment-result?status=failure')) {
            handlePaymentFailure();
        }
    };

    const handlePaymentSuccess = () => {
        navigation.replace('Myorder', { 
            success: true,
            orderDetails
        });
    };

    const handlePaymentFailure = () => {
        navigation.replace('Myorder', { 
            success: false,
            orderDetails
        });
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <WebView
                source={{ uri: paymentUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                startInLoadingState={true}
                onError={(error) => {
                    console.error('WebView error:', error);
                    Alert.alert('Error', 'Payment failed to load');
                    navigation.goBack();
                }}
                renderLoading={() => (
                    <ActivityIndicator size="large" style={{ flex: 1 }} />
                )}
            />
        </SafeAreaView>
    );
};

export default PaymentGateway;