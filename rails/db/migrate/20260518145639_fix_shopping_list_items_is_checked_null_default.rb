class FixShoppingListItemsIsCheckedNullDefault < ActiveRecord::Migration[7.2]
  def up
    # 既存 NULL レコードを false に変換（NOT NULL 制約を付ける前提条件）。
    execute "UPDATE shopping_list_items SET is_checked = false WHERE is_checked IS NULL"

    change_column_default :shopping_list_items, :is_checked, false
    change_column_null :shopping_list_items, :is_checked, false
  end

  def down
    change_column_null :shopping_list_items, :is_checked, true
    change_column_default :shopping_list_items, :is_checked, nil
  end
end
