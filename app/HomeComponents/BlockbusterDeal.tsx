import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { FONTS, COLORS } from '../constants/theme';
import ImageSwper2 from '../components/ImageSwper2';
import { IMAGES } from '../constants/Images';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import { fetchFeaturedProducts } from '../Services/FeatureService';
import { ImageSourcePropType } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addProductToWishList, removeProductFromWishList, fetchWishList } from '../redux/reducer/wishListReducer';
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
        await dispatch(addProductToWishList({
          SNO: product.SNO,
          SUBITEMNAME: product.SUBITEMNAME,
          GrandTotal: product.GrandTotal,
          ImagePath: product.ImagePath,
          // Add other necessary product fields
        }));
      }
      dispatch(fetchWishList());
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishList.some((item: any) => item.SNO === productId);
  };

  return (
    <View style={{ backgroundColor: colors.background, width: '100%' }}>
      {/* Header */}
      <View style={[GlobalStyleSheet.container, { marginBottom: 10, paddingBottom: 0 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ ...FONTS.Marcellus, fontSize: 20, color: colors.title }}>
            Blockbuster deals
          </Text>
          {/* <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={{ ...FONTS.fontRegular, fontSize: 13, color: colors.title }}>
              See All Deals
            </Text>
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Content */}
      {loadingFeatured ? (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ ...FONTS.fontRegular, color: colors.text, marginBottom: 10 }}>
            {error}
          </Text>
          <TouchableOpacity onPress={loadFeaturedProducts}>
            <Text style={{ ...FONTS.fontRegular, color: COLORS.primary }}>
              Tap to retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : featuredProducts.length > 0 ? (
        <View style={[GlobalStyleSheet.container, { padding: 0, paddingVertical: 15 }]}>
          <ImageSwper2
            data={featuredProducts.map((product) => ({
              id: product.SNO,
              image: product.mainImage,
              title: product.SUBITEMNAME || 'Jewelry Item',
              price: `${product.GrandTotal}`,
              discount: product.Discount
                ? `₹${(product.GrandTotal * 1.1).toFixed(2)}`
                : '',
              offer: product.Offer || 'Special Offer',
              delivery: product.DeliveryOption || 'Free delivery',
              isFavorite: isInWishlist(product.SNO),
              onFavoritePress: () => toggleWishlist(product),
            }))}
            onProductPress={(id) =>
              navigation.navigate('ProductDetails', { SNO: id })
            }
            favoriteIcon={(
              <Feather 
                name="heart" 
                size={20} 
                color={COLORS.danger} 
                fill={COLORS.danger}
              />
            )}
          />
        </View>
      ) : (
        <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ ...FONTS.fontRegular, color: colors.text }}>
            No featured products available
          </Text>
          <TouchableOpacity onPress={loadFeaturedProducts} style={{ marginTop: 10 }}>
            <Text style={{ ...FONTS.fontRegular, color: COLORS.primary }}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default BlockbusterDeals;