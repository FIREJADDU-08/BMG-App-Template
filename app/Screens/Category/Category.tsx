import { useTheme } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import Header from '../../layout/Header';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { FONTS, COLORS } from '../../constants/theme';
import { IMAGES } from '../../constants/Images';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../Navigations/RootStackParamList';

type CategoryScreenProps = StackScreenProps<RootStackParamList, 'Category'>;

const Category = ({ navigation, route }: CategoryScreenProps) => {
  const theme = useTheme();
  const { colors } = theme;
  const { categories } = route.params || {};
  
  const [loading, setLoading] = useState(!categories);
  const [allCategories, setAllCategories] = useState(categories || []);

  useEffect(() => {
    // If categories weren't passed, fetch them
    if (!categories) {
      fetchAllCategories();
    }
  }, []);

  const fetchAllCategories = async () => {
    try {
      setLoading(true);
      // You'll need to implement getMainCategoryImages or similar function
      // const data = await getMainCategoryImages();
      // setAllCategories(data);
      // For now, using a placeholder
      setAllCategories([
        { id: 1, name: 'Necklaces', image: IMAGES.item22 },
        { id: 2, name: 'Rings', image: IMAGES.item23 },
        { id: 3, name: 'Earrings', image: IMAGES.item24 },
        { id: 4, name: 'Anklets', image: IMAGES.item25 },
        { id: 5, name: 'Bracelets', image: IMAGES.product3 },
        { id: 6, name: 'Pendants', image: IMAGES.product1 },
      ]);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryName: string) => {
    navigation.navigate('Products', { 
      itemName: categoryName,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <Header
          title="All Categories"
          rightIcon2={'search'}
          leftIcon={'back'}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: colors.text }}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <Header
        title="All Categories"
        rightIcon2={'search'}
        leftIcon={'back'}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={GlobalStyleSheet.container}>
          <Text style={{ ...FONTS.Marcellus, fontSize: 20, color: colors.title, marginBottom: 20 }}>
            Browse All Jewelry Categories
          </Text>
          
          <View style={[GlobalStyleSheet.row, { marginTop: 10 }]}>
            {allCategories.map((category, index) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleCategoryPress(category.name)}
                key={category.id || index}
                style={[GlobalStyleSheet.col50, { marginBottom: 20 }]}
              >
                <View style={{ justifyContent: 'center' }}>
                  <Image
                    source={typeof category.image === 'string' ? { uri: category.image } : category.image}
                    style={{ height: null, width: '100%', aspectRatio: 1/1.2, borderRadius: 20 }}
                  />
                  <View 
                    style={{ 
                      backgroundColor: colors.card,
                      padding: 10,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                      bottom: 10,
                      left: 10,
                      right: 10,
                    }}
                  >
                    <Text style={{ ...FONTS.fontMedium, fontSize: 16, color: colors.title, textAlign: 'center' }}>
                      {category.name}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Category;