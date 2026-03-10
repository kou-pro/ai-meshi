class CreateLikes < ActiveRecord::Migration[7.2]
  def change
    create_table :likes do |t|
      t.references :user, null: false, foreign_key: true
      t.references :recipe, null: false, foreign_key: true

      t.timestamps
    end

    # 同じユーザーが同じレシピに二重いいねできないようにする
    add_index :likes, [:user_id, :recipe_id], unique: true
  end
end