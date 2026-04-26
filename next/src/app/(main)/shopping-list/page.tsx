import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ShoppingListClient from '@/components/ShoppingListClient'

export const dynamic = 'force-dynamic'

type ShoppingListItem = {
  id: number
  ingredient_name: string
  ingredient_amount: string
  ingredient_category: string
  is_checked: boolean
  recipe_id: number
  recipe_title: string
}

async function fetchShoppingList(): Promise<ShoppingListItem[]> {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return []
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) return []

  const res = await fetch(`${RAILS_URL}/api/v1/shopping_list_items`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
      client: client,
      uid: uid,
    },
    cache: 'no-store',
  })

  if (!res.ok) return []
  return res.json()
}

export default async function ShoppingListPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) {
    redirect('/login')
  }

  const items = await fetchShoppingList()

  return <ShoppingListClient initialItems={items} />
}
