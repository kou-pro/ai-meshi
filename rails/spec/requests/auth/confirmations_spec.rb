require "rails_helper"

RSpec.describe "Auth::Confirmations", type: :request do
  describe "GET /auth/confirmation" do
    let(:user) { create(:user, confirmed_at: nil) }
    let(:redirect_url) { "http://localhost:8000/api/auth/confirmation/callback" }

    # Devise の Recoverable / Confirmable と同じパターン：raw_token を生成して
    # hashed_token を DB に保存し、raw_token をリンクパラメータとして使う。
    def issue_confirmation_token(user)
      raw_token, hashed_token = Devise.token_generator.generate(User, :confirmation_token)
      user.update_columns(
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

    it "リダイレクト URL に乗る access-token が User.tokens の client と整合する" do
      raw_token = issue_confirmation_token(user)

      get "/auth/confirmation", params: {
        confirmation_token: raw_token,
        redirect_url: redirect_url,
        config: "default",
      }

      location = response.location
      query = Rack::Utils.parse_nested_query(URI.parse(location).query)
      access_token = query["access-token"]
      client = query["client"]

      expect(access_token).to be_present
      expect(client).to be_present

      # User.tokens[client] に該当エントリが存在し、その token_hash と
      # フロントが送る access-token が devise_token_auth の照合ロジックで一致する。
      user.reload
      expect(user.tokens.keys).to include(client)
      stored_hash = user.tokens[client]["token"]
      expect(BCrypt::Password.new(stored_hash)).to eq(access_token)
    end
  end
end
