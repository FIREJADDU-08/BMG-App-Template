import React from 'react';
import { View, TouchableOpacity, Text, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { FONTS, COLORS } from '../constants/theme';
import {IMAGES} from '../constants/Images'
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
  getImageUrl 
}: CartItemsPreviewProps) => {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View style={{ backgroundColor: colors.card, width: '100%', paddingBottom: 10 }}>
      <View style={[GlobalStyleSheet.container, { marginVertical: 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ ...FONTS.Marcellus, fontSize: 20, color: colors.title }}>Items In Your Cart</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyCart')}>
            <Text style={{ ...FONTS.fontMedium, fontSize: 13, color: colors.title }}>View Cart</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : cartProducts.length > 0 ? (
          <>
            {cartProducts.slice(0, 3).map((item, index) => {
              const imageUri = getImageUrl(item.fullDetails?.ImagePath);
              return (
                <TouchableOpacity
                  key={`${item.sno}-${index}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 }}
                  onPress={() => navigation.navigate('ProductDetails', { sno: item.fullDetails?.SNO })}
                >
                  <Image
                    style={{ width: 75, height: 75, borderRadius: 15, borderWidth: 1, borderColor: colors.border }}
                    source={{ uri: imageUri }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...FONTS.fontMedium, fontSize: 14, color: colors.title }}>
                      {item.fullDetails?.ITEMNAME || 'Unknown Product'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                      <Text style={{ ...FONTS.fontSemiBold, fontSize: 16, color: colors.title }}>
                        ₹{parseFloat(item.fullDetails?.GrandTotal || '0').toFixed(2)}
                      </Text>
                      <Image
                        style={{ height: 12, width: 12, resizeMode: 'contain' }}
                        source={IMAGES.star4}
                      />
                      <Text style={{ ...FONTS.fontRegular, fontSize: 12, color: theme.dark ? 'rgba(255,255,255,0.5)' : 'rgba(0, 0, 0, 0.50)' }}>
                        (2k review)
                      </Text>
                    </View>
                    <Text style={{ ...FONTS.fontRegular, fontSize: 14, color: colors.title }}>
                      Quantity:<Text style={{ ...FONTS.fontBold, fontSize: 14 }}> 1</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      height: 40,
                      width: 40,
                      borderRadius: 50,
                      backgroundColor: colors.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => handleRemove(item)}
                  >
                    <Image
                      style={{ height: 18, width: 18, resizeMode: 'contain', tintColor: theme.dark ? COLORS.card : COLORS.title }}
                      source={IMAGES.close}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
            <View style={{ marginTop: 20 }}>
              <Button
                title={`Proceed to checkout (${cartProducts.length})`}
                onPress={() => navigation.navigate('MyCart')}
                btnRounded
                outline={true}
                icon={<Feather size={24} color={colors.card} name={'arrow-right'} />}
                color={colors.card}
                text={COLORS.primary}
              />
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Feather name="shopping-cart" size={30} color={COLORS.primary} />
            <Text style={{ ...FONTS.fontRegular, color: colors.text, marginTop: 10 }}>
              Your cart is empty
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CartItemsPreview;