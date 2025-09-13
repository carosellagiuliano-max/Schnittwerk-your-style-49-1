import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { productService } from '@/services/productService';
import { customerService } from '@/services/customerService';

export function FeatureFlagDemo() {
  const [useRealAPI, setUseRealAPI] = useState(FEATURE_FLAGS.USE_REAL_API);
  const [productData, setProductData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testProductService = async () => {
    setLoading(true);
    try {
      const products = await productService.getProducts();
      setProductData(products);
    } catch (error) {
      setProductData({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testCustomerService = async () => {
    setLoading(true);
    try {
      const customers = await customerService.getCustomers();
      setCustomerData(customers);
    } catch (error) {
      setCustomerData({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Flag Demo: Backend Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="api-toggle" className="text-sm font-medium">
              Current API Mode:
            </label>
            <Badge variant={FEATURE_FLAGS.USE_REAL_API ? "default" : "secondary"}>
              {FEATURE_FLAGS.USE_REAL_API ? "Real API" : "Mock Data"}
            </Badge>
          </div>
          
          <div className="text-sm text-gray-600">
            To change the API mode, update the VITE_USE_REAL_API environment variable and restart the development server.
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Feature Flags Configuration:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>USE_REAL_API: {FEATURE_FLAGS.USE_REAL_API ? '✅' : '❌'}</div>
              <div>USE_MOCK_PRODUCTS: {FEATURE_FLAGS.USE_MOCK_PRODUCTS ? '✅' : '❌'}</div>
              <div>USE_MOCK_ORDERS: {FEATURE_FLAGS.USE_MOCK_ORDERS ? '✅' : '❌'}</div>
              <div>USE_MOCK_PAYMENTS: {FEATURE_FLAGS.USE_MOCK_PAYMENTS ? '✅' : '❌'}</div>
              <div>LOG_API_CALLS: {FEATURE_FLAGS.LOG_API_CALLS ? '✅' : '❌'}</div>
              <div>MOCK_DELAY: {FEATURE_FLAGS.MOCK_DELAY}ms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Service Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testProductService} disabled={loading}>
              {loading ? 'Loading...' : 'Test Product Service'}
            </Button>
            
            {productData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Result:</h4>
                {productData.error ? (
                  <div className="text-red-600">{productData.error}</div>
                ) : (
                  <div className="text-sm">
                    Loaded {productData.length} product categories
                    {productData.length > 0 && (
                      <div className="mt-2">
                        <div>First category: {productData[0].category}</div>
                        <div>Items in first category: {productData[0].items.length}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Service Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testCustomerService} disabled={loading}>
              {loading ? 'Loading...' : 'Test Customer Service'}
            </Button>
            
            {customerData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Result:</h4>
                {customerData.error ? (
                  <div className="text-red-600">{customerData.error}</div>
                ) : (
                  <div className="text-sm">
                    Loaded {customerData.length} customers
                    {customerData.length > 0 && (
                      <div className="mt-2">
                        <div>First customer: {customerData[0].name}</div>
                        <div>Total revenue: CHF {customerData[0].totalRevenue}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Feature flag system implemented</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Product service with mock/real API switching</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Customer service with mock/real API switching</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>CustomerManagement component updated to use service</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⏳</span>
              <span>Supabase database setup (requires environment configuration)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⏳</span>
              <span>Authentication service implementation</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⏳</span>
              <span>Appointment system implementation</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}