import React from "react";
import { View, Text, Image, Dimensions } from "react-native";
import styles from "./FooterStyles";

const { width } = Dimensions.get("window");

const CertificationFooter = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require("../assets/image1/image.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>100% Certified Jewellery</Text>
          <Text style={styles.subtitle}>
            Fully authenticated and verified by Bureau of Indian Standards (BIS).
          </Text>
        </View>
      </View>

      <Text style={styles.powered}>
        Powered by <Text style={styles.brand}>Brightechsoftware solutions</Text>
      </Text>
    </View>
  );
};

export default CertificationFooter;