import { API_BASE_URL } from "../Config/baseUrl";

const IMAGE_BASE_URL = "https://app.bmgjewellers.com";

export const fetchBudgetCategories = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budget-categories/all`, {
      headers: {
        Authorization: `Bearer ${token}`, // needs login token
        "Content-Type": "application/json",
      },
    });

    const json = await response.json();
    const categories = json || [];

    return categories.map((cat) => ({
      id: cat.id,
      title: cat.title,
      subtitle: cat.subtitle,
      min: cat.min_price,
      max: cat.max_price,
      image: `${IMAGE_BASE_URL}${cat.image_path}`,
    }));
  } catch (error) {
    console.error("Error fetching budget categories:", error);
    return [];
  }
};
