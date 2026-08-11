require "active_support/core_ext/integer/time"
require "ipaddr"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  config.require_master_key = true
  config.active_storage.service = :supabase

  # Force all access to the app over SSL
  config.force_ssl = true

  # ★追加箇所1★ ALB のヘルスチェックは HTTPS 強制リダイレクト除外
  config.ssl_options = {
    redirect: { exclude: ->(request) { request.path == "/api/v1/health_check" } },
  }

  config.logger = ActiveSupport::Logger.new($stdout).
                    tap  {|logger| logger.formatter = Logger::Formatter.new }.
                    then {|logger| ActiveSupport::TaggedLogging.new(logger) }

  config.log_tags = [:request_id]
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
  config.action_mailer.perform_caching = false

  # === Gmail SMTP メール配信設定 ===
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true

  # 送信元アドレス（credentials の Gmail を使用）
  config.action_mailer.default_options = {
    from: Rails.application.credentials.gmail.user_name,
  }

  # メール内のURL生成に使われるホスト名（devise_token_auth の確認URL等）
  config.action_mailer.default_url_options = {
    host: ENV.fetch("RAILS_PUBLIC_URL").sub(%r{\Ahttps?://}, ""),
    protocol: "https",
  }

  # Gmail SMTP 接続設定
  config.action_mailer.smtp_settings = {
    address: "smtp.gmail.com",
    port: 587,
    domain: "gmail.com",
    user_name: Rails.application.credentials.gmail.user_name,
    password: Rails.application.credentials.gmail.password,
    authentication: :plain,
    enable_starttls_auto: true,
  }

  config.i18n.fallbacks = true
  config.active_support.report_deprecations = false
  config.active_record.dump_schema_after_migration = false
  config.active_record.attributes_for_inspect = [:id]

  # Enable DNS rebinding protection
  config.hosts = [
    "api.aimeshi.com",                # 独自ドメイン
    ".aimeshi.com",                   # サブドメイン（admin.aimeshi.com 等の将来対応）
  ]
  # ホスティング先の一時 URL (例: xxx.onrender.com) での動作確認用
  config.hosts << ENV["RAILS_ALLOWED_HOST"] if ENV["RAILS_ALLOWED_HOST"].present?

  # ALB(VPC 10.0.0.0/16)からのX-Forwarded-*ヘッダーを信頼する
  config.action_dispatch.trusted_proxies = [IPAddr.new("10.0.0.0/16")]

  # ALB ヘルスチェックは Host Authorization をスキップ（Rails公式推奨パターン）
  # ALB → ECS タスクの直接通信はホスト名なし or 内部IPで来るため、
  # 該当パスのみ Host チェックを除外する
  config.host_authorization = {
    exclude: ->(request) { request.path == "/api/v1/health_check" },
  }
end
