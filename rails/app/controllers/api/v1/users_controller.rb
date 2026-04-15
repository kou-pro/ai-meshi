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

      # フォロー中一覧
      def following
        user = User.find(params[:id])
        render json: user.following.map { |u|
          {
            id: u.id,
            name: u.name,
            image_url: u.image.attached? ? rails_blob_url(u.image, host: ENV.fetch('RAILS_PUBLIC_URL', 'http://localhost:3000')) : nil,
          }
        }
      end

      # フォロワー一覧
      def followers
        user = User.find(params[:id])
        render json: user.followers.map { |u|
          {
            id: u.id,
            name: u.name,
            image_url: u.image.attached? ? rails_blob_url(u.image, host: ENV.fetch('RAILS_PUBLIC_URL', 'http://localhost:3000')) : nil,
          }
        }
      end

      def recipes
        user = User.find(params[:id])

        # 自分のページなら全レシピ、他人のページなら公開レシピのみ
        is_own_page = current_user&.id == user.id
        recipes = if is_own_page
                    user.recipes.includes(:likes, image_attachment: :blob).order(created_at: :desc)
                  else
                    user.recipes.where(is_published: true).includes(:likes, image_attachment: :blob).order(created_at: :desc)
                  end

        # ログインしているユーザーがこのユーザーをフォローしているか
        is_following = if current_user
                        current_user.following.exists?(id: user.id)
                      else
                        false
                      end

        render json: {
          user: {
            id: user.id,
            name: user.name,
            following_count: user.following.count,
            followers_count: user.followers.count,
          },
          is_following: is_following,
          recipes: recipes.map { |r|
  {
    id: r.id,
    title: r.title,
    is_published: r.is_published,
    image_url: r.image.attached? ? rails_blob_url(r.image, host: ENV.fetch('RAILS_PUBLIC_URL', 'http://localhost:3000')) : nil,
    created_at: r.created_at,
    likes_count: r.likes.count,
  }
},
        }
      end
    end
  end
end
