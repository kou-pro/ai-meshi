/**
 * 食材の数量と単位を、人間に読みやすい amount 文字列に整形する。
 *
 * # バックエンドとの一貫性
 * Rails 側の `IngredientFormatter` (app/services/ingredient_formatter.rb) と
 * 完全に同じロジック・同じキーワードリストを採用している。
 * バックエンドが買い物リストに保存する amount と、フロントが詳細ページで
 * 表示する amount を**必ず一致させる**ため、両者を分離させない。
 *
 * # 使い方
 *   formatIngredientAmount({ quantity: '1', unit: '大さじ' })  // => '大さじ1'
 *   formatIngredientAmount({ quantity: '適量', unit: 'g' })    // => '適量'
 *   formatIngredientAmount({ quantity: '100', unit: 'g' })     // => '100g'
 */

// 数値を伴わない量表現。これらが quantity に来た場合、unit は捨てる。
// 出典: 味の素パーク, DELISH KITCHEN, 素材力だし, 調理師標準表記
export const AMOUNT_ONLY_KEYWORDS = [
  '適量',
  '適宜',
  '少々',
  'ひとつまみ',
  'ふたつまみ',
  'ひとにぎり',
  '一握り',
  'ひとつかみ',
  'お好み',
  'お好みで',
  'お好みの量',
  'お好きな量',
  '各適量',
  '半分',
] as const

// 数量の前に来る単位 (香川綾 1948 規格)
export const UNIT_FIRST = ['大さじ', '小さじ', 'カップ'] as const

type FormatArgs = {
  quantity: string | null | undefined
  unit: string | null | undefined
}

export function formatIngredientAmount({ quantity, unit }: FormatArgs): string {
  const q = (quantity ?? '').trim()
  const u = (unit ?? '').trim()

  if (!q && !u) return ''
  if (!u) return q
  if (!q) return u

  // 「適量」等は単位を捨てる
  if ((AMOUNT_ONLY_KEYWORDS as readonly string[]).includes(q)) return q

  // 「大さじ」「小さじ」「カップ」は前置
  if ((UNIT_FIRST as readonly string[]).includes(u)) return `${u}${q}`

  // それ以外は数量 + 単位
  return `${q}${u}`
}
