# Rails 7 の ActiveSupport::MessageVerifier を使った短命の認証コード。
# OAuth 2.0 Authorization Code Grant (RFC 6749 §4.1) と同等の設計で、
# 本物のアクセストークンを URL クエリに乗せず、Rails サーバー間 POST で交換する。
#
# 参考:
# - RFC 6749 §4.1: https://datatracker.ietf.org/doc/html/rfc6749#section-4.1
# - ActiveSupport::MessageVerifier:
#   https://api.rubyonrails.org/v7.2.3/classes/ActiveSupport/MessageVerifier.html
class AuthExchangeCode
  # コードの有効期限。RFC 6749 は「10 分以内推奨」だが、実際の OAuth フロー
  # (Google からのリダイレクト → Next.js 即時 POST) は数秒で完結するため、
  # 漏洩リスク最小化の観点で 30 秒に絞る。
  EXPIRES_IN = 30.seconds

  # MessageVerifier の用途固定 (他用途のトークンと混在しないように)
  PURPOSE = :auth_exchange

  # 使用済みコードのキャッシュ保持期間。コードの寿命 (EXPIRES_IN=30s) より長く取り、
  # 時計差で「期限切れ判定の前に再利用」される窓を潰す。
  USED_CACHE_TTL = (EXPIRES_IN + 30.seconds)

  class << self
    # 本物のトークン情報を含む短命コードを発行する。
    # 戻り値: HMAC 署名付きの文字列 (Base64 でデコード可能だが改ざん不可)
    def encode(access_token:, client:, uid:, expiry: nil)
      verifier.generate(
        {
          access_token: access_token,
          client: client,
          uid: uid,
          expiry: expiry,
        },
        expires_in: EXPIRES_IN,
        purpose: PURPOSE,
      )
    end

    # コードを検証して payload を取り出す。
    # 期限切れ/署名不正/用途違い/二重使用 の場合は nil を返す。
    # RFC 6749 §4.1.2 / §10.5 / OAuth 2.0 Security BCP の MUST 要件
    # 「authorization code MUST NOT be used more than once」を Rails.cache で実装。
    # MessageVerifier のシリアライザ (JSON ベース) はシンボルキーを文字列化するため、
    # 呼び出し側の利便のため deep_symbolize_keys で復元する。
    def decode(code)
      return nil if code.blank?
      return nil if used?(code)

      payload = verifier.verified(code, purpose: PURPOSE)
      return nil unless payload

      mark_as_used(code)
      payload.deep_symbolize_keys
    end

    private

      def verifier
        Rails.application.message_verifier(:auth_exchange)
      end

      def used?(code)
        Rails.cache.exist?(cache_key(code))
      end

      def mark_as_used(code)
        Rails.cache.write(cache_key(code), true, expires_in: USED_CACHE_TTL)
      end

      # コード文字列を直接キーにすると長くなるため SHA256 で短縮 + 名前衝突防止。
      def cache_key(code)
        "#{PURPOSE}:used:#{Digest::SHA256.hexdigest(code)}"
      end
  end
end
