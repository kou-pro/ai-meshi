import RecipeGenerationModal from '@/components/RecipeGenerationModal'

// 詳細ページのデータ取得 (Server Component fetch) 中に Next.js が
// 自動的に Suspense でラップして表示するフォールバック UI。
//
// レシピ生成直後の navigation では new/page.tsx の useTransition が
// pending を維持してくれるためモーダルが残るが、たとえば直接 URL を
// 叩いた場合や hover prefetch が間に合わなかった場合のために、ここでも
// 同じ生成中モーダルを表示してちらつきを防ぐ。
//
// 参考: https://nextjs.org/docs/app/api-reference/file-conventions/loading
export default function Loading() {
  return <RecipeGenerationModal isOpen />
}
