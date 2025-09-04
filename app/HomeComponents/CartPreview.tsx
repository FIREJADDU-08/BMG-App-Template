import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { FONTS, COLORS, SIZES } from '../constants/theme';
import { IMAGES } from '../constants/Images';
import Button from '../components/Button/Button';
import { Feather } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';

type CartItem = {
  sno: string;
  fullDetails?: {
    SNO: string;
    ITEMNAME: string;
    GrandTotal: string;
    ImagePath: string;
  };
};

type CartItemsPreviewProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
  loading: boolean;
  cartProducts: CartItem[];
  handleRemove: (item: CartItem) => void;
  getImageUrl: (imagePath?: string) => string;
};

const CartItemsPreview = ({
  navigation,
  loading,
  cartProducts,
  handleRemove,
  getImageUrl,
}: CartItemsPreviewProps) => {
  const { colors, dark } = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card }]}>
      <View style={[GlobalStyleSheet.container, styles.innerContainer]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.title }]}>
            Items In Your Cart
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyCart')}>
            <Text style={[styles.viewCart, { color: colors.title }]}>
              View Cart
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loader */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : cartProducts.length > 0 ? (
          <>
            {/* Cart Items */}
            {cartProducts.slice(0, 3).map((item, index) => {
              const imageUri = getImageUrl(item.fullDetails?.ImagePath);
              return (
                <TouchableOpacity
                  key={`${item.sno}-${index}`}
                  style={styles.cartItem}
                  onPress={() =>
                    navigation.navigate('ProductDetails', {
                      sno: item.fullDetails?.SNO,
                    })
                  }
                >
                  {/* Product Image */}
                  <Image
                    style={[
                      styles.productImage,
                      { borderColor: colors.border },
                    ]}
                    source={{ uri: imageUri }}
                  />

                  {/* Product Details */}
                  <View style={styles.productInfo}>
                    <Text
                      style={[styles.productName, { color: colors.title }]}
                      numberOfLines={1}
                    >
                      {item.fullDetails?.ITEMNAME || 'Unknown Product'}
                    </Text>

                    <View style={styles.ratingRow}>
                      <Text
                        style={[styles.price, { color: colors.title }]}
                      >
                        ₹
                        {parseFloat(item.fullDetails?.GrandTotal || '0').toFixed(
                          2
                        )}
                      </Text>
                      <Image
                        style={styles.ratingIcon}
                        source={IMAGES.star4}
                      />
                      <Text
                        style={[
                          styles.reviewText,
                          { color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
                        ]}
                      >
                        (2k review)
                      </Text>
                    </View>

                    <Text
                      style={[styles.quantity, { color: colors.title }]}
                    >
                      Quantity: <Text style={styles.quantityValue}>1</Text>
                    </Text>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: colors.background }]}
                    onPress={() => handleRemove(item)}
                  >
                    <Image
                      style={[
                        styles.removeIcon,
                        { tintColor: dark ? COLORS.card : COLORS.title },
                      ]}
                      source={IMAGES.close}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {/* Checkout Button */}
            <View style={styles.checkoutBtn}>
              <Button
                title={`Proceed to checkout (${cartProducts.length})`}
                onPress={() => navigation.navigate('MyCart')}
                btnRounded
                outline
                icon={<Feather size={24} color={colors.card} name="arrow-right" />}
                color={colors.card}
                text={COLORS.primary}
              />
            </View>
          </>
        ) : (
          /* Empty State */
          <View style={styles.centerContent}>
            <Feather name="shopping-cart" size={30} color={COLORS.primary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Your cart is empty
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingBottom: SIZES.padding / 2,
  },
  innerContainer: {
    marginVertical: SIZES.margin / 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...FONTS.Marcellus,
    fontSize: SIZES.h5,
  },
  viewCart: {
    ...FONTS.fontMedium,
    fontSize: SIZES.fontSm,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: SIZES.margin,
  },
  productImage: {
    width: 75,
    height: 75,
    borderRadius: SIZES.radius_md,
    borderWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...FONTS.fontMedium,
    fontSize: SIZES.font,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  price: {
    ...FONTS.fontSemiBold,
    fontSize: SIZES.fontLg,
  },
  ratingIcon: {
    height: 12,
    width: 12,
    resizeMode: 'contain',
  },
  reviewText: {
    ...FONTS.fontRegular,
    fontSize: SIZES.fontSm,
  },
  quantity: {
    ...FONTS.fontRegular,
    fontSize: SIZES.font,
    marginTop: 2,
  },
  quantityValue: {
    ...FONTS.fontBold,
    fontSize: SIZES.font,
  },
  removeBtn: {
    height: 40,
    width: 40,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    height: 18,
    width: 18,
    resizeMode: 'contain',
  },
  checkoutBtn: {
    marginTop: SIZES.margin,
  },
  emptyText: {
    ...FONTS.fontRegular,
    marginTop: SIZES.margin / 2,
  },
});

export default CartItemsPreview;
