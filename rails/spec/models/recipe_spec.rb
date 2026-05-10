require 'rails_helper'

RSpec.describe Recipe, type: :model do
  
  describe 'バリデーション' do
    it { is_expected.to validate_presence_of(:title) }
  end

  describe 'アソシエーション' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to have_many(:likes).dependent(:destroy) }
    it { is_expected.to have_many(:comments).dependent(:destroy) }
    it { is_expected.to have_many(:bookmarks).dependent(:destroy) }
    it { is_expected.to have_one_attached(:image) }
  end

  describe 'カスタムバリデーション (acceptable_image)' do
    let(:recipe) { build(:recipe) }

    it 'PNG画像なら有効' do
      recipe.image.attach(
        io: StringIO.new('dummy'),
        filename: 'test.png',
        content_type: 'image/png',
      )
      expect(recipe).to be_valid
    end

    it 'JPEG画像なら有効' do
      recipe.image.attach(
        io: StringIO.new('dummy'),
        filename: 'test.jpg',
        content_type: 'image/jpeg',
      )
      expect(recipe).to be_valid
    end

    it 'GIF画像は無効でエラーメッセージが付く' do
      recipe.image.attach(
        io: StringIO.new('dummy'),
        filename: 'test.gif',
        content_type: 'image/gif',
      )
      expect(recipe).not_to be_valid
      expect(recipe.errors[:image]).to include('はPNGまたはJPEG形式にしてください')
    end

    it '5MBを超えるファイルは無効でエラーメッセージが付く' do
      recipe.image.attach(
        io: StringIO.new('a' * 6.megabytes),
        filename: 'big.png',
        content_type: 'image/png',
      )
      expect(recipe).not_to be_valid
      expect(recipe.errors[:image]).to include('は5MB以下にしてください')
    end
  end
end
