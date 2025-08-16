import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { GlobalStyleSheet } from '../constants/StyleSheet';
import { FONTS, COLORS } from '../constants/theme';
import { getMainCategoryImages } from '../Services/CategoryImageService';

const JewelryCollection = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation(); // This is the critical fix

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMainCategoryImages();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handlePress = (categoryName) => {
    if (navigation) { // Additional safety check
      navigation.navigate('Products', { itemName: categoryName });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Curate Your Perfect{"\n"}Jewelry Collection
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() => handlePress(category.name)}
          >
            <View style={[styles.imageContainer, { backgroundColor: colors.card }]}>
              <Image
                source={{ uri: category.image }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  title: {
    ...FONTS.Marcellus,
    fontSize: 20,
    marginBottom: 15,
  },
  categoryItem: {
    marginRight: 20,
    alignItems: 'center',
    width: 80,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  image: {
    width: 50,
    height: 50,
  },
  categoryName: {
    ...FONTS.Marcellus,
    fontSize: 13,
    textAlign: 'center',
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.danger,
    ...FONTS.fontRegular,
  },
});

export default JewelryCollection;