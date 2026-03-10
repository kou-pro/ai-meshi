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

      def recipes
  user = User.find(params[:id])
  recipes = user.recipes.where(is_published: true).order(created_at: :desc)
  render json: {
    user: {
      id: user.id,
      name: user.name
    },
    recipes: recipes.map { |r|
      {
        id: r.id,
        title: r.title,
        content: r.content,
        created_at: r.created_at
      }
    }
  }
end
    end
  end
end