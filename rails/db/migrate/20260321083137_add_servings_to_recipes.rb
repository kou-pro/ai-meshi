class AddServingsToRecipes < ActiveRecord::Migration[7.2]
  def change
    add_column :recipes, :servings, :integer
  end
end
