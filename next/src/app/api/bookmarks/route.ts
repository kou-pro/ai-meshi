import { proxyToRails } from '@/lib/proxyToRails'

export const dynamic = 'force-dynamic'

export async function GET() {
  return proxyToRails('/api/v1/bookmarks')
}

export async function POST(request: Request) {
  const body = await request.json()
  return proxyToRails('/api/v1/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ recipe_id: body.recipe_id }),
  })
}
