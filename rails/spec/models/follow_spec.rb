require "rails_helper"

RSpec.describe Follow, type: :model do
  describe "アソシエーション" do
    it { is_expected.to belong_to(:follower).class_name("User") }
    it { is_expected.to belong_to(:following).class_name("User") }
  end

  describe "バリデーション" do
    subject { build(:follow) }

    it { is_expected.to validate_uniqueness_of(:follower_id).scoped_to(:following_id) }

    describe "cannot_follow_self" do
      let(:user) { create(:user) }

      it "自分自身をフォローしようとするとエラーを追加する" do
        follow = build(:follow, follower: user, following: user)
        expect(follow).not_to be_valid
        expect(follow.errors[:base]).to include("自分自身をフォローすることはできません")
      end

      it "他人をフォローする場合は有効" do
        other_user = create(:user)
        follow = build(:follow, follower: user, following: other_user)
        expect(follow).to be_valid
      end
    end
  end
end
