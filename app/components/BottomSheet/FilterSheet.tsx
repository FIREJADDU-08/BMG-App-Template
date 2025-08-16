import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { GlobalStyleSheet } from '../../constants/StyleSheet';
import { COLORS, FONTS } from '../../constants/theme';
import { useTheme } from '@react-navigation/native';
import Button from '../Button/Button';
import { ScrollView } from 'react-native-gesture-handler';
import { IMAGES } from '../../constants/Images';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  sheetRef: any;
  onFiltersChange?: (filters: any) => void;
};

const FilterSheet2 = ({ sheetRef, onFiltersChange }: Props) => {
  const theme = useTheme();
  const { colors }: { colors: any } = theme;
  const [fadeAnim] = useState(new Animated.Value(0));

  // Filter options data with proper typing
  const filterOptions = {
    gender: ["Men", "Women", "Kids"],
    occasion: ["DAILY_WEAR", "WEDDING", "TRADITIONAL"],
    colorAccent: ["Gold", "Silver", "Rose Gold"],
    materialFinish: ["GOLDCOATED", "SILVERCOATED"],
    size: ["2", "2.2", "2.4", "2.6", "2.8", "2.10"],
  };

  // State management
  const [filters, setFilters] = useState({
    gender: null as string | null,
    occasion: null as string | null,
    colorAccent: null as string | null,
    materialFinish: null as string | null,
    sizeName: null as string | null,
  });

  // Reset filters and animation when sheet opens
  useEffect(() => {
    const resetFilters = () => {
      setFilters({
        gender: null,
        occasion: null,
        colorAccent: null,
        materialFinish: null,
        sizeName: null,
      });
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    // Check if the sheetRef has the onOpen method (react-native-bottom-sheet)
    if (sheetRef.current?.onOpen) {
      const subscription = sheetRef.current.onOpen(resetFilters);
      return () => subscription?.();
    }

    // Alternative: Reset when component mounts (if using conditional rendering)
    resetFilters();
  }, [sheetRef]);

  const handleFilterChange = useCallback(
    (key: keyof typeof filters, value: string | null) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleApplyFilters = useCallback(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== null)
    );
    
    onFiltersChange?.(activeFilters);
    sheetRef.current?.close();
  }, [filters, onFiltersChange]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      gender: null,
      occasion: null,
      colorAccent: null,
      materialFinish: null,
      sizeName: null,
    });
    onFiltersChange?.({
      gender: null,
      occasion: null,
      colorAccent: null,
      materialFinish: null,
      sizeName: null,
    });
  }, [onFiltersChange]);

  const renderFilterOptions = useCallback(
    (data: string[], activeValue: string | null, filterKey: keyof typeof filters) => (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {data.map((item, index) => (
          <Animated.View
            key={index}
            style={{
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }}
          >
            <TouchableOpacity
              onPress={() => handleFilterChange(filterKey, activeValue === item ? null : item)}
              style={[{
                backgroundColor: colors.card,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                paddingHorizontal: 15,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }, activeValue === item && {
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
              }]}
            >
              <Text style={[{
                ...FONTS.fontMedium,
                fontSize: 13,
                color: colors.title,
              }, activeValue === item && {
                color: COLORS.white,
              }]}>
                {item}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    ),
    [colors, fadeAnim, handleFilterChange]
  );

  return (
    <LinearGradient
      colors={[colors.background, colors.background + 'CC']}
      style={[GlobalStyleSheet.container, { paddingTop: 0 }]}
    >
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: 15,
        marginHorizontal: -15,
        paddingHorizontal: 15,
        marginBottom: 10,
      }}>
        <Text style={[FONTS.Marcellus, { color: colors.title, fontSize: 20 }]}>Filters</Text>
        <TouchableOpacity
          style={{
            height: 38,
            width: 38,
            backgroundColor: colors.card,
            borderRadius: 38,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: theme.dark ? "#000" : "rgba(195, 123, 95, 0.20)",
            shadowOffset: { width: 3, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
          }}
          onPress={() => sheetRef.current?.close()}
        >
          <Image
            style={{ width: 18, height: 18, resizeMode: 'contain', tintColor: colors.title }}
            source={IMAGES.close}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gender Filter */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: 10 }}>
          <Text style={{ ...FONTS.fontMedium, fontSize: 18, color: colors.title }}>Gender</Text>
          {renderFilterOptions(filterOptions.gender, filters.gender, 'gender')}
        </Animated.View>

        {/* Occasion Filter */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: 15 }}>
          <Text style={{ ...FONTS.fontMedium, fontSize: 18, color: colors.title }}>Occasion</Text>
          {renderFilterOptions(filterOptions.occasion, filters.occasion, 'occasion')}
        </Animated.View>

        {/* Color Accent Filter */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: 15 }}>
          <Text style={{ ...FONTS.fontMedium, fontSize: 18, color: colors.title }}>Color Accent</Text>
          {renderFilterOptions(filterOptions.colorAccent, filters.colorAccent, 'colorAccent')}
        </Animated.View>

        {/* Material Finish Filter */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: 15 }}>
          <Text style={{ ...FONTS.fontMedium, fontSize: 18, color: colors.title }}>Material Finish</Text>
          {renderFilterOptions(filterOptions.materialFinish, filters.materialFinish, 'materialFinish')}
        </Animated.View>

        {/* Size Filter */}
        <Animated.View style={{ opacity: fadeAnim, marginTop: 15 }}>
          <Text style={{ ...FONTS.fontMedium, fontSize: 18, color: colors.title }}>Size</Text>
          {renderFilterOptions(filterOptions.size, filters.sizeName, 'sizeName')}
        </Animated.View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, paddingRight: 10, marginTop: 20, marginBottom: 130 }}>
          <View style={{ width: '50%' }}>
            <Button
              onPress={handleResetFilters}
              title="Reset"
              text={colors.title}
              color={colors.card}
              btnRounded
            />
          </View>
          <View style={{ width: '50%' }}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primary + 'CC']}
              style={{ borderRadius: 10 }}
            >
              <Button
                onPress={handleApplyFilters}
                title="Apply"
                text={COLORS.white}
                color="transparent"
                btnRounded
              />
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default FilterSheet2;