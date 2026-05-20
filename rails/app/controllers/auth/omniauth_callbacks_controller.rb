class Auth::OmniauthCallbacksController < DeviseTokenAuth::OmniauthCallbacksController
  # OmniAuth 標準パスへ転送し、state 生成・session 保存・Google リダイレクトを
  # OmniAuth middleware に委譲する。
  # 参考: https://github.com/lynndylanhurley/devise_token_auth/issues/1020
  def passthru
    redirect_to "/auth/google_oauth2"
  end

  def omniauth_success
    @resource = User.from_omniauth(request.env["omniauth.auth"])

    # email_verified=false 等で from_omniauth が nil を返した場合も else 分岐に流す
    if @resource&.persisted?
      @token = @resource.create_token
      @resource.save!

      # RFC 6749 §4.1 準拠: 本物のトークンを URL クエリに乗せず、短命コードで包む。
      # Next.js が POST /auth/exchange で本物のトークンに交換する。
      code = AuthExchangeCode.encode(
        access_token: @token.token,
        client: @token.client,
        uid: @resource.uid,
      )

      redirect_to(
        "#{ENV.fetch("FRONT_DOMAIN")}/api/auth/google/callback?code=#{CGI.escape(code)}",
        allow_other_host: true,
      )
    else
      redirect_to(
        "#{ENV.fetch("FRONT_DOMAIN")}/login?error=auth_failed",
        allow_other_host: true,
      )
    end
  end

  alias_method :google_oauth2, :omniauth_success
end
