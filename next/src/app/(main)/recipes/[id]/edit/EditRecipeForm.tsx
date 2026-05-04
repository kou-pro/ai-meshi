'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, GripVertical, Trash2, Save, Info } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Props = {
  id: string
  initialTitle: string
  initialSteps: string[]
}

/**
 * 並び替え可能な手順アイテム 1 件分。
 *
 * # dnd-kit の概念
 * - useSortable フックが「ドラッグ可能 + ドロップターゲット」を一括で提供する。
 * - attributes / listeners をドラッグハンドルに付けると、その要素を掴んで
 *   ドラッグできるようになる (テキストエリアではなくハンドルだけがドラッグの起点)。
 * - transform / transition は dnd-kit が計算するアニメーション値。
 *   CSS.Transform.toString で style に適用するだけで滑らかに動く。
 */
type SortableStepProps = {
  id: string
  index: number
  value: string
  canDelete: boolean
  onChange: (value: string) => void
  onRemove: () => void
}

function SortableStep({
  id,
  index,
  value,
  canDelete,
  onChange,
  onRemove,
}: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // ドラッグ中は半透明にして掴んでいる感を出す
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-3 mb-3 items-start bg-white border border-gray-200 rounded-lg p-3"
    >
      {/* ドラッグハンドル: ここを掴むとドラッグ開始
          textarea にハンドル機能を付けると入力中にドラッグ判定が暴発するため、
          専用の掴み所として GripVertical アイコンに限定する */}
      <button
        type="button"
        className="shrink-0 mt-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
        aria-label={`手順${index + 1}をドラッグして並び替え`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* 番号 (緑丸) */}
      <span className="shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1">
        {index + 1}
      </span>

      {/* テキストエリア (自動リサイズ)
          react-textarea-autosize: Slack / GitHub / Notion / ChatGPT で
          採用されている業界デファクトのライブラリ。入力に応じて高さが
          自動で伸縮する。手動リサイズハンドルは不要なので resize-none。
          minRows=2 で初期高さを保証、maxRows=15 で極端な長文を防ぐ。 */}
      <TextareaAutosize
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minRows={2}
        maxRows={15}
        placeholder={`手順${index + 1}を入力`}
        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />

      {/* 削除ボタン: 手順が 1 つしかないときは disabled */}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canDelete}
        className="shrink-0 mt-1 inline-flex items-center gap-1 px-3 py-2 rounded border border-red-300 bg-white text-red-500 text-xs font-medium hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-white"
        aria-label={`手順${index + 1}を削除`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        削除
      </button>
    </div>
  )
}

/**
 * レシピ編集フォーム (Client Component)。
 * 初期値は親 Server Component (page.tsx) から props として渡される。
 *
 * # スコープ
 * タイトルと手順のみを編集対象とする。
 * - 画像の追加 / 変更は詳細ページの RecipeImageUploader から行える
 * - 投稿者評価は詳細ページの ScoreSection から直接星クリックで保存できる
 *
 * # ドラッグ&ドロップ並び替え
 * 業界標準の dnd-kit (Linear / Vercel / Notion 系で採用) を使用。
 * - PointerSensor: マウス + タッチを統一的に扱う (モバイル対応)
 * - KeyboardSensor: アクセシビリティ (Tab + Space + Arrow + Esc)
 * - SortableContext + verticalListSortingStrategy: 縦並び専用の最適化
 */
export default function EditRecipeForm({
  id,
  initialTitle,
  initialSteps,
}: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)

  // 各手順に内部 ID を持たせる: dnd-kit は文字列 / 数値 ID で各アイテムを識別する。
  // 配列インデックスを ID にすると、並び替え時に ID が変わって React の再描画が
  // 壊れる (key 属性問題)。永続的な ID として stepId を持つ。
  const [steps, setSteps] = useState<{ id: string; text: string }[]>(() =>
    initialSteps.map((text, i) => ({ id: `step-${Date.now()}-${i}`, text })),
  )
  const [loading, setLoading] = useState(false)

  // dnd-kit のセンサー設定。
  // PointerSensor は "8px 動かしたら本格的なドラッグと判定" にしてある。
  // これがないと、テキストエリア領域を軽くタップしただけでドラッグ判定になり
  // 入力操作と競合する。
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // 手順の文字列を更新 (テキストエリアの onChange)
  const handleStepChange = (stepId: string, text: string) => {
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, text } : s)))
  }

  // 手順を末尾に追加
  const handleAddStep = () => {
    setSteps([...steps, { id: `step-${Date.now()}`, text: '' }])
  }

  // 手順を削除 (最後の 1 件は消せない)
  const handleRemoveStep = (stepId: string) => {
    if (steps.length === 1) return
    setSteps(steps.filter((s) => s.id !== stepId))
  }

  // dnd-kit のドラッグ終了イベント。
  // active.id (掴んだやつ) と over.id (ドロップ先) から
  // arrayMove で配列を入れ替える。
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSteps((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  // 編集を保存 (タイトル + 手順のみ)
  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)

    const formData = new FormData()
    formData.append('recipe[title]', title)

    // 空の手順を除外してから送る
    const filteredSteps = steps
      .map((s) => s.text.trim())
      .filter((text) => text !== '')
    filteredSteps.forEach((step) => {
      formData.append('recipe[steps][]', step)
    })

    const res = await fetch(`/api/recipes/${id}`, {
      method: 'PATCH',
      body: formData,
    })

    if (res.ok) {
      router.refresh()
      router.push(`/recipes/${id}`)
    } else {
      toast.error('更新に失敗しました')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
        {/* レシピ詳細に戻るリンク */}
        <Link
          href={`/recipes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          レシピ詳細に戻る
        </Link>

        {/* タイトル + サブコピー */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          レシピを編集
        </h1>
        <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
          タイトルや作り方を見直して、わかりやすいレシピに整えましょう。
        </p>

        {/* タイトル入力 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-800 mb-2">
            タイトル
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* 作り方 (ドラッグ&ドロップ並び替え可能) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm font-bold text-gray-800">作り方</label>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Info className="w-3.5 h-3.5" />
              手順はドラッグで並び替えできます
            </span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {steps.map((step, index) => (
                <SortableStep
                  key={step.id}
                  id={step.id}
                  index={index}
                  value={step.text}
                  canDelete={steps.length > 1}
                  onChange={(text) => handleStepChange(step.id, text)}
                  onRemove={() => handleRemoveStep(step.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* 手順を追加 */}
          <button
            type="button"
            onClick={handleAddStep}
            className="mt-1 inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-green-600 bg-white text-green-600 text-sm font-medium hover:bg-green-50"
          >
            ＋ 手順を追加
          </button>
        </div>

        {/* 保存ボタン */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white rounded-lg font-bold text-base hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          <Save className="w-5 h-5" />
          {loading ? '保存中...' : '変更を保存'}
        </button>
      </div>
    </div>
  )
}
