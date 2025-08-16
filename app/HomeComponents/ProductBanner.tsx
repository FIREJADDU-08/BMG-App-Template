import React from 'react';
import { View, TouchableOpacity, Image, Platform, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { IMAGES } from '../constants/Images';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';
import Scrolling from '../components/Scrolling';
import SvgcurvedText from '../components/SvgcurvedText';

const SliderData = [
  { image: IMAGES.star3, title: "COUPLE RING" },
  { image: IMAGES.star3, title: "SHORT CHAINS" },
  { image: IMAGES.star3, title: "ANKLETS" },
  { image: IMAGES.star3, title: "EARINGS" },
  { image: IMAGES.star3, title: "BRACELETS" },
  { image: IMAGES.star3, title: "STUDS" },
  { image: IMAGES.star3, title: "BANGLES" },
  { image: IMAGES.star3, title: "PENDANTS" },
  { image: IMAGES.star3, title: "DAILY WEAR" },
];

type BannerWithCategoriesProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

const BannerWithCategories = ({ navigation }: BannerWithCategoriesProps) => {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View style={{ paddingTop: 0, overflow: 'hidden', paddingBottom: 0 }}>
      <View style={[GlobalStyleSheet.container, { padding: 0 }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Products')} style={{ zIndex: 20 }}>
          <Image
            style={{ width: '100%', tintColor: theme.dark ? colors.background : null }}
            source={IMAGES.border}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Products')}>
          <Image
            style={{
              width: '100%',
              height: undefined,
              aspectRatio: 1 / 0.6,
              transform: [{ scale: 1.1 }],
              ...(Platform.OS === 'ios' && { aspectRatio: 1 / 0.5 })
            }}
            source={IMAGES.product5}
          />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', position: 'absolute', left: 0, right: 0, top: 70 }}>
          <View style={{
            height: 85,
            width: 85,
            backgroundColor: theme.dark ? 'rgba(0,0,0, 0.70)' : 'rgba(255, 255, 255, 0.70)',
            borderRadius: 100
          }}>
            <TouchableOpacity onPress={() => navigation.navigate('Products')} style={{ position: 'absolute', top: -56, left: -41 }}>
              <SvgcurvedText small />
            </TouchableOpacity>
          </View>
        </View>

        {Platform.OS === 'android' && (
          <Scrolling endPaddingWidth={'50'} style={{ position: 'absolute', bottom: -40 }}>
            <View
              style={{
                height: 50,
                backgroundColor: colors.card,
                justifyContent: 'center',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 20,
                marginBottom: 40,
                marginTop: 30,
                paddingRight: 20,
              }}
            >
              {SliderData.map((data, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => navigation.navigate('Products', { subItemName: data.title })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 15,
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ fontSize: 18, color: colors.title }}>
                    {data.title}
                  </Text>
                  <Image
                    style={{ width: 16, height: 16, resizeMode: 'contain', tintColor: colors.title }}
                    source={data.image}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Scrolling>
        )}
      </View>
    </View>
  );
};

export default BannerWithCategories;