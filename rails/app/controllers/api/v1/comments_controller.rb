class Api::V1::CommentsController < ApplicationController
  before_action :authenticate_user!, only: [:create, :destroy]

  def index
    recipe = Recipe.find(params[:recipe_id])
    comments = recipe.comments
                     .includes(:user)
                     .order(created_at: :desc)
    render json: comments.map { |comment|
      {
        id: comment.id,
        body: comment.body,
        created_at: comment.created_at,
        user: {
          id: comment.user.id,
          name: comment.user.name
        }
      }
    }
  end

  def create
    recipe = Recipe.find(params[:recipe_id])
    comment = recipe.comments.new(comment_params)
    comment.user = current_user
    if comment.save
      render json: {
        id: comment.id,
        body: comment.body,
        created_at: comment.created_at,
        user: {
          id: comment.user.id,
          name: comment.user.name
        }
      }, status: :created
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    recipe = Recipe.find(params[:recipe_id])
    comment = recipe.comments.find(params[:id])
    if comment.user == current_user
      comment.destroy
      render json: { message: '削除しました' }
    else
      render json: { error: '権限がありません' }, status: :forbidden
    end
  end

  private

  def comment_params
    params.require(:comment).permit(:body)
  end
end
