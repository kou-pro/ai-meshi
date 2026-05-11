require "rails_helper"

RSpec.describe "Api::V1::Likes", type: :request do
  let(:user) { create(:user, password: "password", password_confirmation: "password") }
  let(:recipe) { create(:recipe, user: user) }

  describe "POST /api/v1/recipes/:recipe_id/likes" do
    context "未認証の場合" do
      it "401または403を返す" do
        post "/api/v1/recipes/#{recipe.id}/likes"
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済みの場合" do
      it "200 OK を返す" do
        auth_headers = sign_in_and_get_headers(user)
        post "/api/v1/recipes/#{recipe.id}/likes", headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it "Like が 1 件作成され、likes_count が増える" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          post "/api/v1/recipes/#{recipe.id}/likes", headers: auth_headers
        }.to change { Like.count }.by(1).
               and change { recipe.reload.likes_count }.by(1)
      end
    end
  end

  describe "DELETE /api/v1/recipes/:recipe_id/likes" do
    context "未認証の場合" do
      it "401または403を返す" do
        delete "/api/v1/recipes/#{recipe.id}/likes"
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済み + 既にいいね済みの場合" do
      before do
        create(:like, user: user, recipe: recipe)
      end

      it "200 OK を返す" do
        auth_headers = sign_in_and_get_headers(user)
        delete "/api/v1/recipes/#{recipe.id}/likes", headers: auth_headers
        expect(response).to have_http_status(:ok)
      end

      it "Like が 1 件削除され、likes_count が減る" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          delete "/api/v1/recipes/#{recipe.id}/likes", headers: auth_headers
        }.to change { Like.count }.by(-1).
               and change { recipe.reload.likes_count }.by(-1)
      end
    end
  end
end
