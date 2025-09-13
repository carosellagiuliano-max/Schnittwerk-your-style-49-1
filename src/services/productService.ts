import { supabase } from '@/config/api';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { apiService, type Product as APIProduct, type Category } from '@/services/api';

// Legacy product interface for compatibility with existing components
export interface Product {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  usage: string;
  price: string;
  image: string;
}

export interface ProductCategory {
  category: string;
  items: Product[];
}

export interface ProductService {
  getProducts(): Promise<ProductCategory[]>;
  getProductById(id: string): Promise<Product | null>;
  getProductsByCategory(category: string): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
}

// Convert API Product to legacy Product format for compatibility
const convertAPIProductToLegacy = (apiProduct: APIProduct, category?: Category): Product => ({
  id: apiProduct.id,
  name: apiProduct.name,
  description: apiProduct.description,
  detailedDescription: apiProduct.detailed_description || apiProduct.description,
  usage: apiProduct.usage_instructions || '',
  price: `CHF ${apiProduct.price}`,
  image: apiProduct.image_url || '/placeholder.svg',
});

// Mock product service using the new API service
class MockProductService implements ProductService {
  async getProducts(): Promise<ProductCategory[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log('[MOCK] Fetching all products via API service');
    }
    
    try {
      const [products, categories] = await Promise.all([
        apiService.getProducts(),
        apiService.getCategories()
      ]);
      
      // Group products by category
      const categoryMap = new Map<string, Category>();
      categories.forEach(cat => categoryMap.set(cat.id, cat));
      
      const productsByCategory = new Map<string, Product[]>();
      
      products.forEach(product => {
        const category = categoryMap.get(product.category_id);
        const categoryName = category?.name || 'Allgemein';
        
        if (!productsByCategory.has(categoryName)) {
          productsByCategory.set(categoryName, []);
        }
        
        productsByCategory.get(categoryName)!.push(
          convertAPIProductToLegacy(product, category)
        );
      });
      
      return Array.from(productsByCategory.entries()).map(([category, items]) => ({
        category,
        items,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Fetching product by ID: ${id}`);
    }
    
    try {
      const product = await apiService.getProduct(id);
      if (!product) return null;
      
      return convertAPIProductToLegacy(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  async getProductsByCategory(categoryName: string): Promise<Product[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Fetching products for category: ${categoryName}`);
    }
    
    try {
      const categories = await apiService.getCategories();
      const category = categories.find(cat => cat.name === categoryName);
      
      if (!category) return [];
      
      const products = await apiService.getProductsByCategory(category.id);
      return products.map(product => convertAPIProductToLegacy(product, category));
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Searching products for: ${query}`);
    }
    
    try {
      const products = await apiService.getProducts();
      const searchTerm = query.toLowerCase();
      
      const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        (product.detailed_description && product.detailed_description.toLowerCase().includes(searchTerm))
      );
      
      return filteredProducts.map(product => convertAPIProductToLegacy(product));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
}

// Factory function to get the appropriate service
export function createProductService(): ProductService {
  // Since we're now using the API service pattern, we always use the mock service
  // which internally delegates to the API service that handles mock/real switching
  return new MockProductService();
}

// Export singleton instance
export const productService = createProductService();