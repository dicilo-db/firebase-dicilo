# Dicilo Commodities & Commercial Assets Market
## Whitepaper & Architectural Design

### 1. Introduction
The **Dicilo Commodities & Commercial Assets Market** is a proposed extension to the platform designed to facilitate high-level commercial transactions involving physical assets, commodities, and real estate. Unlike traditional investment projects, this module targets buyers, sellers, and trade intermediaries (brokers) dealing in tangible and high-value provisions such as energy products (oil, gas), real estate, and major transport fleets.

The primary objective is to systematize the capture of trade offers and demands, accurately categorizing users by their operational role (Direct vs. Intermediary) and their financial expectations (Provisions/Commissions).

### 2. Core User Roles & Modalities
To accurately capture the user's position in a transaction, the system implements a two-tier classification:

#### 2.1 Primary Role
- **Comprador (Buyer):** Individuals or entities looking to acquire an asset or commodity.
- **Vendedor (Seller):** Individuals or entities offering an asset or commodity.

#### 2.2 Secondary Role (Modality)
- **Directo (Direct):** The user acts as the title holder of the asset (if selling) or the end-purchaser with direct capital (if buying).
- **Intermediario (Broker / Mandatario):** The user acts on behalf of the buyer or seller.

### 3. Commission (Provision) Structure
In B2B and commodities trading, commissions are commonly referred to as "provisions." The required data varies by modality:
- **For Intermediaries:** The system must capture the *Expected Provision* (e.g., "I expect 2% of the transaction value" or "I expect $1 per metric ton").
- **For Direct Players:** The system must capture the *Offered Provision* (e.g., "I am willing to pay an intermediary X% for a successful match").

### 4. Categorization (Rubros)
Assets and commodities are organized into strict categories to facilitate matching and filtering:
1. **Energía (Energy):**
   - Petróleo crudo (Crude Oil)
   - Gasolina (Gasoline)
   - Diésel, Jet Fuel (Aviation Fuel), etc.
2. **Bienes Raíces (Real Estate):**
   - Casas, Apartamentos.
   - Edificios, Terrenos comerciales.
3. **Transporte y Maquinaria (Transport & Machinery):**
   - Camiones, Flotas comerciales.
   - Maquinaria pesada.
4. **Commodities Generales:**
   - Oro, Metales preciosos.
   - Productos agrícolas (Azúcar, Soya, etc.)

### 5. Data Flow & Registration Process
The user will navigate through a dynamic, multi-step form within the Dicilo Dashboard:
1. **Role Selection:** "Are you a Buyer or a Seller?"
2. **Modality Selection:** "Are you Direct or an Intermediary?"
3. **Financials:** "What is your expected/offered provision?"
4. **Category Selection:** "Select the industry/rubro (e.g., Energy -> Oil)."
5. **Details Specification:** "Describe what you are offering or looking for (e.g., Volume, Specs, Origin, Target Price)."

### 6. Database Schema (Firestore)
A new collection `market_offers` will be created to keep this data separated from core user profiles and standard investment projects.

```typescript
interface MarketOffer {
    id: string;
    userId: string;
    createdAt: Timestamp;
    
    // Roles
    primaryRole: 'buyer' | 'seller';
    modality: 'direct' | 'intermediary';
    
    // Financials
    provisionType: 'percentage' | 'fixed_amount';
    provisionValue: number;
    provisionDescription?: string; // Optional context, e.g., "per barrel"
    
    // Categorization
    category: 'energy' | 'real_estate' | 'transport' | 'other';
    subCategory: string; // e.g., 'oil', 'truck_fleet'
    
    // Details
    title: string;
    description: string;
    volumeOrQuantity?: string;
    status: 'active' | 'negotiation' | 'closed';
}
```

### 7. Implementation Strategy
1. **Develop Data Models:** Define TypeScript interfaces and Firebase service endpoints (`createMarketOffer`, `getMarketOffers`).
2. **Build UI Components:** A wizard-style form in Next.js using Zod for robust validation of dynamic fields (e.g., requiring expected commission only if modality is 'intermediary').
3. **Dashboard Integration:** Add a "Mercado Comercial" (Commercial Market) section in the dashboard sidebar, accessible to verified users.

This architecture ensures a scalable, clean approach to separating conventional investing from B2B commodities trading within the Dicilo ecosystem.
