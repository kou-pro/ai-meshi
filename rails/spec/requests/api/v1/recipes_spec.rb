require "rails_helper"

RSpec.describe "Api::V1::Recipes", type: :request do
  let(:user) { create(:user, password: "password", password_confirmation: "password") }

  describe "POST /api/v1/recipes" do
    context "未認証の場合" do
      it "401または403を返す" do
        post "/api/v1/recipes", params: { recipe: { title: "Test" } }

        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済みの場合" do
      it "レシピが作成される" do
        post "/auth/sign_in", params: {
          email: user.email,
          password: "password",
        }

        auth_headers = {
          "access-token" => response.headers["access-token"],
          "client" => response.headers["client"],
          "uid" => response.headers["uid"],
        }

        expect {
          post "/api/v1/recipes",
               params: { recipe: { title: "Test" } },
               headers: auth_headers
        }.to change { user.recipes.count }.by(1)

        expect(response).to have_http_status(:created)
      end
    end
  end
end
