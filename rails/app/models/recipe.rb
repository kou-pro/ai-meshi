class Recipe < ApplicationRecord
  belongs_to :user
  has_many :likes, dependent: :destroy
  has_one_attached :image

  validate :acceptable_image, if: :image_attached?

  private

  def image_attached?
    image.attached?
  end

  def acceptable_image
    unless image.blob.content_type.in?(%w[image/png image/jpeg])
      errors.add(:image, 'はPNGまたはJPEG形式にしてください')
    end

    if image.blob.byte_size > 5.megabytes
      errors.add(:image, 'は5MB以下にしてください')
    end
  end
end