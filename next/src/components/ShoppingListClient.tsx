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
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <h1
          style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}
        >
          買い物リスト
        </h1>
        <p style={{ color: '#6b7280' }}>
          買い物リストに何も追加されていません。
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      {/* ヘッダー */}
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
        買い物リスト
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        レシピ {recipeCount}件 / 買うもの {itemCount}件
      </p>

      {/* 2カラムレイアウト */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '24px',
        }}
      >
        {/* 左カラム: 追加したレシピ一覧 */}
        <div>
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#6b7280',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            追加したレシピ
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(groupedByRecipe).map(([recipeId, group]) => (
              <div
                key={recipeId}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <Link
                  href={`/recipes/${recipeId}`}
                  style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: '#111827',
                    textDecoration: 'none',
                  }}
                >
                  {group.recipe_title}
                </Link>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginTop: '2px',
                  }}
                >
                  食材 {group.items.length}件
                </p>
                <button
                  onClick={() => handleDeleteByRecipe(Number(recipeId))}
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                  }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>

          {/* 全削除ボタン */}
          <button
            onClick={handleDeleteAll}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '8px',
              fontSize: '13px',
              color: '#6b7280',
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            レシピをすべて削除
          </button>
        </div>

        {/* 右カラム: 買うもの一覧（カテゴリ別） */}
        <div>
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#6b7280',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            買うもの一覧
          </h2>

          {sortedCategories.map((category) => (
            <div key={category} style={{ marginBottom: '20px' }}>
              {/* カテゴリ名 */}
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#374151',
                  marginBottom: '8px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {category}
              </h3>

              {/* 食材リスト */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {groupedByCategory[category].map((item) => (
                  <li
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 0',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.is_checked}
                      onChange={(e) => handleCheck(item.ids, e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: item.is_checked ? '#9ca3af' : '#111827',
                        textDecoration: item.is_checked
                          ? 'line-through'
                          : 'none',
                      }}
                    >
                      {item.name}
                      {item.count > 1 && (
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                          {' '}
                          ×{item.count}
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
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
            style={{
              marginTop: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              color: '#6b7280',
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            チェック済み項目を削除
          </button>
        </div>
      </div>
    </div>
  )
}
