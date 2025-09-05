// BlockbusterDeals.tsx
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { FONTS, COLORS, SIZES } from '../constants/theme';
import ImageSwper2 from '../components/ImageSwper2';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import { fetchFeaturedProducts } from '../Services/FeatureService';
import { ImageSourcePropType } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  addProductToWishList,
  removeProductFromWishList,
  fetchWishList,
} from '../redux/reducer/wishListReducer';
import { Feather } from '@expo/vector-icons';

type FeaturedProduct = {
  SNO: string;
  SUBITEMNAME: string;
  GrandTotal: number;
  images: ImageSourcePropType[];
  Discount?: string;
  Offer?: string;
  DeliveryOption?: string;
  ImagePath?: string;
  mainImage: ImageSourcePropType;
};

type BlockbusterDealsProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

const BlockbusterDeals = ({ navigation }: BlockbusterDealsProps) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { wishList } = useSelector((state: any) => state.wishList);

  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadFeaturedProducts = async () => {
    try {
      setLoadingFeatured(true);
      const products = await fetchFeaturedProducts();
      setFeaturedProducts(products);
      setError(null);
    } catch (err) {
      console.error('Failed to load featured products:', err);
      setError('Failed to load featured products. Please try again later.');
      setFeaturedProducts([]);
    } finally {
      setLoadingFeatured(false);
    }
  };

  useEffect(() => {
    loadFeaturedProducts();
    dispatch(fetchWishList());
  }, [dispatch]);

  const toggleWishlist = async (product: FeaturedProduct) => {
    try {
      const isInWishlist = wishList.some((item: any) => item.SNO === product.SNO);

      if (isInWishlist) {
        await dispatch(removeProductFromWishList(product.SNO));
      } else {
        await dispatch(
          addProductToWishList({
            SNO: product.SNO,
            SUBITEMNAME: product.SUBITEMNAME,
            GrandTotal: product.GrandTotal,
            ImagePath: product.ImagePath,
          })
        );
      }
      dispatch(fetchWishList());
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const isInWishlist = (productId: string) =>
    wishList.some((item: any) => item.SNO === productId);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[GlobalStyleSheet.container, styles.header]}>
        <View style={styles.headerRow}>
          <Text style={[FONTS.Marcellus, styles.headerTitle, { color: colors.title }]}>
            Blockbuster Deals
          </Text>
        </View>
      </View>

      {/* Content */}
      {loadingFeatured ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={[FONTS.fontRegular, { color: colors.text, marginBottom: SIZES.radius_sm }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={loadFeaturedProducts}>
            <Text style={[FONTS.fontRegular, { color: COLORS.primary }]}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : featuredProducts.length > 0 ? (
        <View style={[GlobalStyleSheet.container, styles.sliderContainer]}>
          <ImageSwper2
            data={featuredProducts.map((product) => ({
              id: product.SNO,
              SNO: product.SNO, // Add this line to pass SNO
              image: product.mainImage,
              title: product.ITEMNAME || 'Jewelry Item',
              price: `${product.GrandTotal}`,
              discount: product.Discount
                ? `₹${(product.GrandTotal * 1.1).toFixed(2)}`
                : '',
              offer: product.Offer || 'Special Offer',
              delivery: product.DeliveryOption || 'Free delivery',
              isFavorite: isInWishlist(product.SNO),
              onFavoritePress: () => toggleWishlist(product),
            }))}
            onProductPress={(id) => navigation.navigate('ProductDetails', { SNO: id })}
            favoriteIcon={
              <Feather name="heart" size={20} color={COLORS.danger} fill={COLORS.danger} />
            }
          />
        </View>
      ) : (
        <View style={styles.messageContainer}>
          <Text style={[FONTS.fontRegular, { color: colors.text }]}>
            No featured products available
          </Text>
          <TouchableOpacity onPress={loadFeaturedProducts} style={{ marginTop: SIZES.radius_sm }}>
            <Text style={[FONTS.fontRegular, { color: COLORS.primary }]}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  header: {
    marginBottom: SIZES.radius,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
  },
  loaderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderContainer: {
    padding: 0,
    paddingVertical: SIZES.padding,
  },
});

export default BlockbusterDeals;