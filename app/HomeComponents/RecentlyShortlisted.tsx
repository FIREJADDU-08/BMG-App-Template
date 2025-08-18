// screens/RecentlyShortlistedSection.tsx

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
import { Product } from '../types/Product'; // Assuming you have a Product type

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
  title?: string;
  showSeeAll?: boolean;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH > SIZES.container ? SIZES.container / 3 : SCREEN_WIDTH / 2.9;

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

  // Enhanced image processing function
  const processImagePath = useCallback((imagePath: string | string[] | null | undefined): string => {
    const fallbackImage = IMAGES.item11;
    
    if (!imagePath) return fallbackImage;

    try {
      let imageUrl = '';
      
      if (Array.isArray(imagePath)) {
        // If it's already an array, take the first valid image
        const validImages = imagePath.filter(img => img && typeof img === 'string' && img.trim() !== '');
        imageUrl = validImages.length > 0 ? validImages[0] : '';
      } else if (typeof imagePath === 'string') {
        if (imagePath.startsWith('[') && imagePath.endsWith(']')) {
          // JSON string format - parse it
          const parsedImages = JSON.parse(imagePath);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            const validImages = parsedImages.filter(img => img && typeof img === 'string' && img.trim() !== '');
            imageUrl = validImages.length > 0 ? validImages[0] : '';
          }
        } else {
          // Single image path
          imageUrl = imagePath.trim();
        }
      }

      if (!imageUrl) return fallbackImage;

      // Construct full URL if needed
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      } else if (imageUrl.startsWith('/uploads')) {
        return `https://app.bmgjewellers.com${imageUrl}`;
      } else {
        return `https://app.bmgjewellers.com/uploads/${imageUrl}`;
      }
    } catch (err) {
      console.warn('⚠️ Image processing failed for:', imagePath, err);
      return fallbackImage;
    }
  }, []);

  // Enhanced product processing function
  const processProducts = useCallback((rawProducts: any[]): Product[] => {
    if (!Array.isArray(rawProducts)) return [];

    return rawProducts.map((product, index) => {
      const processedImage = processImagePath(product.ImagePath || product.image);
      
      return {
        id: product.SNO || product.TAGKEY || product.id || `product-${index}`,
        title: product.SUBITEMNAME || product.ITEMNAME || product.title || 'Product',
        price: product.GrandTotal || product.RATE || product.price || 0,
        discount: product.discount || 0,
        image: processedImage,
        rawData: product, // Keep original data for reference
      };
    });
  }, [processImagePath]);

  const fetchRecentlyViewed = useCallback(async () => {
    try { 
      setLoading(true);
      setError(null);
      const data = await getRecentlyViewedProducts();
      
      if (data && Array.isArray(data)) {
        const processedProducts = processProducts(data);
        setProducts(processedProducts);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('❌ Failed to load recently viewed products:', err);
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
    [navigation]
  );

  const handleSeeAllPress = useCallback(() => {
    navigation.navigate('RecentlyViewed');
  }, [navigation]);

  // Handle individual image errors
  const handleImageError = useCallback((productId: string, originalImage: string) => {
    console.warn(`⚠️ Image failed for product ${productId}: ${originalImage}`);
    
    setFailedImages(prev => new Set([...prev, originalImage]));
    
    // Update the product with fallback image
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, image: IMAGES.item11 }
          : product
      )
    );
  }, []);

  // Get working image for a product
  const getWorkingImage = useCallback((product: Product): string => {
    if (failedImages.has(product.image)) {
      return IMAGES.item11;
    }
    return product.image || IMAGES.item11;
  }, [failedImages]);

  const renderProductItem = useCallback(
    (product: Product, index: number) => {
      const workingImage = getWorkingImage(product);
      
      return (
        <View
          style={styles.productContainer}
          key={`recent-${product.id}-${index}`}
          testID={`product-item-${index}`}
        >
          <CardStyle1
            id={product.id}
            image={workingImage}
            title={product.title}
            price={product.price}
            discount={product.discount}
            onPress={() => handleProductPress(product.id)}
            onImageError={() => handleImageError(product.id, product.image)}
            card3
            removelikebtn
          />
        </View>
      );
    },
    [handleProductPress, handleImageError, getWorkingImage]
  );

  // Refresh handler for pull-to-refresh functionality
  const handleRefresh = useCallback(() => {
    setFailedImages(new Set()); // Clear failed images on refresh
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} testID="loading-indicator" />
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
          No recently shortlisted products found.
        </Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={[styles.refreshText, { color: COLORS.primary }]}>
            Refresh
          </Text>
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
      ]}
      testID="recently-shortlisted-section"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
        {showSeeAll && products.length > 0 && (
          <TouchableOpacity onPress={handleSeeAllPress} testID="see-all-button">
            <Text style={[styles.seeAllText, { color: colors.title }]}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Scroll */}
      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            products.length === 0 && styles.scrollContentEmpty
          ]}
          testID="products-scrollview"
        >
          <View style={styles.productsRow}>
            {products.map(renderProductItem)}
          </View>
        </ScrollView>
      </View>

      {/* Debug info in development mode */}
      {/* {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={[styles.debugText, { color: colors.text }]}>
            Products: {products.length} | Failed Images: {failedImages.size}
          </Text>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...FONTS.fontRegular,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    padding: 8,
  },
  retryText: {
    ...FONTS.fontMedium,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...FONTS.fontRegular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    ...FONTS.fontMedium,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...FONTS.Marcellus,
    fontSize: 20,
    lineHeight: 24,
  },
  seeAllText: {
    ...FONTS.fontRegular,
    fontSize: 13,
  },
  scrollContainer: {
    marginHorizontal: -15,
    marginTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 15,
  },
  scrollContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  productContainer: {
    width: CARD_WIDTH,
  },
  debugContainer: {
    padding: 5,
    marginTop: 5,
    opacity: 0.5,
  },
  debugText: {
    fontSize: 10,
    textAlign: 'center',
  },
});

export default React.memo(RecentlyShortlistedSection);