class User < ApplicationRecord
  devise :database_authenticatable,
         :registerable,
         :recoverable,
         :rememberable,
         :validatable,
         :confirmable,
         :omniauthable,
         omniauth_providers: [:google_oauth2]

  include DeviseTokenAuth::Concerns::User

  # OmniAuth コールバックから User を取得 or 作成する。
  #
  # 1. provider + uid で既存連携済みユーザーを検索（最優先）
  # 2. email_verified=true でなければ nil を返して処理中断
  #    （未確認 email でのアカウント乗っ取りリスクを排除）
  # 3. 同じ email の既存ユーザーがあれば自動連携
  # 4. なければ新規作成
  def self.from_omniauth(auth)
    user = find_by(provider: auth.provider, uid: auth.uid)
    return user if user

    email_verified = auth.dig("extra", "raw_info", "email_verified")
    return nil unless email_verified && auth.info.email.present?

    user = find_by(email: auth.info.email)
    if user
      user.update!(provider: auth.provider, uid: auth.uid)
      return user
    end

    create!(
      provider: auth.provider,
      uid: auth.uid,
      email: auth.info.email,
      name: auth.info.name,
      password: Devise.friendly_token[0, 20],
    ).tap(&:skip_confirmation!)
  end

  has_one_attached :image
  has_many :recipes, dependent: :destroy

  # プロフィール画像の絶対 URL を返す。
  # 添付がなければ nil。host は Next.js BFF から到達可能な公開ホストを呼び出し側が渡す。
  # 既存 users_controller の rails_blob_url 直書きを DRY 化するためのメソッド (Skinny Controller)。
  # 出典: Active Storage 公式ガイド
  #   https://guides.rubyonrails.org/active_storage_overview.html#linking-to-files
  def image_url(host:)
    return nil unless image.attached?

    Rails.application.routes.url_helpers.rails_blob_url(image, host: host)
  end

  has_many :likes, dependent: :destroy
  has_many :liked_recipes, through: :likes, source: :recipe
  has_many :comments, dependent: :destroy
  has_many :shopping_list_items, dependent: :destroy
  has_many :bookmarks,          dependent: :destroy
  has_many :bookmarked_recipes, through: :bookmarks, source: :recipe
  # フォロー機能
  has_many :following_relationships, class_name: "Follow",
                                     foreign_key: "follower_id",
                                     inverse_of: :follower,
                                     dependent: :destroy
  has_many :following, through: :following_relationships, source: :following

  has_many :follower_relationships, class_name: "Follow",
                                    foreign_key: "following_id",
                                    inverse_of: :following,
                                    dependent: :destroy
  has_many :followers, through: :follower_relationships, source: :follower

  # has_one_attached :image による無限ループを防ぐため
  def as_json(options = {})
    super(options.merge(except: [:image]))
  end
end
