require "rails_helper"

RSpec.describe Bookmark, type: :model do
  describe "アソシエーション" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:recipe) }
  end

  describe "バリデーション" do
    subject { build(:bookmark) }

    it { is_expected.to validate_uniqueness_of(:user_id).scoped_to(:recipe_id) }
  end
end
