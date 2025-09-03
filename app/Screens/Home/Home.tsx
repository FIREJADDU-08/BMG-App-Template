import React, { 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  useContext,
  useRef,
  useReducer
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
  RefreshControl,
  StatusBar,
  InteractionManager
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

// Enhanced lazy loading with error boundaries
const createLazyComponent = (importFn: () => Promise<any>, displayName: string) => {
  const LazyComponent = React.lazy(importFn);
  LazyComponent.displayName = displayName;
  return LazyComponent;
};

// HomeComponents - Lazy loaded for better performance
const JewelryCollection = createLazyComponent(() => import('../../HomeComponents/JewelryCollection'), 'JewelryCollection');
const NaturalBeautySection = createLazyComponent(() => import('../../HomeComponents/NaturalBeauty'), 'NaturalBeautySection');
const HighlyRecommendedSection = createLazyComponent(() => import('../../HomeComponents/HighlyRecommended'), 'HighlyRecommendedSection');
const RecentlyShortlistedSection = createLazyComponent(() => import('../../HomeComponents/RecentlyShortlisted'), 'RecentlyShortlistedSection');
const BannerSlider = createLazyComponent(() => import('../../HomeComponents/Slider'), 'BannerSlider');
const FestivalSlider = createLazyComponent(() => import('../../HomeComponents/FestivalSlider'), 'FestivalSlider');
const VideoSection = createLazyComponent(() => import('../../HomeComponents/VideoSection'), 'VideoSection');
const FeaturedNowSection = createLazyComponent(() => import('../../HomeComponents/Feature'), 'FeaturedNowSection');
const GreatSavingsSection = createLazyComponent(() => import('../../HomeComponents/GreatSaving'), 'GreatSavingsSection');
const PopularNearbySection = createLazyComponent(() => import('../../HomeComponents/PopularNearby'), 'PopularNearbySection');
const ProductBannerSection = createLazyComponent(() => import('../../HomeComponents/ProductBanner'), 'ProductBannerSection');
const SponsoredProducts = createLazyComponent(() => import('../../HomeComponents/SponseredProduct'), 'SponsoredProducts');
const PeopleAlsoViewed = createLazyComponent(() => import('../../HomeComponents/PeopleViewed'), 'PeopleAlsoViewed');
const CartItemsPreview = createLazyComponent(() => import('../../HomeComponents/CartPreview'), 'CartItemsPreview');
const BlockbusterDeals = createLazyComponent(() => import('../../HomeComponents/BlockbusterDeal'), 'BlockbusterDeals');
const BestDesigns = createLazyComponent(() => import('../../HomeComponents/BestDesign'), 'BestDesigns');
const BudgetCategories = createLazyComponent(() => import('../../HomeComponents/BudgetCategory'), 'BudgetCategories');
const OccasionBanner = createLazyComponent(() => import('../../HomeComponents/OccasionBanner'), 'OccasionBanner');
const OfferBanner = createLazyComponent(() => import('../../HomeComponents/OfferBanner'), 'OfferBanner');
const RingCollection = createLazyComponent(() => import('../../HomeComponents/RingCollection'), 'RingCollection');

// Constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SEARCH_DEBOUNCE_DELAY = 500;
const DEFAULT_IMAGE_URL = 'https://app.bmgjewellers.com/uploads/1144/8a953e21-4a4e-4600-bfdb-f614d3a08bc3_img-2.jpg';
const BASE_API_URL = 'https://app.bmgjewellers.com';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Enhanced Types
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
  lastLogin?: string;
}

interface LoadingState {
  main: boolean;
  featured: boolean;
  bestDesign: boolean;
  cart: boolean;
  refresh: boolean;
}

interface ErrorState {
  featured: string | null;
  bestDesign: string | null;
  cart: string | null;
  network: string | null;
}

// State management with useReducer for better control
interface HomeState {
  userData: UserData;
  cartProducts: CartItemWithDetails[];
  featuredProducts: FeaturedProduct[];
  bestDesignProducts: any[];
  loading: LoadingState;
  errors: ErrorState;
  refreshing: boolean;
  searchQuery: string;
  lastRefresh: number;
  networkStatus: 'online' | 'offline' | 'unknown';
}

type HomeAction = 
  | { type: 'SET_USER_DATA'; payload: UserData }
  | { type: 'SET_CART_PRODUCTS'; payload: CartItemWithDetails[] }
  | { type: 'SET_FEATURED_PRODUCTS'; payload: FeaturedProduct[] }
  | { type: 'SET_BEST_DESIGN_PRODUCTS'; payload: any[] }
  | { type: 'SET_LOADING'; payload: Partial<LoadingState> }
  | { type: 'SET_ERROR'; payload: Partial<ErrorState> }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_NETWORK_STATUS'; payload: 'online' | 'offline' | 'unknown' }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'UPDATE_LAST_REFRESH' };

const initialState: HomeState = {
  userData: { username: 'Guest', email: '' },
  cartProducts: [],
  featuredProducts: [],
  bestDesignProducts: [],
  loading: {
    main: true,
    featured: false,
    bestDesign: false,
    cart: false,
    refresh: false,
  },
  errors: {
    featured: null,
    bestDesign: null,
    cart: null,
    network: null,
  },
  refreshing: false,
  searchQuery: '',
  lastRefresh: 0,
  networkStatus: 'unknown',
};

const homeReducer = (state: HomeState, action: HomeAction): HomeState => {
  switch (action.type) {
    case 'SET_USER_DATA':
      return { ...state, userData: action.payload };
    case 'SET_CART_PRODUCTS':
      return { ...state, cartProducts: action.payload };
    case 'SET_FEATURED_PRODUCTS':
      return { ...state, featuredProducts: action.payload };
    case 'SET_BEST_DESIGN_PRODUCTS':
      return { ...state, bestDesignProducts: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, ...action.payload } };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, ...action.payload } };
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_NETWORK_STATUS':
      return { ...state, networkStatus: action.payload };
    case 'CLEAR_ERRORS':
      return { ...state, errors: initialState.errors };
    case 'UPDATE_LAST_REFRESH':
      return { ...state, lastRefresh: Date.now() };
    default:
      return state;
  }
};

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

// Enhanced Custom hooks
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const useAsyncStorage = () => {
  const cache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());

  const getUserData = useCallback(async (): Promise<UserData> => {
    const cacheKey = 'userData';
    const cached = cache.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const [username, email, lastLogin] = await Promise.all([
        AsyncStorage.getItem('user_name'),
        AsyncStorage.getItem('user_email'),
        AsyncStorage.getItem('last_login'),
      ]);
      
      const userData = {
        username: username || 'Guest',
        email: email || '',
        lastLogin: lastLogin || undefined,
      };

      cache.current.set(cacheKey, { data: userData, timestamp: Date.now() });
      return userData;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return { username: 'Guest', email: '' };
    }
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return { getUserData, clearCache };
};

// Enhanced Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View style={styles.errorBoundaryContainer}>
          <Text style={styles.errorBoundaryText}>Something went wrong</Text>
          <TouchableOpacity 
            style={styles.errorBoundaryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.errorBoundaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Enhanced Loading Component with skeleton
const LoadingIndicator: React.FC<{ 
  message?: string; 
  showSkeleton?: boolean;
  size?: 'small' | 'large';
}> = ({ 
  message = 'Loading...', 
  showSkeleton = false,
  size = 'large' 
}) => {
  if (showSkeleton) {
    return (
      <View style={styles.skeletonContainer}>
        <View style={[styles.skeletonHeader, styles.skeletonShimmer]} />
        <View style={[styles.skeletonContent, styles.skeletonShimmer]} />
        <View style={[styles.skeletonFooter, styles.skeletonShimmer]} />
      </View>
    );
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={COLORS.primary} />
      <Text style={styles.loadingText} accessibilityLiveRegion="polite">
        {message}
      </Text>
    </View>
  );
};

// Enhanced Error Component
const ErrorComponent: React.FC<{ 
  message: string; 
  onRetry?: () => void;
  testID?: string;
  type?: 'network' | 'data' | 'generic';
}> = ({ message, onRetry, testID, type = 'generic' }) => {
  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return '📡';
      case 'data':
        return '📊';
      default:
        return '⚠️';
    }
  };

  return (
    <View style={styles.errorContainer} testID={testID}>
      <Text style={styles.errorIcon}>{getErrorIcon()}</Text>
      <Text style={styles.errorText} accessibilityRole="alert">
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry loading"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Enhanced Lazy Component Wrapper with Error Boundary
const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
}> = ({ children, fallback, name }) => (
  <ErrorBoundary
    fallback={
      <ErrorComponent 
        message={`Failed to load ${name || 'component'}`}
        type="generic"
      />
    }
  >
    <React.Suspense fallback={fallback || <LoadingIndicator showSkeleton />}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

// Enhanced Search Bar Component
const SearchBar: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  style: any;
  theme: any;
}> = React.memo(({ value, onChangeText, onSubmit, style, theme }) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={style}
      placeholder="Search products, collections..."
      placeholderTextColor={theme.dark ? 'rgba(255,255,255,0.6)' : '#666666'}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      returnKeyType="search"
      accessible={true}
      accessibilityLabel="Search input field"
      accessibilityHint="Enter text to search for products"
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="while-editing"
    />
    <TouchableOpacity 
      style={styles.searchIcon}
      onPress={onSubmit}
      accessible={true}
      accessibilityLabel="Search button"
      accessibilityRole="button"
    >
      <Image
        style={styles.searchImage}
        source={IMAGES.search}
      />
    </TouchableOpacity>
  </View>
));

const Home: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { profileImage } = useContext(UserContext);
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const dispatch = useDispatch();
  const { getUserData, clearCache } = useAsyncStorage();
  const scrollViewRef = useRef<ScrollView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced state management with useReducer
  const [state, stateDispatch] = useReducer(homeReducer, initialState);

  // Redux selectors with error handling
  const cartItems = useSelector((state: any) => {
    try {
      return state.cart?.items || [];
    } catch (error) {
      console.error('Error accessing cart items from Redux:', error);
      return [];
    }
  });

  const debouncedSearchQuery = useDebounce(state.searchQuery, SEARCH_DEBOUNCE_DELAY);

  // Enhanced memoized values
  const headerStyle = useMemo(() => ({
    backgroundColor: colors.background,
    paddingHorizontal: 15,
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }), [colors.background]);

  const searchBarStyle = useMemo(() => ({
    ...FONTS.fontRegular,
    fontSize: 16,
    height: 52,
    backgroundColor: colors.card,
    borderRadius: 15,
    paddingLeft: 20,
    paddingRight: 50, // Space for search icon
    color: colors.title,
    shadowColor: Platform.OS === 'ios' ? 'rgba(195, 123, 95, 0.25)' : 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  }), [colors.card, colors.title]);

  // Enhanced utility functions
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

  const validateProduct = useCallback((product: any): boolean => {
    return !!(product?.SNO && 
             product?.images?.length > 0 && 
             (product?.GrandTotal || product?.grossAmount));
  }, []);

  // Enhanced API functions with better error handling
  const loadUserData = useCallback(async () => {
    try {
      const userData = await getUserData();
      stateDispatch({ type: 'SET_USER_DATA', payload: userData });
    } catch (error) {
      console.error('Error loading user data:', error);
      stateDispatch({ 
        type: 'SET_ERROR', 
        payload: { network: 'Failed to load user data' } 
      });
    }
  }, [getUserData]);

  const loadBestDesignProducts = useCallback(async () => {
    try {
      stateDispatch({ 
        type: 'SET_LOADING', 
        payload: { bestDesign: true } 
      });
      stateDispatch({ 
        type: 'SET_ERROR', 
        payload: { bestDesign: null } 
      });

      const products = await fetchBestDesignProducts();
      const validProducts = products.filter(validateProduct);

      stateDispatch({ 
        type: 'SET_BEST_DESIGN_PRODUCTS', 
        payload: validProducts 
      });
    } catch (error) {
      console.error('Error loading best design products:', error);
      stateDispatch({ 
        type: 'SET_ERROR', 
        payload: { bestDesign: 'Failed to load best design products' } 
      });
    } finally {
      stateDispatch({ 
        type: 'SET_LOADING', 
        payload: { bestDesign: false } 
      });
    }
  }, [validateProduct]);

  const fetchCartProducts = useCallback(async () => {
    try {
      stateDispatch({ 
        type: 'SET_LOADING', 
        payload: { cart: true } 
      });
      stateDispatch({ 
        type: 'SET_ERROR', 
        payload: { cart: null } 
      });

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

      stateDispatch({ 
        type: 'SET_CART_PRODUCTS', 
        payload: merged 
      });
      
      dispatch(fetchCartItems());
    } catch (error) {
      console.error('Error loading cart data:', error);
      stateDispatch({ 
        type: 'SET_ERROR', 
        payload: { cart: 'Failed to load cart items' } 
      });
    } finally {
      stateDispatch({ 
        type: 'SET_LOADING', 
        payload: { cart: false } 
      });
    }
  }, [dispatch]);

  // Enhanced event handlers
  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - state.lastRefresh < 2000) return; // Prevent rapid refresh

    stateDispatch({ type: 'SET_REFRESHING', payload: true });
    stateDispatch({ type: 'CLEAR_ERRORS' });
    
    try {
      await Promise.all([
        loadUserData(),
        loadBestDesignProducts(),
        fetchCartProducts(),
      ]);
      stateDispatch({ type: 'UPDATE_LAST_REFRESH' });
    } catch (error) {
      console.error('Error during refresh:', error);
      Alert.alert(
        'Refresh Failed', 
        'Unable to refresh content. Please check your connection.',
        [{ text: 'OK' }]
      );
    } finally {
      stateDispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [loadUserData, loadBestDesignProducts, fetchCartProducts, state.lastRefresh]);

  const handleRemove = useCallback(async (item: CartItemWithDetails) => {
    try {
      await cartService.removeItem(item.sno);
      await fetchCartProducts();
      // Show success feedback
      Alert.alert('Success', 'Item removed from cart');
    } catch (error) {
      console.error('Error removing cart item:', error);
      Alert.alert('Error', 'Failed to remove item from cart.');
    }
  }, [fetchCartProducts]);

  const handleAddToWishList = useCallback((data: any) => {
    try {
      dispatch(addTowishList(data));
      // Provide user feedback
      Alert.alert('Success', 'Item added to wishlist');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      Alert.alert('Error', 'Failed to add item to wishlist.');
    }
  }, [dispatch]);

  const handleAddToCart = useCallback((data: any) => {
    try {
      dispatch(addToCart(data));
      navigation.navigate('MyCart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart.');
    }
  }, [dispatch, navigation]);

  const handleSearch = useCallback((query: string) => {
    stateDispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const query = state.searchQuery.trim();
    if (query.length < 2) {
      Alert.alert('Search', 'Please enter at least 2 characters to search');
      return;
    }
    navigation.navigate('Search', { query });
  }, [state.searchQuery, navigation]);

  const scrollToTop = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  // Enhanced effects
  useEffect(() => {
    const initializeData = async () => {
      // Use InteractionManager for better performance
      InteractionManager.runAfterInteractions(async () => {
        stateDispatch({ 
          type: 'SET_LOADING', 
          payload: { main: true } 
        });
        
        try {
          await Promise.all([
            loadUserData(),
            loadBestDesignProducts(),
          ]);
        } catch (error) {
          console.error('Error during initialization:', error);
        } finally {
          stateDispatch({ 
            type: 'SET_LOADING', 
            payload: { main: false } 
          });
        }
      });
    };

    initializeData();
  }, [loadUserData, loadBestDesignProducts]);

  useFocusEffect(
    useCallback(() => {
      fetchCartProducts();
      return () => {
        // Cleanup on unfocus
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [fetchCartProducts])
  );

  // Enhanced render functions
  const renderHeader = () => (
    <View style={[styles.header, headerStyle]}>
      <TouchableOpacity 
        onPress={() => navigation.openDrawer()}
        style={styles.userSection}
        accessible={true}
        accessibilityLabel={`Open navigation drawer. Welcome ${state.userData.username}`}
        accessibilityRole="button"
        accessibilityHint="Opens the navigation menu"
      >
        <Image
          style={styles.profileImage}
          source={profileImage ? { uri: profileImage } : IMAGES.user2}
          defaultSource={IMAGES.user2}
        />
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingText, { color: colors.title }]}>
            Hello
          </Text>
          <Text style={[styles.usernameText, { color: colors.title }]}>
            {state.userData.username}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Notification')}
        style={[styles.notificationButton, { backgroundColor: colors.card }]}
        accessible={true}
        accessibilityLabel="Open notifications"
        accessibilityRole="button"
        accessibilityHint="View your notifications"
      >
        <Image
          style={[styles.bellIcon, { tintColor: colors.title }]}
          source={IMAGES.bell}
        />
        {/* Add notification badge if needed */}
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <SearchBar
      value={state.searchQuery}
      onChangeText={handleSearch}
      onSubmit={handleSearchSubmit}
      style={searchBarStyle}
      theme={theme}
    />
  );

  const renderOfflineIndicator = () => {
    if (state.networkStatus === 'offline') {
      return (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>
            You're offline. Some content may not be up to date.
          </Text>
        </View>
      );
    }
    return null;
  };

  // Enhanced loading state
  if (state.loading.main) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={theme.dark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        <LoadingIndicator message="Loading home content..." showSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={theme.dark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      {renderOfflineIndicator()}
      
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
            title="Pull to refresh"
            titleColor={colors.title}
          />
        }
        accessible={true}
        accessibilityLabel="Home screen content"
      >
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
          {renderHeader()}
          {renderSearchBar()}
          
          <View style={[styles.shadowBox, { backgroundColor: colors.card }]} />

          <LazyWrapper name="Popular Nearby">
            <PopularNearbySection />
          </LazyWrapper>

          <LazyWrapper name="Natural Beauty">
            <NaturalBeautySection navigation={navigation} />
          </LazyWrapper>
        </View>

        <LazyWrapper name="Jewelry Collection">
          <JewelryCollection />
        </LazyWrapper>

        <LazyWrapper name="Product Banner">
          <ProductBannerSection navigation={navigation} />
        </LazyWrapper>

        <LazyWrapper name="Highly Recommended">
          <HighlyRecommendedSection navigation={navigation} />
        </LazyWrapper>

        <LazyWrapper name="Offer Banner">
          <OfferBanner />
        </LazyWrapper>

        <LazyWrapper name="Blockbuster Deals">
          <BlockbusterDeals navigation={navigation} />
        </LazyWrapper>

        <LazyWrapper name="Occasion Banner">
          <OccasionBanner />
        </LazyWrapper>

        <LazyWrapper name="Recently Shortlisted">
          <RecentlyShortlistedSection navigation={navigation} />
        </LazyWrapper>

        <LazyWrapper name="Banner Slider">
          <BannerSlider />
        </LazyWrapper>

        <LazyWrapper name="Sponsored Products">
          <SponsoredProducts />
        </LazyWrapper>

        <LazyWrapper name="Budget Categories">
          <BudgetCategories />
        </LazyWrapper>

        {state.errors.cart ? (
          <ErrorComponent 
            message={state.errors.cart}
            onRetry={fetchCartProducts}
            testID="cart-error"
            type="data"
          />
        ) : (
          <LazyWrapper name="Cart Preview">
            <CartItemsPreview 
              navigation={navigation}
              loading={state.loading.cart}
              cartProducts={state.cartProducts}
              handleRemove={handleRemove}
              getImageUrl={getImageUrl}
            />
          </LazyWrapper>
        )}

        <LazyWrapper name="Festival Slider">
          <FestivalSlider />
        </LazyWrapper>

        <LazyWrapper name="Featured Now">
          <FeaturedNowSection navigation={navigation} />
        </LazyWrapper>

        {/* Conditionally render best design products */}
        {state.errors.bestDesign ? (
          <ErrorComponent 
            message={state.errors.bestDesign}
            onRetry={loadBestDesignProducts}
            testID="best-design-error"
            type="data"
          />
        ) : state.bestDesignProducts.length > 0 ? (
          <LazyWrapper name="Best Designs">
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
        ) : null}

        <LazyWrapper name="Ring Collection">
          <RingCollection navigation={navigation}  />
        </LazyWrapper> 

        {/* Optional components that can be toggled */}
        <LazyWrapper name="People Also Viewed">
          <PeopleAlsoViewed navigation={navigation} />
        </LazyWrapper>

        <LazyWrapper name="Great Savings">
          <GreatSavingsSection navigation={navigation} />
        </LazyWrapper>

        {/* Add scroll to top button */}
        <TouchableOpacity 
          style={[styles.scrollToTopButton, { backgroundColor: colors.primary }]}
          onPress={scrollToTop}
          accessible={true}
          accessibilityLabel="Scroll to top"
          accessibilityRole="button"
        >
          <Feather name="arrow-up" size={20} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Enhanced styles with better responsive design
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // More space for better UX
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
    height: 70, // Slightly taller for better touch targets
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  userSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingRight: 15,
    flex: 1,
  },
  profileImage: {
    height: 48,
    width: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    ...FONTS.Marcellus,
    fontSize: 14,
    lineHeight: 18,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  notificationButton: {
    height: 48,
    width: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(195, 123, 95, 0.20)',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  bellIcon: {
    width: 22,
    height: 22,
  },
  searchContainer: {
    marginTop: 20,
    position: 'relative',
    marginHorizontal: 5,
  },
  searchIcon: {
    position: 'absolute',
    right: 15,
    top: 16,
    padding: 5, // Better touch target
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
    marginTop: 12,
    fontSize: 16,
    color: COLORS.primary,
    ...FONTS.fontMedium,
  },
  skeletonContainer: {
    padding: 20,
    gap: 15,
  },
  skeletonHeader: {
    height: 60,
    borderRadius: 10,
  },
  skeletonContent: {
    height: 200,
    borderRadius: 10,
  },
  skeletonFooter: {
    height: 40,
    borderRadius: 10,
  },
  skeletonShimmer: {
    backgroundColor: '#E1E9EE',
    opacity: 0.7,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    margin: 15,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7D7',
    minHeight: 120,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 15,
    ...FONTS.fontMedium,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBoundaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF8F8',
  },
  errorBoundaryText: {
    fontSize: 18,
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 20,
    ...FONTS.fontSemiBold,
  },
  errorBoundaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  errorBoundaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineIndicator: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  offlineText: {
    color: 'white',
    fontSize: 12,
    ...FONTS.fontMedium,
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // Responsive styles
  ...Platform.select({
    ios: {
      headerIOS: {
        paddingTop: 10,
      },
    },
    android: {
      headerAndroid: {
        paddingTop: 5,
      },
    },
  }),
});

// Enhanced performance optimizations
const arePropsEqual = (prevProps: HomeScreenProps, nextProps: HomeScreenProps) => {
  return prevProps.route.key === nextProps.route.key;
};

export default React.memo(Home, arePropsEqual);