/**
 * Enhanced Shopping Cart Component - Sprint C Week 9
 * Persistent cart with inventory validation and Swiss VAT compliance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Gift, 
  AlertTriangle,
  Package,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  PersistentCartService, 
  SwissVATService,
  InventoryService,
  type PersistentCart,
  type CartItemPersistent,
  type InventoryItem
} from '@/services/api/ecommerceService';

interface EnhancedShoppingCartProps {
  customerId?: string;
  sessionId?: string;
  onCheckout?: (cart: PersistentCart) => void;
  className?: string;
}

interface CartItemWithInventory extends CartItemPersistent {
  inventory?: InventoryItem;
  hasStockIssue?: boolean;
}

export function EnhancedShoppingCart({
  customerId,
  sessionId,
  onCheckout,
  className
}: EnhancedShoppingCartProps) {
  const [cart, setCart] = useState<PersistentCart | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isGiftWrapped, setIsGiftWrapped] = useState(false);
  const [giftWrapGender, setGiftWrapGender] = useState<'men' | 'women'>('women');
  const [showInventoryWarnings, setShowInventoryWarnings] = useState(false);

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, [customerId, sessionId]);

  // Check inventory for all items when cart changes
  useEffect(() => {
    if (cart?.items) {
      checkInventoryForAllItems();
    }
  }, [cart?.items]);

  const loadCart = async () => {
    try {
      setLoading(true);
      let existingCart = await PersistentCartService.getCart(customerId, sessionId);
      
      if (!existingCart) {
        existingCart = await PersistentCartService.createCart(customerId, sessionId);
      }
      
      setCart(existingCart);
      setIsGiftWrapped(existingCart.is_gift_wrapped);
      setGiftWrapGender(existingCart.gift_wrap_gender || 'women');
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast.error('Fehler beim Laden des Warenkorbs');
    } finally {
      setLoading(false);
    }
  };

  const checkInventoryForAllItems = async () => {
    if (!cart?.items) return;

    try {
      const itemsWithInventory: CartItemWithInventory[] = [];
      let hasStockIssues = false;

      for (const item of cart.items) {
        const inventory = await InventoryService.getProductInventory(item.product_id);
        const hasStockIssue = !inventory || inventory.available_quantity < item.quantity;
        
        if (hasStockIssue) {
          hasStockIssues = true;
        }

        itemsWithInventory.push({
          ...item,
          inventory,
          hasStockIssue,
        });
      }

      setCartItems(itemsWithInventory);
      setShowInventoryWarnings(hasStockIssues);
    } catch (error) {
      console.error('Failed to check inventory:', error);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (!cart) return;

    try {
      setUpdating(itemId);
      
      if (newQuantity <= 0) {
        await removeItem(itemId);
        return;
      }

      // Check inventory before updating
      const item = cartItems.find(i => i.id === itemId);
      if (item?.inventory && item.inventory.available_quantity < newQuantity) {
        toast.error(`Nur ${item.inventory.available_quantity} Stück verfügbar`);
        return;
      }

      // Update cart (this will handle inventory reservation)
      const updatedCart = await PersistentCartService.updateCartTotals(cart.id);
      setCart(updatedCart);
      
      toast.success('Warenkorb aktualisiert');
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('Fehler beim Aktualisieren der Menge');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!cart) return;

    try {
      setUpdating(itemId);
      const updatedCart = await PersistentCartService.removeFromCart(cart.id, itemId);
      setCart(updatedCart);
      toast.success('Artikel entfernt');
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error('Fehler beim Entfernen des Artikels');
    } finally {
      setUpdating(null);
    }
  };

  const toggleGiftWrap = async () => {
    if (!cart) return;

    try {
      // This would be implemented in the service
      setIsGiftWrapped(!isGiftWrapped);
      toast.success(isGiftWrapped ? 'Geschenkverpackung entfernt' : 'Geschenkverpackung hinzugefügt');
    } catch (error) {
      console.error('Failed to toggle gift wrap:', error);
      toast.error('Fehler bei der Geschenkverpackung');
    }
  };

  const handleCheckout = () => {
    if (!cart || cartItems.length === 0) {
      toast.error('Warenkorb ist leer');
      return;
    }

    if (showInventoryWarnings) {
      toast.error('Bitte beheben Sie die Lagerbestandsprobleme vor dem Checkout');
      return;
    }

    onCheckout?.(cart);
  };

  const getStockStatusBadge = (item: CartItemWithInventory) => {
    if (!item.inventory) {
      return <Badge variant="destructive">Nicht verfügbar</Badge>;
    }

    if (item.hasStockIssue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Nur {item.inventory.available_quantity} verfügbar
        </Badge>
      );
    }

    if (item.inventory.available_quantity <= item.inventory.low_stock_threshold) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Wenige verfügbar
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

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Warenkorb
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ihr Warenkorb ist leer</p>
            <p className="text-sm">Fügen Sie Produkte hinzu, um zu beginnen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const vatCalculation = SwissVATService.calculateVAT(cart.subtotal);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Warenkorb ({cartItems.length})
          </div>
          {showInventoryWarnings && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Lagerbestandsprobleme
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                <img
                  src={item.image_url || '/placeholder.svg'}
                  alt={item.product_name}
                  className="w-16 h-16 object-cover rounded"
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.product_name}</h4>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      <p className="font-medium">
                        {SwissVATService.formatCurrency(item.product_price)}
                      </p>
                    </div>
                    {getStockStatusBadge(item)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updating === item.id}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                        min="0"
                        max={item.inventory?.available_quantity || 99}
                        disabled={updating === item.id}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={
                          updating === item.id || 
                          (item.inventory && item.quantity >= item.inventory.available_quantity)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={updating === item.id}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {item.hasStockIssue && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      Reduzieren Sie die Menge auf {item.inventory?.available_quantity || 0} oder weniger
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* Gift Wrapping */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="gift-wrap" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Geschenkverpackung (+CHF 5.00)
            </Label>
            <Switch
              id="gift-wrap"
              checked={isGiftWrapped}
              onCheckedChange={toggleGiftWrap}
            />
          </div>

          {isGiftWrapped && (
            <div className="flex gap-2">
              <Button
                variant={giftWrapGender === 'women' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGiftWrapGender('women')}
              >
                Für Sie
              </Button>
              <Button
                variant={giftWrapGender === 'men' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGiftWrapGender('men')}
              >
                Für Ihn
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Zwischensumme:</span>
            <span>{SwissVATService.formatCurrency(vatCalculation.subtotal)}</span>
          </div>
          
          {isGiftWrapped && (
            <div className="flex justify-between text-sm">
              <span>Geschenkverpackung:</span>
              <span>{SwissVATService.formatCurrency(5.00)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span>MwSt. (7.7%):</span>
            <span>{SwissVATService.formatCurrency(vatCalculation.vat_amount)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-medium text-lg">
            <span>Gesamt:</span>
            <span>{SwissVATService.formatCurrency(vatCalculation.total_amount)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button 
          onClick={handleCheckout}
          disabled={showInventoryWarnings || cartItems.length === 0}
          className="w-full"
          size="lg"
        >
          {showInventoryWarnings ? (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Lagerbestandsprobleme beheben
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Zur Kasse ({SwissVATService.formatCurrency(vatCalculation.total_amount)})
            </>
          )}
        </Button>

        {/* Inventory Warning Summary */}
        {showInventoryWarnings && (
          <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-600" />
            <strong>Hinweis:</strong> Einige Artikel haben Lagerbestandsprobleme. 
            Passen Sie die Mengen an, um fortzufahren.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnhancedShoppingCart;