class AddIngredientCategoryToShoppingListItems < ActiveRecord::Migration[7.2]
  def change
    add_column :shopping_list_items, :ingredient_category, :string
  end
end
