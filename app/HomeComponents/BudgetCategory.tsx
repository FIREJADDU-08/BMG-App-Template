import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { fetchBudgetCategories } from '../Services/BudgetService';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { IMAGES } from '../constants/Images';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BudgetCategoriesScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const { width } = Dimensions.get('window');
  const itemSize = (width - SIZES.padding * 3) / 2;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token from AsyncStorage
        const token = await AsyncStorage.getItem('user_token');
        
        if (!token) {
          setError('Please login to view budget categories');
          setLoading(false);
          return;
        }

        const data = await fetchBudgetCategories(token);
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  const handleImageError = (imageUrl: string) => {
    console.log('Image failed to load:', imageUrl);
    setFailedImages(prev => new Set(prev).add(imageUrl));
  };

  const getWorkingImage = (item: any) => {
    if (failedImages.has(item.image)) {
      return IMAGES.item11; // Fallback image
    }
    return item.image;
  };

  const chunkArray = (array: any[], chunkSize: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  };

  const rows = chunkArray(categories, 2);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text, marginTop: 10 }]}>
          Loading budget categories...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { borderColor: colors.border }]}
          onPress={() => setLoading(true)}
        >
          <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No budget categories found
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Check back later for budget options
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.flexContainer, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.title }]}>Shop by Budget</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Find jewelry within your price range
        </Text>
      </View>

      {/* Categories Grid */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((item) => {
              const workingImage = getWorkingImage(item);
              
              return (
                <TouchableOpacity
                  key={item.id.toString()}
                  style={[
                    styles.card,
                    { 
                      width: itemSize, 
                      height: itemSize, 
                      backgroundColor: colors.card,
                      shadowColor: colors.shadow || COLORS.shadow,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('Products', {
                      initialFilters: { 
                        minGrandTotal: item.min, 
                        maxGrandTotal: item.max 
                      },
                    })
                  }
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: workingImage }}
                      style={styles.image}
                      resizeMode="cover"
                      onError={() => handleImageError(item.image)}
                      defaultSource={IMAGES.item11}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.title }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.text }]} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                    <Text style={[styles.priceRange, { color: colors.primary }]} numberOfLines={1}>
                      ₹{item.min} - ₹{item.max}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {row.length === 1 && <View style={{ width: itemSize }} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  headerContainer: {
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h4,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...FONTS.fontSm,
    textAlign: 'center',
  },
  loadingText: {
    ...FONTS.font,
    textAlign: 'center',
  },
  errorText: {
    ...FONTS.font,
    textAlign: 'center',
    marginBottom: SIZES.margin,
  },
  retryButton: {
    padding: SIZES.paddingSm,
    borderWidth: 1,
    borderRadius: SIZES.radius,
  },
  retryText: {
    ...FONTS.fontBold,
  },
  emptyText: {
    ...FONTS.font,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    ...FONTS.fontSm,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.margin,
  },
  card: {
    borderRadius: SIZES.radius_lg,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: '60%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    height: '40%',
    padding: SIZES.radius_sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...FONTS.fontBold,
    fontSize: SIZES.font,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    ...FONTS.fontSm,
    textAlign: 'center',
    marginBottom: 4,
  },
  priceRange: {
    ...FONTS.fontBold,
    fontSize: SIZES.fontSm,
    textAlign: 'center',
  },
});

export default BudgetCategoriesScreen;