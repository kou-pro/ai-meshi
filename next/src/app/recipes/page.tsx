// Server Componentなのでasync/awaitが使える
import { fetchRecipes } from '@/lib/fetchRecipes'

export default async function RecipesPage() {
  // サーバーサイドでレシピを取得
  const recipes = await fetchRecipes()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">レシピ一覧</h1>

      {/* レシピが0件の場合 */}
      {recipes.length === 0 && (
        <p className="text-gray-500">まだレシピがありません</p>
      )}

      {/* レシピ一覧 */}
      <ul className="space-y-4">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="p-4 border border-gray-200 rounded-lg">
            <h2 className="text-lg font-semibold">{recipe.title}</h2>
            {/* contentがある場合のみ表示 */}
            {recipe.content && (
              <p className="text-gray-600 mt-1">{recipe.content}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
