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
        auth_headers = sign_in_and_get_headers(user)

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

  describe "PATCH /api/v1/recipes/:id" do
    let(:recipe) { create(:recipe, user: user, title: "元のタイトル") }

    context "未認証の場合" do
      it "401または403を返す" do
        patch "/api/v1/recipes/#{recipe.id}", params: { recipe: { title: "新タイトル" } }
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "自分のレシピを更新する場合" do
      it "200 OK を返す" do
        auth_headers = sign_in_and_get_headers(user)
        patch "/api/v1/recipes/#{recipe.id}",
              params: { recipe: { title: "新タイトル" } },
              headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it "DB のタイトルが更新される" do
        auth_headers = sign_in_and_get_headers(user)
        patch "/api/v1/recipes/#{recipe.id}",
              params: { recipe: { title: "新タイトル" } },
              headers: auth_headers
        expect(recipe.reload.title).to eq("新タイトル")
      end
    end

    context "他人のレシピを更新しようとした場合" do
      it "404 を返す" do
        other_user = create(:user, password: "password", password_confirmation: "password")
        auth_headers = sign_in_and_get_headers(other_user)
        patch "/api/v1/recipes/#{recipe.id}",
              params: { recipe: { title: "悪意のある更新" } },
              headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "DELETE /api/v1/recipes/:id" do
    let!(:recipe) { create(:recipe, user: user) }

    context "未認証の場合" do
      it "401または403を返す" do
        delete "/api/v1/recipes/#{recipe.id}"
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "自分のレシピを削除する場合" do
      it "200 OK を返す" do
        auth_headers = sign_in_and_get_headers(user)
        delete "/api/v1/recipes/#{recipe.id}", headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it "DB からレシピが 1 件減る" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          delete "/api/v1/recipes/#{recipe.id}", headers: auth_headers
        }.to change { Recipe.count }.by(-1)
      end
    end

    context "他人のレシピを削除しようとした場合" do
      it "404 を返す" do
        other_user = create(:user, password: "password", password_confirmation: "password")
        auth_headers = sign_in_and_get_headers(other_user)
        delete "/api/v1/recipes/#{recipe.id}", headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end

      it "DB のレシピは削除されない" do
        other_user = create(:user, password: "password", password_confirmation: "password")
        auth_headers = sign_in_and_get_headers(other_user)
        expect {
          delete "/api/v1/recipes/#{recipe.id}", headers: auth_headers
        }.not_to change { Recipe.count }
      end
    end
  end
end
