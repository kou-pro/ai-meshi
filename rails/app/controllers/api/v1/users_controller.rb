require "set"

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
                       rails_blob_url(current_user.image, host: ENV.fetch("RAILS_PUBLIC_URL"))
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
                       rails_blob_url(current_user.image, host: ENV.fetch("RAILS_PUBLIC_URL"))
                     else
                       nil
                     end,
        }
      end

      # フォロー中一覧
      # 閲覧者 (current_user) 基準の is_followed_by_me を含めて返す。これは
      # 「current_user がこの一覧内の各ユーザーをフォロー中か」を示すフラグで、
      # FollowsClient の FollowButton 初期状態に使う。
      def following
        user = User.find(params[:id])
        render json: serialize_users(user.following)
      end

      # フォロワー一覧
      # フォロワー一覧では特に「相互フォロー」のケース判定が重要。
      # current_user 自身が一覧内の followers をフォロー中なら is_followed_by_me=true。
      def followers
        user = User.find(params[:id])
        render json: serialize_users(user.followers)
      end

      def recipes
        user = User.includes(image_attachment: :blob).find(params[:id])

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
            image_url: user.image_url(host: ENV.fetch("RAILS_PUBLIC_URL")),
            following_count: user.following.count,
            followers_count: user.followers.count,
          },
          is_following: is_following,
          recipes: recipes.map {|r|
            {
              id: r.id,
              title: r.title,
              is_published: r.is_published,
              image_url: r.image.attached? ? rails_blob_url(r.image, host: ENV.fetch("RAILS_PUBLIC_URL")) : nil,
              created_at: r.created_at,
              likes_count: r.likes.count,
            }
          },
        }
      end

      private

        # following / followers の共通シリアライズ。
        # N+1 回避のため image_attachment を eager load し、閲覧者の following ID は
        # 表示対象ユーザーに絞って一度だけ取得する。
        def serialize_users(users_relation)
          users = users_relation.includes(image_attachment: :blob).to_a
          user_ids = users.map(&:id)
          my_following_ids = if current_user
                               current_user.following.where(id: user_ids).pluck(:id).to_set
                             else
                               Set.new
                             end

          users.map {|u|
            {
              id: u.id,
              name: u.name,
              image_url: u.image_url(host: ENV.fetch("RAILS_PUBLIC_URL")),
              is_followed_by_me: my_following_ids.include?(u.id),
            }
          }
        end
    end
  end
end
