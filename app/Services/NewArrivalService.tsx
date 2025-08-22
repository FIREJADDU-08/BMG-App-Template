// Update your service file (e.g., productService.ts)
import { API_BASE_URL } from "../Config/baseUrl";
import { IMAGES } from '../constants/Images';

const IMAGE_BASE_URL = "https://app.bmgjewellers.com"; // root domain for images

export const getNewArrivalProducts = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/product/items/filter?new_arrival=y`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return []; // return empty array instead of throwing
    }

    const json = await response.json();

    // Map data and construct full image URL and format price
    return (json.data || []).map(item => ({
      ...item,
      id: item.SNO, // using SNO as id
      image: item.ImagePath
        ? `${IMAGE_BASE_URL}${item.ImagePath}` // full image URL
        : IMAGES.item11, // fallback image
      title: item.ITEMNAME || "Jewelry Item",
      price: `₹${parseFloat(item.GrandTotal || "0").toFixed(2)}`, // Format as INR
      discount: `₹${parseFloat(item.GrandTotal || "0").toFixed(2)}`, // Using GrandTotal as discount price
      offer: item.GSTPer || "3% GST", // Showing GST percentage as offer
    }));

  } catch {
    return []; // fail silently and return empty list
  }
};
