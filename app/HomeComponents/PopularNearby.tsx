import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { COLORS, FONTS } from '../constants/theme';
import { useTheme, useNavigation } from '@react-navigation/native';
import { bannerService } from '../Services/PopularbannerService';

const PopularNearbySection = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bannerService
      .getBanners()
      .then((data) => {
        setBanners(data);
        console.log("✅ Popular page banners fetched successfully:", data.length);
      })
      .catch((err) => {
        console.error('❌ Failed to load banners:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ marginVertical: 20 }}
      />
    );
  }

  return (
    <>
      <View style={{ backgroundColor: colors.background, width: '100%' }}>
        <View
          style={[
            GlobalStyleSheet.container,
            { marginVertical: 10, marginBottom: 5 },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{ ...FONTS.Marcellus, fontSize: 20, color: colors.title }}
            >
              Popular Nearby
            </Text>
          </View>
          <Text
            style={{ ...FONTS.fontRegular, fontSize: 13, color: colors.title }}
          >
            Up to 60% off + up to ₹107 Cash BACK
          </Text>
        </View>
      </View>

      <View
        style={[
          GlobalStyleSheet.container,
          {
            backgroundColor: colors.background,
            paddingVertical: 0,
            marginBottom: 10,
          },
        ]}
      >
        <FlatList
          data={banners}
          horizontal
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const imageUrl = `https://app.bmgjewellers.com${item.image_path}`;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={{ marginRight: 12 }}
                onPress={() =>
                  navigation.navigate('Products', {
                    itemName: item.itemname,
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
                    width: 400,
                    alignItems: 'center',
                    ...(Platform.OS === 'ios' && {
                      backgroundColor: colors.card,
                      borderRadius: 15,
                    }),
                  }}
                >
                  <Image
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 15,
                      resizeMode: 'contain',
                    }}
                    source={{ uri: imageUrl }}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </>
  );
};

export default PopularNearbySection;
