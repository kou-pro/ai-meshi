require "rails_helper"

RSpec.describe "Api::V1::Comments", type: :request do
  let(:user) { create(:user, password: "password", password_confirmation: "password") }
  let(:recipe) { create(:recipe, user: user) }

  describe "GET /api/v1/recipes/:recipe_id/comments" do
    before do
      create(:comment, user: user, recipe: recipe, body: "コメント1")
    end

    it "認証不要で 200 OK を返し、コメント一覧を返す" do
      get "/api/v1/recipes/#{recipe.id}/comments"
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.length).to eq(1)
      expect(json.first["body"]).to eq("コメント1")
    end
  end

  describe "POST /api/v1/recipes/:recipe_id/comments" do
    context "未認証の場合" do
      it "401または403を返す" do
        post "/api/v1/recipes/#{recipe.id}/comments",
             params: { comment: { body: "テスト" } }
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済みの場合" do
      it "201 Created を返し、Comment が 1 件作成される" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          post "/api/v1/recipes/#{recipe.id}/comments",
               params: { comment: { body: "テストコメント" } },
               headers: auth_headers
        }.to change { Comment.count }.by(1)
        expect(response).to have_http_status(:created)
      end

      it "body が空だと 422 を返す" do
        auth_headers = sign_in_and_get_headers(user)
        post "/api/v1/recipes/#{recipe.id}/comments",
             params: { comment: { body: "" } },
             headers: auth_headers
        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe "DELETE /api/v1/recipes/:recipe_id/comments/:id" do
    let!(:comment) { create(:comment, user: user, recipe: recipe) }

    context "未認証の場合" do
      it "401または403を返す" do
        delete "/api/v1/recipes/#{recipe.id}/comments/#{comment.id}"
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "自分のコメントを削除する場合" do
      it "200 OK を返し、Comment が 1 件削除される" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          delete "/api/v1/recipes/#{recipe.id}/comments/#{comment.id}", headers: auth_headers
        }.to change { Comment.count }.by(-1)
        expect(response).to have_http_status(:ok)
      end
    end

    context "他人のコメントを削除しようとした場合" do
      it "403 を返し、Comment は削除されない" do
        other_user = create(:user, password: "password", password_confirmation: "password")
        auth_headers = sign_in_and_get_headers(other_user)
        expect {
          delete "/api/v1/recipes/#{recipe.id}/comments/#{comment.id}", headers: auth_headers
        }.not_to change { Comment.count }
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
