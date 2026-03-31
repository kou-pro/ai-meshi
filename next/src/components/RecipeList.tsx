import { Recipe } from '@/lib/fetchRecipes'
import RecipeCard from '@/components/RecipeCard'

type Props = {
  recipes: Recipe[]
}

export default function RecipeList({ recipes }: Props) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">マイレシピ</h1>

      {recipes.length === 0 && (
        <p className="text-gray-500">まだレシピがありません</p>
      )}

      {/* カードグリッド表示 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
        }}
      >
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
