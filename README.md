# DondeCargo

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**DondeCargo** es una plataforma visualización y gestión de precios de combustibles en Argentina. Combina datos oficiales del gobierno con contribuciones de usuarios para proporcionar información precisa y actualizada sobre precios de combustibles a través de una interfaz conversacional (MCP en desarrollo) y un mapa interactivo.

## Características Principales

### Gestión de Datos
- **Datos en tiempo real** - Precios actualizados diariamente desde fuentes oficiales del gobierno argentino
- **5 tipos de combustibles** - Nafta, Nafta Premium, Diesel, Diesel Premium, y GNC
- **Variaciones horarias** - Soporte para precios diurnos y nocturnos
- **Histórico completo** - Preservación de todos los cambios de precios con timestamps

### Interfaz y Experiencia
- **Mapa interactivo** - Visualización geográfica con marcadores personalizados
- **Interfaz conversacional** - Interacción por comandos naturales vía MCP (En desarrollo)
- **Diseño responsive** - Experiencia optimizada para desktop y mobile
- **Favoritos** - Marcá estaciones para acceso rápido y seguimiento

## Arquitectura General

DondeCargo ofrece una arquitectura centrada en la web, incorporando MCP como una forma adicional y opcional de interactuar mediante lenguaje natural. El sistema admite consultas conversacionales a través de MCP y, al mismo tiempo, proporciona visualizaciones ricas en la interfaz web.

### Principios Arquitectónicos

1. **MCP como interfaz adicional**: Interacción por comandos naturales como alternativa a la UI web
2. **Integración de datos en tiempo real**: Conexión directa con APIs oficiales del gobierno argentino
3. **Gestión colaborativa de datos**: Usuarios autenticados pueden proponer actualizaciones

### Fuentes de Datos
- **Datos oficiales**: CSV diario desde http://datos.energia.gob.ar/
- **Contribuciones usuarios**: Sistema de reportes

### Pre-requisitos
- Node.js 18+ and pnpm
- PostgreSQL database (local o cloud)
- Redis instance (opcional, recomendado en producción)

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
Open `http://localhost:3000` para ver DondeCargo.

## Stack Tecnológico

DondeCargo está construido con tecnologías modernas para rendimiento, escalabilidad y experiencia de desarrollador:
- **Next.js 15** App Router & TypeScript
- **shadcn/ui** para componentes primitivos
- **PostgreSQL** + **Drizzle ORM**
- **Redis (Optional)** para cache de sesión y conversación
- **Better Auth** para OIDC & PKCE flows
- **Vercel MCP Adapter** para MCP server creation
- **Argentine Government Data API** para integración
- **Interactive Maps** con OpenStreetMap/Leaflet para visualización
- **Nominatim** para geocoding

## Licencia
[`MIT`](LICENSE)

---
Hecho con ❤️ por [Lumile Argentina](https://www.lumile.com.ar)