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

// Enhanced product service with auto pagination and better error handling
class ProductService {
  private static instance: ProductService;
  private currentPage: number = 0;
  private pageSize: number = 10;
  private _hasMoreData: boolean = true;
  private totalItems: number = 0;
  private lastFilters: string = '';
  private cache: Map<string, ProductItem[]> = new Map();
  private readonly BASE_IMAGE_URL = 'https://app.bmgjewellers.com';
  private readonly MAX_RETRIES = 3;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Singleton pattern
    if (ProductService.instance) {
      return ProductService.instance;
    }
    ProductService.instance = this;
  }

  /**
   * Reset pagination state - call when filters change
   */
  public resetPagination(): void {
    this.currentPage = 0;
    this._hasMoreData = true;
    this.totalItems = 0;
    this.lastFilters = '';
  }

  /**
   * Check if more data is available for pagination
   */
  public hasMoreData(): boolean {
    return this._hasMoreData;
  }

  /**
   * Get current page number
   */
  public getCurrentPage(): number {
    return this.currentPage;
  }

  /**
   * Get total items count
   */
  public getTotalItems(): number {
    return this.totalItems;
  }

  /**
   * Clear cache - useful for force refresh
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key from filters
   */
  private generateCacheKey(filters: ProductFilters, page: number): string {
    const filterString = JSON.stringify({
      ...filters,
      page,
      pageSize: this.pageSize
    });
    return btoa(filterString); // Base64 encode for clean key
  }

  /**
   * Check if filters have changed
   */
  private hasFiltersChanged(filters: ProductFilters): boolean {
    const currentFiltersString = JSON.stringify(filters);
    const changed = this.lastFilters !== currentFiltersString;
    this.lastFilters = currentFiltersString;
    return changed;
  }

  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters: ProductFilters, page: number): URLSearchParams {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: this.pageSize.toString(),
    });

    // Add filters only if they have meaningful values
    const filterMapping = {
      itemName: filters.itemName,
      subItemName: filters.subItemName,
      gender: filters.gender,
      occasion: filters.occasion,
      colorAccent: filters.colorAccent,
      materialFinish: filters.materialFinish,
      sizeName: filters.sizeName,
      searchQuery: filters.searchQuery,
      sortBy: filters.sortBy,
    };

    Object.entries(filterMapping).forEach(([key, value]) => {
      if (value && value.toString().trim() !== '') {
        queryParams.append(key, value.toString().trim());
      }
    });

    // Add price range if specified
    if (filters.minGrandTotal !== undefined && filters.minGrandTotal > 0) {
      queryParams.append('minGrandTotal', filters.minGrandTotal.toString());
    }
    
    if (filters.maxGrandTotal !== undefined && filters.maxGrandTotal < 100000) {
      queryParams.append('maxGrandTotal', filters.maxGrandTotal.toString());
    }

    return queryParams;
  }

  /**
   * Process image paths from API response
   */
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
      
      // Fallback: treat as single path if it's a string
      if (typeof imagePath === 'string' && imagePath.trim() !== '') {
        const path = imagePath.trim();
        return [path.startsWith('http') ? path : `${this.BASE_IMAGE_URL}${path}`];
      }
    }
    
    return [];
  }

  /**
   * Make HTTP request with retries
   */
  private async makeRequest(url: string, retries: number = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000)); // Exponential backoff
        return this.makeRequest(url, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Enhanced getFilteredProducts with automatic pagination management
   */
  public async getFilteredProducts(filters: ProductFilters = {}): Promise<ProductItem[]> {
    try {
      // Check if filters changed - if so, reset pagination
      if (this.hasFiltersChanged(filters)) {
        this.resetPagination();
      }

      // Check if we have more data to load
      if (!this._hasMoreData && this.currentPage > 0) {
        console.log('📄 No more data available');
        return [];
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(filters, this.currentPage);

      // Check cache first (for repeated requests)
      if (this.cache.has(cacheKey)) {
        console.log('💾 Returning cached data for page', this.currentPage);
        const cachedData = this.cache.get(cacheKey)!;
        this.currentPage++;
        return cachedData;
      }

      // Build API URL
      const queryParams = this.buildQueryParams(filters, this.currentPage);
      const apiUrl = `${API_BASE_URL}/product/items/filter?${queryParams.toString()}`;

      console.log(`🔍 Fetching products - Page: ${this.currentPage}, Filters:`, filters);

      // Make API request
      const response = await this.makeRequest(apiUrl);
      const text = await response.text();

      // Parse response
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        console.error('❌ JSON parse error:', err);
        console.error('📄 Response text:', text);
        throw new Error('Invalid JSON response from server');
      }

      // Validate response structure
      if (!parsed || typeof parsed !== 'object') {
        console.error('❌ Invalid response structure:', parsed);
        throw new Error('Invalid response format from server');
      }

      // Extract data from response
      const items = parsed.data || parsed.items || parsed;
      const total = parsed.total || parsed.totalCount || 0;

      if (!Array.isArray(items)) {
        console.warn('⚠️ No items array in response:', parsed);
        this._hasMoreData = false;
        return [];
      }

      // Update pagination state
      this.totalItems = total;
      const itemsCount = items.length;
      
      if (itemsCount < this.pageSize) {
        this._hasMoreData = false;
        console.log('📄 Reached end of data - received', itemsCount, 'items');
      }

      // Process products
      const products: ProductItem[] = items.map((item: any) => ({
        ...item,
        ImagePaths: this.processImagePaths(item.ImagePath || ''),
        // Ensure required fields have fallback values
        SUBITEMNAME: item.SUBITEMNAME || item.ItemName || 'Unknown Product',
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
        // Boolean fields with proper defaults
        Best_Design: Boolean(item.Best_Design),
        NewArrival: Boolean(item.NewArrival),
        Featured_Products: Boolean(item.Featured_Products),
        Top_Trending: Boolean(item.Top_Trending),
      }));

      // Cache the results
      if (products.length > 0) {
        this.cache.set(cacheKey, products);
        
        // Clean old cache entries (simple LRU-like behavior)
        if (this.cache.size > 50) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
      }

      // Increment page for next request
      this.currentPage++;

      console.log(`✅ Successfully fetched ${products.length} products (Page: ${this.currentPage - 1})`);
      return products;

    } catch (error) {
      console.error('❌ ProductService.getFilteredProducts error:', error);
      
      // Reset pagination on error to allow retry
      if (this.currentPage === 0) {
        this._hasMoreData = false;
      }
      
      // Provide more specific error messages
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

  /**
   * Get product details by ID
   */
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

  /**
   * Search products with enhanced query processing
   */
  public async searchProducts(
    query: string, 
    additionalFilters: ProductFilters = {}
  ): Promise<ProductItem[]> {
    const searchFilters: ProductFilters = {
      ...additionalFilters,
      searchQuery: query.trim(),
    };

    return this.getFilteredProducts(searchFilters);
  }

  /**
   * Get products by category
   */
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

  /**
   * Get trending products
   */
  public async getTrendingProducts(limit: number = 20): Promise<ProductItem[]> {
    // Reset pagination for this specific call
    const originalPage = this.currentPage;
    const originalHasMore = this._hasMoreData;
    
    this.resetPagination();
    this.pageSize = limit;

    try {
      const products = await this.getFilteredProducts({
        sortBy: 'popular'
      });
      return products;
    } finally {
      // Restore pagination state
      this.currentPage = originalPage;
      this._hasMoreData = originalHasMore;
      this.pageSize = 10; // Reset to default
    }
  }

  /**
   * Get new arrivals
   */
  public async getNewArrivals(limit: number = 20): Promise<ProductItem[]> {
    const originalPage = this.currentPage;
    const originalHasMore = this._hasMoreData;
    
    this.resetPagination();
    this.pageSize = limit;

    try {
      const products = await this.getFilteredProducts({
        sortBy: 'newest'
      });
      return products.filter(product => product.NewArrival);
    } finally {
      this.currentPage = originalPage;
      this._hasMoreData = originalHasMore;
      this.pageSize = 10;
    }
  }

  /**
   * Get featured products
   */
  public async getFeaturedProducts(limit: number = 20): Promise<ProductItem[]> {
    const originalPage = this.currentPage;
    const originalHasMore = this._hasMoreData;
    
    this.resetPagination();
    this.pageSize = limit;

    try {
      const products = await this.getFilteredProducts();
      return products.filter(product => product.Featured_Products);
    } finally {
      this.currentPage = originalPage;
      this._hasMoreData = originalHasMore;
      this.pageSize = 10;
    }
  }

  /**
   * Set custom page size
   */
  public setPageSize(size: number): void {
    if (size > 0 && size <= 100) {
      this.pageSize = size;
      this.resetPagination(); // Reset pagination when page size changes
    }
  }

  /**
   * Get available filter options (for dynamic filter UI)
   */
  public async getFilterOptions(): Promise<{
    genders: string[];
    occasions: string[];
    materials: string[];
    colors: string[];
    sizes: string[];
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
      };
    } catch (error) {
      console.error('❌ Error fetching filter options:', error);
      return {
        genders: [],
        occasions: [],
        materials: [],
        colors: [],
        sizes: [],
      };
    }
  }
}

// Export singleton instance
export const productService = new ProductService();

// Export class for type checking
export { ProductService };