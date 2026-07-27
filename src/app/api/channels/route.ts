import { NextRequest } from 'next/server'
import { getChannels } from '@/lib/channels'

/**
 * API Route: GET /api/channels
 * 
 * Endpoint que devuelve la lista de canales disponibles.
 * Soporta filtrado por categoría y búsqueda por nombre.
 * 
 * Ejemplo: GET /api/channels?category=Deportes&search=ESPN
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  
  try {
    const result = await getChannels({ category, search })
    return Response.json(result)
  } catch (error) {
    console.error('Error fetching channels:', error)
    return Response.json(
      { error: 'Error al obtener los canales' },
      { status: 500 }
    )
  }
}