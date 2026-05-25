class AllowNullRecipeIdOnShoppingListItems < ActiveRecord::Migration[7.2]
  # レシピ削除時に Recipe#shopping_list_items が dependent: :nullify で
  # recipe_id を NULL にできるよう、NOT NULL 制約を外す。
  # 食材スナップショット(ingredient_*)は残り、買い物リストは存続する。
  def change
    change_column_null :shopping_list_items, :recipe_id, true
  end
end
