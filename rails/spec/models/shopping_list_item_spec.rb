require "rails_helper"

RSpec.describe ShoppingListItem, type: :model do
  describe "アソシエーション" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:recipe) }
  end

  describe "バリデーション" do
    it { is_expected.to validate_presence_of(:ingredient_name) }
  end
end
