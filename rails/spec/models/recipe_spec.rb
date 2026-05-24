require "rails_helper"

RSpec.describe Recipe, type: :model do
  describe "バリデーション" do
    it { is_expected.to validate_presence_of(:title) }

    describe "スコア (0〜5の整数・未評価はnil許可)" do
      %i[taste_score ease_score cost_score].each do |attr|
        it {
          expect(subject).to validate_numericality_of(attr).
                               only_integer.
                               is_greater_than_or_equal_to(0).
                               is_less_than_or_equal_to(5).
                               allow_nil
        }
      end
    end
  end

  describe "アソシエーション" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many(:likes).dependent(:destroy) }
    it { is_expected.to have_many(:comments).dependent(:destroy) }
    it { is_expected.to have_many(:bookmarks).dependent(:destroy) }
    it { is_expected.to have_many(:shopping_list_items).dependent(:nullify) }
    it { is_expected.to have_one_attached(:image) }
  end

  describe "削除時の挙動" do
    it "買い物リストに登録されたレシピを削除しても、項目は recipe_id=nil で残る" do
      user = create(:user)
      recipe = create(:recipe, user: user)
      item = ShoppingListItem.create!(user: user, recipe: recipe, ingredient_name: "玉ねぎ")

      expect { recipe.destroy! }.not_to raise_error
      item.reload
      expect(item.recipe_id).to be_nil
      expect(item.ingredient_name).to eq("玉ねぎ")
    end
  end

  describe "カスタムバリデーション (acceptable_image)" do
    let(:recipe) { build(:recipe) }

    it "PNG画像なら有効" do
      recipe.image.attach(
        io: StringIO.new("dummy"),
        filename: "test.png",
        content_type: "image/png",
      )
      expect(recipe).to be_valid
    end

    it "JPEG画像なら有効" do
      recipe.image.attach(
        io: StringIO.new("dummy"),
        filename: "test.jpg",
        content_type: "image/jpeg",
      )
      expect(recipe).to be_valid
    end

    it "GIF画像は無効でエラーメッセージが付く" do
      recipe.image.attach(
        io: StringIO.new("dummy"),
        filename: "test.gif",
        content_type: "image/gif",
      )
      expect(recipe).not_to be_valid
      expect(recipe.errors[:image]).to include("はPNGまたはJPEG形式にしてください")
    end

    it "5MBを超えるファイルは無効でエラーメッセージが付く" do
      recipe.image.attach(
        io: StringIO.new("a" * 6.megabytes),
        filename: "big.png",
        content_type: "image/png",
      )
      expect(recipe).not_to be_valid
      expect(recipe.errors[:image]).to include("は5MB以下にしてください")
    end
  end
end
