class Like < ApplicationRecord
  belongs_to :user
  belongs_to :recipe, counter_cache: true

  validates :user_id, uniqueness: { scope: :recipe_id }
end