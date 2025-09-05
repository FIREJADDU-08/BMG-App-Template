import { API_BASE_URL } from "../Config/baseUrl";
const IMAGE_BASE_URL = 'https://app.bmgjewellers.com';

export const getMainCategoryImages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/mainCategory_images/list`);

    if (!response.ok) {
      return []; // return empty array on bad status
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(item => ({
      id: item.id,
      name: item.item_name?.trim() || "Unnamed",
      image: item.image_path
        ? `${IMAGE_BASE_URL}${item.image_path}`
        : null, // Use null instead of placeholder
      createdAt: item.created_at
    }));
  } catch {
    return []; // fail silently and return empty array
  }
};