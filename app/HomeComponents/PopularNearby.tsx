import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { COLORS, FONTS } from '../constants/theme';
import { IMAGES } from '../constants/Images';
import { useTheme, useNavigation } from '@react-navigation/native';

const PopularNearbySection = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();

  return (
    <>
      <View style={{ backgroundColor: colors.background, width: '100%' }}>
        <View style={[GlobalStyleSheet.container, { marginVertical: 10, marginBottom: 5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ ...FONTS.Marcellus, fontSize: 20, color: colors.title }}>Popular Nearby</Text>
          </View>
          <Text style={{ ...FONTS.fontRegular, fontSize: 13, color: colors.title }}>
            Up to 60% off + up to $107 Cash BACK
          </Text>
        </View>
      </View>

      <View
        style={[
          GlobalStyleSheet.container,
          { backgroundColor: colors.background, paddingVertical: 0, marginBottom: 10 },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('Products', {
              itemName: 'EARRINGS',
              subItemName: '',
              initialFilters: {},
            })
          }
        >
          <View
            style={{
              shadowColor: 'rgba(195, 123, 95, 0.25)',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
              width: '100%',
              ...(Platform.OS === 'ios' && { backgroundColor: colors.card, borderRadius: 50 }),
            }}
          >
            <Image
              style={{ width: '100%', borderRadius: 15, height: 150 }}
              source={IMAGES.ads1}
            />
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default PopularNearbySection;
