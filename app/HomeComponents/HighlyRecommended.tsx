import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet
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
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          dispatch(fetchCartItems()),
          dispatch(fetchWishList()),
          fetchNewArrivals()
        ]);
      } catch (err) {
        setError('Failed to load products. Please try again.');
        console.error('Initial data loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [dispatch]);

  const fetchNewArrivals = useCallback(async () => {
    try {
      const data = await getNewArrivalProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      throw new Error("Failed to load products");
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      await Promise.all([
        fetchNewArrivals(),
        dispatch(fetchWishList()),
        dispatch(fetchCartItems())
      ]);
    } catch (err) {
      console.error('Refresh error:', err);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [fetchNewArrivals, dispatch]);

  const toggleWishList = useCallback(async (product: any) => {
    try {
      const exists = wishList.some((item) => item.SNO === product.SNO);
      
      if (exists) {
        await dispatch(removeProductFromWishList(product.SNO));
      } else {
        await dispatch(addProductToWishList(product));
      }
      // Don't need to fetch again as the state should be updated
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    }
  }, [dispatch, wishList]);

const handleCartAction = useCallback(async (product: any) => {
  try {
    const existingItem = cart.find((item) => item.itemTagSno === product.SNO);
    
    if (existingItem) {
      await dispatch(removeItemFromCart(existingItem.sno));
    } else {
      const imageUrl = getImageUrl(product);
      
      const cartPayload = {
        itemTagSno: product.SNO,
        imagePath: imageUrl,
        quantity: 1,
        price: parseFloat(product.GrandTotal || product.GrossAmount || '0'),
        productData: product
      };

      await dispatch(addItemToCart(cartPayload));
    }
  } catch (err) {
    console.error('Cart action error:', err);
  }
}, [dispatch, cart, getImageUrl]); // Add getImageUrl to dependencies

  const navigateToProductDetails = useCallback((product: any) => {
    navigation.navigate('ProductDetails', { 
      sno: product.SNO,
      productData: product 
    });
  }, [navigation]);

const getImageUrl = useCallback((product: any): string => {
  try {
    // If there's no ImagePath or it's too short, return default image
    if (!product.ImagePath || product.ImagePath.length < 5) {
      return IMAGES.item12;
    }
    
    // Case 1: Direct image path (like "/uploads/app_banners/...")
    if (typeof product.ImagePath === 'string' && 
        product.ImagePath.startsWith('/') && 
        !product.ImagePath.startsWith('[')) {
      
      let imageUrl = product.ImagePath;
      if (!imageUrl.startsWith('http')) {
        imageUrl = `https://app.bmgjewellers.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
      return imageUrl;
    }
    
    // Case 2: JSON string array (like "[\"/uploads/product_images/...\", ...]")
    let parsedImages;
    if (typeof product.ImagePath === 'string') {
      try {
        parsedImages = JSON.parse(product.ImagePath);
      } catch (e) {
        // If it's not valid JSON, try to handle it as a single string
        if (product.ImagePath.startsWith('/')) {
          let imageUrl = product.ImagePath;
          if (!imageUrl.startsWith('http')) {
            imageUrl = `https://app.bmgjewellers.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
          }
          return imageUrl;
        }
        return IMAGES.item12;
      }
    } else {
      // Case 3: Already an array
      parsedImages = product.ImagePath;
    }
    
    // Get the first image from the array
    let image = Array.isArray(parsedImages) && parsedImages.length > 0 
      ? parsedImages[0] 
      : '';
    
    // Handle case where image might be null or undefined
    if (!image || typeof image !== 'string') {
      return IMAGES.item12;
    }
    
    // Ensure proper URL format
    if (!image.startsWith('http')) {
      image = `https://app.bmgjewellers.com${image.startsWith('/') ? '' : '/'}${image}`;
    }
    
    return image;
  } catch (err) {
    console.error('Image URL parsing error:', err);
    return IMAGES.item12;
  }
}, []);

  const memoizedProducts = useMemo(() => products, [products]);

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading products...
        </Text>
      </View>
    );
  }

  // Render error state
  if (error && products.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={40} color={COLORS.danger} />
        <Text style={[styles.errorText, { color: colors.title }]}>
          {error}
        </Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { borderColor: colors.border }]}
          onPress={handleRefresh}
        >
          <Feather name="refresh-cw" size={20} color={COLORS.primary} />
          <Text style={[styles.refreshText, { color: COLORS.primary }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render empty state
  if (!loading && products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="package" size={40} color={colors.text} />
        <Text style={[styles.emptyTitle, { color: colors.title }]}>
          No products found
        </Text>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Check back later for new arrivals
        </Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { borderColor: colors.border }]}
          onPress={handleRefresh}
        >
          <Feather name="refresh-cw" size={20} color={COLORS.primary} />
          <Text style={[styles.refreshText, { color: COLORS.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[GlobalStyleSheet.container, styles.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.title }]}>
          {title}
        </Text>
        
        {showSeeAll && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('RecommendedProducts')}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.title }]}>
              See All
            </Text>
            <Feather name="chevron-right" size={16} color={colors.title} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {memoizedProducts.map((product) => {
          const inWishList = wishList.some((item) => item.SNO === product.SNO);
          const cartItem = cart.find((item) => item.itemTagSno === product.SNO);
          const imageUrl = getImageUrl(product);

          return (
            <View
              key={`product-${product.SNO}`}
              style={styles.productWrapper}
            >
              <CardStyle1
                id={product.SNO}
                image={imageUrl}
                title={product.ITEMNAME || 'Product'}
                price={`₹${product.GrandTotal || product.GrossAmount || 0}`}
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
      </ScrollView>

      <View style={styles.decorativeBorder}>
        <Image 
          source={IMAGES.border2} 
          style={styles.borderImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    position: 'relative',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    ...FONTS.fontRegular
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorText: {
    marginTop: 15,
    ...FONTS.h5,
    textAlign: 'center'
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyTitle: {
    marginTop: 15,
    ...FONTS.h5
  },
  emptyText: {
    marginTop: 5,
    ...FONTS.fontRegular,
    textAlign: 'center'
  },
  refreshButton: {
    marginTop: 15,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  refreshText: {
    marginLeft: 5,
    ...FONTS.fontRegular
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  title: {
    ...FONTS.Marcellus,
    fontSize: 24,
    lineHeight: 30,
    flex: 1,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    ...FONTS.fontRegular,
    fontSize: 13,
    marginRight: 2,
  },
  productsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  productWrapper: {
    width: SIZES.width / 2.3,
    marginRight: 15,
  },
  decorativeBorder: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  borderImage: {
    width: '100%',
    height: '100%',
  }
});

export default HighlyRecommendedSection;