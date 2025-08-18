import { API_BASE_URL } from "../Config/baseUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_IMAGE_URL='https://app.bmgjewellers.com'
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
    const parsed = typeof imagePath === "string" && imagePath.trim().startsWith("[")
      ? JSON.parse(imagePath)
      : imagePath;

    const paths = Array.isArray(parsed) ? parsed : [parsed];

    const processedPaths = paths
      .map((path, index) => {
        if (!path) {
          console.warn(`Empty path at index ${index}`);
          return null;
        }

        const cleanPath = String(path).trim().replace(/^['"]|['"]$/g, "");

        if (!cleanPath) {
          console.warn(`Invalid path at index ${index}:`, cleanPath);
          return null;
        }

        const fullPath = cleanPath.startsWith("http")
          ? cleanPath
          : `${API_IMAGE_URL}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
        
        console.log(`Processed path ${index}:`, fullPath);
        return fullPath;
      })
      .filter((path) => path !== null);

    return processedPaths;
  } catch (error) {
    console.warn("Image path processing error:", error);
    return [];
  }
};