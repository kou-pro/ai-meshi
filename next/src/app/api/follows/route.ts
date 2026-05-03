import { NextRequest } from 'next/server'
import { proxyToRails } from '@/lib/proxyToRails'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  return proxyToRails('/api/v1/follows', {
    method: 'POST',
    body: JSON.stringify({ following_id: body.following_id }),
  })
}
