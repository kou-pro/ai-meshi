# 短命の認証コードを受け取り、本物の access-token / client / uid / expiry を
# JSON で返却する。RFC 6749 §4.1 の Token Endpoint 相当。
# Next.js Route Handler (server-to-server) からのみ呼ばれる想定。
module Auth
  class ExchangeController < ApplicationController
    def create
      payload = AuthExchangeCode.decode(params[:code])

      if payload
        render json: payload
      else
        render json: { error: "invalid_or_expired_code" }, status: :unauthorized
      end
    end
  end
end
