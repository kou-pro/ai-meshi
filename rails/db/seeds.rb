# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# ===========================================
# Guest User
# ===========================================
# ゲストログイン機能用のユーザー
# guest_sessions_controller.rb で参照される
#
# - ゲストログインは email 検索のみで認証されるため、
#   このユーザーが存在することが唯一の必要条件
# - パスワードはランダム生成（通常ログインフローからは使用不可）
# - find_or_create_by! で冪等性を確保（複数回実行しても安全）
# - 既存の from_omniauth メソッドと同じ実装パターンに統一

guest_email = ENV.fetch("GUEST_USER_EMAIL", "guest@example.com")

User.find_or_create_by!(email: guest_email) do |user|
  user.name = "ゲストユーザー"
  user.password = Devise.friendly_token[0, 20]
  user.provider = "email"
  user.uid = guest_email
  user.skip_confirmation!
end

Rails.logger.debug { "✓ Guest user ready: #{guest_email}" }
