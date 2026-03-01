# rails/app/controllers/auth/omniauth_callbacks_controller.rb

class Auth::OmniauthCallbacksController < DeviseTokenAuth::OmniauthCallbacksController

  def omniauth_success
    # ▼ Googleから返ってきた認証情報でユーザー取得 or 作成
    @resource = User.from_omniauth(request.env['omniauth.auth'])

    if @resource.persisted?
      # ▼ devise_token_authのトークン生成
      @token = @resource.create_token
      @resource.save!

      # ▼ クエリパラメータに安全に乗せる
      access_token = @token.token
      client       = @token.client
      uid          = URI.encode_www_form_component(@resource.uid)

      # ▼ Next.jsのRoute Handlerへリダイレクト
      redirect_to(
        "http://localhost:8000/api/auth/google/callback?" \
        "access-token=#{access_token}" \
        "&client=#{client}" \
        "&uid=#{uid}",
        allow_other_host: true
      )
    else
      redirect_to(
        "http://localhost:8000/login?error=auth_failed",
        allow_other_host: true
      )
    end
  end

  # ▼ google_oauth2 アクション名を紐づけ
  alias_method :google_oauth2, :omniauth_success
end