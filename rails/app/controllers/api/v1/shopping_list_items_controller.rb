class Api::V1::ShoppingListItemsController < ApplicationController
  before_action :authenticate_user!

  def index
    # ログイン中のユーザーの買い物リストを全件取得
    items = current_user.shopping_list_items.
              includes(:recipe).
              order(created_at: :desc)

    render json: items.map {|item|
      {
        id: item.id,
        ingredient_name: item.ingredient_name,
        ingredient_amount: item.ingredient_amount,
        is_checked: item.is_checked,
        recipe_id: item.recipe_id,
        recipe_title: item.recipe.title,
      }
    }
  end

  def create
    recipe_id = params[:recipe_id]
    ingredients = params[:ingredients]
    force = params[:force]

    # 重複チェック
    # 同じユーザーが同じレシピをすでに追加しているか確認する
    already_exists = current_user.shopping_list_items.
                       exists?(recipe_id: recipe_id)

    # force が true でなく、すでに追加済みの場合は 409 を返す
    if !force && already_exists
      render json: { error: "すでに追加済みです" }, status: :conflict
      return
    end

    # ingredients を1つずつ shopping_list_items に保存する
    ingredients.each do |ingredient|
      # 量と単位を組み合わせて ingredient_amount を作る
      amount = "#{ingredient["quantity"]}#{ingredient["unit"]}"

      current_user.shopping_list_items.create!(
        recipe_id: recipe_id,
        ingredient_name: ingredient["name"],
        ingredient_amount: amount,
        is_checked: false,
      )
    end

    render json: { message: "追加しました" }, status: :created
  end

  def update
    # チェック状態を更新する
    item = current_user.shopping_list_items.find(params[:id])
    if item.update(is_checked: params[:is_checked])
      render json: {
        id: item.id,
        is_checked: item.is_checked,
      }
    else
      render json: { errors: item.errors.full_messages }, status: :unprocessable_content
    end
  end

  def destroy
    # 自分のアイテムだけ削除できる
    item = current_user.shopping_list_items.find(params[:id])
    item.destroy!
    render json: { message: "削除しました" }
  end

  private

    def shopping_list_item_params
      params.require(:shopping_list_item).permit(
        :recipe_id,
        :ingredient_name,
        :ingredient_amount,
      )
    end
end
