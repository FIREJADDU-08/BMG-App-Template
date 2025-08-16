import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { BlurView } from 'expo-blur';
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

  // Enhanced filter state with default values
  const [activeFilters, setActiveFilters] = useState({
    gender: '',
    occasion: '',
    colorAccent: '',
    materialFinish: '',
    sizeName: '',
    minGrandTotal: 0,
    maxGrandTotal: 100000,
  });

  // Get initial filters from route params
  const { 
    itemName, 
    subItemName, 
    initialFilters = {},
    ...otherParams 
  } = route.params || {};

  // Initialize filters with route params on component mount
  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      setActiveFilters(prev => ({
        ...prev,
        ...initialFilters
      }));
      productService.resetPagination();
    }
  }, [initialFilters]);

  // Enhanced debounced search with better performance
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      productService.resetPagination();
      setProducts([]);
      fetchProducts(true, query);
    }, 300),
    [activeFilters, itemName, subItemName]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      productService.resetPagination();
      setProducts([]);
      fetchProducts(true);
    } else {
      debouncedSearch(query);
    }
  };

  // Enhanced fetch products with better error handling and loading states
  const fetchProducts = async (
    reset: boolean = false,
    search: string = searchQuery
  ) => {
    try {
      if (reset) {
        setLoading(true);
        productService.resetPagination();
      } else {
        if (!productService.hasMoreData()) return;
        setLoadingMore(true);
      }

      const filters = {
        itemName,
        subItemName,
        ...activeFilters,
        searchQuery: search.trim(),
      };

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
    }
  };

  // Enhanced refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchProducts(true);
  }, [searchQuery, activeFilters, itemName, subItemName]);

  // Load products on component mount and filter changes
  useEffect(() => {
    fetchProducts(true);
  }, [itemName, subItemName, activeFilters]);

  // Enhanced filter change handler
  const handleFiltersChange = useCallback((filters: any) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev, ...filters };
      
      // Only fetch if filters actually changed
      const filtersChanged = Object.keys(filters).some(
        key => prev[key as keyof typeof prev] !== filters[key]
      );
      
      if (filtersChanged) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          productService.resetPagination();
          setProducts([]);
          fetchProducts(true);
        }, 100);
      }
      
      return newFilters;
    });
  }, [searchQuery, itemName, subItemName]);

  // Enhanced scroll handler with better performance
  const handleScroll = useCallback(({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const threshold = 100; // Load more when 100px from bottom
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;

    if (isCloseToBottom && productService.hasMoreData() && !loadingMore && !loading) {
      fetchProducts(false);
    }
  }, [loadingMore, loading]);

  // Redux actions
  const addItemToWishList = useCallback(
    (data: ProductItem) => dispatch(addTowishList(data)),
    [dispatch]
  );
  
  const addItemToCart = useCallback(
    (data: ProductItem) => dispatch(addToCart(data)),
    [dispatch]
  );

  // Enhanced product grid renderer
  const renderProducts = () => {
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
            onPress={() => {
              setSearchQuery('');
              setActiveFilters({
                gender: '',
                occasion: '',
                colorAccent: '',
                materialFinish: '',
                sizeName: '',
                minGrandTotal: 0,
                maxGrandTotal: 100000,
              });
            }}
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

    // Grid view (only view now)
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
              onPress={() =>
                navigation.navigate('ProductDetails', { sno: data.SNO })
              }
              onAddToWishlist={() => addItemToWishList(data)}
              onAddToCart={() => addItemToCart(data)}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      {/* Enhanced Header */}
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
          {/* Back button */}
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
              onPress={() => navigation.goBack()}
              icon={(props) => (
                <MaterialIcons name="arrow-back-ios" {...props} />
              )}
              iconColor={colors.title}
              size={20}
            />
          </View>

          {/* Enhanced Search */}
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

          {/* Cart with dynamic count */}
          <TouchableOpacity
            onPress={() => navigation.navigate('MyCart')}
            style={{ padding: 10, marginRight: 10, marginLeft: 10 }}
          >
            <Image
              style={{ height: 22, width: 22, tintColor: colors.title }}
              source={IMAGES.shopping2}
            />
            <View
              style={[
                GlobalStyleSheet.notification,
                { position: 'absolute', right: 3, top: 3 },
              ]}
            >
              <Text
                style={{ ...FONTS.fontRegular, fontSize: 10, color: COLORS.white }}
              >
                14
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Grid */}
      <View style={[GlobalStyleSheet.container, { paddingTop: 20, flex: 1 }]}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ 
            paddingBottom: 120, 
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
          {/* Active filters indicator */}
          {(searchQuery || Object.values(activeFilters).some(v => v && v !== 0 && v !== 100000)) && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 16,
              paddingHorizontal: 4 
            }}>
              <MaterialIcons name="filter-list" size={16} color={colors.text} />
              <Text style={{ 
                marginLeft: 8, 
                color: colors.text, 
                ...FONTS.fontRegular,
                fontSize: 14
              }}>
                Filters applied
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilters({
                    gender: '',
                    occasion: '',
                    colorAccent: '',
                    materialFinish: '',
                    sizeName: '',
                    minGrandTotal: 0,
                    maxGrandTotal: 100000,
                  });
                }}
                style={{ marginLeft: 'auto' }}
              >
                <Text style={{ 
                  color: colors.primary, 
                  ...FONTS.fontMedium,
                  fontSize: 14
                }}>
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {renderProducts()}
          
          {/* Loading more indicator */}
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
          
          {/* End of list indicator */}
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

      {/* Enhanced Bottom Sheet Filter Bar */}
      <View
        style={{
          width: '100%',
          position: 'absolute',
          bottom: 0,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
        }}
      >
        <BlurView
          style={{
            width: '100%',
            height: Platform.OS === 'ios' ? 90 : 70,
            borderRadius: 50,
          }}
          blurType="light"
          blurAmount={10}
        />
        <View
          style={{
            backgroundColor: theme.dark
              ? 'rgba(0,0,0,0.50)'
              : 'rgba(255, 255, 255, 0.50)',
            height: Platform.OS === 'ios' ? 90 : 70,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            position: 'absolute',
            bottom: 0,
            width: '100%',
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            paddingBottom: Platform.OS === 'ios' ? 20 : 0,
          }}
        >
          {[
            { icon: IMAGES.user2, label: 'GENDER', key: 'gender' },
            { icon: IMAGES.arrowup, label: 'OCCASION', key: 'occasion' },
            { icon: IMAGES.filter, label: 'FILTER', key: 'filter' },
          ].map(({ icon, label, key }) => (
            <TouchableOpacity
              key={key}
              onPress={() => sheetRef.current?.openSheet(key)}
              style={{ 
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
              }}
            >
              <Image
                source={icon}
                style={{ 
                  height: 22, 
                  width: 22, 
                  tintColor: colors.title,
                  marginBottom: 4 
                }}
              />
              <Text
                style={{ 
                  ...FONTS.fontMedium, 
                  fontSize: 13, 
                  color: colors.title 
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* BottomSheet2 component */}
      <BottomSheet2 ref={sheetRef} onFiltersChange={handleFiltersChange} />
    </SafeAreaView>
  );
};

export default Products;