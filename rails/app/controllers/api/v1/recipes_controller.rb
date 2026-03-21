class Api::V1::RecipesController < ApplicationController
  before_action :authenticate_user!, except: [:published, :show]

  def index
    recipes = current_user.recipes
    render json: recipes
  end

  def show
    recipe = Recipe.find(params[:id])
    # ログイン済みの場合だけ自分がいいねしているか確認する
    liked_by_current_user = current_user ? current_user.likes.exists?(recipe: recipe) : false

    render json: {
      id: recipe.id,
      title: recipe.title,
      content: recipe.content,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      hashtags: recipe.hashtags,
      created_at: recipe.created_at,
      user: {
        id: recipe.user.id,
        name: recipe.user.name
      },
      likes_count: recipe.likes.count,
      liked_by_current_user: liked_by_current_user,
      image_url: recipe.image.attached? ? url_for(recipe.image) : nil
    }
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
    sort_order = params[:sort] == 'popular' ? 'popular' : 'newest'
    query = params[:query].presence
    tag = params[:tag].presence

    recipes = Recipe.where(is_published: true)
                    .includes(:user, image_attachment: :blob)

    if tag
      # タグ検索（hashtags）→ tag優先
      recipes = recipes.where(
        'JSON_CONTAINS(recipes.hashtags, ?)',
        "\"##{tag}\""
      )
    elsif query
      # キーワード検索（title・content）→ tagがない場合のみ
      keywords = query.split(/[\s　]+/)
      keywords.each do |keyword|
        recipes = recipes.where(
          'recipes.title LIKE :kw OR recipes.content LIKE :kw',
          kw: "%#{keyword}%"
        )
      end
    end

    recipes = if sort_order == 'popular'
                recipes.order(likes_count: :desc, created_at: :desc)
              else
                recipes.order(created_at: :desc)
              end

    recipes = recipes.page(params[:page]).per(12)

    render json: {
      items: recipes.map { |recipe|
        {
          id: recipe.id,
          title: recipe.title,
          created_at: recipe.created_at,
          likes_count: recipe.likes_count,
          image_url: recipe.image.attached? ? url_for(recipe.image) : nil,
          user: {
            id: recipe.user.id,
            name: recipe.user.name
          }
        }
      },
      current_page: recipes.current_page,
      next_page: recipes.next_page,
      has_next_page: !recipes.last_page?,
      total_count: recipes.total_count
    }
  end

  def generate
    ingredients = params[:ingredients]

    # フロントから選択条件を受け取る
    # .presence → 未選択（nil・空）の場合は nil を返す
    servings   = params[:servings].presence
    genre      = params[:genre].presence
    scene      = params[:scene].presence
    conditions = params[:conditions].presence

    # 選択された条件だけ hints 配列に追加する
    hints = []
    hints << "人数：#{servings}人分"                  if servings.present?
    hints << "料理ジャンル：#{genre}"                 if genre.present?
    hints << "シーン：#{scene}"                       if scene.present?
    hints << "こだわり条件：#{conditions.join('、')}"  if conditions.present?

    # hints が1つでもあれば補助条件テキストを作る・なければ空文字
    hint_text = hints.any? ? "\n\n補助条件：\n#{hints.join("\n")}" : ''

    # 自由入力 + 補助条件を合わせてAIへ渡すプロンプトを作る
    user_content = "以下の食材を使ったレシピを提案してください：#{ingredients}#{hint_text}"

    client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
    response = client.chat(
      parameters: {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '必ず以下のJSON形式のみで返答してください。他の文章は一切含めないでください。マークダウンも使わないでください。{"title": "レシピ名", "servings": 2, "ingredients": [{"name": "食材名", "quantity": "量", "unit": "単位", "category": "カテゴリ"}], "steps": ["手順1", "手順2"], "hashtags": ["タグ1", "タグ2", "タグ3"]}'
          },
          {
            role: 'user',
            content: user_content
          }
        ],
        temperature: 0.7
      }
    )

    raw_content = response.dig('choices', 0, 'message', 'content')
    recipe_data = JSON.parse(raw_content)

    recipe = current_user.recipes.new(
      title:       recipe_data['title'],
      servings:    recipe_data['servings'],
      ingredients: recipe_data['ingredients'],
      steps:       recipe_data['steps'],
      hashtags:    recipe_data['hashtags']
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
    params.require(:recipe).permit(:title, :content, :image)
  end
end