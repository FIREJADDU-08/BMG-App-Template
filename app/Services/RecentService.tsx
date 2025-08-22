// services/recentlyViewedService.ts
import { API_BASE_URL } from '../Config/baseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMAGES } from '../constants/Images';

export const getRecentlyViewedProducts = async () => {
  const API_IMAGE_URL = 'https://app.bmgjewellers.com/';

  try {
    const token = await AsyncStorage.getItem('user_token');

    if (!token) {
      return []; // No token, return empty list
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
      return []; // Fetch failed, return empty list
    }

    const recentlyViewedData = await recentlyViewedResponse.json();

    if (!recentlyViewedData.data || !Array.isArray(recentlyViewedData.data)) {
      return []; // Invalid format, return empty list
    }

    // Step 2: Fetch product details
    const productDetailsPromises = recentlyViewedData.data.map(async (sno: string) => {
      const productDetailsUrl = `${API_BASE_URL}/product/getSnofilter?sno=${sno}`;
      const productDetailsResponse = await fetch(productDetailsUrl);

      if (!productDetailsResponse.ok) {
        return null;
      }

      return await productDetailsResponse.json();
    });

    const productDetailsResults = await Promise.all(productDetailsPromises);
    const productDetailsData = productDetailsResults
      .filter(Boolean)
      .flatMap(result => result || []);

    // Step 3: Map final products with robust image handling
    const products = productDetailsData.map((item: any) => {
      let images: string[] = [];

      try {
        if (item.ImagePath) {
          if (typeof item.ImagePath === 'string') {
            if (item.ImagePath.startsWith('[') && item.ImagePath.endsWith(']')) {
              try {
                images = JSON.parse(item.ImagePath);
              } catch {
                const pathMatch = item.ImagePath.match(/"([^"]+)"/g);
                if (pathMatch) {
                  images = pathMatch.map((path: string) => path.replace(/"/g, ''));
                } else {
                  images = [item.ImagePath];
                }
              }
            } else {
              images = [item.ImagePath];
            }
          } else if (Array.isArray(item.ImagePath)) {
            images = item.ImagePath;
          }
        }
      } catch {
        images = [];
      }

      // Clean and format the first image URL
      let firstImage = IMAGES.item11;
      if (images.length > 0 && images[0]) {
        let imagePath = images[0];
        imagePath = imagePath.replace(/["'[\]]/g, '').trim();

        if (imagePath.startsWith('http')) {
          firstImage = imagePath;
        } else if (imagePath.startsWith('/')) {
          firstImage = `${API_IMAGE_URL}${imagePath.startsWith('/') ? imagePath.substring(1) : imagePath}`;
        } else {
          firstImage = `${API_IMAGE_URL}uploads/${imagePath}`;
        }
      }

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

    return products;
  } catch {
    return []; // On any unexpected error, return empty list
  }
};
