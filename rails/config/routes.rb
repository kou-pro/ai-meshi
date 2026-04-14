Rails.application.routes.draw do
  # ▼ カスタムルートを先に書く（優先される）
  match "/omniauth/:provider/callback", to: "auth/omniauth_callbacks#omniauth_success", via: [:get, :post]
  get "/omniauth/failure", to: "auth/omniauth_callbacks#omniauth_failure"
  get "/omniauth/:provider", to: "auth/omniauth_callbacks#passthru"
  # ▼ 後ろに移動
  mount_devise_token_auth_for "User", at: "auth",
                                      controllers: {
                                        sessions: "auth/sessions",
                                        omniauth_callbacks: "auth/omniauth_callbacks",
                                        registrations: "overrides/registrations",
                                      }
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
  namespace :api do
    namespace :v1 do
      get "users/me", to: "users#me"
      patch "users/me", to: "users#update_me"
      get "health_check", to: "health_check#index"
      post "guest_sessions", to: "guest_sessions#create"
      resources :users, only: [] do
        member do
          get :recipes
          get :following
          get :followers
        end
      end
      resources :recipes, only: [:index, :create, :update, :destroy, :show] do
        collection do
          post :generate
          get :published
          get :popular
          get :popular_tags
        end
        member do
          patch :publish
        end
        resource :likes, only: [:create, :destroy]
        resources :comments, only: [:index, :create, :destroy]
      end
      resources :bookmarks, only: [:index, :create, :destroy]
      # フォロー機能
      resources :follows, only: [:create, :destroy]
      # 買い物リスト
      resources :shopping_list_items, only: [:index, :create, :destroy, :update] do
        collection do
          delete :destroy_by_recipe
          delete :destroy_checked
        end
      end
    end
  end
end
