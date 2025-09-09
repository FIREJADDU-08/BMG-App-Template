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
import { useNavigation, useTheme } from "@react-navigation/native";
import Carousel from "react-native-reanimated-carousel";
import { getOccasionBanners } from "../Services/OccasionService";
import { FONTS, COLORS } from "../constants/theme";

const { width } = Dimensions.get("window");

export default function BannerSlider() {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigation = useNavigation<any>();
    const { colors } = useTheme();

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data = await getOccasionBanners();
                setBanners(data || []);
            } catch (error) {
                console.error("Failed to load banners:", error);
                // Set empty array instead of throwing to prevent app crash
                setBanners([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    const handlePress = (item: any) => {
        if (item.occasion && item.gender) {
            const params = {
                occasion: item.occasion,
                gender: item.gender,
            };
            console.log("Navigating to Products with:", params);
            navigation.navigate("Products", params);
        }
    };

    // Handle image loading errors
    const handleImageError = (item: any, index: number) => {
        console.log("Image failed to load:", item.image_path);
        // You could set a fallback image here if needed
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading occasions...
                </Text>
            </View>
        );
    }

    if (!loading && banners.length === 0) {
        return (
            <View
                style={[
                    styles.placeholderContainer,
                    { backgroundColor: colors.card, borderColor: colors.border },
                ]}
            >
                <Text style={[styles.placeholderText, { color: colors.text }]}>
                    No occasions available
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.headerContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Shop by Occasion
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary || COLORS.textLight }]}>
                    Find perfect jewelry for every special moment
                </Text>
            </View>

            {/* Carousel */}
            <Carousel
                width={width - 32}
                height={width * 0.55}
                data={banners}
                loop
                autoPlay
                autoPlayInterval={5000}
                scrollAnimationDuration={800}
                onSnapToItem={(index) => setCurrentIndex(index)}
                style={styles.carousel}
                panGestureHandlerProps={{
                    activeOffsetX: [-15, 15],
                }}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handlePress(item)}
                        style={[
                            styles.slideContainer,
                            {
                                transform: [
                                    { scale: index === currentIndex ? 1 : 0.95 }
                                ],
                                backgroundColor: colors.card,
                            }
                        ]}
                    >
                        <Image
                            source={{ uri: item.image_path }}
                            style={styles.bannerImage}
                            defaultSource={require("../assets/images/item/pic14.png")}
                            resizeMode="cover"
                            onError={() => handleImageError(item, index)}
                        />
                        <View style={styles.gradientOverlay} />
                        <View style={styles.contentContainer}>
                            <View style={styles.textContainer}>
                                <Text style={styles.titleText} numberOfLines={2}>
                                    {item.title || "Exquisite Jewelry Collection"}
                                </Text>
                                {item.subtitle && (
                                    <Text style={styles.subtitleText} numberOfLines={1}>
                                        {item.subtitle}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={[styles.cornerDecoration, { borderColor: COLORS.primary }]} />
                    </TouchableOpacity>
                )}
            />

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
                {banners.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            {
                                backgroundColor:
                                    index === currentIndex
                                        ? COLORS.primary
                                        : `${COLORS.primary}50`,
                                width: index === currentIndex ? 24 : 8,
                            }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
    },
    headerContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
        alignItems: "center",
    },
    sectionTitle: {
        ...FONTS.Marcellus,
        fontSize: 26,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 4,
    },
    sectionSubtitle: {
        ...FONTS.fontRegular,
        fontSize: 14,
        textAlign: "center",
        fontStyle: "italic",
    },
    carousel: {
        alignSelf: "center",
    },
    loadingContainer: {
        height: width * 0.55,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 16,
        borderRadius: 12,
    },
    loadingText: {
        ...FONTS.fontRegular,
        fontSize: 14,
        marginTop: 8,
    },
    placeholderContainer: {
        height: width * 0.55,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
        marginHorizontal: 16,
        borderWidth: 1,
        borderStyle: "dashed",
    },
    placeholderText: {
        ...FONTS.fontRegular,
        fontSize: 16,
    },
    slideContainer: {
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        marginHorizontal: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    bannerImage: {
        width: "100%",
        height: "100%",
        borderRadius: 12,
    },
    contentContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: 16,
    },
    textContainer: {
        maxWidth: "75%",
    },
    titleText: {
        ...FONTS.Marcellus,
        color: COLORS.white,
        fontSize: 24,
        lineHeight: 28,
        fontWeight: "600",
        marginBottom: 6,
        textShadowColor: "rgba(0,0,0,0.8)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitleText: {
        ...FONTS.fontRegular,
        color: COLORS.white,
        fontSize: 14,
        lineHeight: 18,
        marginBottom: 72,
        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    cornerDecoration: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 8,
    },
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        paddingHorizontal: 16,
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
    },
});