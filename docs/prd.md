# Product Requirements Document (PRD) - DondeCargo

## 1. Product Overview

**DondeCargo v2** is a platform for visualizing and managing fuel prices in Argentina. The app combines official government data with contributions from validated users to provide accurate and up-to-date fuel price information through a conversational interface and an interactive map. The platform also exposes price data via the Model Context Protocol (MCP).

### Value Proposition
- **Reliable data**: Direct integration with official Argentine open data APIs
- **Community collaboration**: Price validation system by authorized users
- **Conversational interface**: Full control through natural language commands (via MCP tools)
- **Intuitive visualization**: Interactive map with automatic geolocation
- **SEO indexing**: Individual station pages for Google search

## 2. Functional Requirements

### 2.1 Price Data Management

#### 2.1.1 Data Sources
- **Official Data**: Daily CSV consumption from http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv
- **User Data**: Price reports by registered and validated users
- **Price History**: Incremental storage of all price changes

#### 2.1.2 Supported Fuel Types
1. **Gasoline** (regular between 92–95 RON)
2. **Premium Gasoline** (more than 95 RON)
3. **Diesel Grade 2**
4. **Diesel Grade 3** (premium)
5. **CNG**

#### 2.1.3 Time Variations
- Daytime prices (normal hours)
- Nighttime prices (reduced hours)

#### 2.1.4 Update Process
- Automatic daily download of official data
- Incremental update in the database
- Duplicate and consistency validation
- Preservation of complete history

### 2.2 User Model and Permissions

#### 2.2.1 User Types
- **Anonymous User**: Price viewing only
- **Registered User**: Can report proposed prices
- **Validated User**: Can report official prices (higher weight in the UI)
- **Administrator**: Manages users and report validation

#### 2.2.2 Validation System
- Identity verification process for validated users
- Differentiated weighting in the interface by user type
- Reputation system based on report accuracy

### 2.3 Interface Features

#### 2.3.1 Interactive Map
- **Automatic geolocation**: Automatic detection of user location
- **Configurable search radius**: Adjustable distance to display stations
- **Price visualization**: Show current prices by fuel type
- **Dynamic filters**: By fuel type, company, min/max price
- **Address search**: Manual location search

#### 2.3.2 Station Details
- **Unique URL per station**: `/estacion/[id]` indexable by Google
- **SEO metadata**: Titles, descriptions, and structured data for search
- **Price history**: Time series chart of changes
- **Exact location**: Embedded map with marker
- **Complete information**: Address, company, hours, fuel types

#### 2.3.3 Price Reporting System
- **Intuitive form**: Select station, fuel type, price
- **Data validation**: Format and range checks
- **Visual confirmation**: Preview before sending
- **Report status**: Validation process tracking

### 2.4 Conversational Interface (MCP)

#### 2.4.1 Tools
- Price search by station name
- Price search by geographic location

#### 2.4.2 System Capabilities
- **Contextual search**: Understands locations, fuel types, price ranges
- **Smart comparison**: Automatic analysis of best options
- **Collaborative update**: Price reports via conversation
- **Notifications**: Alerts for price changes in favorite areas

## 3. Technical Requirements

### 3.1 System Architecture

#### 3.1.1 Tech Stack
- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Redis for frequently accessed data
- **Maps**: OpenStreetMap with Leaflet
- **Authentication**: Better Auth
- **Validation**: Zod schemas
- **Styles**: Tailwind CSS, based on shadcn UI components
- **MCP**: Model Context Protocol
- **Adapter**: Vercel MCP Adapter

#### 3.1.2 Architecture Patterns
- **Conversational-First**: MCP as a primary interface
- **SSR/SSG**: Next.js for SEO and performance
- **RESTful API**: Well-defined endpoints per resource
- **Microservices**: Update process separated from deploy

### 3.2 Data Model

#### 3.2.1 Main Entities

**Service Station**
```typescript
{
  id: string;
  name: string;
  company: string;
  cuit: string;
  address: string;
  city: string;
  province: string;
  region: string;
  latitude: number;
  longitude: number;
  geojson: object;
  createdAt: Date;
  updatedAt: Date;
}
```

**Price**
```typescript
{
  id: string;
  stationId: string;
  fuelType: 'gasoline' | 'premium_gasoline' | 'diesel' | 'premium_diesel' | 'cng';
  price: number;
  schedule: 'daytime' | 'nighttime';
  effectiveDate: Date;
  source: 'official' | 'user';
  userId?: string;
  isValidated: boolean;
  reportedAt: Date;
}
```

**User**
```typescript
{
  id: string;
  email: string;
  name?: string;
  type: 'anonymous' | 'registered' | 'validated' | 'admin';
  registeredAt: Date;
  updatedAt: Date;
  reputation: number;
}
```

#### 3.2.2 Indexes and Optimization
- Geospatial index on latitude/longitude for proximity searches
- Composite index on (stationId, fuelType, effectiveDate) for prices
- Index on (province, city) for geographic filters
- Full-text index on address for searches

### 3.3 Automated Processes

#### 3.3.1 Daily Price Update
- **Frequency**: Runs daily at 6 AM (Argentina time)
- **Process**: Separate script executed outside Vercel
- **Validation**: Data integrity verification
- **Rollback**: Backup system in case of failures
- **Notification**: Alerts in case of anomalies

#### 3.3.2 Data Maintenance
- **Cleanup**: Duplicate removal
- **Validation**: Geographic consistency checks
- **Normalization**: Unified address format
- **Archiving**: Compression of historical data

## 5. Security Requirements

### 5.1 Authentication and Authorization
- **JWT tokens**: Configurable expiration
- **Rate limiting**: Request limit per IP
- **Input validation**: Sanitization of all inputs
- **HTTPS**: All endpoints over HTTPS
- **CORS**: Restrictive cross-origin policies

## 6. SEO and Marketing Requirements

### 6.1 Search Engine Optimization
- **Dynamic meta tags**: Unique titles and descriptions per page
- **Schema.org**: Structured data for service stations
- **Sitemap.xml**: Automatic sitemap generation
- **Robots.txt**: Appropriate crawling configuration
- **Core Web Vitals**: Optimization for Google metrics

### 6.2 Content Indexing
- **SSR for station pages**: Server-side rendering
- **Friendly URLs**: Descriptive slugs by location
- **Open Graph**: Social media previews
- **Twitter Cards**: Social media integration

## 7. Usability Requirements

### 7.1 Accessibility (A11y)
- **Keyboard navigation**: Entire interface usable without a mouse
- **Screen reader support**: Appropriate ARIA labels
- **High contrast**: Light/dark mode with good legibility
- **Font sizes**: Scalable up to 200%

### 7.2 Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: 320px, 768px, 1024px, 1440px
- **Touch targets**: Minimum 44x44px on mobile
- **3G performance**: < 5 seconds on a 3G connection

## 8. Roadmap and Future Versions

### 8.1 Phase 1 (MVP)
- ✅ Integration with official data
- ✅ Basic interactive map
- ✅ User price reporting
- ✅ Basic authentication

### 8.2 Phase 2
- User validation system
- Push notifications for price changes
- Favorites and personalized areas
- Data export

### 8.3 Phase 3
- Native mobile app
- Integration with payment systems
- Loyalty programs
- Public API for developers

## 10. Appendix

### 10.1 Glossary of Terms
- **MCP**: Model Context Protocol
- **SSR**: Server-Side Rendering
- **CNG**: Compressed Natural Gas
- **RON**: Research Octane Number (octane rating)
- **TTL**: Time To Live (cache lifetime)

### 10.2 External Resources
- [Official price dataset](http://datos.energia.gob.ar/dataset/1c181390-5045-475e-94dc-410429be4b17/resource/80ac25de-a44a-4445-9215-090cf55cfda5/download/precios-en-surtidor-resolucin-3142016.csv)
- [MCP Specification](https://modelcontextprotocol.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenStreetMap API](https://wiki.openstreetmap.org/wiki/API_v0.6)

---

**Last updated**: August 4, 2025  
**Version**: 1.0.0  
**Author**: DondeCargo Team
