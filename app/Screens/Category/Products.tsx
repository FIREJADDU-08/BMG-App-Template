
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import { IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { IMAGES } from '../../constants/Images';
import Cardstyle2 from '../../components/Card/Cardstyle2';
import { useDispatch } from 'react-redux';
import { addTowishList } from '../../redux/reducer/wishListReducer';
import { addToCart } from '../../redux/reducer/cartReducer';
import BottomSheet2 from '../Shortcode/BottomSheet2';
import { productService, ProductItem } from '../../Services/ProductService';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import debounce from 'lodash.debounce';

type ProductsScreenProps = StackScreenProps<RootStackParamList, 'Products'>;

const Products = ({ navigation, route }: ProductsScreenProps) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;

  const dispatch = useDispatch();
  const sheetRef = useRef<any>();
  const scrollViewRef = useRef<any>();
  
  // State management
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false); // Prevent duplicate fetches

  // Enhanced filter state with default values
  const [activeFilters, setActiveFilters] = useState({
    gender: '',
    occasion: '',
    colorAccent: '',
    materialFinish: '',
    sizeName: '',
    category: '',
    brand: '',
    minGrandTotal: route.params?.minGrandTotal || 0,
    maxGrandTotal: route.params?.maxGrandTotal || 10000000000,
  });

  // Handle route params
  useEffect(() => {
    console.log('Route params received:', route.params);
    
    const {
      itemName,
      subItemName,
      initialFilters,
      gender,
      occasion,
      colorAccent,
      materialFinish,
      sizeName,
      minGrandTotal,
      maxGrandTotal,
      category,
      brand,
      priceRange,
    } = route.params || {};

    const allFilters = {
      ...initialFilters,
      ...(gender && { gender }),
      ...(occasion && { occasion }),
      ...(colorAccent && { colorAccent }),
      ...(materialFinish && { materialFinish }),
      ...(sizeName && { sizeName }),
      ...(category && { category }),
      ...(brand && { brand }),
      ...(minGrandTotal && { minGrandTotal }),
      ...(maxGrandTotal && { maxGrandTotal }),
      ...(priceRange && { 
        minGrandTotal: priceRange.min, 
        maxGrandTotal: priceRange.max 
      }),
    };

    console.log('All merged filters from route:', allFilters);
    
    if (Object.keys(allFilters).length > 0) {
      setActiveFilters(prev => ({
        ...prev,
        ...allFilters
      }));
      productService.resetPagination();
    }
  }, [route.params]);

  // Log active filters
  useEffect(() => {
    console.log('Active filters:', activeFilters);
  }, [activeFilters]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        console.log('Executing debounced search for:', query);
        productService.resetPagination();
        setProducts([]);
        fetchProducts(true, query);
      }, 300),
    [activeFilters]
  );

  // Cleanup debounced search to prevent memory leaks
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearch = useCallback((query: string) => {
    console.log('Search query changed to:', query);
    setSearchQuery(query);
    if (query.trim() === '') {
      productService.resetPagination();
      setProducts([]);
      fetchProducts(true);
    } else {
      debouncedSearch(query);
    }
  }, [debouncedSearch]);

  // Fetch products
  const fetchProducts = useCallback(
    async (reset: boolean = false, search: string = searchQuery) => {
      if (isFetching) return; // Prevent duplicate fetches
      setIsFetching(true);

      try {
        if (reset) {
          console.log('Fetching products with reset');
          setLoading(true);
          productService.resetPagination();
        } else {
          if (!productService.hasMoreData()) {
            console.log('No more data to fetch');
            setIsFetching(false);
            return;
          }
          console.log('Fetching more products');
          setLoadingMore(true);
        }

        const filters = {
          itemName: route.params?.itemName,
          subItemName: route.params?.subItemName,
          ...activeFilters,
          searchQuery: search.trim(),
        };

        console.log('Fetching products with filters:', filters);
        const data = await productService.getFilteredProducts(filters);

        if (reset) {
          setProducts(data);
        } else {
          setProducts(prev => [...prev, ...data]);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please check your connection and try again.');
        
        if (reset) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        setIsFetching(false);
      }
    },
    [activeFilters, searchQuery, isFetching, route.params]
  );

  // Refresh handler
  const onRefresh = useCallback(() => {
    console.log('Refreshing products list');
    setRefreshing(true);
    setError(null);
    fetchProducts(true);
  }, [fetchProducts]);

  // Load products on mount and filter changes
  useEffect(() => {
    console.log('Component mounted or filters changed, fetching products');
    fetchProducts(true);
  }, [activeFilters, route.params?.itemName, route.params?.subItemName, fetchProducts]);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: any) => {
    console.log('Filters changed:', filters);
    setActiveFilters(prev => {
      const newFilters = { ...prev, ...filters };
      
      const filtersChanged = Object.keys(filters).some(
        key => prev[key as keyof typeof prev] !== filters[key]
      );
      
      if (filtersChanged) {
        setTimeout(() => {
          productService.resetPagination();
          setProducts([]);
          fetchProducts(true);
        }, 100);
      }
      
      return newFilters;
    });
  }, [fetchProducts]);

  // Debounced scroll handler for auto-pagination
  const debouncedHandleScroll = useMemo(
    () =>
      debounce(({ layoutMeasurement, contentOffset, contentSize }) => {
        const threshold = 200;
        const isCloseToBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;

        if (isCloseToBottom && productService.hasMoreData() && !loadingMore && !loading && !isFetching) {
          console.log('Scrolled near bottom, loading more products');
          fetchProducts(false);
        }
      }, 100),
    [loadingMore, loading, isFetching, fetchProducts]
  );

  // Handle scroll event
  const handleScroll = useCallback(
    (event: any) => {
      // Extract properties immediately to avoid event pooling issues
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent || {};
      if (layoutMeasurement && contentOffset && contentSize) {
        debouncedHandleScroll({ layoutMeasurement, contentOffset, contentSize });
      }
    },
    [debouncedHandleScroll]
  );

  // Cleanup scroll handler
  useEffect(() => {
    return () => {
      debouncedHandleScroll.cancel();
    };
  }, [debouncedHandleScroll]);

  // Redux actions
  const addItemToWishList = useCallback(
    (data: ProductItem) => {
      console.log('Adding to wishlist:', data);
      dispatch(addTowishList(data));
    },
    [dispatch]
  );
  
  const addItemToCart = useCallback(
    (data: ProductItem) => {
      console.log('Adding to cart:', data);
      dispatch(addToCart(data));
      setCartItemCount(prev => prev + 1);
    },
    [dispatch]
  );

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return searchQuery.trim() !== '' || 
           Object.entries(activeFilters).some(([key, value]) => {
             if (key === 'minGrandTotal') return value > 0;
             if (key === 'maxGrandTotal') return value < 10000000000;
             return value && value !== '';
           });
  }, [searchQuery, activeFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    console.log('Clearing all filters');
    setSearchQuery('');
    setActiveFilters({
      gender: '',
      occasion: '',
      colorAccent: '',
      materialFinish: '',
      sizeName: '',
      category: '',
      brand: '',
      minGrandTotal: 0,
      maxGrandTotal: 10000000000,
    });
    productService.resetPagination();
    fetchProducts(true);
  }, [fetchProducts]);

  // Render product grid
  const renderProducts = useCallback(() => {
    if (loading && products.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ 
            color: colors.text, 
            marginTop: 16, 
            ...FONTS.fontRegular,
            fontSize: 16 
          }}>
            Loading products...
          </Text>
        </View>
      );
    }

    if (error && products.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
          <MaterialIcons name="error-outline" size={48} color={colors.text} />
          <Text style={{ 
            color: colors.text, 
            textAlign: 'center', 
            marginTop: 16,
            marginHorizontal: 20,
            ...FONTS.fontRegular,
            fontSize: 16,
            lineHeight: 24
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => fetchProducts(true)}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 16
            }}
          >
            <Text style={{ color: COLORS.white, ...FONTS.fontMedium }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
          <MaterialIcons name="search-off" size={48} color={colors.text} />
          <Text style={{
            color: colors.text,
            textAlign: 'center',
            marginTop: 16,
            marginHorizontal: 20,
            ...FONTS.fontRegular,
            fontSize: 16,
            lineHeight: 24
          }}>
            No products found matching your criteria.{'\n'}
            Try adjusting your search or filters.
          </Text>
          <TouchableOpacity
            onPress={clearAllFilters}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 16
            }}
          >
            <Text style={{ color: COLORS.white, ...FONTS.fontMedium }}>
              Clear Filters
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[GlobalStyleSheet.row, { marginTop: 5 }]}>
        {products.map((data, index) => (
          <View
            key={`${data.ITEMID}-${data.SNO}-${index}`}
            style={[GlobalStyleSheet.col50, { marginBottom: 20 }]}
          >
            <Cardstyle2
              id={data.ITEMID}
              title={data.SUBITEMNAME}
              price={`₹${data.GrandTotal !== '0.00' ? data.GrandTotal : data.RATE}`}
              image={data.ImagePaths?.[0]}
              onPress={() => {
                console.log('Navigating to product details:', data.SNO);
                navigation.navigate('ProductDetails', { sno: data.SNO });
              }}
              onAddToWishlist={() => addItemToWishList(data)}
              onAddToCart={() => addItemToCart(data)}
            />
          </View>
        ))}
      </View>
    );
  }, [loading, error, products, colors, clearAllFilters, fetchProducts, addItemToWishList, addItemToCart, navigation]);

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <View
        style={[
          Platform.OS === 'ios' && {
            shadowColor: 'rgba(195, 123, 95, 0.20)',
            shadowOffset: { width: 2, height: 4 },
            shadowOpacity: 0.6,
            shadowRadius: 5,
          },
          Platform.OS === 'android' && {
            elevation: 8,
          },
        ]}
      >
        <View
          style={{
            height: 60,
            backgroundColor: theme.dark
              ? 'rgba(0,0,0,.4)'
              : 'rgba(255,255,255,.4)',
            borderBottomLeftRadius: 25,
            borderBottomRightRadius: 25,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              height: 40,
              width: 40,
              borderRadius: 15,
              backgroundColor: colors.card,
              justifyContent: 'center',
              marginLeft: 10,
            }}
          >
            <IconButton
              onPress={() => {
                console.log('Navigating back');
                navigation.goBack();
              }}
              icon={(props) => (
                <MaterialIcons name="arrow-back-ios" {...props} />
              )}
              iconColor={colors.title}
              size={20}
            />
          </View>

          <View
            style={{
              height: 40,
              backgroundColor: colors.card,
              borderRadius: 10,
              marginLeft: 10,
              flex: 1,
              position: 'relative',
            }}
          >
            <TextInput
              placeholder="Search products..."
              placeholderTextColor={
                theme.dark ? 'rgba(255, 255, 255, .6)' : 'rgba(0, 0, 0, 0.6)'
              }
              style={{
                ...FONTS.fontRegular,
                fontSize: 16,
                color: colors.title,
                paddingLeft: 40,
                paddingRight: searchQuery ? 40 : 16,
                flex: 1,
                borderRadius: 10,
              }}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            <View style={{ position: 'absolute', top: 9, left: 10 }}>
              <Image
                style={{ height: 20, width: 20, tintColor: colors.title }}
                source={IMAGES.search}
              />
            </View>
            {searchQuery && (
              <TouchableOpacity
                onPress={() => handleSearch('')}
                style={{ position: 'absolute', top: 9, right: 10 }}
              >
                <MaterialIcons name="clear" size={20} color={colors.title} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => {
              console.log('Opening filter sheet');
              sheetRef.current?.openSheet('filter');
            }}
            style={{
              height: 40,
              width: 40,
              borderRadius: 15,
              backgroundColor: hasActiveFilters() ? colors.primary : colors.card,
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 10,
              position: 'relative',
            }}
          >
            <Image
              source={IMAGES.filter}
              style={{ 
                height: 20, 
                width: 20, 
                tintColor: hasActiveFilters() ? COLORS.white : colors.title 
              }}
            />
            {hasActiveFilters() && (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  height: 12,
                  width: 12,
                  borderRadius: 6,
                  backgroundColor: COLORS.secondary || '#FF6B6B',
                  borderWidth: 2,
                  borderColor: colors.background,
                }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              console.log('Navigating to cart');
              navigation.navigate('MyCart');
            }}
            style={{ 
              padding: 10, 
              marginRight: 10, 
              marginLeft: 10,
              position: 'relative' 
            }}
          >
            <Image
              style={{ height: 22, width: 22, tintColor: colors.title }}
              source={IMAGES.shopping2}
            />
            {cartItemCount > 0 && (
              <View
                style={[
                  GlobalStyleSheet.notification,
                  { position: 'absolute', right: 3, top: 3 },
                ]}
              >
                <Text
                  style={{ 
                    ...FONTS.fontRegular, 
                    fontSize: 10, 
                    color: COLORS.white 
                  }}
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={[GlobalStyleSheet.container, { paddingTop: 20, flex: 1 }]}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ 
            paddingBottom: 40, 
            paddingHorizontal: 15,
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title="Pull to refresh"
              titleColor={colors.text}
            />
          }
        >
          {hasActiveFilters() && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 16,
              paddingHorizontal: 4,
              paddingVertical: 8,
              backgroundColor: colors.card,
              borderRadius: 8,
            }}>
              <MaterialIcons name="filter-list" size={16} color={colors.primary} />
              <Text style={{ 
                marginLeft: 8, 
                color: colors.text, 
                ...FONTS.fontRegular,
                fontSize: 14,
                flex: 1
              }}>
                {Object.entries(activeFilters)
                  .filter(([key, value]) => {
                    if (key === 'minGrandTotal') return value > 0;
                    if (key === 'maxGrandTotal') return value < 10000000000;
                    return value && value !== '';
                  })
                  .length} filters applied
                {searchQuery && ` • Search: "${searchQuery}"`}
              </Text>
              <TouchableOpacity
                onPress={clearAllFilters}
                style={{ 
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  backgroundColor: colors.primary,
                  borderRadius: 4
                }}
              >
                <Text style={{ 
                  color: COLORS.white, 
                  ...FONTS.fontMedium,
                  fontSize: 12
                }}>
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {renderProducts()}
          
          {loadingMore && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{
                marginTop: 8,
                color: colors.text,
                ...FONTS.fontRegular,
                fontSize: 14
              }}>
                Loading more products...
              </Text>
            </View>
          )}
          
          {!productService.hasMoreData() && products.length > 0 && !loading && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{
                textAlign: 'center',
                color: colors.text,
                ...FONTS.fontRegular,
                fontSize: 14,
                opacity: 0.7
              }}>
                You've reached the end of the list
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <BottomSheet2 
        ref={sheetRef} 
        onFiltersChange={handleFiltersChange} 
        initialFilters={activeFilters}
        currentFilters={activeFilters}
      />
    </SafeAreaView>
  );
};

export default Products;
