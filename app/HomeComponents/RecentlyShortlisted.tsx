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

const API_IMAGE_URL = 'https://app.bmgjewellers.com';

// ✅ Utility to extract product images
const getProductImages = (item: any): string[] => {
  try {
    const imageData = item?.ImagePath;

    if (!imageData) {
      return [IMAGES.item11];
    }

    let parsedImages: string[] = [];
    
    if (typeof imageData === 'string') {
      // Handle JSON string arrays
      if (imageData.startsWith('[') && imageData.endsWith(']')) {
        try {
          parsedImages = JSON.parse(imageData);
        } catch {
          // Fallback parsing for malformed JSON
          const pathMatch = imageData.match(/"([^"]+)"/g);
          if (pathMatch) {
            parsedImages = pathMatch.map((path: string) =>
              path.replace(/"/g, '').trim()
            );
          } else {
            parsedImages = [imageData.replace(/["'[\]]/g, '').trim()];
          }
        }
      } else {
        // Handle simple string paths
        parsedImages = [imageData.trim()];
      }
    } else if (Array.isArray(imageData)) {
      // Handle already parsed arrays
      parsedImages = imageData;
    } else {
      return [IMAGES.item11];
    }

    // Format URLs properly
    return parsedImages.length > 0
      ? parsedImages.map(img => {
          let cleanedImg = img.replace(/["'[\]]/g, '').trim();
          
          if (cleanedImg.startsWith('http')) {
            return cleanedImg;
          } else if (cleanedImg.startsWith('/')) {
            return `${API_IMAGE_URL}${cleanedImg}`;
          } else {
            return `${API_IMAGE_URL}/${cleanedImg}`;
          }
        })
      : [IMAGES.item11];
  } catch (error) {
    console.error('Error parsing product images:', error);
    return [IMAGES.item11];
  }
};

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

  const handleImageError = useCallback((imageUrl: string) => {
    console.log('Image failed to load:', imageUrl);
    setFailedImages(prev => new Set(prev).add(imageUrl));
  }, []);

  const getWorkingImage = useCallback(
    (product: Product): string => {
      if (failedImages.has(product.image)) {
        return IMAGES.item11;
      }
      return product.image || IMAGES.item11;
    },
    [failedImages],
  );

  // ✅ Process products with getProductImages
  const processProducts = useCallback((rawProducts: any[]): Product[] => {
    if (!Array.isArray(rawProducts)) return [];

    return rawProducts.map((product, index) => {
      const images = getProductImages(product);
      const firstImage = images[0] || IMAGES.item11;

      return {
        id: String(product.SNO || product.TAGKEY || product.id || `product-${index}`),
        title: String(product.SUBITEMNAME || product.ITEMNAME || product.title || 'Product'),
        price: Number(product.GrandTotal || product.RATE || product.price || 0),
        discount: Number(product.discount || 0),
        image: firstImage, // ✅ first image for display
        rawData: { ...product, allImages: images }, // ✅ keep all images if needed
      };
    });
  }, []);

  const fetchRecentlyViewed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setFailedImages(new Set());

      const data = await getRecentlyViewedProducts();

      if (Array.isArray(data)) {
        setProducts(processProducts(data));
      } else {
        setError('Invalid data received from server');
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
      if (productId) {
        navigation.navigate('ProductDetails', { sno: productId });
      }
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
            product={product.rawData || product}
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
        {showSeeAll && products.length > 0 && (
          <TouchableOpacity onPress={handleSeeAllPress}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
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
    minHeight: 120,
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
    minHeight: 120,
  },
  errorText: {
    ...FONTS.fontRegular,
    fontSize: SIZES.font,
    marginBottom: SIZES.marginSmall,
    textAlign: 'center',
  },
  retryButton: {
    padding: SIZES.paddingSmall,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  retryText: {
    ...FONTS.fontMedium,
    fontSize: SIZES.font,
  },
  emptyContainer: {
    padding: SIZES.paddingLarge,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyText: {
    ...FONTS.fontRegular,
    fontSize: SIZES.font,
    textAlign: 'center',
    marginBottom: SIZES.marginSmall,
  },
  refreshButton: {
    padding: SIZES.paddingSmall,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
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