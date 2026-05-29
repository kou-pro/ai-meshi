class Api::V1::ShoppingListItemsController < ApplicationController
  before_action :authenticate_user!

  def index
    items = current_user.shopping_list_items.
              includes(recipe: { image_attachment: :blob }).
              order(created_at: :desc)

    render json: items.map {|item|
      {
        id: item.id,
        ingredient_name: item.ingredient_name,
        # 新スキーマの集約フィールド (フロントが正確な値を直接使えるよう全て返す)
        quantity: item.quantity,
        unit: item.unit,
        added_count: item.added_count,
        # 表示用文字列は DB に保存せず、IngredientFormatter で都度組み立てる。
        # (DRY/3NF: quantity + unit を真実源とし、表示文字列はその派生)
        ingredient_amount: IngredientFormatter.call(
          quantity: item.quantity,
          unit: item.unit,
        ),
        ingredient_category: item.ingredient_category,
        is_checked: item.is_checked,
        recipe_id: item.recipe_id,
        # スナップショット(recipe_title)を優先。未設定の旧データは存命レシピから補完。
        # レシピ削除済みなら recipe は nil → スナップショットのみが残り「○○（削除済み）」表示に使う。
        recipe_title: item.recipe_title || item.recipe&.title,
        recipe_image_url: item.recipe&.image_url(host: ENV.fetch("RAILS_PUBLIC_URL")),
      }
    }
  end

  def create
    ShoppingListItemUpserter.call(
      user: current_user,
      recipe_id: params[:recipe_id],
      ingredients: params[:ingredients],
    )
    render json: { message: "追加しました" }, status: :created
  end

  def update
    item = current_user.shopping_list_items.find(params[:id])
    if item.update(is_checked: params[:is_checked])
      render json: { id: item.id, is_checked: item.is_checked }
    else
      render json: { errors: item.errors.full_messages }, status: :unprocessable_content
    end
  end

  def destroy
    item = current_user.shopping_list_items.find(params[:id])
    item.destroy!
    render json: { message: "削除しました" }
  end

  def destroy_by_recipe
    rid = params[:recipe_id].presence
    condition =
      if rid && rid != "null"
        { recipe_id: rid }
      else
        # 公開終了(削除済み)グループは recipe_id IS NULL の中から recipe_title で絞る
        # (複数の公開終了レシピを一括削除しないため)
        { recipe_id: nil, recipe_title: params[:recipe_title].presence }
      end
    current_user.shopping_list_items.where(condition).destroy_all
    render json: { message: "削除しました" }
  end

  def destroy_checked
    current_user.shopping_list_items.
      where(is_checked: true).
      destroy_all
    render json: { message: "削除しました" }
  end

  def destroy_all_items
    current_user.shopping_list_items.destroy_all
    render json: { message: "すべて削除しました" }
  end

  private

    def shopping_list_item_params
      params.require(:shopping_list_item).permit(
        :recipe_id,
        :ingredient_name,
        :ingredient_amount,
        :ingredient_category,
      )
    end
end
