class Bookmark < ApplicationRecord
  # 　どのユーザーが保存したか
  belongs_to :user

  # どのレシピを保存したか
  belongs_to :recipe

  # 同じユーザーが同じレシピを2回保存できないようにする（アプリ側の制約）
  validates :user_id, uniqueness: { scope: :recipe_id }
end
