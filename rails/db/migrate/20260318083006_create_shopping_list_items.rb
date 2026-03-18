class CreateShoppingListItems < ActiveRecord::Migration[7.2]
  def change
    create_table :shopping_list_items do |t|
      t.references :user, null: false, foreign_key: true
      t.references :recipe, null: false, foreign_key: true
      t.boolean :is_checked, default: false, null: false

      t.timestamps
    end
  end
end