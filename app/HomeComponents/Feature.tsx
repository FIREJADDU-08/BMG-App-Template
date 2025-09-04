// components/FeaturedNowSection.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { GlobalStyleSheet } from "../constants/StyleSheet";
import { COLORS, FONTS, SIZES } from "../constants/theme";
import { IMAGES } from "../constants/Images";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../Navigations/RootStackParamList";
import { fetchFeaturedProducts } from "../Services/FeatureService";

type FeaturedNowSectionProps = StackScreenProps<RootStackParamList, "Home">;

const FeaturedNowSection = ({ navigation }: FeaturedNowSectionProps) => {
  const { colors, dark } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchFeaturedProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <View style={[styles.sectionWrapper, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[GlobalStyleSheet.container, styles.headerContainer]}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.title }]}>
            Featured Now
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: colors.title }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Scroll */}
        <View style={styles.scrollWrapper}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.productRow}>
                {products.map((product, index) => (
                  <View
                    key={index}
                    style={[
                      styles.productCardWrapper,
                      Platform.OS === "ios" && { backgroundColor: colors.card, borderRadius: 100 },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("ProductDetails", { sno: product.SNO })
                      }
                      style={[styles.productCard, { backgroundColor: colors.card }]}
                    >
                      {/* Product Image */}
                      <Image
                        style={[
                          styles.productImage,
                          { backgroundColor: colors.background },
                        ]}
                        source={product.mainImage}
                      />

                      {/* Product Info */}
                      <View>
                        <Text style={[styles.productName, { color: colors.title }]}>
                          {product.SUBITEMNAME || "Product"}
                        </Text>
                        <View style={styles.priceRow}>
                          <Text style={[styles.price, { color: colors.title }]}>
                            ₹{product.GrandTotal}
                          </Text>
                          {product.MRP && (
                            <Text
                              style={[
                                styles.mrp,
                                { color: dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" },
                              ]}
                            >
                              ₹{product.MRP}
                            </Text>
                          )}
                          <Image style={styles.ratingIcon} source={IMAGES.star4} />
                          <Text
                            style={[
                              styles.reviewText,
                              { color: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" },
                            ]}
                          >
                            (2k Review)
                          </Text>
                        </View>
                        {product.offer && (
                          <Text style={styles.offerText}>{product.offer}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    width: "100%",
  },
  headerContainer: {
    paddingTop: 0,
    marginTop: SIZES.margin / 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...FONTS.Marcellus,
    fontSize: SIZES.h5,
  },
  seeAllText: {
    ...FONTS.fontRegular,
    fontSize: SIZES.fontSm,
  },
  scrollWrapper: {
    marginHorizontal: -SIZES.margin,
  },
  loader: {
    padding: SIZES.padding,
  },
  scrollContent: {
    paddingHorizontal: SIZES.margin,
    paddingBottom: SIZES.padding * 1.2,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  productCardWrapper: {
    shadowColor: "rgba(195,123,95,0.25)",
    shadowOffset: { width: -10, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: SIZES.margin,
    padding: SIZES.padding / 1.5,
    paddingRight: SIZES.padding * 1.2,
    borderRadius: SIZES.radius_lg,
  },
  productImage: {
    width: 75,
    height: 75,
    borderRadius: SIZES.radius_md,
  },
  productName: {
    ...FONTS.Marcellus,
    fontSize: SIZES.fontLg,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  price: {
    ...FONTS.fontSemiBold,
    fontSize: SIZES.fontLg,
  },
  mrp: {
    ...FONTS.fontRegular,
    fontSize: SIZES.fontSm,
    textDecorationLine: "line-through",
    marginRight: 5,
  },
  ratingIcon: {
    height: 12,
    width: 12,
    resizeMode: "contain",
  },
  reviewText: {
    ...FONTS.fontRegular,
    fontSize: SIZES.fontSm,
  },
  offerText: {
    ...FONTS.fontMedium,
    fontSize: SIZES.fontSm,
    color: COLORS.danger,
  },
});

export default FeaturedNowSection;
