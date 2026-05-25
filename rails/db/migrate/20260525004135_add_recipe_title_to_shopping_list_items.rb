class AddRecipeTitleToShoppingListItems < ActiveRecord::Migration[7.2]
  # 買い物リスト追加時にレシピ名をスナップショット保存する列。
  # レシピ削除(recipe_id=NULL)後も「○○（削除済み）」と表示できるようにする。
  # 既存データのバックフィルはマイグレーション外(単発タスク)で実施(Railsガイド §10.2 準拠)。
  def change
    add_column :shopping_list_items, :recipe_title, :string
  end
end
