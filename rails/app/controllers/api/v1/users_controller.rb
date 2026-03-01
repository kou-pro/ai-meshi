module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!

      def me
        render json: {
          id: current_user.id,
          email: current_user.email
        }
      end
    end
  end
end