class User < ApplicationRecord
  devise :database_authenticatable,
         :registerable,
         :recoverable,
         :rememberable,
         :validatable,
         :confirmable

  include DeviseTokenAuth::Concerns::User

  has_many :recipes, dependent: :destroy
end