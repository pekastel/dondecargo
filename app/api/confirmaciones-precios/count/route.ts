import { NextRequest, NextResponse } from 'next/server'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { confirmacionesPrecios } from '@/drizzle/schema'
import { count, inArray } from 'drizzle-orm'

const connection = postgres(process.env.DATABASE_URL!)
const db = drizzle(connection)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const precioIds = searchParams.get('precioIds')?.split(',').filter(Boolean)

    if (!precioIds || precioIds.length === 0) {
      return NextResponse.json(
        { error: 'precioIds parameter is required' },
        { status: 400 }
      )
    }

    // Get confirmation counts for multiple prices
    const confirmationCounts = await db
      .select({
        precioId: confirmacionesPrecios.precioId,
        count: count(),
      })
      .from(confirmacionesPrecios)
      .where(inArray(confirmacionesPrecios.precioId, precioIds))
      .groupBy(confirmacionesPrecios.precioId)

    // Create a map for easy lookup, defaulting to 0 for prices without confirmations
    const countMap: Record<string, number> = {}
    precioIds.forEach(id => countMap[id] = 0)
    confirmationCounts.forEach(item => countMap[item.precioId] = item.count)

    return NextResponse.json(countMap)

  } catch (error) {
    console.error('Error fetching confirmation counts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}