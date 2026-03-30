import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const RAILS_URL = process.env.RAILS_API_URL

// コメント削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string; commentId: string }> },
) {
  const { recipeId, commentId } = await params

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const res = await fetch(
    `${RAILS_URL}/api/v1/recipes/${recipeId}/comments/${commentId}`,
    {
      method: 'DELETE',
      headers: {
        'access-token': accessToken,
        client: client,
        uid: uid,
      },
    },
  )

  return NextResponse.json({ message: '削除しました' }, { status: res.status })
}
