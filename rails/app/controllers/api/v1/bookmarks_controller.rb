class Api::V1::BookmarksController < ApplicationController
  before_action :authenticate_user!

  # 保存済みレシピ一覧を返す
  def index
    recipes = current_user.bookmarked_recipes.
                includes(:user, image_attachment: :blob).
                order(created_at: :desc)

    render json: recipes.map {|recipe|
      {
        id: recipe.id,
        title: recipe.title,
        created_at: recipe.created_at,
        likes_count: recipe.likes_count,
        image_url: recipe.image.attached? ? url_for(recipe.image) : nil,
        user: {
          id: recipe.user.id,
          name: recipe.user.name,
        },
      }
    }
  end

  # レシピを保存する
  def create
    bookmark = current_user.bookmarks.new(recipe_id: params[:recipe_id])

    if bookmark.save
      render json: { bookmarked: true }, status: :created
    else
      render json: { error: bookmark.errors.full_messages }, status: :unprocessable_content
    end
  end

  # 保存を解除する
  def destroy
    bookmark = current_user.bookmarks.find_by(recipe_id: params[:id])

    if bookmark
      bookmark.destroy!
      render json: { bookmarked: false }, status: :ok
    else
      render json: { error: "保存が見つかりません" }, status: :not_found
    end
  end
end
