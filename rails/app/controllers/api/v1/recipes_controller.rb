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

  def generate
    # ユーザーが入力した食材・条件を受け取る
    ingredients = params[:ingredients]

    # OpenAIクライアントを初期化
    # ENV['OPENAI_API_KEY']は.envから読み込まれる
    client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])

    # ChatGPT APIにリクエスト
    response = client.chat(
      parameters: {
        model: 'gpt-4o-mini',   # 低コストなモデルを使用
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
        temperature: 0.7   # 回答のランダム性（0〜1、高いほど多様な回答）
      }
    )

    # ChatGPTからの返答を取り出す
    raw_content = response.dig('choices', 0, 'message', 'content')

    # JSON文字列をRubyのハッシュに変換
    recipe_data = JSON.parse(raw_content)

    # DBに保存
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
    # ChatGPTがJSON形式で返さなかった場合
    render json: { error: 'レシピの生成に失敗しました' }, status: :unprocessable_entity
  rescue StandardError => e
    # その他のエラー（APIキー不正など）
    render json: { error: e.message }, status: :internal_server_error
  end

  private

  def recipe_params
    params.require(:recipe).permit(:title, :content)
  end
end