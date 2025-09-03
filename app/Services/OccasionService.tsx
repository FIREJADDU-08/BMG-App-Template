export interface OccasionBanner {
  id: number;
  image_path: string;
  title: string;
  subtitle: string;
  occasion: string;
  gender: string;
  created_at: string;
}

import { API_BASE_URL } from "../Config/baseUrl";


export const getOccasionBanners = async (): Promise<OccasionBanner[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/occasion_banner/list`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: OccasionBanner[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching banners:', error);
    throw error;
  }
};
