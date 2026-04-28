class Auth::OmniauthCallbacksController < DeviseTokenAuth::OmniauthCallbacksController
  # OmniAuth 標準パスへ転送し、state 生成・session 保存・Google リダイレクトを
  # OmniAuth middleware に委譲する。
  # 参考: https://github.com/lynndylanhurley/devise_token_auth/issues/1020
  def passthru
    redirect_to "/auth/google_oauth2"
  end

  def omniauth_success
    @resource = User.from_omniauth(request.env["omniauth.auth"])

    if @resource.persisted?
      @token = @resource.create_token
      @resource.save!

      access_token = @token.token
      client       = @token.client
      uid          = URI.encode_www_form_component(@resource.uid)

      redirect_to(
        "#{ENV.fetch("FRONT_DOMAIN")}/api/auth/google/callback?" \
        "access-token=#{access_token}" \
        "&client=#{client}" \
        "&uid=#{uid}",
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
