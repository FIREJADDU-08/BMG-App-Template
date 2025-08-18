import { API_BASE_URL } from '../Config/baseUrl';

export interface ProductItem {
  MaterialFinish: string;
  Description: string;
  TAGNO: string;
  Occasion: string;
  RATE: string;
  GSTAmount: string;
  TAGKEY: string;
  Gender: string;
  SIZEID: number;
  Best_Design: boolean;
  SNO: string;
  CollectionType: string;
  ImagePaths: string[];
  NewArrival: boolean;
  GrossAmount: string;
  Featured_Products: boolean;
  SIZENAME: string | null;
  Rate: string;
  StoneType: string | null;
  SUBITEMNAME: string;
  CATNAME: string;
  NETWT: string;
  GSTPer: string;
  Top_Trending: boolean;
  GrandTotal: string;
  ColorAccents: string;
  ITEMID: string;
  ITEMNAME: string;
}

export interface ProductFilters {
  itemName?: string;
  subItemName?: string;
  gender?: string;
  occasion?: string;
  colorAccent?: string;
  materialFinish?: string;
  sizeName?: string;
  category?: string;
  brand?: string;
  minGrandTotal?: number;
  maxGrandTotal?: number;
  searchQuery?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'popular';
}

export interface ProductServiceResponse {
  data: ProductItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Enhanced pagination configuration
interface PaginationConfig {
  initialPageSize: number;
  maxPageSize: number;
  incrementSize: number;
  fastScrollThreshold: number; // Number of fast scrolls to trigger size increase
  scrollTimeThreshold: number; // Time in ms to consider a scroll as "fast"
}

class ProductService {
  private static instance: ProductService;
  private currentPage: number = 0;
  private basePageSize: number = 10;
  private currentPageSize: number = 10;
  private maxPageSize: number = 50;
  private _hasMoreData: boolean = true;
  private totalItems: number = 0;
  private lastFilters: string = '';
  private cache: Map<string, ProductItem[]> = new Map();
  private readonly BASE_IMAGE_URL = 'https://app.bmgjewellers.com';
  private readonly MAX_RETRIES = 3;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Enhanced pagination tracking
  private scrollCount: number = 0;
  private fastScrollCount: number = 0;
  private lastScrollTime: number = 0;
  private sessionStartTime: number = Date.now();
  private userEngagement: {
    totalScrolls: number;
    averageScrollTime: number;
    fastScrolls: number;
    sessionDuration: number;
  } = {
    totalScrolls: 0,
    averageScrollTime: 0,
    fastScrolls: 0,
    sessionDuration: 0,
  };

  // Adaptive pagination configuration
  private paginationConfig: PaginationConfig = {
    initialPageSize: 10,
    maxPageSize: 50,
    incrementSize: 10,
    fastScrollThreshold: 3,
    scrollTimeThreshold: 2000, // 2 seconds
  };

  constructor() {
    if (ProductService.instance) {
      return ProductService.instance;
    }
    ProductService.instance = this;
    this.currentPageSize = this.paginationConfig.initialPageSize;
  }

  /**
   * Enhanced pagination reset with adaptive sizing
   */
  public resetPagination(): void {
    this.currentPage = 0;
    this._hasMoreData = true;
    this.totalItems = 0;
    this.lastFilters = '';
    // Keep the adapted page size for better user experience
    // this.currentPageSize = this.paginationConfig.initialPageSize; // Commented to maintain adapted size
  }

  /**
   * Track user scroll behavior for adaptive pagination
   */
  public trackScrollBehavior(): void {
    const currentTime = Date.now();
    const timeSinceLastScroll = currentTime - this.lastScrollTime;
    
    this.scrollCount++;
    this.userEngagement.totalScrolls++;
    this.lastScrollTime = currentTime;

    // Track fast scrolling
    if (timeSinceLastScroll < this.paginationConfig.scrollTimeThreshold && timeSinceLastScroll > 100) {
      this.fastScrollCount++;
      this.userEngagement.fastScrolls++;
    }

    // Update session duration
    this.userEngagement.sessionDuration = currentTime - this.sessionStartTime;
    
    // Calculate average scroll time
    if (this.userEngagement.totalScrolls > 1) {
      this.userEngagement.averageScrollTime = this.userEngagement.sessionDuration / this.userEngagement.totalScrolls;
    }

    // Adaptive page size increase logic
    this.adaptPageSize();
  }

  /**
   * Intelligent page size adaptation based on user behavior
   */
  private adaptPageSize(): void {
    const { fastScrollThreshold, incrementSize, maxPageSize } = this.paginationConfig;
    
    // Increase page size if user shows high engagement
    const shouldIncreasePageSize = (
      this.fastScrollCount >= fastScrollThreshold ||
      (this.scrollCount >= 5 && this.userEngagement.averageScrollTime < 3000) ||
      (this.userEngagement.totalScrolls >= 10 && this.currentPageSize < 20)
    );

    if (shouldIncreasePageSize && this.currentPageSize < maxPageSize) {
      const newPageSize = Math.min(this.currentPageSize + incrementSize, maxPageSize);
      
      if (newPageSize !== this.currentPageSize) {
        console.log(`📈 Adapting page size: ${this.currentPageSize} → ${newPageSize} (Fast scrolls: ${this.fastScrollCount})`);
        this.currentPageSize = newPageSize;
        this.fastScrollCount = 0; // Reset counter after adaptation
        
        // Emit event for UI components to react
        this.notifyPageSizeChange(newPageSize);
      }
    }
  }

  /**
   * Notify components about page size changes
   */
  private notifyPageSizeChange(newSize: number): void {
    // This could be enhanced with a proper event system
    console.log(`🔄 Page size adapted to ${newSize} based on user behavior`);
  }

  /**
   * Force set page size with validation
   */
  public setPageSize(size: number): void {
    const validSize = Math.max(10, Math.min(size, this.paginationConfig.maxPageSize));
    if (validSize !== this.currentPageSize) {
      console.log(`🎛️ Manual page size change: ${this.currentPageSize} → ${validSize}`);
      this.currentPageSize = validSize;
      this.resetPagination();
    }
  }

  /**
   * Get current page size
   */
  public getCurrentPageSize(): number {
    return this.currentPageSize;
  }

  /**
   * Get user engagement metrics
   */
  public getUserEngagementMetrics() {
    return {
      ...this.userEngagement,
      currentPageSize: this.currentPageSize,
      totalPages: this.currentPage,
      scrollCount: this.scrollCount,
      fastScrollCount: this.fastScrollCount,
    };
  }

  /**
   * Reset user engagement tracking
   */
  public resetEngagementTracking(): void {
    this.scrollCount = 0;
    this.fastScrollCount = 0;
    this.lastScrollTime = 0;
    this.sessionStartTime = Date.now();
    this.userEngagement = {
      totalScrolls: 0,
      averageScrollTime: 0,
      fastScrolls: 0,
      sessionDuration: 0,
    };
  }

  // Existing methods with enhanced pagination
  public hasMoreData(): boolean {
    return this._hasMoreData;
  }

  public getCurrentPage(): number {
    return this.currentPage;
  }

  public getTotalItems(): number {
    return this.totalItems;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  private generateCacheKey(filters: ProductFilters, page: number): string {
    const filterString = JSON.stringify({
      ...filters,
      page,
      pageSize: this.currentPageSize // Use current adaptive page size
    });
    return btoa(filterString);
  }

  private hasFiltersChanged(filters: ProductFilters): boolean {
    const currentFiltersString = JSON.stringify(filters);
    const changed = this.lastFilters !== currentFiltersString;
    this.lastFilters = currentFiltersString;
    return changed;
  }

  private buildQueryParams(filters: ProductFilters, page: number): URLSearchParams {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: this.currentPageSize.toString(), // Use adaptive page size
    });

    const filterMapping = {
      itemName: filters.itemName,
      subItemName: filters.subItemName,
      gender: filters.gender,
      occasion: filters.occasion,
      colorAccent: filters.colorAccent,
      materialFinish: filters.materialFinish,
      sizeName: filters.sizeName,
      category: filters.category,
      brand: filters.brand,
      searchQuery: filters.searchQuery,
      sortBy: filters.sortBy,
    };

    Object.entries(filterMapping).forEach(([key, value]) => {
      if (value && value.toString().trim() !== '') {
        queryParams.append(key, value.toString().trim());
      }
    });

    if (filters.minGrandTotal !== undefined && !isNaN(filters.minGrandTotal) && filters.minGrandTotal > 0) {
      queryParams.append('minGrandTotal', filters.minGrandTotal.toString());
    }
    
    if (filters.maxGrandTotal !== undefined && !isNaN(filters.maxGrandTotal) && filters.maxGrandTotal < 10000000000) {
      queryParams.append('maxGrandTotal', filters.maxGrandTotal.toString());
    }

    return queryParams;
  }

  private processImagePaths(imagePath: string): string[] {
    if (!imagePath) return [];

    try {
      const parsedPaths = JSON.parse(imagePath);
      if (Array.isArray(parsedPaths)) {
        return parsedPaths.map((path: string) => {
          if (!path) return '';
          return path.startsWith('http') ? path : `${this.BASE_IMAGE_URL}${path}`;
        }).filter(path => path !== '');
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse ImagePath:', imagePath);
      
      if (typeof imagePath === 'string' && imagePath.trim() !== '') {
        const path = imagePath.trim();
        return [path.startsWith('http') ? path : `${this.BASE_IMAGE_URL}${path}`];
      }
    }
    
    return [];
  }

  private async makeRequest(url: string, retries: number = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout for larger page sizes

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        console.warn(`🔄 Retry ${retries + 1}/${this.MAX_RETRIES} for request to ${url}`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        return this.makeRequest(url, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Enhanced getFilteredProducts with adaptive pagination
   */
  public async getFilteredProducts(filters: ProductFilters = {}): Promise<ProductItem[]> {
    try {
      if (this.hasFiltersChanged(filters)) {
        this.resetPagination();
      }

      if (!this._hasMoreData && this.currentPage > 0) {
        console.log('📄 No more data available');
        return [];
      }

      const cacheKey = this.generateCacheKey(filters, this.currentPage);

      if (this.cache.has(cacheKey)) {
        console.log(`💾 Returning cached data for page ${this.currentPage} (size: ${this.currentPageSize})`);
        const cachedData = this.cache.get(cacheKey)!;
        this.currentPage++;
        return cachedData;
      }

      const queryParams = this.buildQueryParams(filters, this.currentPage);
      const apiUrl = `${API_BASE_URL}/product/items/filter?${queryParams.toString()}`;

      console.log(`🔍 Fetching products - Page: ${this.currentPage}, Size: ${this.currentPageSize}, Filters:`, filters);

      const response = await this.makeRequest(apiUrl);
      const text = await response.text();

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        console.error('❌ JSON parse error:', err);
        console.error('📄 Response text:', text);
        throw new Error('Invalid JSON response from server');
      }

      if (!parsed || typeof parsed !== 'object') {
        console.error('❌ Invalid response structure:', parsed);
        throw new Error('Invalid response format from server');
      }

      const items = parsed.data || parsed.items || parsed;
      const total = parsed.total || parsed.totalCount || 0;

      if (!Array.isArray(items)) {
        console.warn('⚠️ No items array in response:', parsed);
        this._hasMoreData = false;
        return [];
      }

      this.totalItems = total;
      const itemsCount = items.length;
      
      // Enhanced pagination logic with adaptive sizing
      if (itemsCount < this.currentPageSize) {
        this._hasMoreData = false;
        console.log(`📄 Reached end of data - received ${itemsCount}/${this.currentPageSize} items`);
      }

      // Process products with enhanced error handling
      const products: ProductItem[] = items.map((item: any, index: number) => {
        try {
          return {
            ...item,
            ImagePaths: this.processImagePaths(item.ImagePath || ''),
            SUBITEMNAME: item.SUBITEMNAME || item.ItemName || `Unknown Product ${index + 1}`,
            RATE: item.RATE || item.Rate || '0',
            GrandTotal: item.GrandTotal || item.RATE || item.Rate || '0',
            ITEMID: item.ITEMID || item.ItemId || `item_${Date.now()}_${Math.random()}`,
            SNO: item.SNO || item.Id || `sno_${Date.now()}_${Math.random()}`,
            Gender: item.Gender || '',
            Occasion: item.Occasion || '',
            MaterialFinish: item.MaterialFinish || '',
            ColorAccents: item.ColorAccents || item.ColorAccent || '',
            SIZENAME: item.SIZENAME || item.SizeName || null,
            Description: item.Description || '',
            CATNAME: item.CATNAME || item.CategoryName || '',
            ITEMNAME: item.ITEMNAME || item.ItemName || '',
            Best_Design: Boolean(item.Best_Design),
            NewArrival: Boolean(item.NewArrival),
            Featured_Products: Boolean(item.Featured_Products),
            Top_Trending: Boolean(item.Top_Trending),
            // Additional fields
            TAGNO: item.TAGNO || '',
            GSTAmount: item.GSTAmount || '0',
            TAGKEY: item.TAGKEY || '',
            SIZEID: item.SIZEID || 0,
            CollectionType: item.CollectionType || '',
            GrossAmount: item.GrossAmount || '0',
            Rate: item.Rate || item.RATE || '0',
            StoneType: item.StoneType || null,
            NETWT: item.NETWT || '0',
            GSTPer: item.GSTPer || '0',
          };
        } catch (itemError) {
          console.warn(`⚠️ Error processing item at index ${index}:`, itemError);
          return null;
        }
      }).filter(Boolean) as ProductItem[];

      // Enhanced caching with size-aware keys
      if (products.length > 0) {
        this.cache.set(cacheKey, products);
        
        // Smart cache management based on page size
        const maxCacheSize = Math.max(20, Math.floor(100 / (this.currentPageSize / 10)));
        if (this.cache.size > maxCacheSize) {
          const keysToDelete = Array.from(this.cache.keys()).slice(0, this.cache.size - maxCacheSize);
          keysToDelete.forEach(key => this.cache.delete(key));
        }
      }

      this.currentPage++;

      console.log(`✅ Successfully fetched ${products.length} products (Page: ${this.currentPage - 1}, Size: ${this.currentPageSize})`);
      
      // Log engagement metrics periodically
      if (this.currentPage % 3 === 0) {
        console.log('📊 User Engagement:', this.getUserEngagementMetrics());
      }

      return products;

    } catch (error) {
      console.error('❌ ProductService.getFilteredProducts error:', error);
      
      if (this.currentPage === 0) {
        this._hasMoreData = false;
      }
      
      // Enhanced error handling
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Network connection error. Please check your internet connection.');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Request timeout. Please try again.');
      } else if (error instanceof Error && error.message.includes('HTTP 4')) {
        throw new Error('Invalid request. Please check your search criteria.');
      } else if (error instanceof Error && error.message.includes('HTTP 5')) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw error;
    }
  }

  // Enhanced utility methods
  public async getProductDetails(sno: string): Promise<ProductItem | null> {
    try {
      const response = await this.makeRequest(`${API_BASE_URL}/product/details/${sno}`);
      const text = await response.text();
      
      const parsed = JSON.parse(text);
      const item = parsed.data || parsed;
      
      if (!item) {
        return null;
      }

      return {
        ...item,
        ImagePaths: this.processImagePaths(item.ImagePath || ''),
        SUBITEMNAME: item.SUBITEMNAME || item.ItemName || 'Unknown Product',
        RATE: item.RATE || item.Rate || '0',
        GrandTotal: item.GrandTotal || item.RATE || item.Rate || '0',
        ITEMID: item.ITEMID || item.ItemId || `item_${Date.now()}`,
        SNO: item.SNO || item.Id || sno,
      };
    } catch (error) {
      console.error('❌ Error fetching product details:', error);
      return null;
    }
  }

  public async searchProducts(query: string, additionalFilters: ProductFilters = {}): Promise<ProductItem[]> {
    const searchFilters: ProductFilters = {
      ...additionalFilters,
      searchQuery: query.trim(),
    };

    return this.getFilteredProducts(searchFilters);
  }

  public async getProductsByCategory(
    itemName: string,
    subItemName?: string,
    additionalFilters: ProductFilters = {}
  ): Promise<ProductItem[]> {
    const categoryFilters: ProductFilters = {
      itemName,
      subItemName,
      ...additionalFilters,
    };

    return this.getFilteredProducts(categoryFilters);
  }

  // Enhanced specialized methods with adaptive pagination
  public async getTrendingProducts(limit?: number): Promise<ProductItem[]> {
    return this.getSpecialProducts('popular', limit);
  }

  public async getNewArrivals(limit?: number): Promise<ProductItem[]> {
    const products = await this.getSpecialProducts('newest', limit);
    return products.filter(product => product.NewArrival);
  }

  public async getFeaturedProducts(limit?: number): Promise<ProductItem[]> {
    const products = await this.getSpecialProducts(undefined, limit);
    return products.filter(product => product.Featured_Products);
  }

  private async getSpecialProducts(sortBy?: string, limit?: number): Promise<ProductItem[]> {
    const originalPage = this.currentPage;
    const originalHasMore = this._hasMoreData;
    const originalPageSize = this.currentPageSize;
    
    this.resetPagination();
    if (limit) {
      this.currentPageSize = Math.min(limit, this.paginationConfig.maxPageSize);
    }

    try {
      const filters: ProductFilters = {};
      if (sortBy) {
        filters.sortBy = sortBy as any;
      }
      
      const products = await this.getFilteredProducts(filters);
      return limit ? products.slice(0, limit) : products;
    } finally {
      this.currentPage = originalPage;
      this._hasMoreData = originalHasMore;
      this.currentPageSize = originalPageSize;
    }
  }

  public async getFilterOptions(): Promise<{
    genders: string[];
    occasions: string[];
    materials: string[];
    colors: string[];
    sizes: string[];
    categories: string[];
    brands: string[];
  }> {
    try {
      const response = await this.makeRequest(`${API_BASE_URL}/product/filters`);
      const data = await response.json();
      
      return {
        genders: data.genders || [],
        occasions: data.occasions || [],
        materials: data.materials || [],
        colors: data.colors || [],
        sizes: data.sizes || [],
        categories: data.categories || [],
        brands: data.brands || [],
      };
    } catch (error) {
      console.error('❌ Error fetching filter options:', error);
      return {
        genders: [],
        occasions: [],
        materials: [],
        colors: [],
        sizes: [],
        categories: [],
        brands: [],
      };
    }
  }
}

export const productService = new ProductService();
export { ProductService };