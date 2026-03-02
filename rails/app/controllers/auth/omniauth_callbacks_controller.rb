class Auth::OmniauthCallbacksController < DeviseTokenAuth::OmniauthCallbacksController

  def passthru
  # ▼ Googleの認証URLを直接生成してリダイレクト
    client_id = ENV['GOOGLE_CLIENT_ID']
    redirect_uri = 'http://localhost:3000/omniauth/google_oauth2/callback'
    scope = 'email profile'
  
    google_auth_url = "https://accounts.google.com/o/oauth2/auth?" \
        "client_id=#{client_id}" \
        "&redirect_uri=#{CGI.escape(redirect_uri)}" \
        "&response_type=code" \
        "&scope=#{CGI.escape(scope)}"
  
    redirect_to google_auth_url, allow_other_host: true
  end

  def omniauth_success
    @resource = User.from_omniauth(request.env['omniauth.auth'])

    if @resource.persisted?
      @token = @resource.create_token
      @resource.save!

      access_token = @token.token
      client       = @token.client
      uid          = URI.encode_www_form_component(@resource.uid)

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

  alias_method :google_oauth2, :omniauth_success
end