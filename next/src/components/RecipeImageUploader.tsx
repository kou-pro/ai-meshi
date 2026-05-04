'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  recipeId: number
  /**
   * 'add': 画像未設定時の placeholder 上に大きく中央配置のボタンを表示
   * 'replace': 既存画像の右上隅に小さなカメラアイコンを表示
   * デフォルトは 'add'。
   */
  variant?: 'add' | 'replace'
}

/**
 * Rails 側の Recipe モデルが受け入れる画像形式・サイズの上限。
 * PNG / JPEG のみ、5MB 以下。app/models/recipe.rb の acceptable_image
 * バリデーションと同じ条件をクライアント側でも事前チェックする。
 */
const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg'] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * レシピ詳細ページの画像エリアに重ねる「画像を追加 / 変更」UI。
 *
 * # 機能
 * - クリック: OS のファイル選択ダイアログを開く
 * - ドラッグ&ドロップ: 画像ファイルを画像エリアに直接ドロップして反映
 * - 既存画像があっても (variant='replace') 同じインタラクションで差し替え可能
 *
 * # variant の使い分け
 * - 'add': placeholder 上に大きく中央配置のグラスモーフィズムボタン (新規追加)
 * - 'replace': 画像右上隅に小さなカメラアイコン (差し替え)
 *   → 画像本体は通常通り視認できるよう、UI は最小化する
 *
 * # クライアント側の事前バリデーション
 * Rails 側 (acceptable_image) が PNG/JPEG のみ・5MB以下で拒否するため、
 * ドラッグ&ドロップ経由で HEIC (iPhone デフォルト) / WebP / 大きすぎるファイル
 * 等を受け取った場合は Rails 通信前にローカルで弾いて UX を上げる。
 *
 * # モバイル考慮
 * モバイルブラウザは HTML Drag & Drop API のタッチイベントに対応していないため、
 * onDrag* 系のイベントは実質発火しない。クリック (タップ) は全環境で動作する
 * フォールバックとして機能する。
 */
export default function RecipeImageUploader({ recipeId, variant = 'add' }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (file: File): boolean => {
    if (
      !ACCEPTED_MIME_TYPES.includes(
        file.type as (typeof ACCEPTED_MIME_TYPES)[number],
      )
    ) {
      toast.error('PNG または JPEG 形式の画像を選択してください')
      return false
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('画像サイズは 5MB 以下にしてください')
      return false
    }
    return true
  }

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return

    setIsUploading(true)

    const formData = new FormData()
    formData.append('recipe[image]', file)

    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PATCH',
        body: formData,
      })

      if (res.ok) {
        toast.success(
          variant === 'replace' ? '画像を変更しました' : '画像を追加しました',
        )
        router.refresh()
        return
      }

      const data = await res.json().catch(() => null)
      const message = Array.isArray(data?.errors)
        ? data.errors.join('\n')
        : variant === 'replace'
          ? '画像の変更に失敗しました'
          : '画像の追加に失敗しました'
      toast.error(message)
    } catch {
      toast.error('通信エラーが発生しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    if (isUploading) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (isUploading) return
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png, image/jpeg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ドラッグ&ドロップを画像エリア全体で受け付けるためのレイヤー。
          variant に関わらず inset-0 でカバーする。クリックは内側のボタンで処理。 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="absolute inset-0"
      >
        {variant === 'add' ? (
          // ─── 新規追加: 中央に大きなグラスモーフィズムボタン ───
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center group disabled:cursor-not-allowed"
            aria-label="画像を追加"
          >
            <div
              className={`
                bg-white/95 backdrop-blur-md
                px-6 py-3 rounded-2xl
                shadow-md group-hover:shadow-xl
                group-hover:scale-105 group-hover:bg-white
                transition-all duration-200
                border border-gray-200/50
                flex items-center gap-2.5
                ${isUploading ? 'opacity-70' : ''}
                ${isDragging ? 'scale-105 shadow-xl bg-white' : ''}
              `}
            >
              <Camera
                strokeWidth={2}
                className="w-4 h-4 text-green-600"
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-gray-800">
                {isUploading
                  ? 'アップロード中...'
                  : isDragging
                    ? 'ドロップしてアップロード'
                    : '画像を追加'}
              </span>
            </div>
          </button>
        ) : (
          // ─── 差し替え: 左上隅に小さなカメラアイコン
          //    (詳細ページの右上はいいね/保存/買い物リストアイコンが並ぶため
          //    カメラは左上で住み分け) ───
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="absolute top-3 left-3 bg-black/60 backdrop-blur-md p-2.5 rounded-full hover:bg-black/80 hover:scale-110 transition-all opacity-90 hover:opacity-100 shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="画像を変更"
          >
            <Camera
              strokeWidth={2}
              className="w-4 h-4 text-white"
              aria-hidden="true"
            />
          </button>
        )}

        {/* ドラッグ中 / アップロード中の全面オーバーレイ (replace のみ。
            画像本体が見えなくなるが、状態を明確に伝えるため) */}
        {variant === 'replace' && (isDragging || isUploading) && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
              <Camera
                strokeWidth={2}
                className="w-4 h-4 text-green-600"
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-gray-800">
                {isUploading ? 'アップロード中...' : 'ドロップして変更'}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
