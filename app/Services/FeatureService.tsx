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
          const cleanedImagePath = product.ImagePath.replace(/\\/g, "");
          const parsedImages = JSON.parse(cleanedImagePath);
          images = parsedImages.map((imgPath) =>
            imgPath.startsWith("http")
              ? imgPath
              : `${IMAGE_BASE_URL}${imgPath}`
          );
        }
      } catch {
        images = [];
      }

      const mainImage =
        images.length > 0
          ? { uri: images[0] }
          : IMAGES.item14;

      return {
        ...product,
        images: images.map((url) => ({ uri: url })),
        mainImage,
      };
    });

    // ✅ Only show products length
    console.log(`✨ Featured Products Count: ${products.length}`);

    return products;
  } catch (error) {
    throw error;
  }
};
