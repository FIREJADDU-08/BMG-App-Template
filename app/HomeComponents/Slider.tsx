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
import { FONTS } from "../constants/theme";

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
        <ActivityIndicator size="large" color="#000" />
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
      console.log("Navigating to Products with:", {
        itemName: item.itemname,
        gender: item.gender,
      });
    }
    // Add additional navigation logic if needed
  };

  return (
    <View style={styles.container}>
      <Carousel
        width={width}
        height={width * 0.5} // 50% aspect ratio
        data={banners}
        loop
        autoPlay
        autoPlayInterval={4000}
        scrollAnimationDuration={1000}
        panGestureHandlerProps={{
          activeOffsetX: [-10, 10], // Better touch responsiveness
        }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handlePress(item)}
            style={styles.slideContainer}
          >
            <Image
              source={{ uri: IMAGE_BASE_URL + item.image_path }}
              style={styles.bannerImage}
              defaultSource={require("../assets/images/item/pic14.png")} // Fallback while loading
              resizeMode="cover"
            />
            {/* Title with better styling and multiline support */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText} numberOfLines={2}>
                {item.title || "BMG Jewellers"}
              </Text>
              {/* {item.subtitle && (
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              )} */}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginHorizontal: 15,
  },
  placeholderText: {
    fontSize: 16,
    color: "#888",
  },
  slideContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  titleContainer: {
    position: "absolute",
    left: 10,
    bottom: 80,
    right: 20,
    // backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    borderRadius: 6,
    maxWidth: "60%",
  },
  titleText: {
    ...FONTS.Marcellus, // Using custom font from your theme
    color: "rgb(128, 128, 0)",
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    alignSelf: "flex-start",
  },
  subtitleText: {
    ...FONTS.fontRegular, // Using custom font from your theme
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});