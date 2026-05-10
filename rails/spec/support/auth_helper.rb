module AuthHelper
  def sign_in_and_get_headers(user, password: "password")
    post "/auth/sign_in", params: { email: user.email, password: password }
    {
      "access-token" => response.headers["access-token"],
      "client" => response.headers["client"],
      "uid" => response.headers["uid"],
    }
  end
end
