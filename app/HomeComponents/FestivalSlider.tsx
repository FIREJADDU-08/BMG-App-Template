import React, { useEffect, useState } from "react";
import { 
  View, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  Text, 
  StyleSheet 
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useNavigation } from "@react-navigation/native";
import { getFestivalBanners } from "../Services/FestivalService";
import { COLORS, FONTS } from "../constants/theme";

const { width } = Dimensions.get("window");
const IMAGE_BASE_URL = "https://app.bmgjewellers.com";

const FestivalSlider = () => {
  const navigation = useNavigation<any>();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#999" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBanners}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!banners.length) {
    return null; // Don't render anything if no banners
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Festival Collection</Text>
      
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
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.8}
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
      
      {/* Pagination indicators */}
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex ? styles.activeDot : styles.inactiveDot
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    position: 'relative',
    backgroundColor: 'white',
  },
  title: {
    ...FONTS.h3,
    paddingHorizontal: 20,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    padding: 20,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  slide: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    resizeMode: "cover",
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  slideTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#ccc',
  },
});

export default FestivalSlider;