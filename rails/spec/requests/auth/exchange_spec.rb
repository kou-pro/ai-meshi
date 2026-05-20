require "rails_helper"

RSpec.describe "Auth::Exchange", type: :request do
  describe "POST /auth/exchange" do
    let(:payload_args) do
      {
        access_token: "abc123",
        client:       "client_xyz",
        uid:          "user@example.com",
        expiry:       1_781_827_344,
      }
    end

    it "有効なコードに対して本物のトークンを JSON で返す" do
      code = AuthExchangeCode.encode(**payload_args)

      post "/auth/exchange", params: { code: code }, as: :json

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["access_token"]).to eq("abc123")
      expect(body["client"]).to eq("client_xyz")
      expect(body["uid"]).to eq("user@example.com")
      expect(body["expiry"]).to eq(1_781_827_344)
    end

    it "改ざんされたコードは 401 を返す" do
      code = AuthExchangeCode.encode(**payload_args)
      post "/auth/exchange", params: { code: "#{code}TAMPERED" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "コード欠損時も 401 を返す" do
      post "/auth/exchange", params: { code: "" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
