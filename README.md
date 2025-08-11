# DondeCargo

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**DondeCargo** es una plataforma conversacional para visualización y gestión de precios de combustibles en Argentina. Combina datos oficiales del gobierno con contribuciones de usuarios validados para proporcionar información precisa y actualizada sobre precios de combustibles a través de una interfaz conversacional y un mapa interactivo.

## Resumen Ejecutivo

- **Datos confiables**: Integración directa con APIs oficiales de datos abiertos del gobierno argentino
- **Colaboración comunitaria**: Sistema de validación de precios por usuarios autorizados
- **Interfaz conversacional**: Control completo a través de comandos en lenguaje natural vía MCP
- **Visualización intuitiva**: Mapa interactivo con geolocalización automática
- **Indexación SEO**: Páginas individuales por estación para búsquedas en Google
- **5 tipos de combustibles**: Nafta, Nafta Premium, Gasoil Grado 2, Gasoil Grado 3, y GNC
- **Precios diurnos/nocturnos**: Soporte para variaciones horarias en precios

---

## Table of Contents
1. [Features](#features)
2. [Architecture Overview](#architecture-overview)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [MCP Server](#mcp-server)
6. [One-Click Vercel Deploy](#one-click-vercel-deploy)
7. [How Does It Work? (Tech Stack)](#how-does-it-work-tech-stack)
8. [Why is all this goodness free?](#why-is-all-this-goodness-free)
9. [Roadmap](#roadmap)
10. [Contributing](#contributing)
11. [License](#license)

---

## Características Principales

### Gestión de Datos
- **Datos en tiempo real** - Precios actualizados diariamente desde fuentes oficiales del gobierno argentino
- **5 tipos de combustibles** - Nafta (92-95 Ron), Nafta Premium (>95 Ron), Gasoil Grado 2, Gasoil Grado 3 (premium), y GNC
- **Variaciones horarias** - Soporte para precios diurnos y nocturnos
- **Histórico completo** - Preservación de todos los cambios de precios con timestamps

### Sistema de Usuarios y Validación
- **4 tipos de usuarios**: Anónimo (solo visualización), Registrado (reportes propuestos), Validado (reportes oficiales), Administrador
- **Sistema de validación** - Proceso de verificación de identidad para usuarios validados
- **Ponderación diferenciada** - Mayor peso en la UI para reportes de usuarios validados
- **Gestión colaborativa** - Usuarios pueden proponer actualizaciones de precios

### Interfaz y Experiencia
- **Mapa interactivo** - Visualización geográfica con marcadores personalizados
- **Interfaz conversacional** - Control completo vía comandos naturales por MCP
- **Diseño responsive** - Experiencia optimizada para desktop y mobile
- **Temas claro/oscuro** - Implementado con `next-themes` y CSS variables
- **SEO optimizado** - Páginas individuales por estación para búsquedas

## Arquitectura General

DondeCargo implementa una arquitectura **conversacional-first** que redefine la interacción con datos de precios de combustibles. El sistema se adapta a consultas en lenguaje natural mientras proporciona visualizaciones ricas a través de una interfaz web opcional.

### Principios Arquitectónicos

1. **Interfaz conversacional primaria**: Toda la funcionalidad accesible mediante comandos naturales vía MCP
2. **Integración de datos en tiempo real**: Conexión directa con APIs oficiales del gobierno argentino
3. **Gestión colaborativa de datos**: Usuarios autenticados pueden proponer actualizaciones
4. **Sistema de intenciones extensible**: Nuevas capacidades sin rediseño de UI

### Arquitectura Técnica

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │     Datos       │
│   Next.js 15    │◄──►│   API Routes     │◄──►│ PostgreSQL +    │
│   React 19      │    │   tRPC          │    │   Drizzle ORM   │
│   TypeScript    │    │   Edge Runtime  │    │   Redis Cache   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Fuentes de Datos
- **Datos oficiales**: CSV diario desde http://datos.energia.gob.ar/
- **Contribuciones usuarios**: Sistema validado de reportes
- **Validación cruzada**: Verificación entre fuentes oficiales y usuarios

### Implementación MCP Protocol

DondeCargo expone funcionalidad completa a través de MCP tools para interacción conversacional:

#### Core MCP Tools

**Fuel Station Operations:**
```typescript
list_stations, get_station_details, search_stations_by_location
```

**Price Management Operations:**
```typescript
get_current_prices, get_price_history, propose_price_update
```

**Data Query Operations:**
```typescript
find_cheapest_fuel, compare_station_prices, get_regional_summary
```

**Collaborative Updates:**
```typescript
submit_price_correction, review_user_submissions, approve_price_change
```

#### Interface Hierarchy

1. **Primary Interface (MCP Protocol)**: Complete functionality accessible through natural language commands in any MCP-compatible client

This architecture ensures all business logic remains accessible through conversational interaction while providing traditional UI elements for visual preference.

### Data Model and Collaboration Architecture

DondeCargo implements a **collaborative data model** that balances accurate government data with community-driven updates:

#### Data Sources

**Official Government Data:**
- **Primary Source**: Argentine government open data APIs
- **Real-time Updates**: Automatic synchronization with official fuel price databases
- **Historical Records**: Complete price history for trend analysis

**Community Contributions:**
- **User Proposals**: Authenticated users can suggest price corrections
- **Moderation System**: Admin review process for community submissions

#### Data Integrity and Quality Controls

- **Source Validation**: All government data validated against official APIs
- **Update Moderation**: Community submissions require admin approval before publication
- **Audit Trail**: Complete history of all price changes with user attribution
- **Rollback Protection**: System prevents accidental deletion of historical price data

This architecture eliminates resource duplication while maintaining appropriate privacy boundaries and data integrity.

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database (local or cloud)
- Redis instance (optional, recommended for production)

### Setup Steps
```bash
# Clone repository
git clone https://github.com/pekastel/dondecargo.git
cd dondecargo

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
# 🔑 Fill in the required variables (see Configuration section)
# Generate AUTH_SECRET using: openssl rand -base64 32
# Or visit: https://www.better-auth.com/docs/installation#set-environment-variables

# Generate Better Auth schema (if needed)
npx @better-auth/cli generate --output drizzle/better-auth-schema.ts
# When prompted to overwrite existing schema, answer "yes"

# Generate database migrations
pnpm db:generate
# Creates new Drizzle migration files based on schema changes

# Run database migrations
pnpm db:migrate
# Applies all pending migrations to your database

# Optional: Load sample data for testing
pnpm db:seed
# Creates sample clients, projects, and time entries for development

# For development: Start PostgreSQL container using Docker
./start-postgres.sh
# This will start a PostgreSQL container with the dondecargo database
# The script will display the DATABASE_URL to add to your .env file

# Start development server
pnpm dev
```
Open `http://localhost:3000` and start using DondeCargo through conversation.

## Configuration

### Variables de Entorno Requeridas
| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon, Supabase, o local) |
| `BETTER_AUTH_SECRET` | Secreto para Better Auth (generar con: `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | URL base de tu aplicación (ej: `http://localhost:3000`) |
| `REDIS_URL` | Redis connection string (opcional, recomendado para producción) |
| `ENABLE_EMAIL_VERIFICATION` | Habilita la verificación de email para nuevos usuarios |

### Variables Opcionales
| Variable | Descripción |
|----------|-------------|
| `LOOPS_API_KEY` | API key para verificación de email via Loops.js |
| `NODE_ENV` | `development` o `production` |

### Sistema de Registro de Usuarios

DondeCargo implementa un sistema de 4 niveles de usuarios según el PRD:

1. **Usuario Anónimo**: Solo visualización de precios y datos
2. **Usuario Registrado**: Puede reportar precios propuestos (menor peso en UI)
3. **Usuario Validado**: Puede reportar precios oficiales (mayor peso en UI)
4. **Administrador**: Gestión completa de usuarios y validación de reportes

El registro está abierto por defecto en `/signup`. Los usuarios pueden solicitar validación mediante proceso de verificación de identidad.

```typescript
list_stations(location?: string)
get_station_details(station_id: string)
search_stations_by_location(lat: number, lng: number, radius?: number)
```

**Operaciones de Precios:**
```typescript
// Precios actuales por estación y tipo de combustible
get_current_prices(station_id?: string, fuel_type?: 'nafta' | 'nafta_premium' | 'gasoil_2' | 'gasoil_3' | 'gnc')

// Historial de precios con soporte para variaciones diurnas/nocturnas
get_price_history(station_id: string, days?: number, include_time_variants?: boolean)

// Búsqueda de precios más bajos por ubicación y tipo
find_cheapest_fuel(fuel_type: string, location?: string, radius_km?: number)
```

**Características Colaborativas:**
```typescript
// Proponer actualización de precios (según tipo de usuario)
propose_price_update(station_id: string, new_prices: object, user_type: 'registered' | 'validated')

// Obtener actualizaciones pendientes de revisión
get_pending_updates(station_id?: string)

// Revisar y aprobar/rechazar propuestas de usuarios
review_user_submissions(approve: boolean, submission_id: string, reviewer_notes?: string)

// Gestión de usuarios y permisos
validate_user_account(user_id: string, validation_level: 'registered' | 'validated')
```

### Email Verification Setup

DondeCargo includes email verification for new user registrations. This feature is enabled by default to keep the setup simple, but you can disable it for enhanced security.

### Why Email Verification?
- **Enhanced Security**: Ensures users have access to their registered email
- **Reduced Spam**: Prevents registration with fake email addresses
- **Better User Experience**: Users receive professional verification emails

### Setting up Email Verification

1. **Create a Loops.js Account**
   - Sign up at [loops.so](https://loops.so)
   - Get your API key from the dashboard

2. **Configure Email Template**
   - Create a new transactional email template in Loops.js
   - Use these variables in your template:
     - `{url}` - The verification link
     - `{homeurl}` - Your application's base URL
   - Note the template ID for configuration

3. **Configure Environment Variables**
   ```bash
   # Enable email verification
   ENABLE_EMAIL_VERIFICATION=true
   
   # Add your Loops.js API key
   LOOPS_API_KEY=your_loops_api_key_here
   
   # Optional: Use your custom template ID
   LOOPS_EMAIL_VERIFICATION_TEMPLATE_ID=your_template_id_here
   ```

4. **Restart your application** - Email verification is now enabled!

## One-Click Vercel Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpekastel%2Fdondecargo&env=BETTER_AUTH_SECRET,REDIS_URL,DATABASE_URL,LOOPS_API_KEY,LOOPS_EMAIL_VERIFICATION_TEMPLATE_ID,LOOPS_REPORT_PRICE_TEMPLATE_ID,LOOPS_CONTACT_TEMPLATE_ID,CONTACT_TO_EMAIL,ENABLE_EMAIL_VERIFICATION,NODE_ENV,BASE_URL)

1. Click the button above.
2. Populate the same env vars shown in the table.
3. Hit **Deploy**. Vercel will build the Next.js project and expose your MCP server.

## Estructura del Proyecto

### Arquitectura de Carpetas
```
app/
├── page.tsx                    # Landing page
├── buscar/
│   └── page.tsx               # Página principal del mapa interactivo
├── estacion/
│   └── [id]/
│       └── page.tsx           # Detalle individual de estación
├── login/page.tsx             # Inicio de sesión
└── signup/page.tsx            # Registro de usuarios

components/
├── ui/                        # Componentes shadcn/ui
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

### Rutas Principales
- `/` - Landing page con información general
- `/buscar` - Mapa interactivo principal
- `/estacion/[id]` - Detalle de estación individual (SEO optimizado)
- `/login` - Inicio de sesión de usuarios
- `/signup` - Registro de nuevos usuarios

## Stack Tecnológico

DondeCargo está construido con tecnologías modernas para rendimiento, escalabilidad y experiencia de desarrollador:
- **Next.js 15** App Router & TypeScript
- **shadcn/ui** for primitive components
- **PostgreSQL** + **Drizzle ORM**
- **Redis (Optional)** for session & conversation cache
- **Better Auth** (patched) for OIDC & PKCE flows
- **Vercel MCP Adapter** for MCP server creation
- **Argentine Government Data API** integration
- **Interactive Maps** with Mapbox/Leaflet for visualization
- **Nomatim** for geocoding
- **pnpm** monorepo tooling

## ¿Por qué es gratuito?
DondeCargo es desarrollado y mantenido por **[Lumile](https://www.lumile.com.ar)** para experimentar con tecnologías de punta como MCPs en escenarios reales. Al compartir el código, nos:
- Devolvemos a la comunidad que nos empoderó en nuestro trabajo diario.
- Recopilamos feedback que hace el producto mejor para todos.
- Demostramos cómo la IA conversacional puede transformar los patrones de acceso tradicionales a datos.

Si DondeCargo te ayuda a encontrar los mejores precios de combustible, considera darle una estrella ⭐ al repositorio o compartirlo con amigos!

## Contribuyendo
Los cambios son bienvenidos! Por favor, abre un issue primero para discutir cambios importantes. Asegúrate de que los tests pasen y sigue el estilo de codificación existente.

## Licencia
Este proyecto está licenciado bajo la **MIT License** — véase el archivo [`LICENSE`](LICENSE) para detalles.

---
Hecho con ❤️ por [Lumile](https://www.lumile.com.ar)