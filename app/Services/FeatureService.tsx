// services/productService.js
import { API_BASE_URL } from "../Config/baseUrl";
import { IMAGES } from "../constants/Images"; // Make sure IMAGES.item14 is require('...')

const IMAGE_BASE_URL = "https://app.bmgjewellers.com";

export const fetchFeaturedProducts = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/product/items/filter?featured_products=true`
    );
    const json = await response.json();

    const products = json.data.map((product) => {
      let images = [];

      try {
        if (product.ImagePath) {
          // Remove backslashes
          const cleanedImagePath = product.ImagePath.replace(/\\/g, "");
          // Parse JSON string into array
          const parsedImages = JSON.parse(cleanedImagePath);
          // Convert to full URLs
          images = parsedImages.map((imgPath) =>
            imgPath.startsWith("http")
              ? imgPath
              : `${IMAGE_BASE_URL}${imgPath}`
          );
        }
        console.log("✅ Product Images:", images);
      } catch (e) {
        console.warn("Failed to parse image paths", e);
        images = [];
      }

      // Prepare RN-safe mainImage
      const mainImage =
        images.length > 0
          ? { uri: images[0] } // ✅ Remote image
          : IMAGES.item14;     // ✅ Local fallback (require)

      return {
        ...product,
        images: images.map((url) => ({ uri: url })), // RN-ready array
        mainImage,
      };
    });

    return products;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    throw error;
  }
};
