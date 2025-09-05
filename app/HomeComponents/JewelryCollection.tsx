import React, { useEffect, useState, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  StyleSheet,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { FONTS, COLORS, SIZES } from '../constants/theme';
import { getMainCategoryImages } from '../Services/CategoryImageService';
import IMAGES from '../constants/Images';

const { width } = Dimensions.get('screen');

const CARD_WIDTH = 90;
const CARD_MARGIN = SIZES.margin - 5;

const JewelryCollection = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);
      setError(null);
      
      const data = await getMainCategoryImages();
      
      // Filter out categories without names and ensure we have valid image URLs
      const validCategories = data
        .filter(category => category.name && category.name.trim() !== '')
        .map(category => ({
          ...category,
          image: category.image || IMAGES.item13 // Use placeholder if no image
        }));
      
      setCategories(validCategories);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
      console.error('Fetch categories error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = useCallback(() => {
    fetchCategories(true);
  }, [fetchCategories]);

  const handlePress = useCallback((categoryName) => {
    navigation.navigate('Products', { 
      itemName: categoryName,
    });
  }, [navigation]);

  const handleSeeAll = useCallback(() => {
    navigation.navigate('Category', {
      categories: categories,
    });
  }, [navigation, categories]);

  const renderCategoryItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handlePress(item.name)}
      activeOpacity={0.7}
    >
      <View style={[styles.imageContainer, { backgroundColor: colors.card }]}>
        <Image
          source={typeof item.image === 'string' ? { uri: item.image } : item.image}
          style={styles.image}
          resizeMode="contain"
          onError={() => console.warn(`Failed to load image for ${item.name}`)}
        />
      </View>
      <Text 
        style={[styles.categoryName, { color: colors.text }]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  ), [colors, handlePress]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading collections...</Text>
      </View>
    );
  }

  if (error && categories.length === 0) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>⚠️</Text>
        <Text style={[styles.errorMessage, { color: colors.text }]}>
          {error}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: COLORS.primary }]}
          onPress={fetchCategories}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Our Jewelry{"\n"} Collections
        </Text>
        {categories.length > 0 && (
          <TouchableOpacity onPress={handleSeeAll}>
            <Text style={[styles.seeAllText, { color: COLORS.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {categories.slice(0, 6).map((category) => (
          <View key={category.id}>
            {renderCategoryItem({ item: category })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SIZES.padding,
    minHeight: 180,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SIZES.margin,
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: SIZES.margin,
  },
  title: {
    ...FONTS.h3,
    lineHeight: 30,
    flex: 1,
  },
  seeAllText: {
    ...FONTS.fontMedium,
    fontSize: SIZES.font,
  },
  categoryItem: {
    marginRight: CARD_MARGIN,
    alignItems: 'center',
    width: CARD_WIDTH,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: CARD_WIDTH / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  image: {
    width: CARD_WIDTH - 30,
    height: CARD_WIDTH - 30,
  },
  categoryName: {
    ...FONTS.Marcellus,
    fontSize: SIZES.fontSm,
    textAlign: 'center',
    maxWidth: CARD_WIDTH,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    ...FONTS.fontRegular,
    fontSize: SIZES.font,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorMessage: {
    ...FONTS.fontRegular,
    fontSize: SIZES.font,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.radius_lg,
  },
  retryText: {
    color: COLORS.white,
    ...FONTS.fontMedium,
    fontSize: SIZES.font,
  },
});

export default memo(JewelryCollection);