import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Platform, 
  Animated, 
  useWindowDimensions,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { COLORS, FONTS } from '../constants/theme';
import { IMAGES } from '../constants/Images';
import SvgcurvedText from '../components/SvgcurvedText';
import ImageSwiper from '../components/ImageSwiper';
import { categoryService, CategoryBanner } from '../Services/CategoryBannerService';

const NaturalBeautySection = () => {
  const theme = useTheme();
  const { colors } = theme;
  const [banners, setBanners] = useState<CategoryBanner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const SIZE = width * 0.6;
  const SPACER = (width - SIZE) / 2;

  const fetchBanners = useCallback(async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);
      setError(null);
      
      const data = await categoryService.getCategoryBanners();
      
      // Filter out invalid banners
      const validBanners = data.filter(banner => 
        banner.image_path && banner.title
      );
      
      setBanners(validBanners);
      
      // Fade in animation when data loads
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError('Failed to load banners. Please try again.');
      setBanners([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    fetchBanners();

    // Shimmer animation for skeleton loader
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim, fetchBanners]);

  const onRefresh = useCallback(() => {
    fetchBanners(true);
  }, [fetchBanners]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const shimmerTranslateSwiper = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIZE, SIZE],
  });

  // Skeleton Loader for ImageSwiper
  const SkeletonLoader = memo(() => {
    const skeletonData = [
      { key: 'space-left' },
      { key: 'card-1' },
      { key: 'card-2' },
      { key: 'card-3' },
      { key: 'space-right' },
    ];

    return (
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        snapToInterval={SIZE}
        decelerationRate="fast"
      >
        {skeletonData.map((item, index) => {
          if (item.key.includes('space')) {
            return <View key={index} style={{ width: SPACER }} />;
          }

          return (
            <View key={index} style={{ width: SIZE, alignItems: 'center' }}>
              <View style={{ 
                height: 300, 
                width: 218, 
                backgroundColor: colors.card, 
                borderRadius: 340, 
                justifyContent: 'center', 
                alignItems: 'center', 
                overflow: 'hidden' 
              }}>
                <View style={{ 
                  height: 281, 
                  width: 198, 
                  backgroundColor: colors.border, 
                  borderRadius: 340 
                }} />
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: [{ translateX: shimmerTranslateSwiper }],
                  }}
                />
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>
    );
  });

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]}>
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  transform: [{ translateX: shimmerTranslate }],
                }}
              />
            </View>
          </View>
          <View style={styles.imageContainer}>
            <View style={[styles.skeletonCircle, { backgroundColor: colors.border }]}>
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  transform: [{ translateX: shimmerTranslate }],
                }}
              />
            </View>
          </View>
        </View>
      );
    }

    if (error && banners.length === 0) {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.title }]}>
              The Natural{"\n"}Beauty Of A Jewelry{"\n"}Collection
            </Text>
          </View>
          <View style={styles.imageContainer}>
            <View
              style={[
                styles.circleBackground,
                {
                  shadowColor: 'rgba(195, 123, 95, 0.15)',
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                  ...(Platform.OS === 'ios' && { backgroundColor: colors.card, borderRadius: 100 }),
                }
              ]}
            >
              <View style={[styles.circle, { backgroundColor: colors.card }]}>
                <View style={styles.svgContainer}>
                  <SvgcurvedText small={undefined} />
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.title }]}>
              The Natural{"\n"}Beauty Of A Jewelry{"\n"}Collection
            </Text>
          </View>
          <View style={styles.imageContainer}>
            <View
              style={[
                styles.circleBackground,
                {
                  shadowColor: 'rgba(195, 123, 95, 0.15)',
                  shadowOffset: { width: 2, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                  ...(Platform.OS === 'ios' && { backgroundColor: colors.card, borderRadius: 100 }),
                }
              ]}
            >
              <View style={[styles.circle, { backgroundColor: colors.card }]}>
                <View style={styles.svgContainer}>
                  <SvgcurvedText small={undefined} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderContent()}
      
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <View style={[styles.swiperContainer, { padding: 0 }]}>
          {loading && !refreshing ? (
            <SkeletonLoader />
          ) : banners.length > 0 ? (
            <ImageSwiper
              data={banners.map((banner) => ({
                image: { uri: banner.image_path },
                itemName: banner.itemName,
                subItemName: banner.subItemName,
                title: banner.title,
                subtitle: banner.subtitle,
              }))}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ ...FONTS.fontRegular, color: colors.text, marginBottom: 10 }}>
                No banners available
              </Text>
              {error && (
                <Text style={{ ...FONTS.fontRegular, color: COLORS.danger, marginBottom: 15, textAlign: 'center' }}>
                  {error}
                </Text>
              )}
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => fetchBanners()}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }}>
          <Image source={IMAGES.border1} style={styles.borderImage} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    marginTop: 20,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...FONTS.Marcellus,
    fontSize: 24,
    lineHeight: 33,
  },
  skeletonTitle: {
    height: 80,
    width: '80%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    marginRight: 20,
  },
  circleBackground: {
    height: 110,
    width: 110,
    borderRadius: 100,
  },
  circle: {
    height: '100%',
    width: '100%',
    borderRadius: 100,
  },
  skeletonCircle: {
    height: 110,
    width: 110,
    borderRadius: 100,
    overflow: 'hidden',
  },
  svgContainer: {
    position: 'absolute',
    top: -44,
    right: -12,
  },
  swiperContainer: {
    width: '100%',
  },
  borderImage: {
    resizeMode: 'contain',
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    ...FONTS.fontMedium,
    fontSize: 14,
  },
});

export default memo(NaturalBeautySection);