import { supabase } from '@/config/api';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { products } from '@/data/products';
import type { Product, ProductCategory } from '@/data/products';

export interface ProductService {
  getProducts(): Promise<ProductCategory[]>;
  getProductById(id: string): Promise<Product | null>;
  getProductsByCategory(category: string): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
}

// Mock product service using local data
class MockProductService implements ProductService {
  async getProducts(): Promise<ProductCategory[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log('[MOCK] Fetching all products');
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    
    return products;
  }

  async getProductById(id: string): Promise<Product | null> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Fetching product by ID: ${id}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    
    for (const category of products) {
      const product = category.items.find(item => item.id === id);
      if (product) return product;
    }
    
    return null;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Fetching products for category: ${category}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    
    const categoryData = products.find(cat => cat.category === category);
    return categoryData?.items || [];
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[MOCK] Searching products for: ${query}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, FEATURE_FLAGS.MOCK_DELAY));
    
    const allProducts = products.flatMap(cat => cat.items);
    const searchTerm = query.toLowerCase();
    
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.detailedDescription.toLowerCase().includes(searchTerm)
    );
  }
}

// Real product service using Supabase
class RealProductService implements ProductService {
  async getProducts(): Promise<ProductCategory[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log('[REAL] Fetching all products from Supabase');
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
    
    // Group products by category
    const categories = new Map<string, Product[]>();
    
    data.forEach(product => {
      const category = product.category || 'Allgemein';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      
      categories.get(category)!.push({
        id: product.id,
        name: product.name,
        description: product.description,
        detailedDescription: product.detailed_description || product.description,
        usage: product.usage || '',
        price: `CHF ${product.price}`,
        image: product.image_url || '/placeholder.svg',
      });
    });
    
    return Array.from(categories.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }

  async getProductById(id: string): Promise<Product | null> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[REAL] Fetching product by ID: ${id}`);
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      detailedDescription: data.detailed_description || data.description,
      usage: data.usage || '',
      price: `CHF ${data.price}`,
      image: data.image_url || '/placeholder.svg',
    };
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[REAL] Fetching products for category: ${category}`);
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching products by category:', error);
      throw new Error('Failed to fetch products by category');
    }
    
    return data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      detailedDescription: product.detailed_description || product.description,
      usage: product.usage || '',
      price: `CHF ${product.price}`,
      image: product.image_url || '/placeholder.svg',
    }));
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (FEATURE_FLAGS.LOG_API_CALLS) {
      console.log(`[REAL] Searching products for: ${query}`);
    }
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${query}%`)
      .or(`description.ilike.%${query}%`)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
    
    return data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      detailedDescription: product.detailed_description || product.description,
      usage: product.usage || '',
      price: `CHF ${product.price}`,
      image: product.image_url || '/placeholder.svg',
    }));
  }
}

// Factory function to get the appropriate service
export function createProductService(): ProductService {
  if (FEATURE_FLAGS.USE_REAL_API) {
    return new RealProductService();
  }
  return new MockProductService();
}

// Export singleton instance
export const productService = createProductService();