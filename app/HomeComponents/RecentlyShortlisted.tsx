import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { IMAGES } from '../constants/Images';
import CardStyle1 from '../components/Card/CardStyle1';
import { useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigations/RootStackParamList';
import { getRecentlyViewedProducts } from '../Services/RecentService';
import { Product } from '../types/Product';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
  title?: string;
  showSeeAll?: boolean;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH =
  SCREEN_WIDTH > SIZES.container ? SIZES.container / 3 : SCREEN_WIDTH / 2.9;

const RecentlyShortlistedSection: React.FC<Props> = ({
  navigation,
  title = 'Recently Shortlisted By You',
  showSeeAll = true,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Handle image loading errors
  const handleImageError = useCallback((imageUrl: string) => {
    console.log('Image failed to load:', imageUrl);
    setFailedImages(prev => new Set(prev).add(imageUrl));
  }, []);

  // Get working image URL (fallback if image failed to load)
  const getWorkingImage = useCallback((product: Product): string => {
    if (failedImages.has(product.image)) {
      return IMAGES.item13;
    }
    return product.image || IMAGES.item13;
  }, [failedImages]);

  // Process products
  const processProducts = useCallback((rawProducts: any[]): Product[] => {
    if (!Array.isArray(rawProducts)) {
      console.log('Invalid products data:', rawProducts);
      return [];
    }

    console.log('Processing products:', rawProducts.length);

    return rawProducts.map((product, index) => {
      const processedProduct = {
        id: product.SNO || product.TAGKEY || product.id || `product-${index}`,
        title: product.SUBITEMNAME || product.ITEMNAME || product.title || 'Product',
        price: product.GrandTotal || product.RATE || product.price || 0,
        discount: product.discount || 0,
        image: product.ImagePath || IMAGES.item13,
        rawData: product,
      };

      console.log('Processed product image:', processedProduct.image);
      return processedProduct;
    });
  }, []);

  // Fetch products
  const fetchRecentlyViewed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setFailedImages(new Set());
      
      console.log('Fetching recently viewed products...');
      const data = await getRecentlyViewedProducts();
      
      console.log('Received data:', data);
      
      if (Array.isArray(data)) {
        const processedProducts = processProducts(data);
        console.log('Processed products:', processedProducts.length);
        setProducts(processedProducts);
      } else {
        console.log('Invalid data format');
        setProducts([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load recently viewed products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [processProducts]);

  useEffect(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  const handleProductPress = useCallback(
    (productId: string) => {
      navigation.navigate('ProductDetails', { sno: productId });
    },
    [navigation],
  );

  const handleSeeAllPress = useCallback(() => {
    navigation.navigate('RecentlyViewed');
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  const renderProductItem = useCallback(
    (product: Product, index: number) => {
      const workingImage = getWorkingImage(product);

      return (
        <View style={styles.productContainer} key={`recent-${product.id}-${index}`}>
          <CardStyle1
            id={product.id}
            image={workingImage}
            title={product.title}
            price={product.price}
            discount={product.discount}
            onPress={() => handleProductPress(product.id)}
            onImageError={() => handleImageError(product.image)}
            card3
            removelikebtn
          />
        </View>
      );
    },
    [handleProductPress, handleImageError, getWorkingImage],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading recently viewed...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={[styles.retryText, { color: COLORS.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No recently viewed products found.
        </Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={[styles.refreshText, { color: COLORS.primary }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        GlobalStyleSheet.container,
        styles.container,
        { backgroundColor: colors.background },
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
        {showSeeAll && products.length > 0 && (
          <TouchableOpacity onPress={handleSeeAllPress}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Scroll */}
      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.productsRow}>{products.map(renderProductItem)}</View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SIZES.paddingSmall,
  },
  loadingContainer: {
    padding: SIZES.paddingLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...FONTS.fontRegular,
    fontSize: SIZES.font,
    marginTop: SIZES.marginSmall,
    textAlign: 'center',
  },
  errorContainer: {
    padding: SIZES.paddingLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...FONTS.fontRegular,
    fontSize: SIZES.font,
    marginBottom: SIZES.marginSmall,
    textAlign: 'center',
  },
  retryButton: {
    padding: SIZES.paddingSmall,
  },
  retryText: {
    ...FONTS.fontMedium,
    fontSize: SIZES.font,
  },
  emptyContainer: {
    padding: SIZES.paddingLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...FONTS.fontRegular,
    fontSize: SIZES.font,
    textAlign: 'center',
    marginBottom: SIZES.marginSmall,
  },
  refreshButton: {
    padding: SIZES.paddingSmall,
  },
  refreshText: {
    ...FONTS.fontMedium,
    fontSize: SIZES.font,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.margin,
  },
  title: {
    ...FONTS.Marcellus,
    fontSize: SIZES.largeTitle,
    lineHeight: SIZES.largeLineHeight,
  },
  seeAllText: {
    ...FONTS.fontRegular,
    fontSize: SIZES.small,
  },
  scrollContainer: {
    marginHorizontal: -SIZES.padding,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
  },
  productsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.margin,
  },
  productContainer: {
    width: CARD_WIDTH,
  },
});

export default React.memo(RecentlyShortlistedSection);