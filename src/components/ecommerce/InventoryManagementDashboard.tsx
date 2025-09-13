/**
 * Inventory Management Dashboard - Sprint C Week 9
 * Real-time inventory tracking with low stock alerts and Swiss compliance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus,
  Search,
  Filter,
  Download,
  Edit,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  InventoryService,
  SwissVATService,
  type InventoryItem
} from '@/services/api/ecommerceService';

interface InventoryWithProduct extends InventoryItem {
  product?: {
    id: string;
    name: string;
    category_id: string;
    price: number;
    image_url?: string;
    is_active: boolean;
  };
}

interface InventoryFilters {
  search?: string;
  low_stock_only?: boolean;
  category?: string;
}

export function InventoryManagementDashboard() {
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryWithProduct[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryWithProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [restockForm, setRestockForm] = useState({ quantity: 0, notes: '' });
  const [adjustmentForm, setAdjustmentForm] = useState({ quantity: 0, reason: '', notes: '' });

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inventory, filters]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      // This would be implemented in the service
      const mockInventory: InventoryWithProduct[] = [
        {
          id: '1',
          product_id: 'prod-1',
          sku: 'TH-SHAM-001',
          stock_quantity: 25,
          reserved_quantity: 3,
          available_quantity: 22,
          low_stock_threshold: 10,
          is_backorder_allowed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product: {
            id: 'prod-1',
            name: 'Trinity Haircare Repair Shampoo',
            category_id: 'shampoo',
            price: 32.90,
            image_url: '/products/trinity-repair-shampoo.jpg',
            is_active: true,
          }
        },
        {
          id: '2',
          product_id: 'prod-2',
          sku: 'TH-COND-001',
          stock_quantity: 8,
          reserved_quantity: 2,
          available_quantity: 6,
          low_stock_threshold: 10,
          is_backorder_allowed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product: {
            id: 'prod-2',
            name: 'Trinity Haircare Repair Conditioner',
            category_id: 'conditioner',
            price: 34.90,
            image_url: '/products/trinity-repair-conditioner.jpg',
            is_active: true,
          }
        },
        {
          id: '3',
          product_id: 'prod-3',
          sku: 'TL-OIL-001',
          stock_quantity: 0,
          reserved_quantity: 0,
          available_quantity: 0,
          low_stock_threshold: 5,
          is_backorder_allowed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product: {
            id: 'prod-3',
            name: 'TAILOR\'s Argan Oil Treatment',
            category_id: 'treatment',
            price: 45.90,
            image_url: '/products/tailors-argan-oil.jpg',
            is_active: true,
          }
        }
      ];
      
      setInventory(mockInventory);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      toast.error('Fehler beim Laden des Lagerbestands');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...inventory];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.product?.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search)
      );
    }

    if (filters.low_stock_only) {
      filtered = filtered.filter(item => 
        item.available_quantity <= item.low_stock_threshold
      );
    }

    setFilteredInventory(filtered);
  };

  const restockInventory = async (productId: string, quantity: number, notes: string) => {
    try {
      setUpdating(productId);
      await InventoryService.restockInventory(productId, quantity, notes);
      
      // Update local state
      setInventory(inventory.map(item => 
        item.product_id === productId 
          ? { 
              ...item, 
              stock_quantity: item.stock_quantity + quantity,
              available_quantity: item.available_quantity + quantity,
              last_restocked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : item
      ));
      
      toast.success(`Lagerbestand um ${quantity} Stück erhöht`);
      setRestockForm({ quantity: 0, notes: '' });
    } catch (error) {
      console.error('Failed to restock inventory:', error);
      toast.error('Fehler beim Auffüllen des Lagerbestands');
    } finally {
      setUpdating(null);
    }
  };

  const adjustInventory = async (productId: string, adjustment: number, reason: string, notes: string) => {
    try {
      setUpdating(productId);
      // This would be implemented in the service
      
      // Update local state
      setInventory(inventory.map(item => 
        item.product_id === productId 
          ? { 
              ...item, 
              stock_quantity: Math.max(0, item.stock_quantity + adjustment),
              available_quantity: Math.max(0, item.available_quantity + adjustment),
              updated_at: new Date().toISOString()
            }
          : item
      ));
      
      toast.success('Lagerbestand angepasst');
      setAdjustmentForm({ quantity: 0, reason: '', notes: '' });
    } catch (error) {
      console.error('Failed to adjust inventory:', error);
      toast.error('Fehler beim Anpassen des Lagerbestands');
    } finally {
      setUpdating(null);
    }
  };

  const getStockStatusBadge = (item: InventoryWithProduct) => {
    if (item.available_quantity === 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Ausverkauft
        </Badge>
      );
    }
    
    if (item.available_quantity <= item.low_stock_threshold) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Niedrig
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Verfügbar
      </Badge>
    );
  };

  const getStockTrendIcon = (item: InventoryWithProduct) => {
    const ratio = item.available_quantity / (item.low_stock_threshold || 1);
    
    if (ratio > 2) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (ratio < 1) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    
    return <BarChart3 className="h-4 w-4 text-yellow-500" />;
  };

  const InventoryDetailModal = ({ item }: { item: InventoryWithProduct }) => {
    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item.product?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex gap-4">
            <img
              src={item.product?.image_url || '/placeholder.svg'}
              alt={item.product?.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">SKU</Label>
                  <p className="font-medium">{item.sku}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Preis</Label>
                  <p className="font-medium">
                    {SwissVATService.formatCurrency(item.product?.price || 0)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Kategorie</Label>
                  <p className="font-medium">{item.product?.category_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  {getStockStatusBadge(item)}
                </div>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Lagerbestand</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600">{item.stock_quantity}</p>
                  <p className="text-sm text-muted-foreground">Gesamtbestand</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-orange-600">{item.reserved_quantity}</p>
                  <p className="text-sm text-muted-foreground">Reserviert</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">{item.available_quantity}</p>
                  <p className="text-sm text-muted-foreground">Verfügbar</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Mindestbestand:</span>
                  <span className="font-medium">{item.low_stock_threshold}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nachbestellung erlaubt:</span>
                  <span className="font-medium">
                    {item.is_backorder_allowed ? 'Ja' : 'Nein'}
                  </span>
                </div>
                {item.last_restocked_at && (
                  <div className="flex justify-between text-sm">
                    <span>Zuletzt aufgefüllt:</span>
                    <span className="font-medium">
                      {new Date(item.last_restocked_at).toLocaleDateString('de-CH')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Restock */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Auffüllen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Menge</Label>
                  <Input
                    type="number"
                    value={restockForm.quantity}
                    onChange={(e) => setRestockForm({ 
                      ...restockForm, 
                      quantity: parseInt(e.target.value) || 0 
                    })}
                    min="1"
                    placeholder="Anzahl Stück"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Notizen</Label>
                  <Textarea
                    value={restockForm.notes}
                    onChange={(e) => setRestockForm({ 
                      ...restockForm, 
                      notes: e.target.value 
                    })}
                    placeholder="Lieferant, Grund..."
                    rows={2}
                  />
                </div>
                
                <Button
                  onClick={() => restockInventory(item.product_id, restockForm.quantity, restockForm.notes)}
                  disabled={restockForm.quantity <= 0 || updating === item.product_id}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Auffüllen
                </Button>
              </CardContent>
            </Card>

            {/* Adjustment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Anpassen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Anpassung</Label>
                  <Input
                    type="number"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({ 
                      ...adjustmentForm, 
                      quantity: parseInt(e.target.value) || 0 
                    })}
                    placeholder="±Anzahl (negativ für Reduzierung)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Grund</Label>
                  <Input
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ 
                      ...adjustmentForm, 
                      reason: e.target.value 
                    })}
                    placeholder="Schaden, Verlust..."
                  />
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={adjustmentForm.quantity === 0 || !adjustmentForm.reason}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Anpassen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Lagerbestand anpassen</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sind Sie sicher, dass Sie den Lagerbestand um {adjustmentForm.quantity} Stück 
                        {adjustmentForm.quantity > 0 ? 'erhöhen' : 'reduzieren'} möchten?
                        <br />
                        <strong>Grund:</strong> {adjustmentForm.reason}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => adjustInventory(
                          item.product_id, 
                          adjustmentForm.quantity, 
                          adjustmentForm.reason,
                          adjustmentForm.notes
                        )}
                      >
                        Bestätigen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    );
  };

  const lowStockCount = inventory.filter(item => item.available_quantity <= item.low_stock_threshold).length;
  const outOfStockCount = inventory.filter(item => item.available_quantity === 0).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.stock_quantity * (item.product?.price || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lagerverwaltung</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtprodukte</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-xs text-muted-foreground">
              Aktive Produkte im Lager
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niedrige Bestände</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Unter Mindestbestand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausverkauft</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Nicht verfügbar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lagerwert</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {SwissVATService.formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gesamtwert aller Bestände
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Suche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Produktname, SKU..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nur niedrige Bestände</Label>
              <Button
                variant={filters.low_stock_only ? 'default' : 'outline'}
                onClick={() => setFilters({ ...filters, low_stock_only: !filters.low_stock_only })}
                className="w-full justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {filters.low_stock_only ? 'Alle anzeigen' : 'Nur niedrige Bestände'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Schnellaktionen</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ low_stock_only: true })}
                >
                  Nachbestellung
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ search: '' })}
                >
                  Alle
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lagerbestand ({filteredInventory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-lg">
                  <div className="h-16 w-16 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Produkte gefunden</p>
              <p className="text-sm">Ändern Sie die Filter oder fügen Sie Produkte hinzu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInventory.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                  <img
                    src={item.product?.image_url || '/placeholder.svg'}
                    alt={item.product?.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <h4 className="font-medium">{item.product?.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.sku}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold">{item.stock_quantity}</p>
                      <p className="text-xs text-muted-foreground">Gesamtbestand</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{item.reserved_quantity}</p>
                      <p className="text-xs text-muted-foreground">Reserviert</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{item.available_quantity}</p>
                      <p className="text-xs text-muted-foreground">Verfügbar</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        {getStockStatusBadge(item)}
                        {getStockTrendIcon(item)}
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Bearbeiten
                          </Button>
                        </DialogTrigger>
                        {selectedItem && <InventoryDetailModal item={selectedItem} />}
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InventoryManagementDashboard;