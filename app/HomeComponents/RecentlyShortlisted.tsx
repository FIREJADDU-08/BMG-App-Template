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

  // Enhanced image path processing function
  const processImagePath = useCallback(
    (imagePath: any): string => {
      const fallbackImage = IMAGES.item13;

      if (!imagePath) return fallbackImage;

      try {
        let imageUrl = '';

        // Case 1: Direct string path (like "/uploads/app_banners/...")
        if (typeof imagePath === 'string' && imagePath.startsWith('/') && !imagePath.startsWith('[')) {
          imageUrl = imagePath;
        }
        // Case 2: JSON string array (like "[\"/uploads/product_images/...\", ...]")
        else if (typeof imagePath === 'string' && imagePath.startsWith('[')) {
          try {
            const parsedImages = JSON.parse(imagePath);
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
              imageUrl = parsedImages[0];
            }
          } catch (parseError) {
            console.warn('Failed to parse image JSON:', parseError);
            // Try to extract the first image using regex
            const match = imagePath.match(/"([^"]+)"/);
            imageUrl = match ? match[1] : imagePath;
          }
        }
        // Case 3: Already an array
        else if (Array.isArray(imagePath) && imagePath.length > 0) {
          imageUrl = imagePath[0];
        }
        // Case 4: Object with image property
        else if (typeof imagePath === 'object' && imagePath !== null) {
          if (imagePath.url) imageUrl = imagePath.url;
          else if (imagePath.path) imageUrl = imagePath.path;
          else if (imagePath.image) imageUrl = imagePath.image;
        }
        // Case 5: Other string formats
        else if (typeof imagePath === 'string') {
          imageUrl = imagePath;
        }

        // Clean up the image URL
        if (imageUrl && typeof imageUrl === 'string') {
          // Remove any quotes or brackets
          imageUrl = imageUrl.replace(/["'[\]]/g, '').trim();
          
          // If empty after cleaning, return fallback
          if (!imageUrl) return fallbackImage;

          // Format the URL properly
          if (imageUrl.startsWith('http')) {
            return imageUrl;
          } else if (imageUrl.startsWith('/')) {
            return `https://app.bmgjewellers.com${imageUrl}`;
          } else {
            // Handle cases where the path might not start with /
            return `https://app.bmgjewellers.com/${imageUrl.replace(/^\/+/, '')}`;
          }
        }

        return fallbackImage;
      } catch (error) {
        console.warn('Error processing image path:', error);
        return fallbackImage;
      }
    },
    [],
  );

  // Process products
  const processProducts = useCallback(
    (rawProducts: any[]): Product[] => {
      if (!Array.isArray(rawProducts)) return [];

      return rawProducts.map((product, index) => {
        const imageSource =
          product.ImagePath || product.image || product.image_url || product.img;
        const processedImage = processImagePath(imageSource);

        return {
          id:
            product.SNO ||
            product.TAGKEY ||
            product.id ||
            `product-${index}`,
          title:
            product.SUBITEMNAME ||
            product.ITEMNAME ||
            product.title ||
            'Product',
          price: product.GrandTotal || product.RATE || product.price || 0,
          discount: product.discount || 0,
          image: processedImage,
          rawData: product,
        };
      });
    },
    [processImagePath],
  );

  // Fetch products
  const fetchRecentlyViewed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching recently viewed products...');
      const data = await getRecentlyViewedProducts();
      console.log('Received data:', data);

      if (data && Array.isArray(data)) {
        console.log('Processing products, count:', data.length);
        const processedProducts = processProducts(data);
        console.log('Processed products:', processedProducts);
        setProducts(processedProducts);
      } else {
        console.log('No data or invalid format');
        setProducts([]);
      }
    } catch (error) {
      console.log('Error fetching recently viewed:', error);
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

  const handleImageError = useCallback((imageUrl: string) => {
    setFailedImages(prev => new Set(prev).add(imageUrl));
  }, []);

  const getWorkingImage = useCallback(
    (product: Product): string => {
      if (failedImages.has(product.image)) {
        return IMAGES.item13;
      }
      return product.image || IMAGES.item13;
    },
    [failedImages],
  );

  const renderProductItem = useCallback(
    (product: Product, index: number) => {
      const workingImage = getWorkingImage(product);

      return (
        <View
          style={styles.productContainer}
          key={`recent-${product.id}-${index}`}
          testID={`product-item-${index}`}>
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

  const handleRefresh = useCallback(() => {
    setFailedImages(new Set());
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          testID="loading-indicator"
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={[styles.retryText, { color: COLORS.primary }]}>
            Retry
          </Text>
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
      testID="recently-shortlisted-section">
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
        {showSeeAll && products.length > 0 && (
          <TouchableOpacity
            onPress={handleSeeAllPress}
            testID="see-all-button">
            <Text style={[styles.seeAllText, { color: colors.title }]}>
              See All
            </Text>
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
            products.length === 0 && styles.scrollContentEmpty,
          ]}
          testID="products-scrollview">
          <View style={styles.productsRow}>
            {products.map(renderProductItem)}
          </View>
        </ScrollView>
      </View>
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
    paddingHorizontal: 15,
    marginBottom: 15,
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
    gap: 15,
  },
  productContainer: {
    width: CARD_WIDTH,
  },
});

export default React.memo(RecentlyShortlistedSection);