class AddLikesCountToRecipes < ActiveRecord::Migration[7.2]
  def change
    add_column :recipes, :likes_count, :integer, default: 0, null: false
  end
end
