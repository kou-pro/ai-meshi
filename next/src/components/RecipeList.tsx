import { Recipe } from '@/lib/fetchRecipes'
import RecipeCard from '@/components/RecipeCard'
import Link from 'next/link'

type Props = {
  recipes: Recipe[]
}

export default function RecipeList({ recipes }: Props) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">マイレシピ</h1>

      {recipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">まだレシピがありません</p>
          <Link
            href="/recipes/new"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            レシピを作る
          </Link>
        </div>
      )}

      {/* カードグリッド表示 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            id={recipe.id}
            title={recipe.title}
            imageUrl={recipe.image_url}
            userName={recipe.user.name}
            userId={recipe.user.id}
            createdAt={recipe.created_at}
            likesCount={recipe.likes_count}
            isPublished={recipe.is_published}
            commentsCount={recipe.comments_count}
          />
        ))}
      </div>
    </div>
  )
}
