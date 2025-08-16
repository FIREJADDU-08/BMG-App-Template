const API_BASE_URL = 'https://app.bmgjewellers.com/api/v1';
const IMAGE_BASE_URL = 'https://app.bmgjewellers.com';

export const getMainCategoryImages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/mainCategory_images/list`);

    if (!response.ok) {
      console.warn(`API returned status ${response.status}`);
      return []; // Don't throw, just return empty array
    }

    
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn('Unexpected API format:', data);
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
  } catch (error) {
    console.error('Error fetching main category images:', error);
    return []; // Return empty list so UI doesn't crash
  }
};
