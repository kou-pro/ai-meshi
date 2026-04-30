'use client'
// ↑ クライアントコンポーネント宣言
//   useEffect / useRef / DOM操作を使うため必須 (Server Component では使えない)

import { useEffect, useId, useRef } from 'react'
// ─────────────────────────────────────────────────────────────
// 各 React フックの役割
// ─────────────────────────────────────────────────────────────
//   useRef:    DOM要素への参照を保持 (React の再レンダーと無関係に値を保持する箱)
//   useEffect: レンダー後に走る副作用処理 (DOM操作・イベント登録等を書く場所)
//   useId:     アクセシビリティ属性用のユニークID生成 (React 18+ 公式機能)
//              参考: https://react.dev/reference/react/useId
// ─────────────────────────────────────────────────────────────

type Props = {
  /** モーダルを開くかどうかのフラグ */
  isOpen: boolean
}

/**
 * AIレシピ生成中の待機モーダル。
 *
 * # 採用している技術と理由
 *
 * 1. HTML5 ネイティブ `<dialog>` 要素 + `showModal()` API
 *    - 背景の自動 `inert` 化 (操作不可)
 *    - フォーカストラップ (Tab キーがダイアログ内をループ)
 *    - top layer (z-index 競合を超えて最前面に描画)
 *    - `aria-modal="true"` の自動付与
 *    これらが**ブラウザ標準で全部効く**。自前実装より遥かに堅牢。
 *    参考: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
 *
 * 2. iOS Safari スクロールロック (body fixed パターン)
 *    iOS Safari では `overflow: hidden` が効かない既知の問題があるため、
 *    `body` 自体を `position: fixed` で固定する手法が業界標準。
 *    参考: https://markus.oberlehner.net/blog/simple-solution-to-prevent-body-scrolling-on-ios
 *
 * 3. ESC キャンセルの抑制
 *    `<dialog>` の `cancel` イベント (ESCキー押下) を `preventDefault` で抑止。
 *    AI生成中に誤って閉じられると処理が中断するため。
 *    参考: https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/cancel_event
 *
 * 4. アクセシビリティ (WAI-ARIA)
 *    - `aria-labelledby`: 「このダイアログのタイトルはこのID」と支援技術に伝える
 *    - `aria-describedby`: 「このダイアログの説明はこのID」と支援技術に伝える
 *    - `aria-busy={isOpen}`: 「処理中です」と支援技術に伝える
 *    - `role="status"` + `aria-label="読み込み中"`: スピナーの意味を読み上げる
 *    - `motion-reduce:animate-none`: OS設定 prefers-reduced-motion に従いアニメ停止
 */
export default function RecipeGenerationModal({ isOpen }: Props) {
  // ─────────────────────────────────────────────────
  // ① ダイアログ要素への参照 (ref)
  // ─────────────────────────────────────────────────
  // <dialog ref={dialogRef}> と書くことで、DOM要素そのものに直接アクセスできる。
  // 初期値は null で、実際の DOM が描画された後に React が紐付けてくれる。
  const dialogRef = useRef<HTMLDialogElement>(null)

  // ─────────────────────────────────────────────────
  // ② 一意な ID の生成 (useId)
  // ─────────────────────────────────────────────────
  // aria-labelledby / aria-describedby は「ID で別要素を指す」仕組み。
  // ハードコードした文字列 ("title" など) で書くと、同じページ内に
  // 複数モーダルがあったときに ID 衝突する。
  // useId() なら React がユニークな値 (例: ":r0:") を自動生成し、
  // SSR と CSR 間でも一致するため安全。
  const titleId = useId()
  const descId = useId()

  // ─────────────────────────────────────────────────
  // ③ 副作用1: ダイアログの開閉とスクロールロック
  // ─────────────────────────────────────────────────
  // useEffect は「レンダー後」に走る関数。DOM操作はここで行う。
  // 第2引数 [isOpen] = 「isOpen が変わったときだけ再実行する」という指定。
  useEffect(() => {
    const dialog = dialogRef.current
    // ref がまだ DOM に紐付いていない場合の安全ガード
    if (!dialog) return

    if (isOpen) {
      // ── ダイアログを開く ──
      // showModal() = モーダルとして開く。
      //   ・背景が inert (操作不可) になる
      //   ・フォーカストラップが自動で効く
      //   ・top layer に描画される (z-index を気にしなくて良い)
      //   ・::backdrop 疑似要素 (背景の暗幕) が自動生成される
      // 既に開いている場合に呼ぶとエラーになるため open フラグで分岐。
      if (!dialog.open) {
        dialog.showModal()
      }

      // ── iOS Safari 対応のスクロールロック ──
      // 通常 `overflow: hidden` を body にかければ良いが、
      // iOS Safari ではこれが効かない (タッチで強制スクロールできてしまう)。
      // 代替として「body 自体を position:fixed で固定する」手法を取る。
      //
      // 注意: position:fixed にすると body は viewport の左上に貼り付くため、
      //       現在のスクロール位置が見えなくなる。これを防ぐために
      //       事前にスクロール位置を保存し、`top: -scrollY` で見た目を維持する。
      const scrollY = window.scrollY
      document.body.dataset.scrollY = String(scrollY)
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
    }

    // ── クリーンアップ関数 ──
    // useEffect の return で渡した関数は、
    //   (a) 次回 effect が走る直前 (依存配列の値が変わったとき)
    //   (b) コンポーネントがアンマウントされるとき
    // のいずれかで自動的に呼ばれる。ここで「後始末」を書く。
    return () => {
      // ダイアログが開いていれば閉じる
      if (dialog.open) {
        dialog.close()
      }

      // ── スクロール位置の復元 ──
      // body の position:fixed を解除し、保存していた位置までスクロールを戻す。
      const savedScrollY = document.body.dataset.scrollY
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      delete document.body.dataset.scrollY
      if (savedScrollY) {
        // parseInt は第2引数 (radix) を明示するのが安全。
        // 省略すると先頭が "0" で始まる文字列を8進と誤解する歴史的問題がある。
        // ESLint の `radix` ルールも radix 指定を推奨。
        window.scrollTo(0, parseInt(savedScrollY, 10))
      }
    }
  }, [isOpen])

  // ─────────────────────────────────────────────────
  // ④ 副作用2: ESCキーキャンセルを無効化
  // ─────────────────────────────────────────────────
  // <dialog> は ESC キーで閉じられる際 `cancel` イベントを発火する。
  // ここで preventDefault することで、ESC を押されても閉じなくなる。
  //
  // 第2引数 [] = 「初回マウント時のみ実行」。
  // イベントリスナの登録は1度だけで良いため、依存配列は空にする。
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => e.preventDefault()
    dialog.addEventListener('cancel', handleCancel)

    // クリーンアップでイベントリスナを必ず解除 (メモリリーク防止)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [])

  // ─────────────────────────────────────────────────
  // ⑤ 描画
  // ─────────────────────────────────────────────────
  return (
    <dialog
      ref={dialogRef}
      // 「このダイアログのタイトルはこの ID の要素」と支援技術に伝える
      aria-labelledby={titleId}
      // 「このダイアログの説明はこの ID の要素」と支援技術に伝える
      aria-describedby={descId}
      // 「処理中です」と支援技術に伝える (true の間スクリーンリーダーが
      // 追加のフィードバックを抑制してくれる)
      aria-busy={isOpen}
      // ── スタイル ──
      //   bg-transparent + p-0 + m-auto:
      //     <dialog> 自体は枠だけにし、中の <div> をカードとして装飾する。
      //     m-auto で画面中央に配置。
      //   backdrop:* :
      //     ::backdrop 疑似要素 (showModal 時に自動生成される暗幕) のスタイル。
      //     bg-black/40 = 黒の40%透過、backdrop-blur-sm = 背景をぼかす。
      className="bg-transparent p-0 m-auto backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-xl px-8 py-10 mx-4 max-w-sm w-[calc(100vw-2rem)] flex flex-col items-center">
        {/*
          スピナー (回転する円)
          - role="status" + aria-label="読み込み中": 支援技術に「これは状態通知」と伝える
          - animate-spin: Tailwind 標準の回転アニメーション (CSS transform rotate)
          - motion-reduce:animate-none:
              OS設定で prefers-reduced-motion: reduce が有効なら回転を止める。
              アニメで気分が悪くなるユーザーへのアクセシビリティ配慮 (WCAG 2.3.3)
          - border + border-t-green-600:
              枠線4本のうち上だけ濃緑にすることで「半円が回ってる」風に見える
        */}
        <div
          role="status"
          aria-label="読み込み中"
          className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin motion-reduce:animate-none mb-6"
        />

        {/* タイトル: aria-labelledby={titleId} で参照される */}
        <h2 id={titleId} className="text-lg font-bold text-gray-800 mb-2">
          AIがレシピを考案中
        </h2>

        {/* 説明文: aria-describedby={descId} で参照される */}
        <p id={descId} className="text-sm text-gray-500 text-center">
          5〜10秒ほどお待ちください
        </p>
      </div>
    </dialog>
  )
}
