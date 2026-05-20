class Overrides::ConfirmationsController < DeviseTokenAuth::ConfirmationsController
  # Rails 7+ では default_redirect_response_options が allow_other_host: false に
  # なったため、devise_token_auth 1.2.6 標準の redirect_to は別ホスト(api.* → aimeshi.*)
  # への遷移で UnsafeRedirectError を起こす。
  # フロント(aimeshi.com)へのリダイレクトを許可するため allow_other_host: true を
  # 明示する形でオーバーライド。
  def show
    @resource = resource_class.confirm_by_token(params[:confirmation_token])

    if @resource.errors.empty?
      yield @resource if block_given?

      # create_token は呼ぶたびに新しいトークンを生成するため、必ず 1 回だけ呼んで
      # 同じ token/client をフロントに渡す。save! しないと tokens カラムが
      # DB に永続化されず、フロントからの後続リクエストが 401 になる。
      token = @resource.create_token
      @resource.save!

      redirect_header_options = { account_confirmation_success: true }
      redirect_headers = build_redirect_headers(token.token,
                                                token.client,
                                                redirect_header_options)
      redirect_to(@resource.build_auth_url(params[:redirect_url],
                                           redirect_headers),
                  allow_other_host: true)
    else
      redirect_to "#{params[:redirect_url]}?account_confirmation_success=false",
                  allow_other_host: true
    end
  end
end
