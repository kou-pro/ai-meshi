class AddIsPublishedToRecipes < ActiveRecord::Migration[7.2]
  def change
    add_column :recipes, :is_published, :boolean, default: false, null: false
  end
end
