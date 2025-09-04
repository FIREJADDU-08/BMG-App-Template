import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  Text,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Carousel from "react-native-reanimated-carousel";
import { getBanners } from "../Services/BannerService";
import appTheme from "../constants/theme";

const { COLORS, FONTS, SIZES } = appTheme;
const { width } = Dimensions.get("window");
const IMAGE_BASE_URL = "https://app.bmgjewellers.com"; // root domain for images

export default function BannerSlider() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    (async () => {
      try {
        const data = await getBanners();
        setBanners(data);
      } catch (error) {
        console.error("Failed to load banners:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!loading && banners.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>No banners available</Text>
      </View>
    );
  }

  const handlePress = (item: any) => {
    if (item.itemname && item.gender) {
      navigation.navigate("Products", {
        itemName: item.itemname,
        gender: item.gender,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Carousel
        width={width}
        height={width * 0.5}
        data={banners}
        loop
        autoPlay
        autoPlayInterval={4000}
        scrollAnimationDuration={1000}
        panGestureHandlerProps={{
          activeOffsetX: [-10, 10],
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handlePress(item)}
            style={styles.slideContainer}
          >
            <Image
              source={{ uri: IMAGE_BASE_URL + item.image_path }}
              style={styles.bannerImage}
              defaultSource={require("../assets/images/item/pic14.png")}
              resizeMode="cover"
            />
            <View style={styles.titleContainer}>
              <Text style={styles.titleText} numberOfLines={2}>
                {item.title || "BMG Jewellers"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.margin,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    height: width * 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderContainer: {
    height: width * 0.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.margin,
  },
  placeholderText: {
    ...FONTS.font,
    color: COLORS.textLight,
  },
  slideContainer: {
    position: "relative",
    borderRadius: SIZES.radius,
    overflow: "hidden",
    marginHorizontal: SIZES.margin / 2,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: SIZES.radius,
  },
  titleContainer: {
    position: "absolute",
    left: SIZES.padding,
    bottom: 80,
    right: SIZES.padding,
    padding: SIZES.padding / 2,
    borderRadius: SIZES.radius,
    maxWidth: "60%",
  },
  titleText: {
    ...FONTS.Marcellus,
    color: COLORS.primary,
    fontSize: 22,
    lineHeight: 26,
    textShadowColor: COLORS.black,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
