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
import { getOccasionBanners } from "../Services/OccasionService";
import { FONTS } from "../constants/theme";

const { width } = Dimensions.get("window");
const IMAGE_BASE_URL = "https://app.bmgjewellers.com";

export default function BannerSlider() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigation = useNavigation<any>();

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data = await getOccasionBanners();
                setBanners(data || []);
            } catch (error) {
                console.error("Failed to load banners:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

// In BannerSlider's handlePress
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={styles.loadingText}>Loading occasions...</Text>
            </View>
        );
    }

    if (!loading && banners.length === 0) {
        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No occasions available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.headerContainer}>
                <Text style={styles.sectionTitle}>Shop by Occasion</Text>
                <Text style={styles.sectionSubtitle}>
                    Find perfect jewelry for every special moment
                </Text>
            </View>

            {/* Enhanced Carousel */}
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
                                ]
                            }
                        ]}
                    >
                        {/* Main Image */}
                        <Image
                            source={{ uri: IMAGE_BASE_URL + item.image_path }}
                            style={styles.bannerImage}
                            defaultSource={require("../assets/images/item/pic14.png")}
                            resizeMode="cover"
                        />

                        {/* Gradient Overlay */}
                        <View style={styles.gradientOverlay} />

                        {/* Content Container */}
                        <View style={styles.contentContainer}>
                            {/* Title and Subtitle */}
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

                        {/* Corner Decoration */}
                        <View style={styles.cornerDecoration} />
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
                                backgroundColor: index === currentIndex ? "#D4AF37" : "rgba(212, 175, 55, 0.3)",
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
        color: "#000000ff",
        textAlign: "center",
        marginBottom: 4,
    },
    sectionSubtitle: {
        ...FONTS.fontRegular,
        fontSize: 14,
        color: "#666",
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
        backgroundColor: "#f9f9f9",
        marginHorizontal: 16,
        borderRadius: 12,
    },
    loadingText: {
        ...FONTS.fontRegular,
        fontSize: 14,
        color: "#666",
        marginTop: 8,
    },
    placeholderContainer: {
        height: width * 0.55,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 12,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderStyle: "dashed",
    },
    placeholderText: {
        ...FONTS.fontRegular,
        fontSize: 16,
        color: "#999",
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
    //   gradientOverlay: {
    //     position: "absolute",
    //     bottom: 0,
    //     left: 0,
    //     right: 0,
    //     height: "60%",
    //     backgroundColor: "transparent",
    //     background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)",
    //     // For React Native, we'll use a semi-transparent overlay
    //     backgroundColor: "rgba(0, 0, 0, 0.4)",
    //   },
    contentContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: 16,
    },
    occasionBadge: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(212, 175, 55, 0.9)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    occasionBadgeText: {
        ...FONTS.fontRegular,
        fontSize: 10,
        fontWeight: "700",
        color: "#000",
        letterSpacing: 1,
    },
    textContainer: {
        maxWidth: "75%",
    },
    titleText: {
        ...FONTS.Marcellus,
        color: "#080808ff",
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
        color: "rgba(49, 46, 46, 0.9)",
        fontSize: 14,
        lineHeight: 18,
        marginBottom: 72,
        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    ctaContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
        alignSelf: "flex-start",
    },
    ctaText: {
        ...FONTS.fontRegular,
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "600",
        marginRight: 4,
    },
    ctaArrow: {
        color: "#D4AF37",
        fontSize: 14,
        fontWeight: "bold",
    },
    cornerDecoration: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderColor: "#D4AF37",
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
        backgroundColor: "rgba(212, 175, 55, 0.3)",
    },
});