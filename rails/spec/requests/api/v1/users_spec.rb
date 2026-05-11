require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
  let(:user) { create(:user, password: "password", password_confirmation: "password", name: "テストユーザー") }

  describe "GET /api/v1/users/me" do
    context "未認証の場合" do
      it "401または403を返す" do
        get "/api/v1/users/me"
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済みの場合" do
      it "200 OK + 自分の情報を返す" do
        auth_headers = sign_in_and_get_headers(user)
        get "/api/v1/users/me", headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["id"]).to eq(user.id)
        expect(json["name"]).to eq("テストユーザー")
        expect(json["email"]).to eq(user.email)
      end
    end
  end

  describe "PATCH /api/v1/users/me" do
    context "未認証の場合" do
      it "401または403を返す" do
        patch "/api/v1/users/me", params: { name: "新しい名前" }
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済みの場合" do
      it "200 OK + 名前が更新される" do
        auth_headers = sign_in_and_get_headers(user)
        patch "/api/v1/users/me", params: { name: "更新後の名前" }, headers: auth_headers
        expect(response).to have_http_status(:ok)
        expect(user.reload.name).to eq("更新後の名前")
      end
    end
  end

  describe "GET /api/v1/users/:id/recipes" do
    let!(:published_recipe) { create(:recipe, user: user, title: "公開レシピ", is_published: true) }
    let!(:draft_recipe) { create(:recipe, user: user, title: "下書きレシピ", is_published: false) }

    context "未認証 (他人のページ扱い) の場合" do
      it "公開レシピのみ返す" do
        get "/api/v1/users/#{user.id}/recipes"
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        titles = json["recipes"].map {|r| r["title"] }
        expect(titles).to include("公開レシピ")
        expect(titles).not_to include("下書きレシピ")
      end
    end

    context "認証済み (自分のページ) の場合" do
      it "下書きを含む全レシピを返す" do
        auth_headers = sign_in_and_get_headers(user)
        get "/api/v1/users/#{user.id}/recipes", headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        titles = json["recipes"].map {|r| r["title"] }
        expect(titles).to include("公開レシピ", "下書きレシピ")
      end
    end
  end

  describe "GET /api/v1/users/:id/following" do
    it "フォロー中のユーザー一覧を返す" do
      other_user = create(:user, name: "フォロー先")
      create(:follow, follower: user, following: other_user)

      get "/api/v1/users/#{user.id}/following"
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.length).to eq(1)
      expect(json.first["id"]).to eq(other_user.id)
    end
  end

  describe "GET /api/v1/users/:id/followers" do
    it "フォロワー一覧を返す" do
      follower_user = create(:user, name: "フォロワー")
      create(:follow, follower: follower_user, following: user)

      get "/api/v1/users/#{user.id}/followers"
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.length).to eq(1)
      expect(json.first["id"]).to eq(follower_user.id)
    end
  end
end
