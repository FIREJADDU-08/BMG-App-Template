import { API_BASE_URL } from '../Config/baseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMAGES } from '../constants/Images';

const API_IMAGE_URL = 'https://app.bmgjewellers.com';

// Enhanced image processing function for JSON string arrays
export const processImageUrl = (imagePath: any): string => {
  if (!imagePath) return IMAGES.item11;

  try {
    let images: string[] = [];

    // Handle different image path formats
    if (typeof imagePath === 'string') {
      // Handle JSON string arrays like: "[\"/uploads/product_images/10181/d798e27f-...\"]"
      if (imagePath.startsWith('[') && imagePath.endsWith(']')) {
        try {
          // Parse the JSON array string
          images = JSON.parse(imagePath);
        } catch (parseError) {
          console.log('JSON parse failed, trying manual extraction:', parseError);
          // Manual extraction for malformed JSON
          const pathMatch = imagePath.match(/"([^"]+)"/g);
          if (pathMatch) {
            images = pathMatch.map((path: string) => 
              path.replace(/"/g, '').trim()
            );
          } else {
            // Fallback: treat as single string
            images = [imagePath.replace(/["'[\]]/g, '').trim()];
          }
        }
      } else {
        // Single string path
        images = [imagePath.trim()];
      }
    } else if (Array.isArray(imagePath)) {
      // Already an array
      images = imagePath;
    } else {
      return IMAGES.item11;
    }

    // Get the first valid image
    const firstImage = images[0]?.trim();
    if (!firstImage) return IMAGES.item11;

    // Clean and format the URL
    let cleanedPath = firstImage.replace(/["'[\]]/g, '').trim();

    // Ensure proper URL format
    if (cleanedPath.startsWith('http')) {
      return cleanedPath;
    } else if (cleanedPath.startsWith('/')) {
      return `${API_IMAGE_URL}${cleanedPath}`;
    } else {
      return `${API_IMAGE_URL}/${cleanedPath}`;
    }
  } catch (error) {
    console.error('Image processing error:', error);
    return IMAGES.item11;
  }
};

export const getRecentlyViewedProducts = async () => {
  try {
    const token = await AsyncStorage.getItem('user_token');
    if (!token) return [];

    // Step 1: Get recently viewed IDs
    const recentlyViewedUrl = `${API_BASE_URL}/recently-viewed/list`;
    const recentlyViewedResponse = await fetch(recentlyViewedUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!recentlyViewedResponse.ok) {
      console.log('Recently viewed API failed:', recentlyViewedResponse.status);
      return [];
    }

    const recentlyViewedData = await recentlyViewedResponse.json();
    if (!recentlyViewedData.data || !Array.isArray(recentlyViewedData.data)) {
      console.log('Invalid data format from API');
      return [];
    }

    // If we already have product data with ImagePath, use it directly
    if (recentlyViewedData.data.length > 0 && 
        typeof recentlyViewedData.data[0] === 'object' && 
        recentlyViewedData.data[0].ImagePath) {
      
      console.log('Using direct product data with ImagePath');
      return recentlyViewedData.data.map((item: any) => ({
        SNO: item.SNO || item.id || `product-${Math.random()}`,
        SUBITEMNAME: item.SUBITEMNAME || item.ITEMNAME || item.title || 'Unknown Product',
        GrandTotal: item.GrandTotal || item.price || '0.00',
        RATE: item.RATE || item.price || '0.00',
        ImagePath: processImageUrl(item.ImagePath),
        TAGKEY: item.TAGKEY,
        ITEMNAME: item.ITEMNAME,
        discount: item.discount || 0,
      }));
    }

    // Step 2: If we only have IDs, fetch product details
    console.log('Fetching product details for IDs');
    const productDetailsPromises = recentlyViewedData.data.map(async (sno: string) => {
      try {
        const productDetailsUrl = `${API_BASE_URL}/product/getSnofilter?sno=${sno}`;
        const productDetailsResponse = await fetch(productDetailsUrl);
        
        if (!productDetailsResponse.ok) {
          console.log(`Product ${sno} fetch failed:`, productDetailsResponse.status);
          return null;
        }

        const productData = await productDetailsResponse.json();
        return productData;
      } catch (error) {
        console.log(`Product ${sno} fetch error:`, error);
        return null;
      }
    });

    const productDetailsResults = await Promise.all(productDetailsPromises);
    
    // Flatten and filter results
    const productDetailsData = productDetailsResults
      .filter(Boolean)
      .flatMap(result => {
        if (Array.isArray(result)) return result;
        if (result.data && Array.isArray(result.data)) return result.data;
        return [result];
      })
      .filter(item => item !== null && item !== undefined);

    console.log(`Fetched ${productDetailsData.length} product details`);

    // Step 3: Map final products with proper image processing
    return productDetailsData.map((item: any) => {
      const processedImage = processImageUrl(item.ImagePath);
      console.log('Processed image:', processedImage);

      return {
        SNO: item.SNO || item.id || `product-${Math.random()}`,
        SUBITEMNAME: item.SUBITEMNAME || item.ITEMNAME || item.title || 'Unknown Product',
        GrandTotal: item.GrandTotal || item.price || '0.00',
        RATE: item.RATE || item.price || '0.00',
        ImagePath: processedImage,
        TAGKEY: item.TAGKEY,
        ITEMNAME: item.ITEMNAME,
        discount: item.discount || 0,
      };
    });

  } catch (error) {
    console.error('Error in getRecentlyViewedProducts:', error);
    return [];
  }
};