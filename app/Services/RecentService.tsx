// services/recentlyViewedService.ts
import { API_BASE_URL } from '../Config/baseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMAGES } from '../constants/Images';

export const getRecentlyViewedProducts = async () => {
  const API_IMAGE_URL = 'https://app.bmgjewellers.com/';

  try {
    const token = await AsyncStorage.getItem('user_token');

    if (!token) {
      console.log('No token found');
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
      console.log('Recently viewed response not OK:', recentlyViewedResponse.status);
      return []; // Fetch failed, return empty list
    }

    const recentlyViewedData = await recentlyViewedResponse.json();
    console.log('Recently viewed data:', recentlyViewedData);

    if (!recentlyViewedData.data || !Array.isArray(recentlyViewedData.data)) {
      console.log('Invalid data format or empty array');
      return []; // Invalid format, return empty list
    }

    // If we already have product data in the response, use it directly
    if (recentlyViewedData.data.length > 0 && typeof recentlyViewedData.data[0] === 'object') {
      console.log('Using direct product data from response');
      const products = recentlyViewedData.data.map((item: any) => {
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
          SNO: item.SNO || item.id || `product-${Math.random()}`,
          SUBITEMNAME: item.SUBITEMNAME || item.ITEMNAME || item.title || 'Unknown Product',
          GrandTotal: item.GrandTotal || item.price || '0.00',
          RATE: item.RATE || item.price || '0.00',
          ImagePath: firstImage,
          // Include other properties that might be needed
          TAGKEY: item.TAGKEY,
          ITEMNAME: item.ITEMNAME,
          discount: item.discount || 0,
        };
      });
      
      console.log('Processed products:', products);
      return products;
    }

    // Step 2: If we only have IDs, fetch product details
    console.log('Fetching product details for IDs:', recentlyViewedData.data);
    const productDetailsPromises = recentlyViewedData.data.map(async (sno: string) => {
      try {
        const productDetailsUrl = `${API_BASE_URL}/product/getSnofilter?sno=${sno}`;
        const productDetailsResponse = await fetch(productDetailsUrl);

        if (!productDetailsResponse.ok) {
          console.log(`Failed to fetch product ${sno}`);
          return null;
        }

        const productData = await productDetailsResponse.json();
        console.log(`Product ${sno} data:`, productData);
        return productData;
      } catch (error) {
        console.log(`Error fetching product ${sno}:`, error);
        return null;
      }
    });

    const productDetailsResults = await Promise.all(productDetailsPromises);
    console.log('All product results:', productDetailsResults);
    
    // Flatten the results and filter out nulls
    const productDetailsData = productDetailsResults
      .filter(Boolean)
      .flatMap(result => {
        // Handle different response structures
        if (Array.isArray(result)) return result;
        if (result.data && Array.isArray(result.data)) return result.data;
        return [result];
      })
      .filter(item => item !== null && item !== undefined);

    console.log('Filtered product data:', productDetailsData);

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
        SNO: item.SNO || item.id || `product-${Math.random()}`,
        SUBITEMNAME: item.SUBITEMNAME || item.ITEMNAME || item.title || 'Unknown Product',
        GrandTotal: item.GrandTotal || item.price || '0.00',
        RATE: item.RATE || item.price || '0.00',
        ImagePath: firstImage,
        // Include other properties that might be needed
        TAGKEY: item.TAGKEY,
        ITEMNAME: item.ITEMNAME,
        discount: item.discount || 0,
      };
    });

    console.log('Final products:', products);
    return products;
  } catch (error) {
    console.log('Unexpected error in getRecentlyViewedProducts:', error);
    return []; // On any unexpected error, return empty list
  }
};