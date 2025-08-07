# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DondeCargo v2** es una plataforma conversacional para visualización y gestión de precios de combustibles en Argentina. La aplicación combina datos oficiales del gobierno con contribuciones de usuarios validados para proporcionar información precisa y actualizada sobre precios de combustibles a través de una interfaz conversacional (MCP) y un mapa interactivo.

### Propuesta de Valor
- **Datos confiables**: Integración directa con APIs oficiales de datos abiertos del gobierno argentino
- **Colaboración comunitaria**: Sistema de validación de precios por usuarios autorizados  
- **Interfaz conversacional**: Control completo a través de comandos en lenguaje natural vía MCP
- **Visualización intuitiva**: Mapa interactivo con geolocalización automática
- **Indexación SEO**: Páginas individuales por estación para búsquedas en Google
- **5 tipos de combustibles**: Nafta, Nafta Premium, Gasoil Grado 2, Gasoil Grado 3, y GNC
- **Precios diurnos/nocturnos**: Soporte para variaciones horarias en precios

## Arquitectura del Sistema

DondeCargo v2 implementa una arquitectura **conversacional-first** que prioriza la interacción natural con datos de precios de combustibles mediante MCP (Model Context Protocol).

### Principios Arquitectónicos
1. **Interfaz conversacional primaria**: Toda la funcionalidad accesible mediante comandos naturales vía MCP
2. **Integración de datos en tiempo real**: Conexión directa con APIs oficiales del gobierno argentino
3. **Gestión colaborativa de datos**: Usuarios autenticados pueden proponer actualizaciones
4. **Sistema de intenciones extensible**: Nuevas capacidades sin rediseño de UI

### Stack Tecnológico
- **Frontend**: Next.js 15 con App Router
- **Backend**: Next.js API Routes  
- **Base de datos**: PostgreSQL con Drizzle ORM
- **Cache**: Redis para datos de frecuente acceso
- **Mapas**: OpenStreetMap con Leaflet
- **Autenticación**: Better Auth con MCP plugin
- **Validación**: Zod schemas
- **Estilos**: Tailwind CSS + shadcn/ui components
- **MCP**: Model Context Protocol + Vercel MCP Adapter

### Estructura de Páginas Web
```
app/
├── page.tsx                    # Landing page
├── buscar/
│   └── page.tsx               # Página principal del mapa interactivo
├── estacion/
│   └── [id]/
│       └── page.tsx           # Detalle individual de estación (SEO optimizado)
├── login/page.tsx             # ✅ Ya existe - Inicio de sesión
└── signup/page.tsx            # ✅ Ya existe - Registro de usuarios

components/
├── ui/                        # shadcn/ui components
├── map/
│   ├── MapSearch.tsx         # Componente principal del mapa
│   ├── MapFilters.tsx        # Filtros por tipo de combustible
│   └── LocationSearch.tsx    # Buscador de ubicaciones
├── station/
│   ├── StationDetail.tsx     # Vista detalle de estación
│   ├── PriceHistory.tsx      # Gráfico histórico de precios
│   └── StationInfo.tsx       # Información básica de estación
└── layout/
    ├── Header.tsx            # Header global
    ├── Navigation.tsx        # Navegación principal
    └── Footer.tsx            # Footer
```

### Fuentes de Datos
- **Datos oficiales**: CSV diario desde http://datos.energia.gob.ar/
- **Contribuciones usuarios**: Sistema validado de reportes de precios
- **Validación cruzada**: Verificación entre fuentes oficiales y usuarios

### MCP Protocol Integration
DondeCargo expone funcionalidad completa a través de MCP tools:

**Operaciones de Estaciones:**
- `list_stations`, `get_station_details`, `search_stations_by_location`

**Gestión de Precios:**
- `get_current_prices`, `get_price_history`, `propose_price_update`

**Consultas de Datos:**
- `find_cheapest_fuel`, `compare_station_prices`, `get_regional_summary`

**Actualizaciones Colaborativas:**
- `submit_price_correction`, `review_user_submissions`, `approve_price_change`

### Authentication Flow
- **Better Auth**: Primary authentication system with MCP plugin support
- **OAuth 2.0**: Implements OAuth authorization server with custom `claudeai` scope
- **Database**: PostgreSQL for production, with Better Auth schema migrations
- **MCP Integration**: Uses `@vercel/mcp-adapter` to expose authenticated tools via MCP protocol

### Core Components
- `lib/auth.ts`: Better Auth configuration with MCP plugin and OAuth settings
- `app/api/auth/[...all]/route.ts`: Better Auth handlers for OAuth flows
- `app/api/[transport]/route.ts`: MCP tool endpoints with authentication middleware
- `app/.well-known/`: OAuth discovery endpoints for server metadata
- `lib/utils/url.ts`: Base URL resolution prioritizing custom domains over Vercel URLs

### API Endpoints (Read-Only)
- `app/api/estaciones/`: **READ-ONLY** endpoints for station data queries - no data modifications allowed
- `app/api/precios/`: **READ-ONLY** endpoints for price data queries - no data modifications allowed
- For data modifications, use MCP tools which provide proper authentication and validation

## Development Commands

```bash
# Development server with Turbopack
pnpm dev

# Build (includes migration run)
pnpm build

# Run migrations manually
npx @better-auth/cli migrate

# Drizzle database commands
pnpm db:setup     # Initial setup (Better Auth + Drizzle migrations)
pnpm db:generate  # Generate new migrations
pnpm db:migrate   # Run Drizzle migrations (RECOMMENDED)
pnpm db:push      # ⚠️  WARNING: Can conflict with Better Auth tables
pnpm db:studio    # Open Drizzle Studio

# Development data seeding
pnpm db:seed           # Seed database with sample data for development
pnpm test:reports-api  # Test reports API directly (bypasses auth)

# Testing commands
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode
pnpm test:coverage     # Generate coverage report
pnpm test:api          # Run API tests only
pnpm test:components   # Run component tests only
pnpm test:mcp          # Run MCP tools tests only
pnpm test:services     # Run service layer tests only

# Lint code
pnpm lint

# Test MCP connection with inspector
pnpm inspector
```

## Database Setup

The application uses a dual-database approach:
- **Better Auth**: Handles user authentication tables via SQL migrations
- **Drizzle ORM**: Manages tables 

**IMPORTANT**: Use migrations, not `db:push`, to avoid conflicts between Better Auth and Drizzle.

**Automatic Migrations**: Both Better Auth and Drizzle migrations run automatically during `pnpm build` via `scripts/run-migrations.js`. This ensures deployments on Vercel always have the latest schema.

For manual migration:
```bash
# Initial setup (recommended for new environments)
pnpm db:setup

# Individual migrations
npx @better-auth/cli migrate  # Better Auth first
pnpm db:migrate              # Then Drizzle

# Development workflow
pnpm db:generate  # Generate new Drizzle migrations
pnpm db:migrate   # Apply Drizzle migrations
```

## Testing Setup

The project has comprehensive test coverage using **Jest** and **React Testing Library**:

### Test Structure
- **`__tests__/api/`** - API route tests (Next.js endpoints)
- **`__tests__/mcp-tools/`** - MCP tools tests 
- **`__tests__/services/`** - Service layer tests (business logic)
- **`__tests__/components/`** - UI component tests (React components)
- **`__tests__/utils/`** - Test utilities and helpers
- **`__tests__/mocks/`** - Mock data and API responses

### Key Testing Features
- **Database Mocking**: All database operations are mocked for isolation
- **API Mocking**: HTTP requests are mocked using MSW patterns
- **Component Testing**: User interactions and state changes
- **Authentication Testing**: Better Auth sessions and user authorization
- **Error Handling**: Comprehensive error scenario testing

### Test Coverage
The test suite covers:
- ✅ API endpoints with authentication and validation
- ✅ MCP tools with success/error scenarios
- ✅ Service layer business logic
- ✅ UI components with user interactions
- ✅ Data filtering and pagination
- ✅ Export functionality

See `TESTING.md` for detailed testing guide and best practices.

### Quick Start (Recommended)
```bash
# Ensure your .env.local file has DATABASE_URL set
# Run the seed script with default test user
pnpm db:seed

# Test the reports API directly
pnpm test:reports-api
```

### Testing the Implementation
```bash
# 1. Seed the database
pnpm db:seed

# 2. Test APIs directly (bypasses auth)
pnpm test:reports-api

# 3. Start the dev server
pnpm dev

# 4. View reports at http://localhost:3000/reports
```

**Notes**: 
- The seed script uses `test-user-123` as the default user ID. For production testing, you'll need to either:
  1. Create a user with this ID in the auth system, or
- **Environment Variables**: Scripts automatically load from `.env.local` first, then `.env`
- **Database Connection**: Ensure your `DATABASE_URL` is properly set in your environment file

## Modelo de Datos

### Entidades Principales

**Estación de Servicio**
```typescript
{
  id: string;
  nombre: string;
  empresa: string;
  cuit: string;
  direccion: string;
  localidad: string;
  provincia: string;
  region: string;
  latitud: number;
  longitud: number;
  geojson: object;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

**Precio**
```typescript
{
  id: string;
  estacionId: string;
  tipoCombustible: 'nafta' | 'nafta_premium' | 'gasoil' | 'gasoil_premium' | 'gnc';
  precio: number;
  horario: 'diurno' | 'nocturno';
  fechaVigencia: Date;
  fuente: 'oficial' | 'usuario';
  usuarioId?: string;
  esValidado: boolean;
  fechaReporte: Date;
}
```

**Usuario**
```typescript
{
  id: string;
  email: string;
  nombre?: string;
  tipo: 'anonimo' | 'registrado' | 'validado' | 'admin';
  fechaRegistro: Date;
  fechaActualizacion: Date;
  reputacion: number;
}
```

## Environment Variables Required

### Variables Principales
- `DATABASE_URL`: PostgreSQL connection string (Neon, Supabase, o local)
- `AUTH_SECRET`: At least 32-character secret key (generar con: `openssl rand -base64 32`)
- `BETTER_AUTH_URL`: URL base de tu aplicación (ej: `http://localhost:3000`)
- `REDIS_URL`: (Optional) Redis connection string para producción

### Variables Opcionales
- `LOOPS_API_KEY`: API key para verificación de email via Loops.js
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Token para mapas interactivos (si usas Mapbox)
- `CRON_SECRET`: Secreto para endpoints de actualización automática
- `NODE_ENV`: `development` o `production`

## CORS Configuration

The application has extensive CORS setup in `next.config.ts` and individual route handlers to support MCP client connections from various origins including localhost and claude.ai domains.

## Better Auth Integration

### Authentication Architecture
This project uses **@pekastel/better-auth**, a custom branch of Better Auth with enhanced features:

- **Custom Branch**: Uses `@pekastel/better-auth` which includes enhanced PKCE support (PR #3091)
- **MCP Plugin**: Integrated MCP (Model Context Protocol) plugin for OAuth-based authentication
- **Admin Plugin**: Includes Better Auth admin plugin for user management and profile editing
- **OAuth 2.0**: Implements full OAuth authorization server with custom `claudeai` scope

### Better Auth Configuration
Key files and setup:
- `lib/auth.ts`: Main Better Auth configuration with MCP and admin plugins
- `app/api/auth/[...all]/route.ts`: Better Auth route handlers for all auth flows
- `lib/authClient.ts`: Client-side auth utilities and session management

### User Management Features
- **Profile Management**: Users can edit their profile through `/profile` page
- **Password Changes**: Secure password updates via `/profile/settings` page  
- **Admin Integration**: Uses Better Auth admin plugin for user CRUD operations
- **Session Management**: Automatic session handling with SWR integration

### Authentication Flow
1. **OAuth Login**: Users authenticate via OAuth 2.0 flow
2. **Session Creation**: Better Auth creates secure sessions with JWT tokens
3. **Client Access**: MCP clients can access tools using OAuth access tokens
4. **Profile Management**: Users can modify their data through admin plugin endpoints

### API Endpoints for Profile Management
- `POST /api/auth/admin/update-user`: Update user profile (name, email, password)
- `GET /api/auth/session`: Get current user session
- `POST /api/auth/sign-out`: Sign out and invalidate session

## Development Guidelines

### Client-Side Architecture
- **State Management**: Uses SWR for data fetching and React state for UI state
- **Authentication Guards**: All protected pages check authentication status and redirect as needed

### Component Organization Pattern
- **Client Components**: Large client components that represent full pages should be placed in the `components/` directory, not in the `app/` directory
- **Page Components**: App router pages should be minimal and simply import and render the corresponding client component from `components/`
- **Example**: `app/buscar/page.tsx` should import and render `components/MapSearchClient.tsx`
- **Directory Structure**: 
  - `components/` - Contains all reusable components and full-page client components
  - `app/` - Contains only Next.js App Router pages that import components
  - This pattern keeps the app directory clean and makes components more reusable

## UI/UX Design System

### Sistema de Colores
- **Primarios**: Gradiente azul-morado (#1E64C8 → #8E44AD) consistente con login/signup
- **Combustibles**: 
  - Nafta: #4ECDC4 (Teal)
  - Premium: #FF6B6B (Coral)
  - Gasoil: #45B7D1 (Sky blue)
  - GNC: #8E44AD (Purple)
- **Estados de precio**: Verde (bajo), Naranja (medio), Rojo (alto)

### Principios de Diseño
- **Mobile-first**: Priorizar experiencia móvil
- **Accesibilidad**: WCAG 2.1 AA compliance
- **Performance**: Optimizado para conexiones 3G
- **Microinteracciones**: Transiciones suaves de 200-300ms
- **Consistency**: Mantener coherencia visual con páginas existentes

### Componentes UI Clave
- **MapSearch**: Componente principal del mapa interactivo
- **MapFilters**: Panel de filtros avanzado (combustibles, precios, empresas)
- **StationDetail**: Vista completa de detalle de estación
- **PriceHistory**: Gráficos temporales de variaciones de precio
- **PriceReportPage**: Formulario para reportar precios por usuarios

### Responsive Design
- **Breakpoints**: Mobile (375px), Tablet (768px), Desktop (1024px), Wide (1440px)
- **Touch targets**: Mínimo 44x44px en móviles
- **Navigation**: Adaptable entre desktop sidebar y mobile bottom sheet

Ver `docs/ui.md` para especificaciones detalladas de mockups y componentes.