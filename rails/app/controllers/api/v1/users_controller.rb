module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!, only: [:me, :update_me]

      def me
        render json: {
          id: current_user.id,
          name: current_user.name,
          email: current_user.email,
          image_url: if current_user.image.attached?
                       rails_blob_url(current_user.image, host: ENV.fetch("RAILS_PUBLIC_URL", "http://localhost:3000"))
                     else
                       nil
                     end,
        }
      end

      def update_me
        if params[:name].present?
          current_user.update!(name: params[:name])
        end

        if params[:image].present?
          current_user.image.attach(params[:image])
        end

        render json: {
          id: current_user.id,
          name: current_user.name,
          email: current_user.email,
          image_url: if current_user.image.attached?
                       rails_blob_url(current_user.image, host: ENV.fetch("RAILS_PUBLIC_URL", "http://localhost:3000"))
                     else
                       nil
                     end,
        }
      end

      def recipes
        user = User.find(params[:id])
        recipes = user.recipes.where(is_published: true).order(created_at: :desc)
        render json: {
          user: {
            id: user.id,
            name: user.name,
          },
          recipes: recipes.map {|r|
            {
              id: r.id,
              title: r.title,
              content: r.content,
              created_at: r.created_at,
              likes_count: r.likes.count,
            }
          },
        }
      end
    end
  end
end
