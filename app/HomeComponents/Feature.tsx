// components/FeaturedNowSection.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Platform, ActivityIndicator } from "react-native";
import { GlobalStyleSheet } from "../constants/StyleSheet";
import { COLORS, FONTS } from "../constants/theme";
import { IMAGES } from "../constants/Images";
import { useTheme } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../Navigations/RootStackParamList";
import { fetchFeaturedProducts } from "../Services/FeatureService"; // ✅ your new service

type FeaturedNowSectionProps = StackScreenProps<RootStackParamList, "Home">;

const adsData = [
  { image: IMAGES.ads4 },
  { image: IMAGES.ads5 },
  { image: IMAGES.ads4 },
  { image: IMAGES.ads5 },
];

const FeaturedNowSection = ({ navigation }: FeaturedNowSectionProps) => {
  const theme = useTheme();
  const { colors } = theme;

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
    <View style={{ backgroundColor: colors.background, width: "100%" }}>
      {/* Featured Now */}
      <View style={[GlobalStyleSheet.container, { paddingTop: 0, marginTop: 10 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ ...FONTS.Marcellus, fontSize: 20, color: colors.title }}>Featured Now</Text>
          <TouchableOpacity>
            <Text style={{ ...FONTS.fontRegular, fontSize: 13, color: colors.title }}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginHorizontal: -15 }}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 20 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 25 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {products.map((product, index) => (
                  <View
                    key={index}
                    style={{
                      shadowColor: "rgba(195, 123, 95, 0.25)",
                      shadowOffset: { width: -10, height: 20 },
                      shadowOpacity: 0.1,
                      shadowRadius: 5,
                      ...(Platform.OS === "ios" && { backgroundColor: colors.card, borderRadius: 100 }),
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => navigation.navigate("ProductDetails", { sno: product.SNO })}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 20,
                        backgroundColor: colors.card,
                        padding: 10,
                        borderRadius: 20,
                        paddingRight: 20,
                      }}
                    >
                      <Image
                        style={{ width: 75, height: 75, borderRadius: 15, backgroundColor: colors.background }}
                        source={product.mainImage}
                      />
                      <View>
                        <Text style={{ ...FONTS.Marcellus, fontSize: 16, color: colors.title }}>
                          {product.SUBITEMNAME || "Product"}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
                          <Text style={{ ...FONTS.fontSemiBold, fontSize: 16, color: colors.title }}>
                            ₹{product.GrandTotal}
                          </Text>
                          {product.MRP && (
                            <Text
                              style={{
                                ...FONTS.fontRegular,
                                fontSize: 13,
                                textDecorationLine: "line-through",
                                textDecorationColor: "rgba(0, 0, 0, 0.70)",
                                color: theme.dark
                                  ? "rgba(255,255,255,0.7)"
                                  : "rgba(0, 0, 0, 0.70)",
                                marginRight: 5,
                              }}
                            >
                              ₹{product.MRP}
                            </Text>
                          )}
                          <Image style={{ height: 12, width: 12, resizeMode: "contain" }} source={IMAGES.star4} />
                          <Text
                            style={{
                              ...FONTS.fontRegular,
                              fontSize: 12,
                              color: theme.dark ? "rgba(255,255,255,0.5)" : "rgba(0, 0, 0, 0.50)",
                            }}
                          >
                            (2k Review)
                          </Text>
                        </View>
                        {product.offer && (
                          <Text style={{ ...FONTS.fontMedium, fontSize: 13, color: COLORS.danger }}>
                            {product.offer}
                          </Text>
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

      {/* Featured Offers */}
      <View style={[GlobalStyleSheet.container, { marginTop: 0, paddingTop: 0, paddingBottom: 0 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ ...FONTS.Marcellus, fontSize: 20, color: colors.title }}>Featured Offer For You</Text>
          <TouchableOpacity>
            <Text style={{ ...FONTS.fontRegular, fontSize: 13, color: colors.title }}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginHorizontal: -15, marginTop: 20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 15 }}
          >
            {adsData.map((data, index) => (
              <View
                key={index}
                style={{
                  shadowColor: "rgba(195, 123, 95, 0.25)",
                  shadowOffset: { width: 2, height: 15 },
                  shadowOpacity: 0.2,
                  shadowRadius: 5,
                }}
              >
                <TouchableOpacity
                  style={{ marginRight: 15, marginBottom: 10 }}
                  onPress={() => navigation.navigate("Coupons")}
                >
                  <Image style={{ width: 250, height: 105, borderRadius: 15 }} source={data.image} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default FeaturedNowSection;
