require "rails_helper"

RSpec.describe "Api::V1::Bookmarks", type: :request do
  let(:user) { create(:user, password: "password", password_confirmation: "password") }
  let(:recipe) { create(:recipe, user: user) }

  describe "GET /api/v1/bookmarks" do
    context "未認証の場合" do
      it "401または403を返す" do
        get "/api/v1/bookmarks"
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済みの場合" do
      before do
        create(:bookmark, user: user, recipe: recipe)
      end

      it "200 OK を返し、保存済みレシピを返す" do
        auth_headers = sign_in_and_get_headers(user)
        get "/api/v1/bookmarks", headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json.length).to eq(1)
        expect(json.first["id"]).to eq(recipe.id)
      end

      it "user キーに image_url が含まれ、画像未添付なら nil を返す" do
        auth_headers = sign_in_and_get_headers(user)
        get "/api/v1/bookmarks", headers: auth_headers
        user_json = response.parsed_body.first["user"]
        expect(user_json).to include("id", "name", "image_url")
        expect(user_json["image_url"]).to be_nil
      end
    end
  end

  describe "POST /api/v1/bookmarks" do
    context "未認証の場合" do
      it "401または403を返す" do
        post "/api/v1/bookmarks", params: { recipe_id: recipe.id }
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済みの場合" do
      it "201 Created を返し、Bookmark が 1 件作成される" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          post "/api/v1/bookmarks",
               params: { recipe_id: recipe.id },
               headers: auth_headers
        }.to change { Bookmark.count }.by(1)
        expect(response).to have_http_status(:created)
      end
    end

    context "認証済み + 既に保存済みの場合" do
      before do
        create(:bookmark, user: user, recipe: recipe)
      end

      it "422 を返す (uniqueness バリデーション)" do
        auth_headers = sign_in_and_get_headers(user)
        post "/api/v1/bookmarks",
             params: { recipe_id: recipe.id },
             headers: auth_headers
        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe "DELETE /api/v1/bookmarks/:id" do
    context "未認証の場合" do
      it "401または403を返す" do
        delete "/api/v1/bookmarks/#{recipe.id}"
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済み + 保存済みの場合" do
      before do
        create(:bookmark, user: user, recipe: recipe)
      end

      it "200 OK を返し、Bookmark が 1 件削除される" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          delete "/api/v1/bookmarks/#{recipe.id}", headers: auth_headers
        }.to change { Bookmark.count }.by(-1)
        expect(response).to have_http_status(:ok)
      end
    end

    context "認証済み + 保存していない場合" do
      it "404 を返す" do
        auth_headers = sign_in_and_get_headers(user)
        delete "/api/v1/bookmarks/#{recipe.id}", headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
