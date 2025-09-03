import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';

const { width } = Dimensions.get('window');

const RingsPage = ({ navigation }) => {
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    // Animate on component mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Sample ring images with item and subitem names
  const ringImages = [
    {
      id: 1,
      itemName: 'Rings',
      subItemName: 'WEDDING RINGS',
      image: require('../assets/image1/ring3.webp'),
      description: 'Symbolize eternal love with our exquisite wedding bands',
    },
    {
      id: 2,
      itemName: 'Rings',
      subItemName: 'ENGAGEMENT RINGS',
      image: require('../assets/image1/ring4.webp'),
      description: 'Sparkling diamonds for the perfect proposal',
    },
    {
      id: 3,
      itemName: 'Rings',
      subItemName: 'COUPLE RINGS',
      image: require('../assets/image1/ring2.webp'),
      description: 'Matching sets to celebrate your connection',
    },
  ];

  const handleImagePress = (itemName, subItemName) => {
    // Navigate to Products page with parameters
    navigation.navigate('Products', {
      itemName,
      subItemName,
    });
  };

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.header}>Explore Our Rings</Text>
      </Animated.View>
      {/* Content - Images */}
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* First row with two images */}
        <View style={styles.row}>
          <Animated.View 
            style={[
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              styles.animationWrapper
            ]}
          >
            <TouchableOpacity
              style={[styles.imageContainer, styles.halfWidth]}
              onPress={() => handleImagePress(ringImages[0].itemName, ringImages[0].subItemName)}
              activeOpacity={0.9}
            >
              <Image
                source={ringImages[0].image}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageText}>{ringImages[0].subItemName}</Text>
                {/* <Text style={styles.imageSubtext}>{ringImages[0].description}</Text>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>EXPLORE</Text>
                </View> */}
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View 
            style={[
              { 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }],
                marginLeft: 16
              },
              styles.animationWrapper
            ]}
          >
            <TouchableOpacity
              style={[styles.imageContainer, styles.halfWidth]}
              onPress={() => handleImagePress(ringImages[1].itemName, ringImages[1].subItemName)}
              activeOpacity={0.9}
            >
              <Image
                source={ringImages[1].image}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageText}>{ringImages[1].subItemName}</Text>
                {/* <Text style={styles.imageSubtext}>{ringImages[1].description}</Text>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>EXPLORE</Text>
                </View> */}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Second row with one centered image */}
        <View style={styles.row}>
          <Animated.View 
            style={[
              { 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }] 
              },
              styles.animationWrapper
            ]}
          >
            <TouchableOpacity
              style={[styles.imageContainer, styles.fullWidth]}
              onPress={() => handleImagePress(ringImages[2].itemName, ringImages[2].subItemName)}
              activeOpacity={0.9}
            >
              <Image
                source={ringImages[2].image}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageText}>{ringImages[2].subItemName}</Text>
                {/* <Text style={styles.imageSubtext}>{ringImages[2].description}</Text> */}
                {/* <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>EXPLORE</Text>
                </View> */}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fafafa',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    fontSize: 22,
    color: '#000000ff',
  
    letterSpacing: 1,
  
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  divider: {
    height: 3,
    width: 60,
    backgroundColor: '#d4af37',
    borderRadius: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  animationWrapper: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  halfWidth: {
    width: (width - 40) / 2,
  },
  fullWidth: {
    width: width - 32,
  },
  image: {
    width: '100%',
    height: 240,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 16,
    alignItems: 'center',
  },
  imageText: {
    color: '#000000ff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  imageSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default RingsPage;