import { API_BASE_URL } from "../Config/baseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_IMAGE_URL = 'https://app.bmgjewellers.com';

export const fetchOrderHistory = async () => {
  try {
    const token = await AsyncStorage.getItem("user_token");
    if (!token) throw new Error("No token found. Please log in.");

    const response = await fetch(`${API_BASE_URL}/order/history`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status}`);
    }

    const json = await response.json();

    return json.map((order) => ({
      ...order,
      orderItems: processOrderItems(order.orderItems),
    }));
  } catch (error) {
    console.error("OrderService Error:", error.message);
    throw error;
  }
};

const processOrderItems = (orderItems) => {
  if (!orderItems || !Array.isArray(orderItems)) {
    console.warn("Invalid orderItems data:", orderItems);
    return [];
  }

  return orderItems.map((item, index) => {
    try {
      const imageUrls = processImagePaths(item.image_path);
      console.log(`Processed image URLs for item ${index}:`, imageUrls);
      return {
        ...item,
        imageUrls: imageUrls.length > 0 ? imageUrls : [null],
      };
    } catch (error) {
      console.warn(`Failed to process order item images for item ${index}:`, error);
      return {
        ...item,
        imageUrls: [null],
      };
    }
  });
};

const processImagePaths = (imagePath) => {
  if (!imagePath) {
    console.warn("No image path provided");
    return [];
  }

  try {
    // Handle different formats of image paths
    let paths = [];
    
    // Case 1: Already an array
    if (Array.isArray(imagePath)) {
      paths = imagePath;
    } 
    // Case 2: String that looks like a JSON array
    else if (typeof imagePath === 'string' && imagePath.trim().startsWith('[')) {
      paths = JSON.parse(imagePath);
    }
    // Case 3: Single URL string
    else if (typeof imagePath === 'string') {
      paths = [imagePath];
    }
    // Case 4: Unexpected format
    else {
      console.warn("Unexpected image path format:", imagePath);
      return [];
    }

    // Process each path
    const processedPaths = paths
      .map((path, index) => {
        if (!path) {
          console.warn(`Empty path at index ${index}`);
          return null;
        }

        const cleanPath = String(path).trim();
        
        if (!cleanPath) {
          console.warn(`Invalid path at index ${index}:`, cleanPath);
          return null;
        }

        // Check if it's already a full URL
        if (cleanPath.startsWith("http")) {
          return cleanPath;
        }
        
        // Handle relative paths
        let fullPath = cleanPath;
        if (!cleanPath.startsWith("/")) {
          fullPath = `/${cleanPath}`;
        }
        
        return `${API_IMAGE_URL}${fullPath}`;
      })
      .filter((path) => path !== null);

    return processedPaths;
  } catch (error) {
    console.warn("Image path processing error:", error);
    return [];
  }
};