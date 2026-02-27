# app/controllers/auth/sessions_controller.rb

module Auth
  class SessionsController < DeviseTokenAuth::SessionsController

    def create
      super do |_resource|
        set_token_cookie
      end
    end

    private

    def set_token_cookie
      token  = response.headers['access-token']
      client = response.headers['client']
      uid    = response.headers['uid']

      cookies.signed[:access_token] = {
        value: token,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :lax
      }

      cookies.signed[:client] = {
        value: client,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :lax
      }

      cookies.signed[:uid] = {
        value: uid,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :lax
      }
    end
  end
end