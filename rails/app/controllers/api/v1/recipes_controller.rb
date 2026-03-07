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

  def update
    # 自分のレシピだけ編集できる
    recipe = current_user.recipes.find(params[:id])
    if recipe.update(recipe_params)
      render json: recipe
    else
      render json: { errors: recipe.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    # 自分のレシピだけ削除できる
    recipe = current_user.recipes.find(params[:id])
    recipe.destroy
    render json: { message: '削除しました' }
  end

  def publish
    # 自分のレシピだけ公開できる
    recipe = current_user.recipes.find(params[:id])
    if recipe.update(is_published: true)
      render json: recipe
    else
      render json: { errors: recipe.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def published
    # 全ユーザーの公開済みレシピを取得
    recipes = Recipe.where(is_published: true).order(created_at: :desc)
    render json: recipes
  end

  def generate
    ingredients = params[:ingredients]
    client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
    response = client.chat(
      parameters: {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '必ず以下のJSON形式のみで返答してください。他の文章は一切含めないでください。マークダウンも使わないでください。{"title": "レシピ名", "content": "作り方の詳細"}'
          },
          {
            role: 'user',
            content: "以下の食材を使ったレシピを提案してください：#{ingredients}"
          }
        ],
        temperature: 0.7
      }
    )
    raw_content = response.dig('choices', 0, 'message', 'content')
    recipe_data = JSON.parse(raw_content)
    recipe = current_user.recipes.new(
      title: recipe_data['title'],
      content: recipe_data['content']
    )
    if recipe.save
      render json: recipe, status: :created
    else
      render json: { errors: recipe.errors.full_messages }, status: :unprocessable_entity
    end
  rescue JSON::ParserError
    render json: { error: 'レシピの生成に失敗しました' }, status: :unprocessable_entity
  rescue StandardError => e
    render json: { error: e.message }, status: :internal_server_error
  end

  private

  def recipe_params
    params.require(:recipe).permit(:title, :content)
  end
end