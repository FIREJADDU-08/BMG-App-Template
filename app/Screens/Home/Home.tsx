import React, { 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  useContext,
  useRef 
} from 'react';
import { useTheme } from '@react-navigation/native';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  TextInput, 
  Alert,
  Dimensions,
  RefreshControl
} from 'react-native';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { ScrollView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { IMAGES } from '../../constants/Images';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import { useDispatch, useSelector } from 'react-redux';
import { addTowishList } from '../../redux/reducer/wishListReducer';
import { addToCart } from '../../redux/reducer/cartReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../Context/ProfileContext';
import { useFocusEffect } from '@react-navigation/native';
import { cartService } from '../../Services/CartService';
import { fetchCartItems } from '../../redux/reducer/cartReducer';
import { fetchFeaturedProducts } from '../../Services/FeatureService';
import { fetchBestDesignProducts } from '../../Services/BestDesignService';

// HomeComponents - Lazy loaded for better performance
const JewelryCollection = React.lazy(() => import('../../HomeComponents/JewelryCollection'));
const NaturalBeautySection = React.lazy(() => import('../../HomeComponents/NaturalBeauty'));
const HighlyRecommendedSection = React.lazy(() => import('../../HomeComponents/HighlyRecommended'));
const RecentlyShortlistedSection = React.lazy(() => import('../../HomeComponents/RecentlyShortlisted'));
const BannerSlider = React.lazy(() => import('../../HomeComponents/Slider'));
const FestivalSlider = React.lazy(() => import('../../HomeComponents/FestivalSlider'));
const VideoSection = React.lazy(() => import('../../HomeComponents/VideoSection'));
const FeaturedNowSection = React.lazy(() => import('../../HomeComponents/Feature'));
const GreatSavingsSection = React.lazy(() => import('../../HomeComponents/GreatSaving'));
const PopularNearbySection = React.lazy(() => import('../../HomeComponents/PopularNearby'));
const ProductBannerSection = React.lazy(() => import('../../HomeComponents/ProductBanner'));
const SponsoredProducts = React.lazy(() => import('../../HomeComponents/SponseredProduct'));
const PeopleAlsoViewed = React.lazy(() => import('../../HomeComponents/PeopleViewed'));
const CartItemsPreview = React.lazy(() => import('../../HomeComponents/CartPreview'));
const BlockbusterDeals = React.lazy(() => import('../../HomeComponents/BlockbusterDeal'));
const BestDesigns = React.lazy(() => import('../../HomeComponents/BestDesign'));

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SEARCH_DEBOUNCE_DELAY = 500;
const DEFAULT_IMAGE_URL = 'https://app.bmgjewellers.com/uploads/1144/8a953e21-4a4e-4600-bfdb-f614d3a08bc3_img-2.jpg';
const BASE_API_URL = 'https://app.bmgjewellers.com';

// Types
interface CartItemWithDetails {
  sno: string;
  itemTagSno: string;
  fullDetails: {
    SNO: string;
    Title: string;
    GrandTotal: string;
    ImagePath: string;
  };
}

interface FeaturedProduct {
  SNO: string;
  ITEMNAME: string;
  SUBITEMNAME: string;
  GrandTotal: string;
  images: string[];
  Description?: string;
  Offer?: string;
  DeliveryOption?: string;
}

interface UserData {
  username: string;
  email: string;
}

interface HomeState {
  userData: UserData;
  cartProducts: CartItemWithDetails[];
  featuredProducts: FeaturedProduct[];
  bestDesignProducts: any[];
  loading: {
    main: boolean;
    featured: boolean;
    bestDesign: boolean;
    cart: boolean;
  };
  errors: {
    featured: string | null;
    bestDesign: string | null;
    cart: string | null;
  };
  refreshing: boolean;
  searchQuery: string;
}

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

// Custom hooks
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useAsyncStorage = () => {
  const getUserData = useCallback(async (): Promise<UserData> => {
    try {
      const [username, email] = await Promise.all([
        AsyncStorage.getItem('user_name'),
        AsyncStorage.getItem('user_email'),
      ]);
      
      return {
        username: username || 'Guest',
        email: email || '',
      };
    } catch (error) {
      console.error('Error fetching user details:', error);
      return { username: 'Guest', email: '' };
    }
  }, []);

  return { getUserData };
};

// Loading Component
const LoadingIndicator: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// Error Component
const ErrorComponent: React.FC<{ 
  message: string; 
  onRetry?: () => void;
  testID?: string;
}> = ({ message, onRetry, testID }) => (
  <View style={styles.errorContainer} testID={testID}>
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Lazy Component Wrapper
const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <LoadingIndicator /> }) => (
  <React.Suspense fallback={fallback}>
    {children}
  </React.Suspense>
);

const Home: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { profileImage } = useContext(UserContext);
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const dispatch = useDispatch();
  const { getUserData } = useAsyncStorage();
  const scrollViewRef = useRef<ScrollView>(null);

  // Redux selectors
  const cartItems = useSelector((state: any) => state.cart?.items || []);

  // State management
  const [state, setState] = useState<HomeState>({
    userData: { username: 'Guest', email: '' },
    cartProducts: [],
    featuredProducts: [],
    bestDesignProducts: [],
    loading: {
      main: true,
      featured: true,
      bestDesign: true,
      cart: false,
    },
    errors: {
      featured: null,
      bestDesign: null,
      cart: null,
    },
    refreshing: false,
    searchQuery: '',
  });

  const debouncedSearchQuery = useDebounce(state.searchQuery, SEARCH_DEBOUNCE_DELAY);

  // Memoized values
  const headerStyle = useMemo(() => ({
    backgroundColor: colors.background,
    // borderBottomWidth: 1,
    // borderBottomColor: colors.border || '#E5E5E5',
    paddingHorizontal: 15,
  }), [colors.background, colors.border]);

  const searchBarStyle = useMemo(() => ({
    ...FONTS.fontRegular,
    fontSize: 16,
    height: 52,
    backgroundColor: colors.card,
    borderRadius: 15,
    paddingLeft: 20,
    color: colors.title,
    shadowColor: 'rgba(195, 123, 95, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  }), [colors.card, colors.title]);

  // Utility functions
  const getImageUrl = useCallback((imagePath?: string): string => {
    if (!imagePath || imagePath.length < 5) return DEFAULT_IMAGE_URL;
    
    try {
      const parsed = JSON.parse(imagePath);
      let image = parsed?.[0] || '';
      
      if (!image || typeof image !== 'string') return DEFAULT_IMAGE_URL;
      
      return image.startsWith('http') ? image : `${BASE_API_URL}${image}`;
    } catch (error) {
      console.warn('Image parse error:', error);
      return DEFAULT_IMAGE_URL;
    }
  }, []);

  const validateProduct = useCallback((product: any) => {
    return product?.SNO && 
           product?.images?.length > 0 && 
           (product?.GrandTotal || product?.grossAmount);
  }, []);

  // API functions
  const loadUserData = useCallback(async () => {
    try {
      const userData = await getUserData();
      setState(prev => ({ ...prev, userData }));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [getUserData]);

  // const loadFeaturedProducts = useCallback(async () => {
  //   try {
  //     setState(prev => ({
  //       ...prev,
  //       loading: { ...prev.loading, featured: true },
  //       errors: { ...prev.errors, featured: null }
  //     }));

  //     const products = await fetchFeaturedProducts();
  //     const validProducts = products
  //       .filter(validateProduct)
  //       .map(product => ({
  //         ...product,
  //         images: product.images.map(img =>
  //           img.startsWith('http') ? img : `${BASE_API_URL}${img}`
  //         )
  //       }));

  //     setState(prev => ({
  //       ...prev,
  //       featuredProducts: validProducts,
  //       loading: { ...prev.loading, featured: false }
  //     }));
  //   } catch (error) {
  //     console.error('Error loading featured products:', error);
  //     setState(prev => ({
  //       ...prev,
  //       loading: { ...prev.loading, featured: false },
  //       errors: { ...prev.errors, featured: 'Failed to load featured products' }
  //     }));
  //   }
  // }, [validateProduct]);

  const loadBestDesignProducts = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, bestDesign: true },
        errors: { ...prev.errors, bestDesign: null }
      }));

      const products = await fetchBestDesignProducts();
      const validProducts = products.filter(validateProduct);

      setState(prev => ({
        ...prev,
        bestDesignProducts: validProducts,
        loading: { ...prev.loading, bestDesign: false }
      }));
    } catch (error) {
      console.error('Error loading best design products:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, bestDesign: false },
        errors: { ...prev.errors, bestDesign: 'Failed to load best design products' }
      }));
    }
  }, [validateProduct]);

  const fetchCartProducts = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, cart: true },
        errors: { ...prev.errors, cart: null }
      }));

      const [detailedProducts, cartItems] = await Promise.all([
        cartService.getDetailedCartProducts(),
        cartService.getItemsByPhone(),
      ]);

      const merged: CartItemWithDetails[] = cartItems
        .map((item) => {
          const product = detailedProducts.find((p) => p.SNO === item.itemTagSno);
          return product ? { ...item, fullDetails: product } : null;
        })
        .filter((item): item is CartItemWithDetails => item !== null);

      setState(prev => ({
        ...prev,
        cartProducts: merged,
        loading: { ...prev.loading, cart: false }
      }));
      
      dispatch(fetchCartItems());
    } catch (error) {
      console.error('Error loading cart data:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, cart: false },
        errors: { ...prev.errors, cart: 'Failed to load cart items' }
      }));
    }
  }, [dispatch]);

  // Event handlers
  const handleRefresh = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    
    await Promise.all([
      loadUserData(),
      
      loadBestDesignProducts(),
      fetchCartProducts(),
    ]);
    
    setState(prev => ({ ...prev, refreshing: false }));
  }, [loadUserData,  loadBestDesignProducts, fetchCartProducts]);

  const handleRemove = useCallback(async (item: CartItemWithDetails) => {
    try {
      await cartService.removeItem(item.sno);
      await fetchCartProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item from cart.');
    }
  }, [fetchCartProducts]);

  const handleAddToWishList = useCallback((data: any) => {
    try {
      dispatch(addTowishList(data));
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to wishlist.');
    }
  }, [dispatch]);

  const handleAddToCart = useCallback((data: any) => {
    try {
      dispatch(addToCart(data));
      navigation.navigate('MyCart');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart.');
    }
  }, [dispatch, navigation]);

  const handleSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

const handleSearchSubmit = useCallback(() => {
  const query = state.searchQuery.trim();
  navigation.navigate('Search', { query: query || '' });
}, [state.searchQuery, navigation]);

  // Effects
  useEffect(() => {
    const initializeData = async () => {
      setState(prev => ({ ...prev, loading: { ...prev.loading, main: true } }));
      
      await Promise.all([
        loadUserData(),
        
        loadBestDesignProducts(),
      ]);
      
      setState(prev => ({ ...prev, loading: { ...prev.loading, main: false } }));
    };

    initializeData();
  }, [loadUserData,  loadBestDesignProducts]);

  useFocusEffect(
    useCallback(() => {
      fetchCartProducts();
    }, [fetchCartProducts])
  );

  // Render functions
  const renderHeader = () => (
    <View style={[styles.header, headerStyle]}>
      <TouchableOpacity 
        onPress={() => navigation.openDrawer()}
        style={styles.userSection}
        accessible={true}
        accessibilityLabel="Open navigation drawer"
      >
        <Image
          style={styles.profileImage}
          source={profileImage ? { uri: profileImage } : IMAGES.user2}
        />
        <Text style={[styles.greetingText, { color: colors.title }]}>
          Hello{"\n"}
          <Text style={styles.usernameText}>{state.userData.username}</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Notification')}
        style={[styles.notificationButton, { backgroundColor: colors.card }]}
        accessible={true}
        accessibilityLabel="Open notifications"
      >
        <Image
          style={[styles.bellIcon, { tintColor: colors.title }]}
          source={IMAGES.bell}
        />
      </TouchableOpacity>
    </View>
  );

const renderSearchBar = () => (
  <TouchableOpacity 
    onPress={handleSearchSubmit}  // Navigate when any part is pressed
    activeOpacity={0.8}
  >
    <View style={styles.searchContainer}>
      <TextInput
        style={searchBarStyle}
        placeholder="Search products, collections..."
        placeholderTextColor={theme.dark ? 'rgba(255,255,255,0.6)' : '#666666'}
        value={state.searchQuery}
        onChangeText={handleSearch}
        onSubmitEditing={handleSearchSubmit}
        returnKeyType="search"
        editable={false}  // Disable direct text input
        pointerEvents="none"  // Ensure touch passes to parent
        accessible={true}
        accessibilityLabel="Search input"
      />
      <TouchableOpacity 
        style={styles.searchIcon}
        onPress={handleSearchSubmit}
        accessible={true}
        accessibilityLabel="Search button"
      >
        <Image
          style={styles.searchImage}
          source={IMAGES.search}
        />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

  if (state.loading.main) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingIndicator message="Loading home content..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
          {renderHeader()}
          {renderSearchBar()}
          
          <View style={[styles.shadowBox, { backgroundColor: colors.card }]} />

          <LazyWrapper>
            <PopularNearbySection />
          </LazyWrapper>

          <LazyWrapper>
            <NaturalBeautySection navigation={navigation} />
          </LazyWrapper>
        </View>

        <LazyWrapper>
          <JewelryCollection />
        </LazyWrapper>

        <LazyWrapper>
          <ProductBannerSection navigation={navigation} />
        </LazyWrapper>

        <LazyWrapper>
          <HighlyRecommendedSection navigation={navigation} />
        </LazyWrapper>

        <LazyWrapper>
          <RecentlyShortlistedSection navigation={navigation} />
        </LazyWrapper>

        <LazyWrapper>
          <BannerSlider />
        </LazyWrapper>

        <LazyWrapper>
          <SponsoredProducts />
        </LazyWrapper>

        <LazyWrapper>
          <PeopleAlsoViewed navigation={navigation} />
        </LazyWrapper>

        <LazyWrapper>
          <CartItemsPreview 
            navigation={navigation}
            loading={state.loading.cart}
            cartProducts={state.cartProducts}
            handleRemove={handleRemove}
            getImageUrl={getImageUrl}
          />
        </LazyWrapper>

        <LazyWrapper>
          <FestivalSlider />
        </LazyWrapper>

        {state.errors.featured ? (
          <ErrorComponent 
            message={state.errors.featured}
            onRetry={loadFeaturedProducts}
            testID="featured-error"
          />
        ) : (
          <LazyWrapper>
            <BlockbusterDeals 
              navigation={navigation}
            />
          </LazyWrapper>
        )}

        {state.errors.bestDesign ? (
          <ErrorComponent 
            message={state.errors.bestDesign}
            onRetry={loadBestDesignProducts}
            testID="best-design-error"
          />
        ) : (
          <LazyWrapper>
            <BestDesigns 
              navigation={navigation}
              loadingBestDesign={state.loading.bestDesign}
              bestDesignError={state.errors.bestDesign}
              bestDesignProducts={state.bestDesignProducts}
              addItemToWishList={handleAddToWishList}
              addItemToCart={handleAddToCart}
              loadBestDesignProducts={loadBestDesignProducts}
            />
          </LazyWrapper>
        )}

        <LazyWrapper>
          <FeaturedNowSection navigation={navigation} />
        </LazyWrapper>

        {/* <LazyWrapper>
          <GreatSavingsSection navigation={navigation} />
        </LazyWrapper> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  mainContainer: {
    marginHorizontal: 5,
    marginVertical: 5,
    marginBottom: 0,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 10,
  },
  userSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingRight: 15,
  },
  profileImage: {
    height: 45,
    width: 45,
    borderRadius: 15,
  },
  greetingText: {
    ...FONTS.Marcellus,
    fontSize: 14,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: '600',
  },
  notificationButton: {
    height: 45,
    width: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(195, 123, 95, 0.20)',
    shadowOffset: { width: 2, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  bellIcon: {
    width: 20,
    height: 20,
  },
  searchContainer: {
    marginTop: 20,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    right: 15,
    top: 16,
  },
  searchImage: {
    height: 20,
    width: 20,
    tintColor: COLORS.primary,
  },
  shadowBox: {
    height: 50,
    opacity: 0.6,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: -40,
    zIndex: -1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    margin: 20,
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default React.memo(Home);