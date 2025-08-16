// services/orderService.js
import { API_BASE_URL } from "../Config/baseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  if (!orderItems || !Array.isArray(orderItems)) return [];

  return orderItems.map((item) => {
    try {
      const imageUrls = processImagePaths(item.image_path);
      return {
        ...item,
        imageUrls: imageUrls.length > 0 ? imageUrls : [null], // Ensure at least one item
      };
    } catch (error) {
      console.warn("Failed to process order item images:", error);
      return {
        ...item,
        imageUrls: [null], // Fallback to null
      };
    }
  });
};

const processImagePaths = (imagePath) => {
  if (!imagePath) return [];
  
  try {
    // Handle string or already parsed JSON
    const images = typeof imagePath === 'string' 
      ? JSON.parse(imagePath) 
      : imagePath;
    
    // Ensure we have an array
    const imageArray = Array.isArray(images) ? images : [images];
    
    return imageArray.map((path) => {
      if (!path) return null;
      
      const cleanPath = String(path)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      
      if (!cleanPath) return null;
      
      return cleanPath.startsWith('http') 
        ? cleanPath 
        : `${API_BASE_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    }).filter(Boolean); // Remove any null values
  } catch (error) {
    console.warn("Image path processing error:", error);
    return [];
  }
};