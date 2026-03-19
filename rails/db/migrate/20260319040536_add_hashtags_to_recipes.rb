class AddHashtagsToRecipes < ActiveRecord::Migration[7.2]
  def change
    add_column :recipes, :hashtags, :json
  end
end
