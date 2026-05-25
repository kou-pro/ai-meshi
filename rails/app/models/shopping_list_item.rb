class ShoppingListItem < ApplicationRecord
  belongs_to :user
  # 元レシピが削除されると recipe_id は NULL になる(Recipe 側 dependent: :nullify)。
  # 食材スナップショット(ingredient_*)は残るため、optional にして参照切れを許容する。
  belongs_to :recipe, optional: true

  validates :ingredient_name, presence: true
end
