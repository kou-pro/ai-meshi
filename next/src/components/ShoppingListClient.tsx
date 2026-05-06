'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import {
  Carrot,
  Apple,
  Beef,
  Fish,
  Milk,
  Egg,
  Bean,
  Wheat,
  Sandwich,
  CookingPot,
  Leaf,
  Package,
  ShoppingBasket,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchWithAuthClient } from '@/lib/fetchWithAuthClient'

// カテゴリの表示順を定義（スーパーの売り場順）
const CATEGORY_ORDER = [
  '野菜',
  '果物',
  '肉類',
  '魚介',
  '乳製品',
  '卵',
  '豆腐・大豆',
  '穀物',
  '主食',
  '調味料',
  '薬味',
  'たんぱく質',
  'その他',
]

// カテゴリ別アイコン（Lucide React）+ 緑系のテーマ色
const CATEGORY_ICONS: Record<
  string,
  { Icon: LucideIcon; colorClass: string }
> = {
  野菜: { Icon: Carrot, colorClass: 'text-green-600' },
  果物: { Icon: Apple, colorClass: 'text-red-500' },
  肉類: { Icon: Beef, colorClass: 'text-rose-500' },
  魚介: { Icon: Fish, colorClass: 'text-blue-500' },
  乳製品: { Icon: Milk, colorClass: 'text-sky-500' },
  卵: { Icon: Egg, colorClass: 'text-amber-500' },
  '豆腐・大豆': { Icon: Bean, colorClass: 'text-amber-700' },
  穀物: { Icon: Wheat, colorClass: 'text-yellow-600' },
  主食: { Icon: Sandwich, colorClass: 'text-orange-500' },
  調味料: { Icon: CookingPot, colorClass: 'text-amber-600' },
  薬味: { Icon: Leaf, colorClass: 'text-emerald-600' },
  たんぱく質: { Icon: Egg, colorClass: 'text-amber-500' },
  その他: { Icon: Package, colorClass: 'text-gray-500' },
}

type ShoppingListItem = {
  id: number
  ingredient_name: string
  ingredient_amount: string
  ingredient_category: string
  is_checked: boolean
  recipe_id: number
  recipe_title: string
  recipe_image_url: string | null
}

// 同じ食材をまとめる（名前一致ベース）
function mergeItems(items: ShoppingListItem[]) {
  const merged: Record<
    string,
    {
      ids: number[]
      amount: string
      count: number
      is_checked: boolean
      category: string
    }
  > = {}

  items.forEach((item) => {
    if (merged[item.ingredient_name]) {
      merged[item.ingredient_name].ids.push(item.id)
      merged[item.ingredient_name].count += 1
      // 1つでもチェックされていなければ未チェック扱い
      if (!item.is_checked) {
        merged[item.ingredient_name].is_checked = false
      }
    } else {
      merged[item.ingredient_name] = {
        ids: [item.id],
        amount: item.ingredient_amount,
        count: 1,
        is_checked: item.is_checked,
        category: item.ingredient_category || 'その他',
      }
    }
  })

  return merged
}

type Props = {
  initialItems: ShoppingListItem[]
}

export default function ShoppingListClient({ initialItems }: Props) {
  const [items, setItems] = useState<ShoppingListItem[]>(initialItems)

  // レシピごとにグループ化
  const groupedByRecipe = items.reduce(
    (acc, item) => {
      if (!acc[item.recipe_id]) {
        acc[item.recipe_id] = {
          recipe_title: item.recipe_title,
          recipe_image_url: item.recipe_image_url,
          items: [],
        }
      }
      acc[item.recipe_id].items.push(item)
      return acc
    },
    {} as Record<
      number,
      {
        recipe_title: string
        recipe_image_url: string | null
        items: ShoppingListItem[]
      }
    >,
  )

  // カテゴリ別に食材をまとめる（全アイテム横断）
  const mergedItems = mergeItems(items)

  // カテゴリごとにグループ化
  const groupedByCategory = Object.entries(mergedItems).reduce(
    (acc, [name, data]) => {
      const cat = data.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push({ name, ...data })
      return acc
    },
    {} as Record<
      string,
      {
        name: string
        ids: number[]
        amount: string
        count: number
        is_checked: boolean
      }[]
    >,
  )

  // カテゴリを定義した順番に並べる
  const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a)
    const bIndex = CATEGORY_ORDER.indexOf(b)
    const aOrder = aIndex === -1 ? 999 : aIndex
    const bOrder = bIndex === -1 ? 999 : bIndex
    return aOrder - bOrder
  })

  // チェック状態を更新する
  // 楽観的更新を行うため、API 失敗時は state を rollback + toast 通知 (silent failure 防止)
  const handleCheck = async (ids: number[], checked: boolean) => {
    // rollback 用に元の状態を保存
    const prevItems = items
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, is_checked: checked } : item,
      ),
    )

    try {
      for (const id of ids) {
        const res = await fetchWithAuthClient('/api/shopping-list', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_checked: checked }),
        })
        if (res.status === 401) return
        if (!res.ok) {
          setItems(prevItems)
          toast.error('チェック状態の保存に失敗しました')
          return
        }
      }
    } catch {
      setItems(prevItems)
      toast.error('通信エラーが発生しました')
    }
  }

  // レシピごと削除
  const handleDeleteByRecipe = async (recipeId: number) => {
    if (!confirm('このレシピの食材をすべて削除しますか？')) return

    const prevItems = items
    setItems((prev) => prev.filter((item) => item.recipe_id !== recipeId))

    try {
      const res = await fetchWithAuthClient('/api/shopping-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'recipe', recipe_id: recipeId }),
      })
      if (res.status === 401) return
      if (!res.ok) {
        setItems(prevItems)
        toast.error('レシピ食材の削除に失敗しました')
      }
    } catch {
      setItems(prevItems)
      toast.error('通信エラーが発生しました')
    }
  }

  // 全レシピ削除
  const handleDeleteAll = async () => {
    if (!confirm('買い物リストをすべて削除しますか？')) return

    const prevItems = items
    setItems([])

    try {
      const res = await fetchWithAuthClient('/api/shopping-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' }),
      })
      if (res.status === 401) return
      if (!res.ok) {
        setItems(prevItems)
        toast.error('買い物リストの全削除に失敗しました')
      }
    } catch {
      setItems(prevItems)
      toast.error('通信エラーが発生しました')
    }
  }

  // チェック済み削除
  const handleDeleteChecked = async () => {
    if (!confirm('チェック済みの食材を削除しますか？')) return

    const prevItems = items
    setItems((prev) => prev.filter((item) => !item.is_checked))

    try {
      const res = await fetchWithAuthClient('/api/shopping-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'checked' }),
      })
      if (res.status === 401) return
      if (!res.ok) {
        setItems(prevItems)
        toast.error('チェック済み項目の削除に失敗しました')
      }
    } catch {
      setItems(prevItems)
      toast.error('通信エラーが発生しました')
    }
  }

  // 統計
  const recipeCount = Object.keys(groupedByRecipe).length
  const itemCount = Object.keys(mergedItems).length

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 min-h-[calc(100vh-160px)] flex flex-col justify-center md:min-h-0 md:py-8 md:block">
        {/* タイトル: 中央寄せ */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-12">
          買い物リスト
        </h1>

        {/* バスケットアイコン + メッセージ + ボタン: 縦中央 */}
        <div className="flex flex-col items-center text-center pb-8 md:pb-0">
          <ShoppingBasket
            className="w-32 h-32 text-green-200"
            strokeWidth={1.5}
          />
          <p className="mt-6 text-gray-500 text-sm leading-relaxed">
            買い物リストに
            <br className="sm:hidden" />
            何も追加されていません
          </p>
          <Link
            href="/home"
            className="mt-8 inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
          >
            レシピを探して追加する
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      {/* ヘッダー: バスケットアイコン + タイトル + サブテキスト */}
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBasket className="w-9 h-9 text-green-600" strokeWidth={1.75} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">買い物リスト</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            レシピ {recipeCount}件 / 買うもの {itemCount}件
          </p>
        </div>
      </div>

      {/* レスポンシブレイアウト: モバイル縦並び / PC横並び（左1/3 右2/3） */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,1fr)_2fr] gap-4 md:gap-6">
        {/* 左カラム: 追加したレシピ一覧（カード化） */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            追加したレシピ
          </h2>

          <div className="flex flex-col gap-3">
            {Object.entries(groupedByRecipe).map(([recipeId, group]) => (
              <div
                key={recipeId}
                className="border border-gray-200 rounded-xl p-3 flex gap-3"
              >
                {/* レシピ画像 */}
                <Link
                  href={`/recipes/${recipeId}`}
                  className="shrink-0 block w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      group.recipe_image_url
                        ? group.recipe_image_url.replace(
                            'http://rails:3000',
                            process.env.NEXT_PUBLIC_RAILS_URL ?? '',
                          )
                        : '/default-recipe.jpg'
                    }
                    alt={group.recipe_title}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* レシピ情報 */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <Link
                    href={`/recipes/${recipeId}`}
                    className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-green-600"
                  >
                    {group.recipe_title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-1">
                    食材 {group.items.length}件
                  </p>
                  <button
                    onClick={() => handleDeleteByRecipe(Number(recipeId))}
                    className="mt-auto self-start flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 全削除ボタン */}
          <button
            onClick={handleDeleteAll}
            className="mt-4 w-full py-2.5 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            レシピをすべて削除
          </button>
        </div>

        {/* 右カラム: 買うもの一覧（カード化） */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            買うもの一覧
          </h2>

          <div className="space-y-5">
            {sortedCategories.map((category, index) => {
              const { Icon, colorClass } =
                CATEGORY_ICONS[category] || CATEGORY_ICONS['その他']
              return (
                <div key={category}>
                  {/* カテゴリ間の区切り線（最初以外） */}
                  {index > 0 && <hr className="border-gray-100 mb-5" />}

                  {/* カテゴリ名（Lucide アイコン + カラー） */}
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                    <span>{category}</span>
                  </h3>

                  {/* 食材リスト */}
                  <ul className="space-y-1.5">
                    {groupedByCategory[category].map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center gap-3 py-1"
                      >
                        <input
                          type="checkbox"
                          checked={item.is_checked}
                          onChange={(e) =>
                            handleCheck(item.ids, e.target.checked)
                          }
                          className="w-4 h-4 cursor-pointer accent-green-600"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            item.is_checked
                              ? 'text-gray-400 line-through'
                              : 'text-gray-800'
                          }`}
                        >
                          {item.name}
                          {item.count > 1 && (
                            <span className="text-gray-400 text-xs ml-1">
                              ×{item.count}
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-sm ${
                            item.is_checked
                              ? 'text-gray-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {item.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* チェック済み削除ボタン */}
          <button
            onClick={handleDeleteChecked}
            className="mt-6 w-full py-2.5 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            チェック済み項目を削除
          </button>
        </div>
      </div>
    </div>
  )
}
