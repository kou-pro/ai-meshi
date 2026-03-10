class Api::V1::LikesController < ApplicationController
  before_action :authenticate_user!

  def create
    recipe = Recipe.find(params[:recipe_id])
    current_user.likes.create!(recipe: recipe)

    render json: {
      likes_count: recipe.likes.count,
      liked_by_current_user: true
    }
  end

  def destroy
    recipe = Recipe.find(params[:recipe_id])
    like = current_user.likes.find_by(recipe: recipe)
    like&.destroy

    render json: {
      likes_count: recipe.likes.count,
      liked_by_current_user: false
    }
  end
end