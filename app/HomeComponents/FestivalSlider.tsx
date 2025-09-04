import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getFestivalBanners } from "../Services/FestivalService";
import { COLORS, FONTS, SIZES } from "../constants/theme";

const { width } = Dimensions.get("window");
const IMAGE_BASE_URL = "https://app.bmgjewellers.com";

const FestivalSlider = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFestivalBanners();
      setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
      setError("Failed to load festival banners. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.errorText, { color: COLORS.danger }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBanners}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!banners.length) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.title }]}>Festival Collection</Text>

      <Carousel
        width={width}
        height={250}
        data={banners}
        autoPlay
        loop
        autoPlayInterval={3000}
        scrollAnimationDuration={1000}
        onSnapToItem={(index) => setActiveIndex(index)}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("Products", {
                itemName: item.item_name,
                subItemName: item.sub_item_name,
              })
            }
            style={styles.slide}
          >
            <Image
              source={{ uri: IMAGE_BASE_URL + item.image_path }}
              style={styles.image}
            />
            {item.sub_item_name && (
              <View style={styles.textContainer}>
                <Text style={styles.slideTitle}>{item.sub_item_name}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Pagination */}
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.margin,
    position: "relative",
  },
  title: {
    ...FONTS.h3,
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.margin / 2,
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: SIZES.padding,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    padding: SIZES.padding,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.radius_sm,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  slide: {
    borderRadius: SIZES.radius_md,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: SIZES.radius_md,
    resizeMode: "cover",
  },
  textContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderBottomLeftRadius: SIZES.radius_md,
    borderBottomRightRadius: SIZES.radius_md,
  },
  slideTitle: {
    color: COLORS.white,
    fontSize: SIZES.fontLg,
    fontWeight: "bold",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 12,
  },
  inactiveDot: {
    backgroundColor: COLORS.gray,
  },
});

export default FestivalSlider;
