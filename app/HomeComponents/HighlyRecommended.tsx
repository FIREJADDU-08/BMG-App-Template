import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import CardStyle1 from '../components/Card/CardStyle1';
import { useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigations/RootStackParamList';
import { useDispatch, useSelector } from 'react-redux';
import { addProductToWishList, removeProductFromWishList, fetchWishList } from '../redux/reducer/wishListReducer';
import { addItemToCart, removeItemFromCart, fetchCartItems } from '../redux/reducer/cartReducer';
import { getNewArrivalProducts } from '../Services/NewArrivalService';
import { IMAGES } from '../constants/Images';
import { RootState } from '../redux/store';
import { Feather } from '@expo/vector-icons';
import { Alert } from 'react-native';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
  title?: string;
  showSeeAll?: boolean;
};

const HighlyRecommendedSection = ({
  navigation,
  title = 'Highly Recommended\nJewelry Essentials',
  showSeeAll = true,
}: Props) => {
  const theme = useTheme();
  const { colors } = theme;
  const dispatch = useDispatch();

  const { cart } = useSelector((state: RootState) => state.cart);
  const { wishList, loading: wishlistLoading } = useSelector((state: RootState) => state.wishList);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          dispatch(fetchCartItems()),
          dispatch(fetchWishList()),
          fetchNewArrivals()
        ]);
      } catch (error) {
        console.error('Initial data loading error:', error);
        Alert.alert('Error', 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [dispatch]);

  // Fetch product data
  const fetchNewArrivals = useCallback(async () => {
    try {
      const data = await getNewArrivalProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      throw error;
    }
  }, []);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchNewArrivals(),
        dispatch(fetchWishList()),
        dispatch(fetchCartItems())
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [fetchNewArrivals, dispatch]);

  // Toggle wishlist status
  const toggleWishList = useCallback(async (product: any) => {
    try {
      const exists = wishList.some((item) => item.SNO === product.SNO);
      
      if (exists) {
        await dispatch(removeProductFromWishList(product.SNO)).unwrap();
        // Alert.alert('Success', 'Removed from wishlist');
      } else {
        await dispatch(addProductToWishList(product)).unwrap();
        // Alert.alert('Success', 'Added to wishlist');
      }
      
      // Refresh wishlist data
      await dispatch(fetchWishList());
    } catch (error) {
      console.error('Wishlist error:', error);
      Alert.alert('Error', 'Failed to update wishlist');
    }
  }, [dispatch, wishList]);

  // Handle cart actions (add/remove)
  const handleCartAction = useCallback(async (product: any) => {
    try {
      const existingItem = cart.find((item) => item.itemTagSno === product.SNO);
      
      if (existingItem) {
        // Show removal confirmation
        Alert.alert(
          'Remove Item',
          'This item is in your cart. Remove it?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                await dispatch(removeItemFromCart(existingItem.sno)).unwrap();
                await dispatch(fetchCartItems());
                // Alert.alert('Success', 'Removed from cart');
              }
            }
          ]
        );
      } else {
        // Add to cart logic
        let imageUrl = '';
        try {
          if (product.ImagePath) {
            const parsed = typeof product.ImagePath === 'string' 
              ? JSON.parse(product.ImagePath) 
              : product.ImagePath;
            if (Array.isArray(parsed) && parsed.length > 0) {
              imageUrl = parsed[0];
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `https://app.bmgjewellers.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
              }
            }
          }
        } catch (err) {
          console.warn('Image processing error:', err);
        }

        const cartPayload = {
          itemTagSno: product.SNO,
          imagePath: imageUrl,
          quantity: 1,
          price: parseFloat(product.GrandTotal || product.GrossAmount || '0'),
          productData: product // Include full product details
        };

        await dispatch(addItemToCart(cartPayload)).unwrap();
        await dispatch(fetchCartItems());
        // Alert.alert('Success', 'Added to cart');
      }
    } catch (error) {
      console.error('Cart error:', error);
      Alert.alert('Error', 'Failed to update cart');
    }
  }, [dispatch, cart]);

  // Navigate to product details
  const navigateToProductDetails = useCallback((product: any) => {
    navigation.navigate('ProductDetails', { 
      sno: product.SNO,
      productData: product 
    });
  }, [navigation]);

  // Process image URL
  const getImageUrl = useCallback((product: any): string => {
    try {
      if (!product.ImagePath || product.ImagePath.length < 5) return IMAGES.item11;
      
      const parsed = typeof product.ImagePath === 'string' 
        ? JSON.parse(product.ImagePath) 
        : product.ImagePath;
      
      let image = Array.isArray(parsed) ? parsed[0] : '';
      if (!image || typeof image !== 'string') return IMAGES.item11;
      
      if (!image.startsWith('http')) {
        image = `https://app.bmgjewellers.com${image}`;
      }
      return image;
    } catch (err) {
      return IMAGES.item11;
    }
  }, []);

  // Memoize products for performance
  const memoizedProducts = useMemo(() => products, [products]);

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Loading products...</Text>
      </View>
    );
  }

  // Empty state
  if (!loading && products.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Feather name="package" size={40} color={colors.text} />
        <Text style={{ marginTop: 15, ...FONTS.h5, color: colors.title }}>
          No products found
        </Text>
        <Text style={{ marginTop: 5, color: colors.text }}>
          Check back later for new arrivals
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 15, padding: 10 }}
          onPress={handleRefresh}
        >
          <Feather name="refresh-cw" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[GlobalStyleSheet.container, { paddingTop: 25 }]}>
      {/* Header Section */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 15
      }}>
        <Text style={{ 
          ...FONTS.Marcellus, 
          fontSize: 24, 
          color: colors.title,
          lineHeight: 30
        }}>
          {title}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showSeeAll && (
            <TouchableOpacity 
              onPress={() => navigation.navigate('RecommendedProducts')}
              style={{ marginRight: 15 }}
            >
              <Text style={{ 
                ...FONTS.fontRegular, 
                fontSize: 13, 
                color: colors.title 
              }}>
                See All
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleRefresh}>
            <Feather name="refresh-cw" size={20} color={colors.title} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 15,
          paddingBottom: 20
        }}
      >
        <View style={{ flexDirection: 'row', gap: 15 }}>
          {memoizedProducts.map((product) => {
            const inWishList = wishList.some((item) => item.SNO === product.SNO);
            const cartItem = cart.find((item) => item.itemTagSno === product.SNO);
            const imageUrl = getImageUrl(product);

            return (
              <View
                key={`product-${product.SNO}`}
                style={{ width: SIZES.width / 2.3 }}
              >
                <CardStyle1
                  id={product.SNO}
                  image={imageUrl}
                  title={product.ITEMNAME || 'Product'}
                  price={`₹${product.GrandTotal || product.GrossAmount || 0}`}
                  // discount={`₹${product.GrossAmount || 0}`}
                  // review={`(${product.GRSWT}g • ${product.PURITY}% Pure)`}
                  onPress={() => navigateToProductDetails(product)}
                  onPress1={() => toggleWishList(product)}
                  onPress2={() => handleCartAction(product)}
                  closebtn
                  wishlistActive={inWishList}
                  cartActive={!!cartItem}
                  product={product}
                  cartItemId={cartItem?.sno}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Decorative Border */}
      <View style={{ 
        top: 60, 
        left: 0, 
        position: 'absolute', 
        zIndex: -1 
      }}>
        <Image 
          source={require('../assets/images/border2.png')} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default HighlyRecommendedSection;