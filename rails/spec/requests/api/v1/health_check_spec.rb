require "rails_helper"

RSpec.describe "Api::V1::HealthCheck", type: :request do
  describe "GET /api/v1/health_check" do
    it "200 OK を返す" do
      get "/api/v1/health_check"
      expect(response).to have_http_status(:ok)
    end

    it "メッセージが正しい JSON を返す" do
      get "/api/v1/health_check"
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Success Health Check!")
    end
  end
end
