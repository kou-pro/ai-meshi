import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

type ShoppingListItem = {
  id: number
  ingredient_name: string
  ingredient_amount: string
  is_checked: boolean
  recipe_id: number
  recipe_title: string
}

async function fetchShoppingList(): Promise<ShoppingListItem[]> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access-token')?.value
  const client = cookieStore.get('client')?.value
  const uid = cookieStore.get('uid')?.value

  if (!accessToken || !client || !uid) return []

  const res = await fetch('http://rails:3000/api/v1/shopping_list_items', {
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

  // 未ログインの場合はログインページへ
  if (!accessToken || !client || !uid) {
    redirect('/login')
  }

  const items = await fetchShoppingList()

  // レシピごとにグループ化する
  const groupedItems = items.reduce(
    (acc, item) => {
      // recipe_id をキーにしてグループ化
      if (!acc[item.recipe_id]) {
        acc[item.recipe_id] = {
          recipe_title: item.recipe_title,
          items: [],
        }
      }
      acc[item.recipe_id].items.push(item)
      return acc
    },
    {} as Record<number, { recipe_title: string; items: ShoppingListItem[] }>,
  )

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">買い物リスト</h1>

      {items.length === 0 ? (
        // アイテムが0件の場合
        <p className="text-gray-500">買い物リストに何も追加されていません。</p>
      ) : (
        // レシピごとにグループ表示
        Object.entries(groupedItems).map(([recipeId, group]) => (
          <div key={recipeId} className="mb-8">
            {/* レシピ名 */}
            <h2 className="text-lg font-bold mb-3 text-gray-700">
              {group.recipe_title}
            </h2>
            {/* 材料一覧 */}
            <ul
              className="border border-gray-200 rounded-lg divide-y divide-gray-200"
              style={{ listStyle: 'none', padding: 0 }}
            >
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center px-4 py-3 text-sm"
                >
                  <span
                    style={{
                      color: item.is_checked ? '#9ca3af' : '#374151',
                      textDecoration: item.is_checked ? 'line-through' : 'none',
                    }}
                  >
                    {item.ingredient_name}
                  </span>
                  <span className="text-gray-500">
                    {item.ingredient_amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}
