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
        json = response.parsed_body
        expect(json["id"]).to eq(recipe.id)
        expect(json["title"]).to eq(recipe.title)
        expect(json["content"]).to eq("テスト内容")
      end

      it "user の情報がネストされて返る" do
        recipe.user.update!(name: "テストユーザー")
        get "/api/v1/recipes/#{recipe.id}"
        json = response.parsed_body
        expect(json["user"]["id"]).to eq(user.id)
        expect(json["user"]["name"]).to eq("テストユーザー")
      end

      it "未ログインなので liked_by_current_user は false" do
        get "/api/v1/recipes/#{recipe.id}"
        json = response.parsed_body
        expect(json["liked_by_current_user"]).to be(false)
        expect(json["bookmarked_by_current_user"]).to be(false)
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

  describe "POST /api/v1/recipes/generate" do
    let(:openai_url) { "https://api.openai.com/v1/chat/completions" }

    context "未認証の場合" do
      it "401または403を返す" do
        post "/api/v1/recipes/generate", params: { ingredients: "豚肉、玉ねぎ" }
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "OpenAI が正常な JSON を返す場合" do
      let(:openai_response_body) do
        {
          choices: [
            {
              message: {
                content: {
                  title: "AI生成カレー",
                  servings: 2,
                  ingredients: [],
                  steps: ["切る", "煮る"],
                  hashtags: ["和食"],
                }.to_json,
              },
            },
          ],
        }.to_json
      end

      before do
        stub_request(:post, openai_url).
          to_return(
            status: 200,
            body: openai_response_body,
            headers: { "Content-Type" => "application/json" },
          )
      end

      it "201 Created を返す" do
        auth_headers = sign_in_and_get_headers(user)
        post "/api/v1/recipes/generate",
             params: { ingredients: "豚肉、玉ねぎ", is_published: true },
             headers: auth_headers
        expect(response).to have_http_status(:created)
      end

      it "Recipe が 1 件作成される" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          post "/api/v1/recipes/generate",
               params: { ingredients: "豚肉、玉ねぎ", is_published: true },
               headers: auth_headers
        }.to change { user.recipes.count }.by(1)
      end
    end

    context "OpenAI が不正な JSON を返す場合" do
      before do
        stub_request(:post, openai_url).
          to_return(
            status: 200,
            body: {
              choices: [{ message: { content: "これは JSON ではない" } }],
            }.to_json,
            headers: { "Content-Type" => "application/json" },
          )
      end

      it "422 を返す" do
        auth_headers = sign_in_and_get_headers(user)
        post "/api/v1/recipes/generate",
             params: { ingredients: "豚肉", is_published: true },
             headers: auth_headers
        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "Recipe バリデーション失敗の場合 (title 空)" do
      before do
        stub_request(:post, openai_url).
          to_return(
            status: 200,
            body: {
              choices: [
                {
                  message: {
                    content: { title: "", servings: 2, ingredients: [], steps: [], hashtags: [] }.to_json,
                  },
                },
              ],
            }.to_json,
            headers: { "Content-Type" => "application/json" },
          )
      end

      it "422 を返す" do
        auth_headers = sign_in_and_get_headers(user)
        post "/api/v1/recipes/generate",
             params: { ingredients: "豚肉", is_published: true },
             headers: auth_headers
        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe "GET /api/v1/recipes/published" do
    let!(:published_recipe) { create(:recipe, user: user, title: "公開レシピ", is_published: true) }
    let!(:draft_recipe) { create(:recipe, user: user, title: "下書きレシピ", is_published: false) }

    it "公開レシピのみ返し、ページネーション情報を含む" do
      get "/api/v1/recipes/published"
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      titles = json["items"].map {|r| r["title"] }
      expect(titles).to include("公開レシピ")
      expect(titles).not_to include("下書きレシピ")
      expect(json).to include("current_page", "next_page", "has_next_page", "total_count")
    end

    it "query パラメータで検索できる" do
      create(:recipe, user: user, title: "カレーライス", is_published: true)
      get "/api/v1/recipes/published", params: { query: "カレー" }
      expect(response).to have_http_status(:ok)
      titles = response.parsed_body["items"].map {|r| r["title"] }
      expect(titles).to include("カレーライス")
      expect(titles).not_to include("公開レシピ")
    end
  end

  describe "GET /api/v1/recipes/popular" do
    let!(:published_recipe) { create(:recipe, user: user, title: "公開人気レシピ", is_published: true) }
    let!(:draft_recipe) { create(:recipe, user: user, title: "下書きレシピ", is_published: false) }

    it "公開レシピのみ返す" do
      get "/api/v1/recipes/popular"
      expect(response).to have_http_status(:ok)
      titles = response.parsed_body.map {|r| r["title"] }
      expect(titles).to include("公開人気レシピ")
      expect(titles).not_to include("下書きレシピ")
    end
  end

  describe "GET /api/v1/recipes/popular_tags" do
    before do
      create(:recipe, user: user, is_published: true, hashtags: ["#和食", "#簡単"])
      create(:recipe, user: user, is_published: true, hashtags: ["#和食"])
    end

    it "タグの集計を返す" do
      get "/api/v1/recipes/popular_tags"
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to have_key("tags")
      tag_names = json["tags"].map {|t| t["tag"] }
      expect(tag_names).to include("#和食", "#簡単")
    end
  end

  describe "PATCH /api/v1/recipes/:id/publish" do
    let(:recipe) { create(:recipe, user: user, is_published: false) }

    context "未認証の場合" do
      it "401または403を返す" do
        patch "/api/v1/recipes/#{recipe.id}/publish", params: { is_published: true }
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "自分のレシピを公開する場合" do
      it "200 OK + is_published が true に更新される" do
        auth_headers = sign_in_and_get_headers(user)
        patch "/api/v1/recipes/#{recipe.id}/publish",
              params: { is_published: true },
              headers: auth_headers
        expect(response).to have_http_status(:ok)
        expect(recipe.reload.is_published).to be(true)
      end
    end

    context "他人のレシピを公開しようとした場合" do
      it "404 を返す" do
        other_user = create(:user, password: "password", password_confirmation: "password")
        auth_headers = sign_in_and_get_headers(other_user)
        patch "/api/v1/recipes/#{recipe.id}/publish",
              params: { is_published: true },
              headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
