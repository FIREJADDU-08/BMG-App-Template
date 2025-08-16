// services/recentlyViewedService.ts
import { API_BASE_URL } from '../Config/baseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMAGES } from '../constants/Images';

export const getRecentlyViewedProducts = async () => {
  const API_IMAGE_URL = 'https://app.bmgjewellers.com/';


  try {
    // console.log("📌 getRecentlyViewedProducts started");

    const token = await AsyncStorage.getItem('user_token');
    // console.log("📌 Retrieved token:", token);

    if (!token) {
      throw { type: 'NO_TOKEN', message: 'User token not found. Please log in.' };
    }

    // Step 1: Get recently viewed IDs
    const recentlyViewedUrl = `${API_BASE_URL}/recently-viewed/list`;
    const recentlyViewedResponse = await fetch(recentlyViewedUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!recentlyViewedResponse.ok) {
      throw { type: 'FETCH_FAILED', message: `HTTP ${recentlyViewedResponse.status}` };
    }

    const recentlyViewedData = await recentlyViewedResponse.json();
    // console.log("✅ Raw Recently Viewed IDs:", recentlyViewedData);

    if (!recentlyViewedData.data || !Array.isArray(recentlyViewedData.data)) {
      throw { type: 'INVALID_DATA', message: 'Invalid recently viewed data format' };
    }

    // Step 2: Fetch product details
    const productDetailsPromises = recentlyViewedData.data.map(async (sno: string) => {
      const productDetailsUrl = `${API_BASE_URL}/product/getSnofilter?sno=${sno}`;
      const productDetailsResponse = await fetch(productDetailsUrl);

      const productJson = await productDetailsResponse.json();

      if (!productDetailsResponse.ok) {
        console.error(`Failed to fetch details for product ${sno}`);
        return null;
      }

      return productJson;
    });

    const productDetailsResults = await Promise.all(productDetailsPromises);
    const productDetailsData = productDetailsResults
      .filter(Boolean)
      .flatMap(result => result || []);

    // console.log("✅ Raw Product Details:", productDetailsData);

    // Step 3: Map final products with safe image parsing
// Step 3: Map final products with safe image parsing
const products = productDetailsData.map((item: any) => {
  let images: string[] = [];

  try {
    if (item.ImagePath) { // Check if ImagePath exists and is not null/undefined
      if (typeof item.ImagePath === 'string') {
        images = JSON.parse(item.ImagePath);
      } else if (Array.isArray(item.ImagePath)) {
        images = item.ImagePath;
      }
    }
  } catch (e) {
    console.error("Error parsing ImagePath:", e);
    images = [];
  }

  const firstImage =
  images.length > 0 && images[0]
    ? `${API_IMAGE_URL}${images[0]}`
    : IMAGES.item11; // ✅ use directly

  // console.log("✅ Product Image:", firstImage);
  return {
    id: item.SNO,
    title: item.SUBITEMNAME || item.ITEMNAME || 'Unknown Product',
   price: `${(Number(item.GrandTotal) > 0 ? item.GrandTotal : item.RATE) || '0.00'}`,
    image: firstImage,
    description: item.Description, 
    category: item.CATNAME,  
    weight: item.GRSWT,
    purity: item.PURITY,
    originalData: item,
  };
});
    // console.log("✅ Final Recently Viewed Products:", products);
    return products;

  } catch (error: any) {
    console.error("❌ getRecentlyViewedProducts error:", error);
    throw error;
  }
};
