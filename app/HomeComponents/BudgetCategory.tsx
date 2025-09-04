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

const BudgetCategoriesScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { width } = Dimensions.get('window');
  const itemSize = (width - SIZES.padding * 3) / 2;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchBudgetCategories('yourAuthToken');
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

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
      <View style={[GlobalStyleSheet.flexCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[GlobalStyleSheet.flexCenter, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={[GlobalStyleSheet.flexCenter, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>No categories found</Text>
      </View>
    );
  }

  return (
    <View style={[GlobalStyleSheet.flexContainer, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerContainer]}>
        <Text style={[styles.headerTitle, { color: colors.title }]}>Shop by Price</Text>
      </View>

      {/* Categories Grid */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                style={[
                  styles.card,
                  { width: itemSize, height: itemSize, backgroundColor: colors.card },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('Products', {
                    initialFilters: { minGrandTotal: item.min, maxGrandTotal: item.max },
                  })
                }
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.title, { color: colors.title }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.text }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {row.length === 1 && <View style={{ width: itemSize }} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: SIZES.padding,
    paddingBottom: SIZES.padding,
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
  },
  errorText: {
    ...FONTS.font,
    textAlign: 'center',
  },
  emptyText: {
    ...FONTS.font,
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
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: '70%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    height: '30%',
    padding: SIZES.radius_sm,
    justifyContent: 'center',
  },
  title: {
    ...FONTS.fontBold,
    fontSize: SIZES.font,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.fontSm,
    textAlign: 'center',
  },
});

export default BudgetCategoriesScreen;
