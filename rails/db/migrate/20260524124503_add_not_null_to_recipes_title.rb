class AddNotNullToRecipesTitle < ActiveRecord::Migration[7.2]
  # モデルでは validates :title, presence: true があるのに DB は NULL 許可で不整合。
  # 生SQLや競合をすり抜けないよう DB レベルでも NOT NULL を保証する。
  def change
    change_column_null :recipes, :title, false
  end
end
