require "rails_helper"

RSpec.describe "Auth::Confirmations", type: :request do
  describe "GET /auth/confirmation" do
    let(:user) { create(:user, confirmed_at: nil) }
    let(:redirect_url) { "http://localhost:8000/api/auth/confirmation/callback" }

    # Devise の Recoverable / Confirmable と同じパターン：raw_token を生成して
    # hashed_token を DB に保存し、raw_token をリンクパラメータとして使う。
    # テスト用フィクスチャの直書き込みなので validations / callbacks は意図的にスキップ。
    def issue_confirmation_token(user)
      raw_token, hashed_token = Devise.token_generator.generate(User, :confirmation_token)
      user.update_columns( # rubocop:disable Rails/SkipsModelValidations
        confirmation_token: hashed_token,
        confirmation_sent_at: Time.current,
      )
      raw_token
    end

    it "確認後に User.tokens が DB に永続化される" do
      raw_token = issue_confirmation_token(user)

      expect {
        get "/auth/confirmation", params: {
          confirmation_token: raw_token,
          redirect_url: redirect_url,
          config: "default",
        }
      }.to change { user.reload.tokens.size }.from(0).to(1)

      expect(response).to have_http_status(:found)
      expect(user.reload.confirmed_at).to be_present
    end

    it "リダイレクト URL に access-token は乗らず、短命コード (code) のみ乗る" do
      raw_token = issue_confirmation_token(user)

      get "/auth/confirmation", params: {
        confirmation_token: raw_token,
        redirect_url: redirect_url,
        config: "default",
      }

      location = response.location
      query = Rack::Utils.parse_nested_query(URI.parse(location).query)

      # 短命コードのみが乗る (RFC 6749 §4.1 準拠)
      expect(query["code"]).to be_present
      expect(query["account_confirmation_success"]).to eq("true")

      # 本物のアクセストークンは URL に絶対に乗らない
      expect(query).not_to have_key("access-token")
      expect(query).not_to have_key("client")
      expect(query).not_to have_key("uid")
    end

    it "リダイレクト URL の短命コードを decode すると User.tokens の client と整合する" do
      raw_token = issue_confirmation_token(user)

      get "/auth/confirmation", params: {
        confirmation_token: raw_token,
        redirect_url: redirect_url,
        config: "default",
      }

      query = Rack::Utils.parse_nested_query(URI.parse(response.location).query)
      payload = AuthExchangeCode.decode(query["code"])

      expect(payload).to be_present
      user.reload
      expect(user.tokens.keys).to include(payload[:client])
      stored_hash = user.tokens[payload[:client]]["token"]
      expect(BCrypt::Password.new(stored_hash)).to eq(payload[:access_token])
    end
  end
end
