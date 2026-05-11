require "rails_helper"

RSpec.describe "Api::V1::Follows", type: :request do
  let(:user) { create(:user, password: "password", password_confirmation: "password") }
  let(:other_user) { create(:user, password: "password", password_confirmation: "password") }

  describe "POST /api/v1/follows" do
    context "未認証の場合" do
      it "401または403を返す" do
        post "/api/v1/follows", params: { following_id: other_user.id }
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済み + 他人をフォローする場合" do
      it "201 Created を返し、Follow が 1 件作成される" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          post "/api/v1/follows",
               params: { following_id: other_user.id },
               headers: auth_headers
        }.to change { Follow.count }.by(1)
        expect(response).to have_http_status(:created)
      end
    end

    context "認証済み + 既にフォロー済みの場合" do
      before do
        create(:follow, follower: user, following: other_user)
      end

      it "422 を返す (uniqueness バリデーション)" do
        auth_headers = sign_in_and_get_headers(user)
        post "/api/v1/follows",
             params: { following_id: other_user.id },
             headers: auth_headers
        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "認証済み + 自分自身をフォローしようとする場合" do
      it "422 を返す (cannot_follow_self)" do
        auth_headers = sign_in_and_get_headers(user)
        post "/api/v1/follows",
             params: { following_id: user.id },
             headers: auth_headers
        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe "DELETE /api/v1/follows/:id" do
    context "未認証の場合" do
      it "401または403を返す" do
        delete "/api/v1/follows/#{other_user.id}"
        expect(response).to have_http_status(:forbidden).or(
          have_http_status(:unauthorized),
        )
      end
    end

    context "認証済み + 既にフォロー済みの場合" do
      before do
        create(:follow, follower: user, following: other_user)
      end

      it "200 OK を返し、Follow が 1 件削除される" do
        auth_headers = sign_in_and_get_headers(user)
        expect {
          delete "/api/v1/follows/#{other_user.id}", headers: auth_headers
        }.to change { Follow.count }.by(-1)
        expect(response).to have_http_status(:ok)
      end
    end

    context "認証済み + フォローしていない場合" do
      it "404 を返す" do
        auth_headers = sign_in_and_get_headers(user)
        delete "/api/v1/follows/#{other_user.id}", headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
