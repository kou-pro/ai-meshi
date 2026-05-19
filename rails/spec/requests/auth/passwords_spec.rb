require "rails_helper"

RSpec.describe "Auth::Passwords", type: :request do
  describe "GET /auth/password/edit" do
    let(:user) { create(:user) }
    let(:redirect_url) { "https://aimeshi.com/password-reset/edit" }

    it "別ホストへのリダイレクトが UnsafeRedirectError でブロックされず 302 を返す" do
      raw_token = user.send_reset_password_instructions

      get "/auth/password/edit", params: {
        reset_password_token: raw_token,
        redirect_url: redirect_url,
        config: "default",
      }

      expect(response).to have_http_status(:found)
      expect(response.location).to include("aimeshi.com")
      expect(response.location).to include("reset_password_token=")
    end
  end
end
