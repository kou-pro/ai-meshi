class Follow < ApplicationRecord
  # follower_id → users テーブルの id を参照
  belongs_to :follower, class_name: 'User'
  # following_id → users テーブルの id を参照
  belongs_to :following, class_name: 'User'

  # 必須バリデーション
  validates :follower_id, presence: true
  validates :following_id, presence: true
  # 同じ人を2回フォローできない
  validates :follower_id, uniqueness: { scope: :following_id }

  validate :cannot_follow_self

  private

  def cannot_follow_self
    if follower_id == following_id
      errors.add(:base, '自分自身をフォローすることはできません')
    end
  end
end