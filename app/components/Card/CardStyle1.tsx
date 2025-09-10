import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FONTS, COLORS } from '../../constants/theme';
import { useTheme } from '@react-navigation/native';
import { IMAGES } from '../../constants/Images';
import { useDispatch } from 'react-redux';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  addProductToWishList,
  removeProductFromWishList,
} from '../../redux/reducer/wishListReducer';
import {
  addItemToCart,
  removeItemFromCart,
} from '../../redux/reducer/cartReducer';

type Props = {
  id: string;
  title: string;
  price: string | number;
  image?: any;
  discount?: string | number;
  review?: string;
  closebtn?: boolean;
  Cardstyle4?: boolean;
  removelikebtn?: boolean;
  wishlist?: boolean;
  card3?: boolean;
  likebtn?: boolean;
  onPress?: () => void;
  onImageError?: (imageUrl: string) => void;
  wishlistActive?: boolean;
  cartActive?: boolean;
  product: any;
  cartItemId?: string;
};

const CardStyle1 = ({
  id,
  image,
  title,
  price,
  discount,
  review,
  onPress,
  onImageError,
  closebtn,
  removelikebtn,
  likebtn,
  card3,
  Cardstyle4,
  wishlistActive = false,
  cartActive = false,
  product,
  cartItemId,
}: Props) => {
  const theme = useTheme();
  const { colors } = theme;
  const dispatch = useDispatch();

  const FALLBACK_IMAGE = IMAGES.item12;
  const [imageSrc, setImageSrc] = useState(
    typeof image === 'string' ? { uri: image } : image || FALLBACK_IMAGE
  );
  const [imageLoading, setImageLoading] = useState(true);

  // Format price as currency
  const formatPrice = (value: string | number) => {
    if (typeof value === 'number') {
      return `₹${value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      return `₹${numericValue.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return String(value);
  };

  const handleWishlistPress = () => {
    if (wishlistActive) {
      dispatch(removeProductFromWishList(id));
    } else {
      dispatch(addProductToWishList(product));
    }
  };

  const handleCartPress = () => {
    if (cartActive && cartItemId) {
      Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            dispatch(removeItemFromCart(cartItemId));
            Alert.alert('Removed', 'Item removed from cart');
          },
        },
      ]);
    } else {
      dispatch(
        addItemToCart({
          itemTagSno: id,
          imagePath: typeof image === 'string' ? image : '',
          productData: product,
        })
      );
      Alert.alert('Added', 'Item added to cart');
    }
  };

  const handleImageLoadError = () => {
    console.log('Image load error for:', image);
    setImageSrc(FALLBACK_IMAGE);
    setImageLoading(false);
    if (onImageError && typeof image === 'string') {
      onImageError(image);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  

  return (
    <View
      style={[
        styles.cardContainer,
        Platform.OS === 'ios' && {
          backgroundColor: card3 ? undefined : colors.card,
          borderRadius: 20,
        },
        { shadowColor: 'rgba(195, 123, 95, 0.25)' },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.cardTouchable,
          {
            backgroundColor: card3 ? undefined : colors.card,
            alignItems: card3 ? 'center' : undefined,
          },
        ]}
        onPress={onPress}
      >
        {/* Image Container with Loading State */}
        <View
          style={[
            styles.imageContainer,
            {
              backgroundColor: card3 ? colors.card : undefined,
              width: card3 ? 127 : undefined,
              height: card3 ? 127 : Cardstyle4 ? undefined : 170,
              borderRadius: card3 ? 40 : undefined,
            },
          ]}
        >
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          )}
          
          <Image
            style={styles.productImage}
            source={imageSrc}
            onError={handleImageLoadError}
            onLoad={handleImageLoad}
            resizeMode="contain"
          />
        </View>

        {/* Product Info */}
        <View
          style={[
            styles.infoContainer,
            {
              backgroundColor: card3 ? undefined : colors.card,
              alignItems: card3 ? 'center' : undefined,
            },
          ]}
        >
          {title ? (
            <Text
              style={[
                styles.titleText,
                {
                  fontSize: card3 ? 16 : 18,
                  color: colors.title,
                  textAlign: card3 ? 'center' : 'left',
                  paddingRight: card3 ? 0 : 20,
                },
              ]}
              numberOfLines={2}
            >
              {String(title)}
            </Text>
          ) : null}

          {review ? (
            <Text style={styles.reviewText}>{String(review)}</Text>
          ) : null}

          <View
            style={[
              styles.priceContainer,
              Cardstyle4 && styles.priceContainerCard4,
            ]}
          >
            {price ? (
              <Text
                style={[
                  styles.priceText,
                  { fontSize: card3 ? 16 : 18, color: colors.title },
                ]}
              >
                {formatPrice(price)}
              </Text>
            ) : null}

            {discount ? (
              <Text
                style={[
                  styles.discountText,
                  {
                    color: theme.dark
                      ? 'rgba(255,255,255, .4)'
                      : 'rgba(0, 0, 0, 0.40)',
                  },
                ]}
              >
                {formatPrice(discount)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Wishlist Button */}
        {!removelikebtn && !likebtn && (
          <View style={styles.wishlistButtonContainer}>
            <TouchableOpacity style={styles.iconButton} onPress={handleWishlistPress}>
              <Ionicons
                name={wishlistActive ? 'heart' : 'heart-outline'}
                size={20}
                color={wishlistActive ? COLORS.danger : colors.title}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Cart Button */}
        {closebtn && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.cartButtonContainer}
            onPress={handleCartPress}
          >
            <View
              style={[
                styles.cartButton,
                {
                  backgroundColor: cartActive ? COLORS.danger : COLORS.primary,
                },
              ]}
            >
              <Feather
                name={cartActive ? 'trash-2' : 'shopping-cart'}
                size={18}
                color={colors.card}
              />
            </View>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    shadowOffset: { width: 2, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 15,
  },
  cardTouchable: {
    borderRadius: 20,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  productImage: {
    height: undefined,
    width: '100%',
    aspectRatio: 1 / 1,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  infoContainer: {
    padding: 10,
    paddingTop: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  titleText: {
    ...FONTS.Marcellus,
    marginBottom: 4,
  },
  reviewText: {
    ...FONTS.fontXs,
    color: COLORS.gray,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  priceContainerCard4: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
  },
  priceText: {
    ...FONTS.Marcellus,
  },
  discountText: {
    ...FONTS.Marcellus,
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginRight: 5,
  },
  wishlistButtonContainer: {
    position: 'absolute',
    right: 5,
    top: 5,
  },
  iconButton: {
    height: 38,
    width: 38,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  cartButtonContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  cartButton: {
    height: 35,
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 20,
  },
});

export default CardStyle1;