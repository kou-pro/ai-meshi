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
  # 2. email_verified=true のときに限り、同じ email の既存ユーザーと自動連携
  #    （メール+パスワード登録 → Google ログインへの統合シナリオ）
  # 3. それ以外は新規作成
  #
  # email_verified=false の場合に自動連携しないのは、未確認 email を使った
  # アカウント乗っ取りリスクを排除するため。Google 個人アカウントは通常 true。
  def self.from_omniauth(auth)
    user = find_by(provider: auth.provider, uid: auth.uid)
    return user if user

    if auth.dig("extra", "raw_info", "email_verified") && auth.info.email.present?
      user = find_by(email: auth.info.email)
      if user
        user.update!(provider: auth.provider, uid: auth.uid)
        return user
      end
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
