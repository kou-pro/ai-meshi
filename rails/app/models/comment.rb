class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :recipe, counter_cache: true

  validates :body, presence: true, length: { maximum: 300 }
end
