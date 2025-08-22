import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ImageSourcePropType,
  Dimensions,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { GlobalStyleSheet } from "../constants/StyleSheet";
import { FONTS, COLORS } from "../constants/theme";
import CardStyle1 from "../components/Card/CardStyle1";
import Button from "../components/Button/Button";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../../Navigations/RootStackParamList";
import { fetchBestDesignProducts } from "../Services/BestDesignService";
import { IMAGES } from "../constants/Images";

const { width } = Dimensions.get("window");

type BestDesignsPageProps = StackScreenProps<
  RootStackParamList,
  "BestDesignsPage"
>;

const BestDesignsPage = ({ navigation }: BestDesignsPageProps) => {
  const { colors } = useTheme();

  const [bestDesignProducts, setBestDesignProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBestDesignProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const products = await fetchBestDesignProducts();
      const validProducts = products.filter((p) => p.mainImage && p.GrossAmount);
      setBestDesignProducts(validProducts);

      // ✅ Only console here: show fetched count
      console.log(`✅ Best Designs fetched: ${validProducts.length} items`);
    } catch (err) {
      console.error("❌ Error loading best design products:", err);
      setError("Failed to load best design products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBestDesignProducts();
  }, [loadBestDesignProducts]);

  const fallbackImage: ImageSourcePropType = IMAGES.item11;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[GlobalStyleSheet.container, { paddingVertical: 20 }]}>
        <View style={styles.header}>
          <Text style={{ ...FONTS.Marcellus, fontSize: 24, color: colors.title }}>
            Best Designs
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={{ ...FONTS.fontRegular, color: colors.text }}>
              {error}
            </Text>
            <Button
              title="Try Again"
              onPress={loadBestDesignProducts}
              color={COLORS.primary}
              btnRounded
              style={{ marginTop: 15, width: 150 }}
            />
          </View>
        ) : bestDesignProducts.length > 0 ? (
          <View style={styles.gridContainer}>
            {Array.from({ length: Math.ceil(bestDesignProducts.length / 4) }).map(
              (_, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.row}>
                  {bestDesignProducts
                    .slice(rowIndex * 4, rowIndex * 4 + 4)
                    .map((product, index) => {
                      const price = Number(product?.GrandTotal) || 0;
                      const discountPrice = price ? price * 1.1 : 0;

                      return (
                        <View
                          key={`${product.SNO}-${index}`}
                          style={styles.cardWrapper}
                        >
                          <CardStyle1
                            id={product.SNO}
                            image={
                              product.mainImage
                                ? { uri: product.mainImage }
                                : fallbackImage
                            }
                            title={product.SUBITEMNAME || "Jewelry Item"}
                            price={`₹${price.toFixed(2)}`}
                            discount={`₹${discountPrice.toFixed(2)}`}
                            onPress={() =>
                              navigation.navigate("ProductDetails", {
                                sno: product.SNO,
                              })
                            }
                            onPress1={() => {}} // Removed console log
                            onPress2={() => {}} // Removed console log
                            closebtn
                          />
                        </View>
                      );
                    })}
                </View>
              )
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ ...FONTS.fontRegular, color: colors.text }}>
              No best design products available
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  gridContainer: {
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 15,
  },
});

export default BestDesignsPage;
