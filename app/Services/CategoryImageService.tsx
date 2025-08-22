const API_BASE_URL = 'https://app.bmgjewellers.com/api/v1';
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
        : "https://via.placeholder.com/100",
      createdAt: item.created_at
    }));
  } catch {
    return []; // fail silently and return empty array
  }
};
