import { fetchRecipes } from '@/lib/fetchRecipes'
import RecipeList from '@/components/RecipeList'

export default async function RecipesPage() {
  // サーバーサイドでレシピを取得
  const recipes = await fetchRecipes()

  // 取得したデータをRecipeListに渡す
  return <RecipeList recipes={recipes} />
}
