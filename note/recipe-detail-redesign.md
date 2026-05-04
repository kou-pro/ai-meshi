# レシピ詳細ページ改修の解説

> 2026/5/4 のセッションで実装した詳細ページ (`/recipes/[id]`) の改修内容をすべてコード付きで解説。

## 全体像

| PR | テーマ | 内容 |
|---|---|---|
| **#21** | レイアウト・アクション再設計 | ヒーロー画像 + 2 カラム構成、星評価の自動保存、`⋯ 管理` ドロップダウン、メタ行の充実化 |
| **#22** | 認証・エラー処理の一貫化 | `fetchWithAuthClient` 統一、try/catch/finally でガード、setTimeout の cleanup |
| **#23** | パフォーマンス最適化 | `Promise.all` で fetch 並列化、`cache: 'no-store'` 重複の解消 |
| **#C (本ブランチ)** | アクセシビリティ改善 | WAI-ARIA radiogroup / menu pattern 完全準拠、キーボード操作完全対応 |

---

# 目次

1. [Server Component と Client Component の境界](#1-server-component-と-client-component-の境界)
2. [`router.refresh()` による Server-Client 同期](#2-routerrefresh-による-server-client-同期)
3. [`fetchWithAuthClient` 統一の意義](#3-fetchwithauthclient-統一の意義)
4. [`try/catch/finally` で loading 永続化を防ぐ](#4-trycatchfinally-で-loading-永続化を防ぐ)
5. [`useEffect` cleanup によるタイマー片付け](#5-useeffect-cleanup-によるタイマー片付け)
6. [`Promise.all` による並列化](#6-promiseall-による並列化)
7. [`force-dynamic` と `cache: 'no-store'` の関係](#7-force-dynamic-と-cache-no-store-の関係)
8. [WAI-ARIA radiogroup pattern (StarInput)](#8-wai-aria-radiogroup-pattern-starinput)
9. [WAI-ARIA menu pattern (RecipeOwnerActions)](#9-wai-aria-menu-pattern-recipeowneractions)
10. [`useId()` による id 衝突回避](#10-useid-による-id-衝突回避)
11. [roving tabindex パターン](#11-roving-tabindex-パターン)

---

# 1. Server Component と Client Component の境界

Next.js 15+ App Router では、**コンポーネントは原則 Server Component (SC)** で、ユーザー操作や状態が必要な箇所だけ `'use client'` で Client Component (CC) にします。

## 詳細ページの構造

```
page.tsx [Server Component]
├─ <img> ヒーロー画像
├─ <RecipeImageUploader />     [CC] ファイルアップロード
├─ <LikeButton />               [CC] いいね
├─ <SaveButton />               [CC] 保存
├─ <h1>レシピ名</h1>
├─ <RecipeOwnerActions />       [CC] 管理メニュー
├─ メタ行 (アバター/名前/日付/人数/コメント数/公開バッジ)
├─ 材料リスト
├─ <AddToShoppingListButton />  [CC] 買い物リスト追加
├─ 作り方
├─ タグ
├─ <ScoreSection />             [CC] 星評価
└─ <CommentSection />           [CC] コメント
```

## なぜ境界が大事か

| 種類 | できること | 制約 |
|---|---|---|
| **Server Component** | DB 直アクセス、環境変数読込、`cookies()` 等の API | `useState` 等の Hook 不可、イベントハンドラ不可 |
| **Client Component** | `useState`, `useEffect`, イベント処理 | データ取得は API 経由のみ、bundle に含まれる |

→ **静的な部分はすべて SC** にするとバンドルサイズが小さく、SEO に強く、初回表示が速い。  
→ **インタラクティブな部分だけ CC** に切り出す。

---

# 2. `router.refresh()` による Server-Client 同期

## 課題

`page.tsx` が SC で `recipe.is_published` や `comments.length` を描画しているとき、CC 側 (`RecipeOwnerActions`, `CommentSection`) で公開状態を切り替えたりコメントを追加しても、**SC の表示は古いまま**。

## 解決策

CC で API 成功後に `router.refresh()` を呼ぶ。Next.js が **SC だけを再 fetch** してページを更新する（フルリロードではないので CC の state は保持される）。

```tsx
// RecipeOwnerActions.tsx (抜粋)
const handleTogglePublish = async () => {
  // ... API call ...
  if (res.ok) {
    router.refresh()  // ← SC 部分だけ再取得 → 公開バッジが更新
    toast.success(next ? '公開しました' : '非公開にしました')
  }
}
```

```tsx
// CommentSection.tsx (抜粋)
if (res.ok) {
  const newComment = await res.json()
  setComments([newComment, ...comments])  // CC 内の楽観的更新
  setBody('')
  router.refresh()  // SC のメタ行コメント数を更新
}
```

## ポイント

- `router.refresh()` は **SC ツリーの再 fetch + 再レンダ**
- CC の `useState` 値は保持される（フォーム入力等が消えない）
- 軽量だが ~200ms の Rails 通信が走るので、頻繁に呼ばないこと

---

# 3. `fetchWithAuthClient` 統一の意義

## 共通ラッパーの役割

```tsx
// src/lib/fetchWithAuthClient.ts
export async function fetchWithAuthClient(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options)

  if (res.status === 401) {
    toast.error('セッションが切れました。再ログインしてください。')
    await fetch('/api/logout', { method: 'POST' })  // Cookie 削除
    window.location.href = '/login'                 // リダイレクト
  }

  return res
}
```

→ 401 を 1 箇所で処理することで、すべての API 呼び出しで一貫した「セッション切れ → ログイン画面」の体験を提供。

## Before (修正前) の問題

`RecipeImageUploader` だけ生の `fetch` を使っており、画像アップロード中にセッション切れすると：
- ❌ トースト出ない
- ❌ ログイン画面に飛ばない
- → ユーザーは「画像が変わらない…」と何度もクリックする (silent failure)

## After (修正後)

```tsx
// RecipeImageUploader.tsx (修正後)
const res = await fetchWithAuthClient(`/api/recipes/${recipeId}`, {
  method: 'PATCH',
  body: formData,
})

if (res.status === 401) return  // ラッパー側で処理済み、早期 return
```

→ 他の CC と同じ挙動になり、セッション切れ時に自動でログイン画面へ。

---

# 4. `try/catch/finally` で loading 永続化を防ぐ

## 問題のパターン

```tsx
// Bad: ネットワーク断時に loading=true が永続化
const handleSubmit = async () => {
  setLoading(true)
  const res = await fetchWithAuthClient(url)  // ← ここで throw すると...
  if (res.ok) { ... }
  setLoading(false)  // ← ここに到達しない！
}
```

ネットワーク断や `res.json()` の throw でこの行に到達しないと、**ボタンが「投稿中…」のまま固まる**。

## 解決策: `try/finally` で必ず実行

```tsx
// Good: finally で必ず setLoading(false) が実行される
const handleSubmit = async () => {
  setLoading(true)
  try {
    const res = await fetchWithAuthClient(url)
    if (res.status === 401) return
    if (res.ok) {
      const data = await res.json()
      // 成功処理
    } else {
      const data = await res.json().catch(() => null)  // 非 JSON 応答もガード
      setError(data?.errors?.[0] || 'デフォルトメッセージ')
    }
  } catch {
    setError('通信エラーが発生しました')  // ネットワーク断・throw を捕捉
  } finally {
    setLoading(false)  // ← 必ず実行される
  }
}
```

### `finally` のキモ

| 状態 | 実行されるブロック |
|---|---|
| 正常終了 | `try` → `finally` |
| `return` | `try` の return 直前 → `finally` |
| `throw` | `catch` → `finally` |
| `catch` 内で再 throw | `catch` → `finally` (再 throw は finally 後) |

→ **どんなパスでも `finally` は通る**。loading 状態のリセットには最適。

### 適用箇所

- `CommentSection.handleSubmit`
- `RecipeOwnerActions.handleDelete`
- `RecipeOwnerActions.handleTogglePublish`

---

# 5. `useEffect` cleanup によるタイマー片付け

## 問題

`setTimeout` が設定された後、コンポーネントが画面から消えても **タイマーは生き続ける**。  
画面遷移後にタイマーが発火し、消えたコンポーネントの中の `setState` を呼ぼうとして React 警告：

```
Warning: Can't perform a React state update on an unmounted component.
```

## 解決策: `useEffect` の戻り値で cleanup

```tsx
// AddToShoppingListButton.tsx
const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  // unmount 時に呼ばれる cleanup 関数
  return () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
    }
  }
}, [])  // 空配列 = マウント時に 1 回だけ登録

// タイマーセット時
resetTimerRef.current = setTimeout(() => setStatus('idle'), 3000)
```

### `useEffect` の構造

```tsx
useEffect(() => {
  // ① マウント時に実行 (画面に出た時)

  return () => {
    // ② アンマウント時に実行 (画面から消える時)
    // ここで購読解除・タイマー削除等を行う
  }
}, [deps])  // ③ deps が変わると ② → ① の順に再実行
```

→ **副作用 (timer / listener / subscription) を持つコンポーネントは、必ず cleanup を書く**。

### 適用箇所

- `ScoreSection`: 600ms デバウンスタイマー
- `AddToShoppingListButton`: 3 秒後に「追加しました」を idle に戻すタイマー

---

# 6. `Promise.all` による並列化

## Before: 逐次実行

```tsx
const recipe = await fetchRecipe(id)              // 300ms 待つ
if (!recipe) return notFound()

const comments = await fetchComments(id)          // さらに 300ms 待つ

const currentUserId = isLoggedIn
  ? await fetchCurrentUserId(...)                 // さらに 300ms 待つ
  : null

// 合計: 約 900ms
```

時系列：

```
0ms        300ms       600ms       900ms
|-recipe-|
        |-comments-|
                 |-currentUser-|
```

## After: 並列実行

```tsx
const [recipe, comments, currentUserId] = await Promise.all([
  fetchRecipe(id),
  fetchComments(id),
  isLoggedIn
    ? fetchCurrentUserId(accessToken!, client!, uid!)
    : Promise.resolve(null),  // ← 未ログイン時は null を即解決
])

if (!recipe) return notFound()

// 合計: 約 300ms (一番遅い 1 つ分)
```

時系列：

```
0ms        300ms
|-recipe------|
|-comments----|
|-currentUser-|
```

## 並列化できる条件

「**互いの結果に依存しない**」こと。3 つとも開始時点で必要な情報 (id, accessToken) が揃っているため並列化可能。

## トレードオフ

`notFound()` チェックを `Promise.all` 後に移したため、レシピが存在しないケースで `comments` と `currentUserId` も無駄に fetch される。  
→ **ハッピーパス最適化**。404 は稀なので合理的。

---

# 7. `force-dynamic` と `cache: 'no-store'` の関係

## Next.js のキャッシュ階層

| 階層 | 設定方法 | 影響 |
|---|---|---|
| **ルート (ページ)** | `export const dynamic = 'force-dynamic'` | このページは常に動的レンダリング |
| **fetch (リクエスト)** | `fetch(url, { cache: 'no-store' })` | このリクエストはキャッシュしない |

## 公式の規定

> `dynamic = 'force-dynamic'` を宣言すると、**そのルート内の全 fetch は自動的に `cache: 'no-store'` 相当**として扱われる

つまり以下は**重複**：

```tsx
export const dynamic = 'force-dynamic'  // ← これだけで十分

const res = await fetch(url, {
  cache: 'no-store',  // ← 重複（自動で no-store 扱い）
})
```

## 修正

`force-dynamic` を残し、各 fetch の `cache: 'no-store'` を削除（動作変更なし、コード簡素化）。

---

# 8. WAI-ARIA radiogroup pattern (StarInput)

WAI-ARIA APG (Authoring Practices Guide) の **Radio Group Pattern** に完全準拠。

## 仕様

| 要素 | role | 必須 ARIA 属性 |
|---|---|---|
| グループ | `radiogroup` | `aria-labelledby` (or `aria-label`), `aria-orientation` |
| 各ラジオ | `radio` | `aria-checked` (boolean), `aria-label` |

## キーボード操作仕様

| キー | 挙動 |
|---|---|
| `Tab` | グループに入る (currently checked か最初の radio に focus) |
| `→` / `↓` | 次の radio (orientation により挙動を変えても可) |
| `←` / `↑` | 前の radio |
| `Home` | 最初の radio |
| `End` | 最後の radio |
| `Space` / `Enter` | 現在の radio を選択 |

## 実装

```tsx
// StarInput.tsx
export default function StarInput({ value, onChange, label }: Props) {
  const [hovered, setHovered] = useState(0)
  const groupRef = useRef<HTMLDivElement>(null)
  const labelId = useId()  // ← React 19 のユニーク ID 生成

  // value の防御 (異常値で tabbable な radio が消えるのを防ぐ)
  const clampedValue = Math.max(0, Math.min(5, Math.floor(value)))

  // 矢印キーハンドラ
  const handleKeyDown = (e, star) => {
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp':   next = Math.min(5, star + 1); break
      case 'ArrowLeft':  case 'ArrowDown': next = Math.max(1, star - 1); break
      case 'Home': next = 1; break
      case 'End':  next = 5; break
      default: return
    }
    e.preventDefault()
    onChange(next)

    // querySelector で role="radio" を取り直してフォーカス移動
    const radios = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    radios?.[next - 1]?.focus()
  }

  return (
    <div className="flex items-center gap-2 flex-nowrap">
      <span id={labelId} className="text-sm text-gray-600 w-20 shrink-0">{label}</span>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-orientation="horizontal"
        className="flex gap-1 shrink-0"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const checked = star === clampedValue
          // roving tabindex
          const tabIndex = (clampedValue === 0 ? star === 1 : checked) ? 0 : -1
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${star} 星`}
              tabIndex={tabIndex}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              className="..."
            >★</button>
          )
        })}
      </div>
      <span aria-hidden="true">{clampedValue > 0 ? `${clampedValue}/5` : '未評価'}</span>
    </div>
  )
}
```

## SR (スクリーンリーダー) で読まれる内容

```
「美味しさ、ラジオグループ、横方向」
「3 星、ラジオボタン、選択中、5 個中の 3 番目」
```

→ **何点付いているかが音声で正確に伝わる**

## ポイント

### `useId()` の使用

```tsx
const labelId = useId()  // React 19 が安定したユニーク ID を生成
```

→ 同一ページに `<StarInput>` を 3 つ置いても id 衝突しない。label 値に空白や特殊文字があっても安全。

### `aria-orientation="horizontal"`

→ SR ユーザーが矢印キーの方向を予測しやすくなる (←→ で移動と分かる)。

### `aria-hidden="true"` でテキストを SR から隠す

```tsx
<span aria-hidden="true">{clampedValue}/5</span>
```

→ aria-checked と aria-label で既に伝わるため、視覚補助テキストは SR で 2 重読み上げにしない。

---

# 9. WAI-ARIA menu pattern (RecipeOwnerActions)

WAI-ARIA APG の **Menu Pattern** に完全準拠。

## 仕様

| 要素 | role | 必須 ARIA 属性 |
|---|---|---|
| トリガー | (button) | `aria-haspopup="menu"`, `aria-expanded` |
| メニュー | `menu` | (任意で `aria-labelledby`) |
| 項目 | `menuitem` | (有効時のみ tabbable) |

## キーボード操作仕様

| キー | 挙動 |
|---|---|
| トリガーで `Enter` / `Space` | メニューを開く + 最初の項目に focus |
| メニュー内で `↓` | 次の項目 (循環) |
| メニュー内で `↑` | 前の項目 (循環) |
| `Home` | 最初の項目 |
| `End` | 最後の項目 |
| `Escape` | メニューを閉じる + トリガーに focus 復帰 |
| 外側クリック | メニューを閉じる |

## 実装

```tsx
// RecipeOwnerActions.tsx (一部抜粋)
const containerRef = useRef<HTMLDivElement>(null)
const triggerRef = useRef<HTMLButtonElement>(null)
const menuRef = useRef<HTMLDivElement>(null)

// 外側クリック / Escape で閉じる + Escape はトリガーに focus 復帰
useEffect(() => {
  if (!open) return

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('keydown', handleKeyDown)
  }
}, [open])

// メニューを開いた直後に最初の menuitem へ自動 focus
useEffect(() => {
  if (!open) return
  const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
  firstItem?.focus()
}, [open])

// メニュー内の矢印キー / Home / End ナビゲーション
const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  const items = Array.from(
    menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
  )
  if (items.length === 0) return

  const currentIndex = items.findIndex((el) => el === document.activeElement)
  let nextIndex: number | null = null

  switch (e.key) {
    case 'ArrowDown':
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length
      break
    case 'ArrowUp':
      nextIndex = currentIndex < 0
        ? items.length - 1
        : (currentIndex - 1 + items.length) % items.length
      break
    case 'Home': nextIndex = 0; break
    case 'End':  nextIndex = items.length - 1; break
    default: return
  }
  e.preventDefault()
  items[nextIndex]?.focus()
}
```

JSX:

```tsx
<div ref={containerRef} className="relative">
  <button
    ref={triggerRef}
    aria-haspopup="menu"
    aria-expanded={open}
    onClick={() => setOpen(v => !v)}
  >⋯ 管理</button>

  {open && (
    <div
      ref={menuRef}
      role="menu"
      onKeyDown={handleMenuKeyDown}
    >
      <Link role="menuitem" tabIndex={-1} ...>編集</Link>
      <button role="menuitem" tabIndex={-1} ...>公開する/非公開にする</button>
      <button role="menuitem" tabIndex={-1} ...>削除</button>
    </div>
  )}
</div>
```

## ポイント

### `tabIndex={-1}` の意味

> 「Tab キーでは到達しないが、JS から `.focus()` で focus 可能」

メニュー項目は **矢印キーで移動するもの**で Tab では順次移動しない（roving tabindex のため）。

### 開いた瞬間の自動 focus

```tsx
useEffect(() => {
  if (!open) return
  menuRef.current?.querySelector('[role="menuitem"]')?.focus()
}, [open])
```

→ メニューを開いた直後に最初の項目に focus が当たる。これがないと、ユーザーが開いた後 Tab を押す必要があり面倒。

### Escape で focus 復帰

```tsx
if (e.key === 'Escape') {
  setOpen(false)
  triggerRef.current?.focus()  // ← トリガーに戻す
}
```

→ メニューを閉じた後に focus が宙に浮かない。ユーザーが「⋯ 管理」ボタンに戻ってきたことが視覚的に分かる。

### 循環ナビゲーション

```tsx
nextIndex = (currentIndex + 1) % items.length
```

→ 最後の項目から ↓ を押すと最初に戻る (`% items.length` でラップ)。WAI-ARIA APG 推奨。

---

# 10. `useId()` による id 衝突回避

## 問題のあるパターン

```tsx
<span id={`star-label-${label}`}>{label}</span>
<div aria-labelledby={`star-label-${label}`}>...</div>
```

このコードの問題：

1. **id 衝突**: 同一ページに `<StarInput label="美味しさ" />` を 2 つ置くと id が同じになる
2. **空白問題**: label に空白が入ると `aria-labelledby` の token list として誤解釈
3. **i18n 問題**: 日本語 id は HTML5 で valid だが古いツールで escape が必要なことがある

## 解決: React 19 の `useId()`

```tsx
import { useId } from 'react'

const labelId = useId()  // 例: ":r0:" (一意かつ安全な ID)

<span id={labelId}>{label}</span>
<div aria-labelledby={labelId}>...</div>
```

### `useId()` の特徴

- **一意性**: 同じコンポーネントを N 回マウントしても全部別 ID
- **SSR セーフ**: サーバーとクライアントで同じ ID が生成される (hydration mismatch 回避)
- **HTML 安全**: 特殊文字なし、空白なし

→ **id を動的生成するときは `useId()` を使う**。これだけ覚えておけば間違わない。

---

# 11. roving tabindex パターン

## 課題

ラジオボタンやメニュー項目を Tab で巡回させると：
- 項目が 5 個あれば Tab を 5 回押す必要がある
- ユーザーが疲れる

## 解決: roving tabindex

「**フォーカス可能な要素は常に 1 つだけ**」というパターン：

| 要素 | tabIndex |
|---|---|
| 現在選択中 (or 最初) の要素 | `0` (Tab 可能) |
| その他の要素 | `-1` (Tab 不可、JS focus は可能) |

## StarInput での実装

```tsx
const tabIndex = (clampedValue === 0 ? star === 1 : checked) ? 0 : -1
```

- 未選択 (clampedValue=0): ★1 だけ tabIndex=0 (Tab で入れる)
- 選択中: 選択中の星だけ tabIndex=0
- それ以外: tabIndex=-1

→ Tab 1 回でグループに入って、矢印キーで星間移動。

## RecipeOwnerActions での実装

```tsx
<Link role="menuitem" tabIndex={-1} ...>
<button role="menuitem" tabIndex={-1} ...>
```

→ メニュー項目は全部 tabIndex=-1。  
→ メニューを開いた瞬間に JS で最初の項目に `.focus()` する。  
→ ユーザーは矢印キーで項目間を移動。

## なぜこれがベストプラクティスか

WAI-ARIA APG が推奨する**標準パターン**。VoiceOver / NVDA / JAWS 等の主要 SR が期待する操作感と一致するため、**ユーザーが学習コストなしで使える**。

---

# 検証方法

## キーボードで星評価
1. ページ読込後に Tab で「美味しさ」の星にフォーカス
2. ←→ で星の数を増減
3. Home で ★1、End で ★5
4. Enter or Space で確定（既存の onClick が発火）
5. 600ms 後に自動保存

## キーボードで管理メニュー
1. Tab で「⋯ 管理」にフォーカス
2. Enter or Space でメニュー展開 → 自動で「編集」に focus
3. ↓↑ で項目移動 (循環)
4. Home / End で先頭/末尾
5. Enter で選択 / Escape で閉じる + トリガーに focus 復帰

## スクリーンリーダーでの読み上げ確認
- VoiceOver (macOS): `Cmd + F5` で起動
- NVDA (Windows): https://www.nvaccess.org/
- 期待される読み上げ:
  - 星: 「美味しさ、ラジオグループ、3 星、ラジオボタン、選択中、5 個中の 3 番目」
  - メニュー: 「管理、メニューポップアップを展開、選択済み」「編集、メニュー項目」

---

# 参考リンク

- [WAI-ARIA Authoring Practices: Radio Group Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- [WAI-ARIA Authoring Practices: Menu Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/)
- [Next.js: Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [React 19: useId Hook](https://react.dev/reference/react/useId)
- [MDN: tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)
- [React: useEffect with cleanup](https://react.dev/reference/react/useEffect#parameters)
