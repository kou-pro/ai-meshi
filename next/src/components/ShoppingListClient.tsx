'use client'

import { useState } from 'react'
import Link from 'next/link'

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
  'その他',
]

type ShoppingListItem = {
  id: number
  ingredient_name: string
  ingredient_amount: string
  ingredient_category: string
  is_checked: boolean
  recipe_id: number
  recipe_title: string
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
  const handleCheck = async (ids: number[], checked: boolean) => {
    // 楽観的UI: 先に画面を更新する
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, is_checked: checked } : item,
      ),
    )

    // APIを叩く（最初のIDだけ更新）
    await fetch('/api/shopping-list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ids[0], is_checked: checked }),
    })
  }

  // レシピごと削除
  const handleDeleteByRecipe = async (recipeId: number) => {
    if (!confirm('このレシピの食材をすべて削除しますか？')) return

    setItems((prev) => prev.filter((item) => item.recipe_id !== recipeId))

    await fetch('/api/shopping-list', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'recipe', recipe_id: recipeId }),
    })
  }

  // 全レシピ削除
  const handleDeleteAll = async () => {
    if (!confirm('買い物リストをすべて削除しますか？')) return

    setItems([])

    await fetch('/api/shopping-list', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'checked' }),
    })
  }

  // チェック済み削除
  const handleDeleteChecked = async () => {
    if (!confirm('チェック済みの食材を削除しますか？')) return

    setItems((prev) => prev.filter((item) => !item.is_checked))

    await fetch('/api/shopping-list', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'checked' }),
    })
  }

  // 統計
  const recipeCount = Object.keys(groupedByRecipe).length
  const itemCount = Object.keys(mergedItems).length

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">
          買い物リスト
        </h1>
        <p className="text-gray-500">
          買い物リストに何も追加されていません。
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー */}
      <h1 className="text-2xl font-bold mb-1">
        買い物リスト
      </h1>
      <p className="text-gray-500 mb-6 text-sm">
        レシピ {recipeCount}件 / 買うもの {itemCount}件
      </p>

      {/* 2カラムレイアウト */}
      <div className="grid grid-cols-[1fr_2fr] gap-6">
        {/* 左カラム: 追加したレシピ一覧 */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
            追加したレシピ
          </h2>

          <div className="flex flex-col gap-2">
            {Object.entries(groupedByRecipe).map(([recipeId, group]) => (
              <div
                key={recipeId}
                className="border border-gray-200 rounded-lg p-3"
              >
                <Link
                  href={`/recipes/${recipeId}`}
                  className="font-bold text-sm text-gray-900 no-underline"
                >
                  {group.recipe_title}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  食材 {group.items.length}件
                </p>
                <button
                  onClick={() => handleDeleteByRecipe(Number(recipeId))}
                  className="mt-2 text-xs text-red-500 bg-transparent border-none cursor-pointer p-0"
                >
                  削除
                </button>
              </div>
            ))}
          </div>

          {/* 全削除ボタン */}
          <button
            onClick={handleDeleteAll}
            className="mt-4 w-full py-2 text-[13px] text-gray-500 bg-transparent border border-gray-200 rounded cursor-pointer"
          >
            レシピをすべて削除
          </button>
        </div>

        {/* 右カラム: 買うもの一覧（カテゴリ別） */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
            買うもの一覧
          </h2>

          {sortedCategories.map((category) => (
            <div key={category} className="mb-5">
              {/* カテゴリ名 */}
              <h3 className="text-[13px] font-bold text-gray-700 mb-2 pb-1 border-b border-gray-100">
                {category}
              </h3>

              {/* 食材リスト */}
              <ul className="list-none p-0 m-0">
                {groupedByCategory[category].map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center gap-2 py-1.5"
                  >
                    <input
                      type="checkbox"
                      checked={item.is_checked}
                      onChange={(e) => handleCheck(item.ids, e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span
                      className={`flex-1 text-sm ${item.is_checked ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                    >
                      {item.name}
                      {item.count > 1 && (
                        <span className="text-gray-400 text-xs">
                          {' '}
                          ×{item.count}
                        </span>
                      )}
                    </span>
                    <span className="text-[13px] text-gray-500">
                      {item.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* チェック済み削除ボタン */}
          <button
            onClick={handleDeleteChecked}
            className="mt-2 px-4 py-2 text-[13px] text-gray-500 bg-transparent border border-gray-200 rounded cursor-pointer"
          >
            チェック済み項目を削除
          </button>
        </div>
      </div>
    </div>
  )
}
