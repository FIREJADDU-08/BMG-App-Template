import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const BottomNavigation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentScreen = route.name;

  // Define tabs array first
  const tabs = [
    { name: "Home", icon: "home-outline", activeIcon: "home", label: "Home" },
    { name: "Cart", icon: "cart-outline", activeIcon: "cart", label: "Cart" },
    {
      name: "Products",
      icon: "shopping-outline",
      activeIcon: "shopping",
      label: "Explore",
    },
    {
      name: "Favourite",
      icon: "heart-outline",
      activeIcon: "heart",
      label: "Favourites",
    },
    {
      name: "ProfileScreen",
      icon: "account-outline",
      activeIcon: "account",
      label: "Profile",
    },
  ];

  // Initialize animation values after tabs are defined
  const animationValues = useRef(tabs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    tabs.forEach((tab, index) => {
      if (currentScreen === tab.name) {
        Animated.spring(animationValues[index], {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(animationValues[index], {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [currentScreen, animationValues]);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isActive = currentScreen === tab.name;
          const scale = animationValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1],
          });
          const opacity = animationValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1],
          });

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[styles.tabContent, { transform: [{ scale }], opacity }]}
              >
                <Icon
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={24}
                  color={isActive ? "#6C63FF" : "#9E9E9E"}
                />
                <Text
                  style={[
                    styles.label,
                    { color: isActive ? "#6C63FF" : "#9E9E9E" },
                  ]}
                >
                  {tab.label}
                </Text>
              </Animated.View>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    height: 60,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 6,
    height: 3,
    backgroundColor: "#6C63FF",
    borderRadius: 3,
  },
});

export default BottomNavigation;
