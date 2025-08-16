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

  const fetchRecentlyViewed = useCallback(async () => {
    try { 
      setLoading(true);
      setError(null);
      const data = await getRecentlyViewedProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('❌ Failed to load recently viewed products:', err);
      setError('Failed to load recently viewed products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const renderProductItem = useCallback(
    (product: Product, index: number) => {
      const fallbackImage = IMAGES.item11;
      const productImage = product.image || fallbackImage;

      return (
        <View
          style={styles.productContainer}
          key={`recent-${product.id}-${index}`}
          testID={`product-item-${index}`}
        >
          <CardStyle1
            id={product.id}
            image={productImage}
            title={product.title}
            price={product.price}
            discount={product.discount}
            onPress={() => handleProductPress(product.id)}
            onImageError={() => ({ ...product, image: fallbackImage })}
            card3
            removelikebtn
          />
        </View>
      );
    },
    [handleProductPress]
  );

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
        <TouchableOpacity onPress={fetchRecentlyViewed} style={styles.retryButton}>
          <Text style={[styles.retryText, { color: COLORS.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: colors.text }}>No recently shortlisted products.</Text>
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
        {showSeeAll && (
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
          contentContainerStyle={styles.scrollContent}
          testID="products-scrollview"
        >
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
  productsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  productContainer: {
    width: CARD_WIDTH,
  },
});

export default React.memo(RecentlyShortlistedSection);