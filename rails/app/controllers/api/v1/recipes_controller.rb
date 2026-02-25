class Api::V1::RecipesController < ApplicationController
  before_action :authenticate_user!

  def index
    recipes = current_user.recipes
    render json: recipes
  end

  def create
    recipe = current_user.recipes.new(recipe_params)

    if recipe.save
      render json: recipe, status: :created
    else
      render json: { errors: recipe.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def recipe_params
    params.require(:recipe).permit(:title)
  end
end