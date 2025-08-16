// services/bestDesignService.js
import { API_BASE_URL } from "../Config/baseUrl";

const IMAGE_BASE_URL = "https://app.bmgjewellers.com";

export const fetchBestDesignProducts = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/product/items/filter?best_design=true`
    );
    const json = await response.json();

    const products = (json?.data || []).map((product) => {
      let images = [];

      try {
        // Remove any escape backslashes first
        const cleanedPath = product.ImagePath?.replace(/\\/g, "") || "[]";
        // Parse JSON string safely
        const parsedPaths = JSON.parse(cleanedPath);
        // Convert relative paths to full URLs
        images = parsedPaths.map((path) =>
          path.startsWith("http") ? path : `${IMAGE_BASE_URL}${path}`
        );
        console.log("✅ Product Images:", images);
        console.log("✅ Product Main Image:", images[0]);
      } catch (error) {
        console.warn("Error parsing ImagePath for product:", product.SNO, error);
        images = [];
      }

      return {
        SNO: product.SNO,
        SUBITEMNAME: product.SUBITEMNAME || "Jewelry Item",
        GrossAmount: product.GrossAmount || 0,
        GrandTotal: product.GrandTotal || 0,
        Best_Design: product.Best_Design || false,
        Discount: product.Discount || null,
        Offer: product.Offer || null,
        DeliveryOption: product.DeliveryOption || null,
        images,
        mainImage: images.length > 0 ? images[0] : null, // First image for convenience
      };
    });

    return products;
  } catch (error) {
    console.error("Error fetching best design products:", error);
    throw error;
  }
};
