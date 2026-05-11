require "rails_helper"

RSpec.describe Comment, type: :model do
  describe "アソシエーション" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:recipe).counter_cache(true) }
  end

  describe "バリデーション" do
    it { is_expected.to validate_presence_of(:body) }
    it { is_expected.to validate_length_of(:body).is_at_most(300) }
  end
end
