module Auth
  class PasswordsController < DeviseTokenAuth::PasswordsController
    protected

      def redirect_options
        { allow_other_host: true }
      end
  end
end
