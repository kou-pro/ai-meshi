# This file is copied to spec/ when you run 'rails generate rspec:install'
require 'spec_helper'
# Docker 環境で RAILS_ENV=development がセットされている場合でも
# テスト実行時は確実に test 環境にするため、||= ではなく = で強制する。
# rails_helper.rb は RSpec 専用ファイルなので test 固定で問題ない。
ENV['RAILS_ENV'] = 'test'
require_relative '../config/environment'


# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?
# Uncomment the line below in case you have `--require rails_helper` in the `.rspec` file
# that will avoid rails generators crashing because migrations haven't been run yet
# return unless Rails.env.test?
require 'rspec/rails'
require 'factory_bot_rails'  # ← ここを追加
require 'webmock/rspec'      # 外部 API のモック (OpenAI 等) を有効化
require 'shoulda/matchers'   # validation/association を 1 行で書ける matcher

# Add additional requires below this line. Rails is not loaded until this point!

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This means that files in spec/support that end
# in _spec.rb will both be required and run as specs, causing the specs to be
# run twice. It is recommended that you do not name files matching this glob to
# end with _spec.rb. You can configure this pattern with the --pattern
# option on the command line or in ~/.rspec, .rspec or `.rspec-local`.
#
Rails.root.glob('spec/support/**/*.rb').sort_by(&:to_s).each { |f| require f }

# Ensures that the test database schema matches the current schema file.
# If there are pending migrations it will invoke `db:test:prepare` to
# recreate the test database by loading the schema.
# If you are not using ActiveRecord, you can remove these lines.
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

# WebMock: テスト中の外部通信を完全禁止する。localhost (MySQL 等) は許可。
# OpenAI 等の外部 API を叩くテストでは stub_request で意図的にモックする。
WebMock.disable_net_connect!(allow_localhost: true)

RSpec.configure do |config|
  # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
  config.fixture_paths = [
    Rails.root.join('spec/fixtures')
  ]

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = true

  # You can uncomment this line to turn off ActiveRecord support entirely.
  # config.use_active_record = false

  # RSpec Rails uses metadata to mix in different behaviours to your tests,
  # for example enabling you to call `get` and `post` in request specs.
  #
  # To enable this behaviour uncomment the line below.
  # config.infer_spec_type_from_file_location!

  # Filter lines from Rails gems in backtraces.
  config.filter_rails_from_backtrace!

  # Devise を request spec で利用可能にする
  # config.include Devise::Test::IntegrationHelpers, type: :request

  # FactoryBot を create(:user) などで使えるようにする
  config.include FactoryBot::Syntax::Methods

  # Request Spec で sign_in_and_get_headers を使えるようにする
  config.include AuthHelper, type: :request

  # Faker のロケールを日本語に設定 (Faker::Food.dish → "肉じゃが" 等)
  config.before(:suite) do
    Faker::Config.locale = :ja
  end
end

# shoulda-matchers の RSpec 統合 (公式推奨設定)
# これで `it { should validate_presence_of(:title) }` のような 1 行記述が使える
Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end