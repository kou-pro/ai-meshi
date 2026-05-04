# 買い物リストの単位バグ調査・修正記録

> 2026/5/4 のセッション。「買い物リストの単位がおかしい (例: 醤油が `"1大さじ"` と表示される)」という報告から、根本原因の特定 → Service Object 化による修正まで。

---

## 目次

1. [事象](#1-事象)
2. [調査プロセス](#2-調査プロセス)
3. [根本原因](#3-根本原因)
4. [設計判断: Service Object パターンの採用](#4-設計判断-service-object-パターンの採用)
5. [実装内容](#5-実装内容)
6. [業界標準の調査結果](#6-業界標準の調査結果)
7. [テスト戦略](#7-テスト戦略)
8. [既存データの修正](#8-既存データの修正)
9. [学び](#9-学び)

---

## 1. 事象

### 報告内容
> 「買い物リストに人のレシピを追加すると、単位がたまにずれていたり合っていなかったりする。バジルが `"枚枚枚"` になっていた等」

### 期待挙動
レシピの「醤油 大さじ1」は買い物リストでも `"大さじ1"` と表示されるべき。

### 実際の挙動 (バグ)
- 大さじ/小さじが付く調味料 → `"1大さじ"` `"1小さじ"` (順序が逆)
- 「適量」の食材 → `"適量g"` (適量に単位が付く)

---

## 2. 調査プロセス

### Step 1: ブランチ作成 (Git ベストプラクティス)

```bash
git checkout -b fix/shopping-list-unit-bug
```

main を直接触らず、修正用ブランチで作業。

### Step 2: DB の実データを確認

「コードを推測で議論する前に DB を見る」が鉄則。

```bash
docker compose exec rails rails runner '
  ShoppingListItem.order(created_at: :desc).limit(10).each do |item|
    puts "[#{item.id}] #{item.ingredient_name} = #{item.ingredient_amount.inspect}"
  end
'
```

#### 出力 (抜粋)

```
[268] 白ごま     = "適量g"      ← ❌ 適量に単位が付いている
[267] 砂糖       = "1小さじ"    ← ❌ 「小さじ1」が正しい
[266] 醤油       = "1大さじ"    ← ❌ 「大さじ1」が正しい
[264] ニンジン   = "2本"        ← ✅ 正しい
[262] もやし     = "100g"       ← ✅ 正しい
```

### Step 3: 元の Recipe ingredients と突き合わせ

**ShoppingListItem の壊れた amount** と、**元の Recipe の生 ingredients** を比較して、AI 出力時点で壊れているのか・連結時に壊れたのかを判別。

```bash
docker compose exec rails rails runner '
  ShoppingListItem.order(created_at: :desc).limit(10).each do |item|
    matching = item.recipe.ingredients&.find {|i| i["name"] == item.ingredient_name }
    puts "[#{item.id}] #{item.ingredient_name}"
    puts "  saved amount: #{item.ingredient_amount.inspect}"
    puts "  raw recipe:  #{matching.inspect}"
  end
'
```

#### 出力 (抜粋)

```
[267] 砂糖
  saved amount: "1小さじ"
  raw recipe:  {"name"=>"砂糖", "unit"=>"小さじ", "category"=>"調味料", "quantity"=>"1"}

[268] 白ごま
  saved amount: "適量g"
  raw recipe:  {"name"=>"白ごま", "unit"=>"g", "category"=>"トッピング", "quantity"=>"適量"}
```

#### 重要な発見

> **AI 出力は構造的に正しい**。`quantity` と `unit` のフィールドは適切に分離されている。  
> **バグは 100% Rails コントローラーの連結ロジックにある**。

### Step 4: 全 DB の異常パターン検出

```bash
docker compose exec rails rails runner '
  weird = ShoppingListItem.all.select do |item|
    a = item.ingredient_amount
    (a.include?("適量") && a != "適量") ||
    a.match?(/^\d+(大さじ|小さじ|カップ)/) ||
    a.match?(/(.)\1{2,}/)
  end
  puts "Total weird: #{weird.size}"
  weird.each {|i| puts "[#{i.id}] #{i.ingredient_name} = #{i.ingredient_amount}" }
'
```

→ 全 28 件中 **10 件 (35%) が壊れた状態**。  
→ パターンは「大さじ/小さじ前後逆」と「適量+単位」の 2 種類のみ。

---

## 3. 根本原因

`rails/app/controllers/api/v1/shopping_list_items_controller.rb` (修正前 line 37):

```ruby
amount = "#{ingredient["quantity"]}#{ingredient["unit"]}"
```

このコードが以下のエッジケースを処理していなかった:

| 入力 | 旧結果 | 正しい結果 |
|---|---|---|
| `quantity="適量", unit="g"` | `"適量g"` | `"適量"` |
| `quantity="1", unit="大さじ"` | `"1大さじ"` | `"大さじ1"` |
| `quantity="1", unit="小さじ"` | `"1小さじ"` | `"小さじ1"` |

詳細ページ (`page.tsx`) では同じロジックが**正しく実装されていた**ため、表示と保存で挙動が乖離していた = **コードの重複が事故の元**。

---

## 4. 設計判断: Service Object パターンの採用

### 選択肢

| パターン | 説明 | 評価 |
|---|---|---|
| A. モデル class method | `ShoppingListItem.format_amount(...)` | △ 永続化責務と混ざる |
| **B. Service Object** | **`IngredientFormatter.call(...)`** | **⭐ Rails コミュニティ定石** |
| C. Plain Ruby Module | `module IngredientFormatting` | ○ 純 Ruby だが Rails 慣習弱い |
| D. Rails 7.1 `normalizes` | `normalizes :amount, with: ->(v) {...}` | ✗ 単一カラム正規化用、本ケース不適 |

### B (Service Object) を選んだ理由

1. **Skinny Model 原則**: モデルは永続化責務に専念、ドメインロジックは外部に
2. **再利用性**: Recipe 等の他の文脈からも同じロジックを呼べる
3. **単一責任原則 (SRP)**: 「単位整形」という独立した責務として切り出す
4. **テスタビリティ**: AR モデルに依存しない純粋関数として独立してテスト可能
5. **業界標準**: Rails 5.x 以降のコミュニティ定石パターン

### ファイル構成

```
rails/app/
├── models/
│   └── shopping_list_item.rb     ← 永続化のみ (純粋化)
├── services/                      ← 新規ディレクトリ
│   └── ingredient_formatter.rb   ← 単位整形ロジック
└── controllers/api/v1/
    └── shopping_list_items_controller.rb  ← Service を呼ぶ

rails/spec/
└── services/
    └── ingredient_formatter_spec.rb  ← 36 例の単体テスト
```

---

## 5. 実装内容

### IngredientFormatter (Service Object)

```ruby
class IngredientFormatter
  AMOUNT_ONLY_KEYWORDS = %w[
    適量 適宜
    少々
    ひとつまみ ふたつまみ
    ひとにぎり 一握り ひとつかみ
    お好み お好みで お好みの量 お好きな量
    各適量
    半分
  ].freeze

  UNIT_FIRST = %w[大さじ 小さじ カップ].freeze

  def self.call(quantity:, unit:)
    new(quantity: quantity, unit: unit).call
  end

  def initialize(quantity:, unit:)
    @quantity = quantity.to_s.strip
    @unit = unit.to_s.strip
  end

  def call
    return "" if @quantity.blank? && @unit.blank?
    return @quantity if @unit.blank?
    return @unit if @quantity.blank?
    return @quantity if AMOUNT_ONLY_KEYWORDS.include?(@quantity)
    return "#{@unit}#{@quantity}" if UNIT_FIRST.include?(@unit)
    "#{@quantity}#{@unit}"
  end
end
```

### Controller の変更

```ruby
# Before
amount = "#{ingredient["quantity"]}#{ingredient["unit"]}"

# After
amount = IngredientFormatter.call(
  quantity: ingredient["quantity"],
  unit: ingredient["unit"],
)
```

### Model の純粋化

```ruby
# Before: format_amount メソッドや定数を持っていた
# After: 永続化責務だけに戻す
class ShoppingListItem < ApplicationRecord
  belongs_to :user
  belongs_to :recipe
  validates :ingredient_name, presence: true
end
```

### Frontend (TypeScript) の同期

`next/src/lib/formatIngredientAmount.ts` を新規作成し、Rails 側と**同じキーワードリスト**で同じロジックを実装。

```typescript
export const AMOUNT_ONLY_KEYWORDS = [
  '適量', '適宜',
  '少々',
  'ひとつまみ', 'ふたつまみ',
  // ... (Rails と完全一致)
] as const

export const UNIT_FIRST = ['大さじ', '小さじ', 'カップ'] as const

export function formatIngredientAmount({ quantity, unit }) {
  // Rails の IngredientFormatter と同じロジック
}
```

詳細ページ (`page.tsx`) からこれを呼び出し:

```tsx
const amount = formatIngredientAmount({
  quantity: ingredient.quantity,
  unit: ingredient.unit,
})
```

---

## 6. 業界標準の調査結果

複数の信頼できる情報源を確認:

| 出典 | 内容 |
|---|---|
| [味の素パーク](https://park.ajinomoto.co.jp/recipe/basic/ingredients_bunryou/) | 食材別の標準単位 (個・本・株・玉・束・把・枚・切れ・尾・丁・パック等) |
| [DELISH KITCHEN](https://help.delishkitchen.tv/) | レシピ内での単位表記慣習 |
| [素材力だし (味の素)](https://sozairyoku.jp/) | 「少々」「ひとつまみ」「適量」の定義 |
| 香川綾 (1948) | 大さじ・小さじ・カップの規格 (女子栄養大学創立者) |

### 全網羅した単位カテゴリ

#### Pre-fix (前置)
- 大さじ / 小さじ / カップ

#### Post-fix (後置)
- 体積: g, kg, ml, cc, L, 合
- 個数 (野菜): 個, 本, 株, 玉, 束, 把, 房, 節, 片, かけ, cm
- 個数 (肉魚): 枚, 切れ, 尾
- 個数 (卵豆腐): 丁, 個
- 包装: 袋, パック, 缶, 瓶, 箱
- 麺主食: 玉, 杯

#### Amount-only (単位なし)
- 適量, 適宜, 少々, ひとつまみ, ふたつまみ, ひとにぎり, 一握り, ひとつかみ, お好み, お好みで, お好みの量, お好きな量, 各適量, 半分

---

## 7. テスト戦略

### RSpec 36 例で全エッジケースをカバー

```ruby
# spec/services/ingredient_formatter_spec.rb (抜粋)
context "数値 + 大さじ/小さじ/カップ (前置)" do
  it "1 + 大さじ → '大さじ1' (順序逆転)" do
    expect(call_formatter("1", "大さじ")).to eq("大さじ1")
  end
end

context "回帰テスト (実際に発生したバグ)" do
  it "白ごま: 適量 + g → '適量' (旧バグ: '適量g')" do
    expect(call_formatter("適量", "g")).to eq("適量")
  end
end
```

### テストカテゴリ

1. **通常ケース**: 100g, 2本, 200ml 等
2. **前置単位**: 大さじ1, 小さじ1, カップ2
3. **Amount-only キーワード**: 14 種類すべて
4. **空値・nil**: nil, 空文字列, 片方空
5. **前後空白**: trim 対応
6. **範囲・分数**: 1〜2本, 1.5個, 1/3カップ
7. **回帰テスト**: 実際の本番バグ事例
8. **不変性**: 定数が `frozen` であることを保証

### 注意点: RuboCop の `Style/FormatString`

最初は helper メソッド名を `format` にしていたが、RuboCop の autocorrect が **Kernel#format と誤認**して
`format("100", "g")` を `"100" % "g"` に変換してしまい、テストが全て壊れる事故が発生。  
→ **`call_formatter` に rename して回避**。「Ruby Kernel と同名のメソッドを定義しない」が教訓。

---

## 8. 既存データの修正

新コードを動かすだけだと既存の壊れデータは残る。**Recipe の生 ingredients から再計算**して修正:

```bash
docker compose exec rails rails runner '
  ShoppingListItem.includes(:recipe).find_each do |item|
    ing = item.recipe.ingredients&.find {|i| i["name"] == item.ingredient_name }
    next unless ing
    new_amount = IngredientFormatter.call(quantity: ing["quantity"], unit: ing["unit"])
    item.update!(ingredient_amount: new_amount) if item.ingredient_amount != new_amount
  end
'
```

#### 結果

```
[172] ごま油: "1大さじ" → "大さじ1"
[173] 醤油:   "1大さじ" → "大さじ1"
[252] 白ごま: "適量g"  → "適量"
... (10 件全て修正)
Fixed: 10 records
```

修正後の異常検出: **0 件** ✅

### なぜ Recipe の生データから再計算する？

ShoppingListItem の壊れた `ingredient_amount` を再パースするのは脆弱 (例: "1大さじ" を "1" と "大さじ" に分解する正規表現はエッジケースで失敗しやすい)。  
代わりに **Recipe の `ingredients` JSON (壊れていない元データ)** から再計算するのが確実。

---

## 9. 学び

### A. データバグの調査は「事実 → 仮説 → 検証」の順

最初は「AI が悪い」と推測したが、DB を実際に見たら AI 出力は正しかった。  
**コードを推測で議論する前に DB の実データを確認**するのが鉄則。

### B. Skinny Model 原則と Service Object

「モデルに何でも書ける ≠ 何でも書くべき」。  
**そのモデル固有のロジックだけ Model に書く**。複数モデル横断や再利用性の高い処理は Service Object に切り出す。

### C. 単一ソース原則 (DRY)

詳細ページ (page.tsx) と Rails Controller の **2 箇所に同じロジック**があったのが事故の元。  
それぞれが独立に進化してしまい、片方だけ正しくて片方が間違っているという状態に。  
→ **今回は完全な単一ロジック化はできないが、同じキーワードリスト + 同じ条件分岐**を両側で実装。

### D. テストファースト的な姿勢

RSpec で 36 例を書いてから動作確認することで、「どのエッジケースが正しく動くべきか」を**事前に明文化**できる。  
将来「これってどう動くんだっけ？」と疑問になった時の確認資料にもなる。

### E. RuboCop autocorrect の罠

便利だが盲信は危険。`format` のような Ruby Kernel の標準メソッド名と被るシンボルを使うと、RuboCop が想定外の変換をかけてくる。  
**autocorrect 後は必ずテストを再実行**して動作確認する。

### F. 既存データの後始末を忘れない

新コードがリリース時から動くだけでは、過去に壊れたデータが残る。  
**マイグレーション or rake task or rails runner で既存データを修正**する工程をリリース計画に必ず含める。

---

## 修正後のディレクトリ構成

```
rails/
├── app/
│   ├── models/
│   │   └── shopping_list_item.rb           ← 純粋化
│   ├── services/                            ← 新規
│   │   └── ingredient_formatter.rb         ← 新規
│   └── controllers/api/v1/
│       └── shopping_list_items_controller.rb  ← IngredientFormatter.call を使用
├── spec/
│   └── services/                            ← 新規
│       └── ingredient_formatter_spec.rb    ← 新規 (36 例)

next/
└── src/
    ├── lib/
    │   └── formatIngredientAmount.ts       ← 新規 (Rails と一貫性)
    └── app/(main)/recipes/[id]/page.tsx    ← formatIngredientAmount を使用

note/
└── shopping-list-unit-bug.md               ← この資料
```

---

## 参考リンク

- [Rails 7.1: ActiveRecord::Normalization 公式](https://api.rubyonrails.org/v7.1/classes/ActiveRecord/Normalization/ClassMethods.html)
- [Saeloun Blog: Rails 7.1 Normalizes Feature](https://blog.saeloun.com/2023/11/02/rails-7-1-introduces-active-record-base-normalization/)
- [Scott Domes: Service Objects in Rails](https://scottdomes.medium.com/service-objects-in-rails-75ca74214b77)
- [BairesDev: Rails Service Objects Best Practices](https://www.bairesdev.com/blog/rails-service-models/)
- [味の素パーク: 食材の目安量](https://park.ajinomoto.co.jp/recipe/basic/ingredients_bunryou/)
- [素材力だし: 計量スプーンの正しい使い方](https://sozairyoku.jp/)
