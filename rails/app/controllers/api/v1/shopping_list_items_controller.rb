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
        ingredient_amount: item.ingredient_amount,
        ingredient_category: item.ingredient_category,
        is_checked: item.is_checked,
        recipe_id: item.recipe_id,
        recipe_title: item.recipe.title,
        recipe_image_url: item.recipe.image.attached? ? url_for(item.recipe.image) : nil,
      }
    }
  end

  def create
    recipe_id   = params[:recipe_id]
    ingredients = params[:ingredients]
    force       = params[:force]

    already_exists = current_user.shopping_list_items.
                       exists?(recipe_id: recipe_id)

    if !force && already_exists
      render json: { error: "すでに追加済みです" }, status: :conflict
      return
    end

    ingredients.each do |ingredient|
      # IngredientFormatter (Service Object) に整形を委譲。
      # 旧実装の素朴な連結 ("#{quantity}#{unit}") では
      # "適量g" や "1大さじ" のような壊れ表記が発生していたため、
      # 業界標準 (大さじ前置 / 「適量」等の単位省略) に準拠した整形を行う。
      amount = IngredientFormatter.call(
        quantity: ingredient["quantity"],
        unit: ingredient["unit"],
      )
      current_user.shopping_list_items.create!(
        recipe_id: recipe_id,
        ingredient_name: ingredient["name"],
        ingredient_amount: amount,
        ingredient_category: ingredient["category"],
        is_checked: false,
      )
    end

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
    current_user.shopping_list_items.
      where(recipe_id: params[:recipe_id]).
      destroy_all
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
