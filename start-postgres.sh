#!/bin/bash
set -e
echo "Starting PostgreSQL container for dondecargo..."
docker compose up -d postgres
echo "PostgreSQL container started successfully."
echo "Connection: postgres://dondecargo:dondecargo@localhost:5432/dondecargo"

# Display information for .env file
echo ""
echo "=================================================="
echo "Add the following to your .env file:"
echo "=================================================="
echo "DATABASE_URL=postgresql://dondecargo:dondecargo@localhost:5433/dondecargo"
echo "=================================================="
echo ""
