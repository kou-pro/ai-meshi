class AddAggregationFieldsToShoppingListItems < ActiveRecord::Migration[7.2]
  # 集約設計 (quantity加算モデル) への移行。
  # ingredient_amount (文字列で数量+単位を持つ列) を廃止し、
  # quantity (数値) + unit (単位) に分離して 3NF/業界標準に揃える。
  # 同時に added_count (追加回数) を導入し、フロントの推定計算を撤廃。
  #
  # 出典:
  #   - Shopping cart DB pattern: https://www.geeksforgeeks.org/sql/how-to-design-a-database-for-shopping-cart/
  #   - Rails Migrations: https://guides.rubyonrails.org/active_record_migrations.html
  #
  # 注意: 本Migrationは既存データを破棄する前提 (デモフェーズのため許容)。
  #   ローカル: Migration実行前に ShoppingListItem.delete_all
  #   本番:    PRマージ前に ECS Exec から ShoppingListItem.delete_all
  def change
    # 文字列で派生値を持っていたカラムを削除 (DRY違反/3NF違反のため)
    remove_column :shopping_list_items, :ingredient_amount, :string

    # 数量 (数値): decimal(10,3) で 1234567.890 まで対応。
    # null許容の理由: 「適量」「少々」等の AMOUNT_ONLY_KEYWORDS は数値化できないため。
    # その場合 quantity=NULL, unit="適量" 等のキーワードを格納する。
    add_column :shopping_list_items, :quantity, :decimal,
               precision: 10, scale: 3

    # 単位 ("個", "g", "大さじ", "適量" 等)。最低1つは必ず入る。
    add_column :shopping_list_items, :unit, :string, null: false

    # 同一キーが何回追加されたか (最低1回)
    add_column :shopping_list_items, :added_count, :integer,
               default: 1, null: false

    # 同一 (user_id, recipe_id, ingredient_name, unit) は1行に集約。
    # quantity が NULL でも、unit が UNIQUE キーの一部なので「卵 適量」と
    # 「卵 2個」は別行として共存できる (unit が違う)。
    add_index :shopping_list_items,
              [:user_id, :recipe_id, :ingredient_name, :unit],
              unique: true,
              name: "index_shopping_list_items_on_aggregation_key"
  end
end
