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

# ▼ Googleから返ってきた情報でユーザーを作成 or 取得するメソッド
  def self.from_omniauth(auth)
# ▼ Google の uid + provider の組み合わせでユーザーを検索
# 存在しなければ新規作成する
    find_or_create_by(provider: auth.provider, uid: auth.uid) do |user|
      user.email = auth.info.email
      user.name = auth.info.name if user.respond_to?(:name)
# ▼ OmniAuthログインではパスワード不要なのでランダム生成
      user.password = Devise.friendly_token[0, 20]
      user.skip_confirmation!
    end
  end

  has_many :recipes, dependent: :destroy 
  has_many :likes, dependent: :destroy
  has_many :liked_recipes, through: :likes, source: :recipe
  has_many :comments, dependent: :destroy
  has_many :shopping_list_items, dependent: :destroy
end
