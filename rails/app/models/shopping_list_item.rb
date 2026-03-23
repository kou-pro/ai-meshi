class ShoppingListItem < ApplicationRecord
  belongs_to :user
  belongs_to :recipe

  validates :ingredient_name, presence: true
end