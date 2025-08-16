// services/festivalService.ts
import { API_BASE_URL } from "../Config/baseUrl";

export const getFestivalBanners = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/festival_banner/list?page=0&pageSize=100`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch festival banners:", error);
    throw error;
  }
};
