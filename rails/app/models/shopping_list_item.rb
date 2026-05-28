class ShoppingListItem < ApplicationRecord
  belongs_to :user
  # 元レシピが削除されると recipe_id は NULL になる(Recipe 側 dependent: :nullify)。
  # 食材スナップショット(ingredient_*)は残るため、optional にして参照切れを許容する。
  belongs_to :recipe, optional: true

  # 食材名は空NG。Rails 公式 presence バリデーション (Object#blank? で判定)
  validates :ingredient_name, presence: true
  # 単位は必須。DB の null: false に加え Rails 側でも保証する二重防御。
  validates :unit, presence: true
  # 数量は 0 以上の数値。「適量」「少々」等は quantity=NULL で表現するため allow_nil。
  validates :quantity, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  # 追加回数は 1 以上の整数。レコード存在 = 最低1回は追加されたという不変条件。
  validates :added_count, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
end
