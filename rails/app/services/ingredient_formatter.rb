# 食材の数量と単位を、人間に読みやすい "amount" 文字列に整形する Service Object。
#
# # 設計理由
# 元の実装は ShoppingListItemsController 内で素朴に
#   "#{quantity}#{unit}"
# と連結しており、以下の壊れ表記が頻発していた:
#   ("適量", "g")    → "適量g"   (「適量」に単位は不要)
#   ("1", "大さじ")  → "1大さじ" (正しくは "大さじ1")
#
# モデル (ShoppingListItem) に書くこともできたが、
# - "単位整形" は永続化責務とは独立したドメインロジック
# - 将来 Recipe / 他の機能でも再利用される可能性が高い
# - Skinny Model 原則に反する
# ため、Service Object として切り出した。
#
# # 使い方
#   IngredientFormatter.call(quantity: "1", unit: "大さじ")
#   #=> "大さじ1"
#
#   IngredientFormatter.call(quantity: "適量", unit: "g")
#   #=> "適量"
#
#   IngredientFormatter.call(quantity: "100", unit: "g")
#   #=> "100g"
#
# # データソースの根拠
# 業界標準 (味の素パーク / DELISH KITCHEN / クラシル / 調理師慣習) を
# 網羅したキーワードリストを採用。
class IngredientFormatter
  # 数値を伴わない量表現。これらが quantity に来た場合、unit は捨てて
  # quantity だけを採用する (例: "適量g" ではなく "適量")。
  # 出典: 味の素パーク, DELISH KITCHEN, 素材力だし (味の素), 調理師標準表記
  AMOUNT_ONLY_KEYWORDS = %w[
    適量 適宜
    少々
    ひとつまみ ふたつまみ
    ひとにぎり 一握り ひとつかみ
    お好み お好みで お好みの量 お好きな量
    各適量
    半分
  ].freeze

  # 数量の「前」に来る単位 (香川綾 1948 規格による日本料理の慣習)。
  # これらは "{unit}{quantity}" の順序で結合する (例: "大さじ1")。
  UNIT_FIRST = %w[大さじ 小さじ カップ].freeze

  # エントリポイント。
  # キーワード引数で呼ぶことで、呼び出し側で順番ミスが起きないようにする。
  def self.call(quantity:, unit:)
    new(quantity: quantity, unit: unit).call
  end

  def initialize(quantity:, unit:)
    @quantity = normalize_quantity(quantity)
    @unit = unit.to_s.strip
  end

  def call
    return "" if @quantity.blank? && @unit.blank?
    return @quantity if @unit.blank?
    return @unit if @quantity.blank?

    # 「適量」「少々」等は単位を捨てる
    return @quantity if AMOUNT_ONLY_KEYWORDS.include?(@quantity)

    # 「大さじ」「小さじ」「カップ」は前置
    return "#{@unit}#{@quantity}" if UNIT_FIRST.include?(@unit)

    # それ以外は数量+単位 (例: "100g", "2本")
    "#{@quantity}#{@unit}"
  end

  private

    # 数量を人間向け表示文字列に正規化する。
    #
    # 新スキーマでは ShoppingListItem.quantity は BigDecimal で渡ってくるが、
    # 素朴な to_s は "0.2e1" のような工学表記になることがある。
    # 整数値の場合は ".0" を付けず "2"、小数の場合は "2.5" のように
    # 自然な表記に整形する。
    #
    # 既存の文字列(AI 出力直後の "2" "適量" 等)もそのまま受け付ける。
    def normalize_quantity(qty)
      case qty
      when BigDecimal
        qty.frac.zero? ? qty.to_i.to_s : qty.to_s("F")
      else
        qty.to_s.strip
      end
    end
end
