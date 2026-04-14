class Api::V1::FollowsController < ApplicationController
  before_action :authenticate_user!

  # フォローする
  def create
    follow = current_user.following_relationships.build(following_id: params[:following_id])
    if follow.save
      render json: { status: 'followed' }, status: :created
    else
      render json: { errors: follow.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # アンフォローする
  def destroy
    follow = current_user.following_relationships.find_by(following_id: params[:id])
    if follow
      follow.destroy
      render json: { status: 'unfollowed' }
    else
      render json: { errors: 'フォロー関係が見つかりません' }, status: :not_found
    end
  end
end