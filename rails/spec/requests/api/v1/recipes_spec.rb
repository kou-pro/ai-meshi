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

  describe "GET /api/v1/recipes/:id" do
    let(:recipe) { create(:recipe, user: user, content: "テスト内容") }

    context "存在するレシピ ID の場合" do
      it "200 OK を返す" do
        get "/api/v1/recipes/#{recipe.id}"
        expect(response).to have_http_status(:ok)
      end

      it "レシピの基本情報を返す" do
        get "/api/v1/recipes/#{recipe.id}"
        json = JSON.parse(response.body)
        expect(json["id"]).to eq(recipe.id)
        expect(json["title"]).to eq(recipe.title)
        expect(json["content"]).to eq("テスト内容")
      end

      it "user の情報がネストされて返る" do
        recipe.user.update!(name: "テストユーザー")
        get "/api/v1/recipes/#{recipe.id}"
        json = JSON.parse(response.body)
        expect(json["user"]["id"]).to eq(user.id)
        expect(json["user"]["name"]).to eq("テストユーザー")
      end

      it "未ログインなので liked_by_current_user は false" do
        get "/api/v1/recipes/#{recipe.id}"
        json = JSON.parse(response.body)
        expect(json["liked_by_current_user"]).to eq(false)
        expect(json["bookmarked_by_current_user"]).to eq(false)
      end
    end
  end
end
