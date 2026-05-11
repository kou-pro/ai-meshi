require "rails_helper"

RSpec.describe "Api::V1::GuestSessions", type: :request do
  describe "POST /api/v1/guest_sessions" do
    context "ゲストユーザーが存在する場合" do
      let!(:guest_user) do
        create(:user,
               email: ENV.fetch("GUEST_USER_EMAIL", "guest@example.com"),
               password: "password",
               password_confirmation: "password",
               name: "ゲスト")
      end

      it "200 OK + ユーザー情報とトークンを返す" do
        post "/api/v1/guest_sessions"
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["data"]["id"]).to eq(guest_user.id)
        expect(json["data"]["email"]).to eq(guest_user.email)
        expect(json["tokens"]).to include("access-token", "client", "uid")
      end
    end

    context "ゲストユーザーが存在しない場合" do
      it "404 を返す" do
        post "/api/v1/guest_sessions"
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
