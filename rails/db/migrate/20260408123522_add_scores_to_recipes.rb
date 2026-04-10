class AddScoresToRecipes < ActiveRecord::Migration[7.2]
  def change
    add_column :recipes, :taste_score, :integer
    add_column :recipes, :ease_score, :integer
    add_column :recipes, :cost_score, :integer
  end
end
