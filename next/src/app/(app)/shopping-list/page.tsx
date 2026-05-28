import { fetchWithAuth } from '@/lib/fetchWithAuth'
import ShoppingListClient from '@/components/ShoppingListClient'

export const dynamic = 'force-dynamic'

type ShoppingListItem = {
  id: number
  ingredient_name: string
  // 集約モデル (Shopify Cart 等の業界標準) のフィールド
  quantity: string | null
  unit: string
  added_count: number
  // 表示用文字列 (Server 側で IngredientFormatter で組み立て)
  ingredient_amount: string
  ingredient_category: string
  is_checked: boolean
  recipe_id: number
  recipe_title: string
  recipe_image_url: string | null
}

async function fetchShoppingList(): Promise<ShoppingListItem[]> {
  const RAILS_URL = process.env.RAILS_API_URL
  if (!RAILS_URL) {
    console.error('RAILS_API_URL is not set in environment variables')
    return []
  }

  // 認証ヘッダー / Cookie 欠落時の redirect / cache: 'no-store' は fetchWithAuth が処理する。
  const res = await fetchWithAuth(`${RAILS_URL}/api/v1/shopping_list_items`)

  if (!res.ok) return []
  return res.json()
}

export default async function ShoppingListPage() {
  // Cookie 欠落時の /login redirect は fetchShoppingList 内の fetchWithAuth が処理する。
  const items = await fetchShoppingList()

  return <ShoppingListClient initialItems={items} />
}
