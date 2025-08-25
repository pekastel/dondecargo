# DondeCargo

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**DondeCargo** is a platform for visualizing and managing fuel prices in Argentina. It combines official government data with user contributions to provide accurate and up-to-date fuel price information through a conversational interface (MCP in development) and an interactive map.

## Key Features

### Data Management
- **Real-time data** - Daily updated prices from official Argentine government sources
- **5 fuel types** - Gasoline, Premium Gasoline, Diesel, Premium Diesel, and CNG
- **Time variations** - Support for daytime and nighttime prices
- **Full history** - Preservation of all price changes with timestamps

### Interface and Experience
- **Interactive map** - Geographic visualization with custom markers
- **Conversational interface** - Natural command interaction via MCP (In development)
- **Responsive design** - Optimized experience for desktop and mobile
- **Favorites** - Mark stations for quick access and tracking

## Overall Architecture

DondeCargo offers a web-centered architecture, incorporating MCP as an additional and optional way to interact via natural language. The system supports conversational queries through MCP while also providing rich visualizations in the web interface.

### Architectural Principles

1. **MCP as an additional interface**: Natural command interaction as an alternative to the web UI
2. **Real-time data integration**: Direct connection with official Argentine government APIs
3. **Collaborative data management**: Authenticated users can propose updates

### Data Sources
- **Official data**: Daily CSV from http://datos.energia.gob.ar/
- **User contributions**: Reporting system

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database (local or cloud)
- Redis instance (optional, recommended in production)

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
Open `http://localhost:3000` to see DondeCargo.

## Tech Stack

DondeCargo is built with modern technologies for performance, scalability, and developer experience:
- **Next.js 15** App Router & TypeScript
- **shadcn/ui** for primitive components
- **PostgreSQL** + **Drizzle ORM**
- **Redis (Optional)** for session and conversation cache
- **Better Auth** for OIDC & PKCE flows
- **Vercel MCP Adapter** for MCP server creation
- **Argentine Government Data API** for integration
- **Interactive Maps** with OpenStreetMap/Leaflet for visualization
- **Nominatim** for geocoding

## License
[`MIT`](LICENSE)

---

Made with ❤️ by [Lumile Argentina](https://www.lumile.com.ar)
