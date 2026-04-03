class Api::V1::GuestSessionsController < ApplicationController
  def create
    guest_user = User.find_by(email: ENV.fetch("GUEST_USER_EMAIL", "guest@example.com"))

    unless guest_user
      return render json: { error: "ゲストユーザーが見つかりません" }, status: :not_found
    end

    token = guest_user.create_token
    guest_user.save!

    render json: {
      data: {
        id: guest_user.id,
        name: guest_user.name,
        email: guest_user.email,
      },
      tokens: {
        "access-token" => token.token,
        "client" => token.client,
        "uid" => guest_user.uid,
        "expiry" => token.expiry.to_s,
      },
    }, status: :ok
  end
end
