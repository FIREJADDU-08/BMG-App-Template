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
  console.log(`✅ HighlyRecommendedSection loaded with ${products.length} products`);

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
      } catch {
        setError('Failed to load products. Please try again.');
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
    } catch {
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
    } catch {
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
      dispatch(fetchWishList());
    } catch {
      // silently fail
    }
  }, [dispatch, wishList]);

  const handleCartAction = useCallback(async (product: any) => {
    try {
      const existingItem = cart.find((item) => item.itemTagSno === product.SNO);
      
      if (existingItem) {
        await dispatch(removeItemFromCart(existingItem.sno));
        dispatch(fetchCartItems());
      } else {
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
        } catch {
          // fail silently for image processing
        }

        const cartPayload = {
          itemTagSno: product.SNO,
          imagePath: imageUrl,
          quantity: 1,
          price: parseFloat(product.GrandTotal || product.GrossAmount || '0'),
          productData: product
        };

        await dispatch(addItemToCart(cartPayload));
        dispatch(fetchCartItems());
      }
    } catch {
      // fail silently
    }
  }, [dispatch, cart]);

  const navigateToProductDetails = useCallback((product: any) => {
    navigation.navigate('ProductDetails', { 
      sno: product.SNO,
      productData: product 
    });
  }, [navigation]);

  const getImageUrl = useCallback((product: any): string => {
    try {
      if (!product.ImagePath || product.ImagePath.length < 5) return IMAGES.item12;
      
      const parsed = typeof product.ImagePath === 'string' 
        ? JSON.parse(product.ImagePath) 
        : product.ImagePath;
      
      let image = Array.isArray(parsed) ? parsed[0] : '';
      if (!image || typeof image !== 'string') return IMAGES.item12;
      
      if (!image.startsWith('http')) {
        image = `https://app.bmgjewellers.com${image}`;
      }
      return image;
    } catch {
      return IMAGES.item12;
    }
  }, []);

  const memoizedProducts = useMemo(() => products, [products]);

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

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={40} color={COLORS.danger} />
        <Text style={[styles.errorText, { color: colors.title }]}>
          {error}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Feather name="refresh-cw" size={20} color={COLORS.primary} />
          <Text style={styles.refreshText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Feather name="refresh-cw" size={20} color={COLORS.primary} />
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
        
        <View style={styles.headerActions}>
          {/* If See All required, uncomment */}
          {/* {showSeeAll && (
            <TouchableOpacity 
              onPress={() => navigation.navigate('RecommendedProducts')}
              style={styles.seeAllButton}
            >
              <Text style={[styles.seeAllText, { color: colors.title }]}>
                See All
              </Text>
            </TouchableOpacity>
          )} */}
        </View>
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
        <View style={styles.productsList}>
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
        </View>
      </ScrollView>

      <View style={styles.decorativeBorder}>
        <Image 
          source={require('../assets/images/border2.png')} 
          style={styles.borderImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 25
  },
  loadingContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 10,
    ...FONTS.fontRegular
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    marginTop: 15,
    ...FONTS.h5,
    textAlign: 'center'
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
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
    alignItems: 'center'
  },
  refreshText: {
    marginLeft: 5,
    color: COLORS.primary,
    ...FONTS.fontRegular
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  title: {
    ...FONTS.Marcellus,
    fontSize: 24,
    lineHeight: 30
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  seeAllButton: {
    marginRight: 15
  },
  seeAllText: {
    ...FONTS.fontRegular,
    fontSize: 13
  },
  productsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20
  },
  productsList: {
    flexDirection: 'row',
    gap: 15
  },
  productWrapper: {
    width: SIZES.width / 2.3
  },
  decorativeBorder: {
    top: 60,
    left: 0,
    position: 'absolute',
    zIndex: -1
  },
  borderImage: {
    width: '100%',
    height: '100%'
  }
});

export default HighlyRecommendedSection;
