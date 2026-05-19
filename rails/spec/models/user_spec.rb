require "rails_helper"

RSpec.describe User, type: :model do
  describe "バリデーション" do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive.scoped_to(:provider) }
    it { is_expected.to validate_presence_of(:password) }
    it { is_expected.to validate_length_of(:password).is_at_least(6) }
  end

  describe "アソシエーション" do
    # シンプルな has_many (dependent: :destroy 付き)
    it { is_expected.to have_many(:recipes).dependent(:destroy) }
    it { is_expected.to have_many(:likes).dependent(:destroy) }
    it { is_expected.to have_many(:comments).dependent(:destroy) }
    it { is_expected.to have_many(:shopping_list_items).dependent(:destroy) }
    it { is_expected.to have_many(:bookmarks).dependent(:destroy) }

    # through 関係
    it { is_expected.to have_many(:liked_recipes).through(:likes).source(:recipe) }
    it { is_expected.to have_many(:bookmarked_recipes).through(:bookmarks).source(:recipe) }

    # フォロー関係 (class_name + foreign_key + dependent)
    it { is_expected.to have_many(:following_relationships).class_name("Follow").with_foreign_key("follower_id").dependent(:destroy) }
    it { is_expected.to have_many(:follower_relationships).class_name("Follow").with_foreign_key("following_id").dependent(:destroy) }

    # フォロー関係の through
    it { is_expected.to have_many(:following).through(:following_relationships).source(:following) }
    it { is_expected.to have_many(:followers).through(:follower_relationships).source(:follower) }

    # 画像 (Active Storage)
    it { is_expected.to have_one_attached(:image) }
  end

  describe ".from_omniauth" do
    context "既に provider と uid で登録済みの User がいる場合" do
      let(:auth) do
        OmniAuth::AuthHash.new(
          provider: "google_oauth2",
          uid: "google-12345",
          info: { email: "test@example.com", name: "Test User" },
        )
      end

      let!(:existing_user) do
        create(:user, provider: "google_oauth2", uid: "google-12345")
      end

      it "既存ユーザーを返す" do
        result = User.from_omniauth(auth)
        expect(result).to eq(existing_user)
      end

      it "User の数は増えない" do
        expect {
          User.from_omniauth(auth)
        }.not_to change { User.count }
      end
    end

    context "email 一致 + email_verified=true で自動連携する場合" do
      let(:auth) do
        OmniAuth::AuthHash.new(
          provider: "google_oauth2",
          uid: "google-12345",
          info: { email: "test@example.com", name: "Test User" },
          extra: { raw_info: { email_verified: true } },
        )
      end

      let!(:existing_user) do
        create(:user, email: "test@example.com")
      end

      it "既存ユーザーを返す" do
        result = User.from_omniauth(auth)
        expect(result).to eq(existing_user)
      end

      it "provider と uid が Google のものに更新される" do
        User.from_omniauth(auth)
        existing_user.reload
        expect(existing_user.provider).to eq("google_oauth2")
        expect(existing_user.uid).to eq("google-12345")
      end

      it "User の数は増えない" do
        expect {
          User.from_omniauth(auth)
        }.not_to change { User.count }
      end
    end

    context "該当する User が存在しない場合 (新規作成)" do
      let(:auth) do
        OmniAuth::AuthHash.new(
          provider: "google_oauth2",
          uid: "google-99999",
          info: { email: "newuser@example.com", name: "New User" },
          extra: { raw_info: { email_verified: true } },
        )
      end

      it "新規 User を作成する" do
        expect {
          User.from_omniauth(auth)
        }.to change { User.count }.by(1)
      end

      it "作成された User の属性が正しい" do
        user = User.from_omniauth(auth)
        expect(user.provider).to eq("google_oauth2")
        expect(user.uid).to eq("google-99999")
        expect(user.email).to eq("newuser@example.com")
        expect(user.name).to eq("New User")
      end

      it "作成された User は確認済み (skip_confirmation!) になっている" do
        user = User.from_omniauth(auth)
        expect(user.confirmed_at).not_to be_nil
      end
    end

    context "email_verified=false の場合 (未検証 email でのアカウント乗っ取り防御)" do
      let(:auth) do
        OmniAuth::AuthHash.new(
          provider: "google_oauth2",
          uid: "google-fake",
          info: { email: "victim@example.com", name: "Fake User" },
          extra: { raw_info: { email_verified: false } },
        )
      end

      it "nil を返す" do
        expect(User.from_omniauth(auth)).to be_nil
      end

      it "User は作成されない" do
        expect {
          User.from_omniauth(auth)
        }.not_to change { User.count }
      end
    end

    context "email_verified クレームが auth に含まれない場合" do
      let(:auth) do
        OmniAuth::AuthHash.new(
          provider: "google_oauth2",
          uid: "google-no-verified",
          info: { email: "unverified@example.com", name: "Unverified User" },
        )
      end

      it "nil を返す" do
        expect(User.from_omniauth(auth)).to be_nil
      end

      it "User は作成されない" do
        expect {
          User.from_omniauth(auth)
        }.not_to change { User.count }
      end
    end
  end
end
