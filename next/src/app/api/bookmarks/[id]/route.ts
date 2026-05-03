import { proxyToRails } from '@/lib/proxyToRails'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return proxyToRails(`/api/v1/bookmarks/${id}`, { method: 'DELETE' })
}
