import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, Image,Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { IMAGES } from '../constants/Images';
import { FONTS, COLORS } from '../constants/theme';

const SponsoredData = [
  {
    image: IMAGES.item40,
    title: "Pearl Cluster\nRing",
    price: "$80",
    discount: "$89",
    offer: "Min. 30% Off"
  },
  {
    image: IMAGES.item39,
    title: "Topaz\nSolitaire Ring",
    price: "$80",
    discount: "$89",
    offer: "Min. 50% Off"
  },
  {
    image: IMAGES.item40,
    title: "Pearl Cluster\nRing",
    price: "$80",
    discount: "$89",
    offer: "Min. 30% Off"
  },
];

const SponsoredProducts = () => {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View style={{ backgroundColor: colors.background, width: '100%' }}>
      <View style={[GlobalStyleSheet.container, { paddingBottom: 5 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ ...FONTS.Marcellus, fontSize: 20, color: colors.title }}>Sponsored</Text>
          <TouchableOpacity>
            <Text style={{ ...FONTS.fontRegular, fontSize: 13, color: colors.title }}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginHorizontal: -15, marginTop: 20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              {SponsoredData.map((data, index) => (
                <View
                  key={index}
                  style={{
                    shadowColor: 'rgba(195, 123, 95, 0.25)',
                    shadowOffset: { width: -10, height: 20 },
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    ...(Platform.OS === 'ios' && { backgroundColor: colors.card, borderRadius: 100 }),
                  }}
                >
                  <View style={{ backgroundColor: colors.card, height: 138, padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...FONTS.Marcellus, fontSize: 16, color: colors.title }}>{data.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                        <Text style={{ ...FONTS.Marcellus, fontSize: 16, color: colors.title }}>{data.price}</Text>
                        <Text
                          style={{
                            ...FONTS.Marcellus,
                            fontSize: 13,
                            textDecorationLine: 'line-through',
                            color: theme.dark ? 'rgba(255,255,255,0.4)' : 'rgba(0, 0, 0, 0.40)',
                            marginRight: 5,
                          }}
                        >
                          {data.discount}
                        </Text>
                      </View>
                      <Text style={{ ...FONTS.fontSemiBold, fontSize: 13, color: COLORS.success, marginTop: 8 }}>{data.offer}</Text>
                    </View>
                    <View>
                      <Image
                        style={{ height: 100, width: 100, resizeMode: 'contain' }}
                        source={data.image}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default SponsoredProducts;