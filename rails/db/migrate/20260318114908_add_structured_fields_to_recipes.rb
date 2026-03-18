class AddStructuredFieldsToRecipes < ActiveRecord::Migration[7.2]
  def change
    add_column :recipes, :ingredients, :json
    add_column :recipes, :steps, :json
  end
end
