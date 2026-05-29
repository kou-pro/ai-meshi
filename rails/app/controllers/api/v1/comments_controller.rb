class Api::V1::CommentsController < ApplicationController
  before_action :authenticate_user!, only: [:create, :destroy]

  def index
    recipe = Recipe.find(params[:recipe_id])
    comments = recipe.comments.
                 includes(user: { image_attachment: :blob }).
                 order(created_at: :desc)
    render json: comments.map {|comment| serialize_comment(comment) }
  end

  def create
    recipe = Recipe.find(params[:recipe_id])
    comment = recipe.comments.new(comment_params)
    comment.user = current_user
    if comment.save
      render json: serialize_comment(comment), status: :created
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_content
    end
  end

  def destroy
    recipe = Recipe.find(params[:recipe_id])
    comment = recipe.comments.find(params[:id])
    if comment.user == current_user
      comment.destroy!
      render json: { message: "削除しました" }
    else
      render json: { error: "権限がありません" }, status: :forbidden
    end
  end

  private

    def comment_params
      params.require(:comment).permit(:body)
    end

    # コメント 1 件の JSON 表現を共通化 (index / create で同じ形を返すため)。
    # user.image_url は users_controller と同じ rails_blob_url パターンで返し、
    # 生成ロジックは User#image_url に切り出し済み (Skinny Controller / DRY)。
    def serialize_comment(comment)
      {
        id: comment.id,
        body: comment.body,
        created_at: comment.created_at,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          image_url: comment.user.image_url(host: ENV.fetch("RAILS_PUBLIC_URL")),
        },
      }
    end
end
