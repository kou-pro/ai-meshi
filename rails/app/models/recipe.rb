class Recipe < ApplicationRecord
  belongs_to :user
  has_many :likes, dependent: :destroy
  has_one_attached :image
  has_many :comments, dependent: :destroy
  has_many :bookmarks, dependent: :destroy
  # レシピ削除時、買い物リスト項目は食材スナップショットを保持したまま残す。
  # recipe_id を NULL にする(:nullify)ことで「削除されたレシピ」として参照を切る。
  has_many :shopping_list_items, dependent: :nullify

  validates :title, presence: true
  # スコアは0〜5の星評価。未評価は nil を許可し、範囲外・非整数を弾く。
  validates :taste_score, :ease_score, :cost_score,
            numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 5 },
            allow_nil: true

  validate :acceptable_image, if: :image_attached?

  private

    def image_attached?
      image.attached?
    end

    def acceptable_image
      unless image.blob.content_type.in?(%w[image/png image/jpeg])
        errors.add(:image, "はPNGまたはJPEG形式にしてください")
      end

      if image.blob.byte_size > 5.megabytes
        errors.add(:image, "は5MB以下にしてください")
      end
    end
end
