# 📋 Schritt-für-Schritt Anleitung: Frontend Migration

Diese Anleitung zeigt dir genau, was du noch selbst tun musst, um die PLAN.md Umsetzung zu vollenden.

## 🎯 Ziel
Die Frontend-Components auf das neue API Service Layer migrieren, damit sie die neuen Feature Flags verwenden.

## ⏱️ Geschätzte Zeit
**2-4 Stunden** für alle Components

## 🛠️ Schritt 1: Customer Management Component migrieren

### Datei: `src/components/admin/CustomerManagement.tsx`

**Was zu ändern ist:**
```typescript
// ❌ ALT - Diese Zeilen entfernen:
const mockCustomers = [
  // ... alle mock customer daten
];

// ✅ NEU - Diese Imports hinzufügen:
import { apiService, type Customer } from '@/services/api';
import { useEffect } from 'react';

// ✅ NEU - State und Data Loading hinzufügen:
const [customers, setCustomers] = useState<Customer[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };
  loadCustomers();
}, []);

// ✅ NEU - Alle Stellen wo 'mockCustomers' verwendet wird ersetzen:
// mockCustomers → customers
```

**Vollständige Code-Änderungen:**
1. Mock data löschen (Zeilen ~38-100)
2. API import hinzufügen
3. useState und useEffect für data loading
4. Alle `mockCustomers` Referenzen durch `customers` ersetzen

## 🛠️ Schritt 2: Products in Shopping/E-commerce Components

### Komponenten, die products.ts verwenden:

1. **Finde alle betroffenen Dateien:**
```bash
grep -r "from '@/data/products'" src/ --include="*.tsx"
```

2. **Für jede Datei:**
```typescript
// ❌ ALT - Entfernen:
import { products } from '@/data/products';

// ✅ NEU - Hinzufügen:
import { apiService, type Product } from '@/services/api';

// ✅ NEU - State und Loading:
const [products, setProducts] = useState<Product[]>([]);

useEffect(() => {
  const loadProducts = async () => {
    const data = await apiService.getProducts();
    setProducts(data);
  };
  loadProducts();
}, []);
```

## 🛠️ Schritt 3: Financial Overview Component

### Datei: `src/components/admin/FinancialOverview.tsx`

**Mock Data zu ersetzen:**
- `monthlyData`
- `serviceBreakdown`
- `dailyData` 
- `weeklyData`
- `yearlyData`

**Migration:**
```typescript
// ❌ ALT - Mock data arrays entfernen

// ✅ NEU - API Service verwenden:
import { apiService } from '@/services/api';

const [financialData, setFinancialData] = useState({
  monthly: [],
  services: [],
  daily: [],
  weekly: [],
  yearly: []
});

useEffect(() => {
  const loadFinancialData = async () => {
    // API Service bietet diese Methoden über mockService.ts
    const monthly = await apiService.getMonthlyFinancials();
    const services = await apiService.getServiceBreakdown();
    // ... etc
    setFinancialData({ monthly, services, ... });
  };
  loadFinancialData();
}, []);
```

## 🛠️ Schritt 4: Calendar/Appointment Components

### Datei: `src/components/admin/CalendarView.tsx`

**Mock Data zu ersetzen:**
- `mockAppointments`
- `mockWaitingList` 
- `mockEmployees`

```typescript
// ✅ NEU - API Service verwenden:
const [appointments, setAppointments] = useState<Appointment[]>([]);
const [waitingList, setWaitingList] = useState([]);
const [staff, setStaff] = useState([]);

useEffect(() => {
  const loadCalendarData = async () => {
    const [appointmentsData, waitingData, staffData] = await Promise.all([
      apiService.getAppointments(),
      apiService.getWaitingList(),
      apiService.getStaff()
    ]);
    setAppointments(appointmentsData);
    setWaitingList(waitingData);
    setStaff(staffData);
  };
  loadCalendarData();
}, []);
```

## 🛠️ Schritt 5: Shopping Cart Context

### Datei: `src/contexts/cart-context.tsx`

```typescript
// ✅ NEU - API Service für cart operations:
import { apiService } from '@/services/api';

// Cart operations über API Service:
const addToCart = async (productId: string, quantity: number) => {
  await apiService.addToCart(productId, quantity);
  // Update local state
};

const removeFromCart = async (productId: string) => {
  await apiService.removeFromCart(productId);
  // Update local state
};
```

## 🧪 Schritt 6: Testing & Validation

### Nach jeder Component-Migration:

1. **Component einzeln testen:**
```bash
npm run dev
# Navigiere zur entsprechenden Seite
# Prüfe Console auf Fehler
```

2. **Feature Flag Test:**
```bash
# In .env:
VITE_USE_REAL_API=false  # Mock-Daten
VITE_USE_REAL_API=true   # Echte API (wenn verfügbar)
```

3. **Build Test:**
```bash
npm run build
# Sollte ohne Fehler funktionieren
```

## 🚨 Häufige Probleme & Lösungen

### Problem 1: TypeScript Errors
```
Property 'xyz' does not exist on type 'Customer'
```
**Lösung:** Interface in `src/services/api/mockService.ts` prüfen und korrigieren

### Problem 2: Loading States
```
Components zeigen leere Daten während Loading
```
**Lösung:** Loading State hinzufügen:
```typescript
if (loading) return <div>Loading...</div>;
```

### Problem 3: Error Handling
```
API calls schlagen fehl
```
**Lösung:** Try-catch verwenden:
```typescript
try {
  const data = await apiService.getCustomers();
} catch (error) {
  console.error('API Error:', error);
  // Show error message to user
}
```

## ✅ Completion Checklist

Hake ab, wenn erledigt:

### Component Migrations:
- [ ] `CustomerManagement.tsx` migriert
- [ ] `ProductManagement.tsx` migriert (falls existiert)
- [ ] `FinancialOverview.tsx` migriert
- [ ] `CalendarView.tsx` migriert
- [ ] Shopping cart components migriert
- [ ] Alle product imports entfernt

### Testing:
- [ ] Alle Components laden ohne Fehler
- [ ] Feature Flag switching funktioniert
- [ ] Build erfolgreich
- [ ] Keine TypeScript Errors
- [ ] Console clean (keine Errors)

### Optional (Later):
- [ ] Loading states hinzugefügt
- [ ] Error handling verbessert
- [ ] Performance optimiert

## 🎉 Nach Completion

Wenn alle Checkboxen abgehakt sind:

1. **Sprint A ist 100% abgeschlossen** ✅
2. **Sprint B kann gestartet werden** ✅
3. **System ist produktionsbereit** ✅
4. **Feature Flags ermöglichen seamless deployment** ✅

## 💡 Pro Tips

1. **Eine Component nach der anderen migrieren** - nicht alles gleichzeitig
2. **Nach jeder Migration testen** - um Fehler früh zu erkennen
3. **Console prüfen** - für API call logs und errors
4. **Git commits nach jeder Component** - für einfaches rollback falls nötig

## 🆘 Wenn du Hilfe brauchst

Das API Service Layer ist so designt, dass es identische Interfaces hat:
- Mock Service gibt sofort realistische Daten zurück
- Supabase Service macht echte API calls
- Der Switch funktioniert automatisch über Feature Flags

Die TypeScript Interfaces in `mockService.ts` sind die "Source of Truth" für alle Datenstrukturen.