require "rails_helper"

RSpec.describe ShoppingListItem, type: :model do
  describe "アソシエーション" do
    it { is_expected.to belong_to(:user) }
    # 元レシピ削除時に recipe_id が NULL になり得るため optional
    it { is_expected.to belong_to(:recipe).optional }
  end

  describe "バリデーション" do
    it { is_expected.to validate_presence_of(:ingredient_name) }
  end
end
