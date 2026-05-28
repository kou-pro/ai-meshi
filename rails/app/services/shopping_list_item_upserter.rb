class ShoppingListItemUpserter
  # 既存 IngredientFormatter と同じ呼び出しパターン (キーワード引数で順番ミスを防ぐ)
  def self.call(user:, recipe_id:, ingredients:)
    new(user, recipe_id, ingredients).call
  end

  def initialize(user, recipe_id, ingredients)
    @user         = user
    @recipe_id    = recipe_id
    @ingredients  = ingredients
    # レシピ削除後の墓標表示用にスナップショット保存 (既存仕様維持)
    @recipe_title = Recipe.find_by(id: recipe_id)&.title
  end

  def call
    # 全 ingredients を atomic に upsert (1 つでも失敗したら全部ロールバック)。
    # transaction で囲む理由: 半端な状態 (5 件中 3 件だけ保存) を許さない。
    ApplicationRecord.transaction do
      @ingredients.each {|ingredient| upsert_one(ingredient) }
    end
  end

  private

    # 1 食材を upsert する。
    #
    # race condition (連打等) で同一キーの並行 INSERT が起きると UNIQUE INDEX
    # 違反で ActiveRecord::RecordNotUnique が発生する。これを catch して 1 回
    # retry することで、retry 時には find_or_initialize_by が既存行を見つけて
    # update 経路に入る (Rails 公式パターン: rails/rails#45720)。
    def upsert_one(ingredient)
      qty, unit_val = split_quantity_and_unit(ingredient)

      retries = 0
      begin
        item = @user.shopping_list_items.find_or_initialize_by(
          recipe_id: @recipe_id,
          ingredient_name: ingredient["name"],
          unit: unit_val,
        )

        if item.persisted?
          # 既存行: quantity 加算 + added_count +1
          # qty が nil (適量等) のときは加算スキップ、added_count だけ +1
          item.quantity = (item.quantity || 0) + qty if qty
          item.added_count += 1
        else
          # 新規行: 初期値設定 (added_count は DB default 1)
          item.recipe_title        = @recipe_title
          item.quantity            = qty
          item.ingredient_category = ingredient["category"]
          item.is_checked          = false
        end

        item.save!
      rescue ActiveRecord::RecordNotUnique
        retries += 1
        retry if retries < 2
        raise
      end
    end

    # AI 出力の {quantity, unit} を新スキーマ用に分解する。
    #
    # 「適量」「少々」等の AMOUNT_ONLY_KEYWORDS は数値化できないため
    # quantity=NULL とし、unit 側にそのキーワードを格納する。
    # (例: input {quantity: "適量", unit: ""} → output [nil, "適量"])
    #
    # それ以外は raw_quantity を BigDecimal に変換。
    # 失敗した場合は nil とし、unit が空なら "個" にフォールバック。
    def split_quantity_and_unit(ingredient)
      raw_quantity = ingredient["quantity"].to_s.strip
      raw_unit     = ingredient["unit"].to_s.strip

      if IngredientFormatter::AMOUNT_ONLY_KEYWORDS.include?(raw_quantity)
        [nil, raw_quantity]
      else
        qty = parse_decimal(raw_quantity)
        unit_val = raw_unit.presence || "個"
        [qty, unit_val]
      end
    end

    # 文字列を BigDecimal に変換。失敗時は nil を返す。
    # BigDecimal は Float の丸め誤差がない正確な十進演算を提供する
    # (Ruby 公式: https://docs.ruby-lang.org/en/master/BigDecimal.html)。
    def parse_decimal(str)
      BigDecimal(str)
    rescue ArgumentError, TypeError
      nil
    end
end
