Rails.application.routes.draw do
  # ▼ カスタムルートを先に書く（優先される）
  match '/omniauth/:provider/callback', to: 'auth/omniauth_callbacks#omniauth_success', via: [:get, :post]
  get '/omniauth/failure', to: 'auth/omniauth_callbacks#omniauth_failure'
  get '/omniauth/:provider', to: 'auth/omniauth_callbacks#passthru'
  # ▼ 後ろに移動
  mount_devise_token_auth_for 'User', at: 'auth',
    controllers: {
      sessions: 'auth/sessions',
      omniauth_callbacks: 'auth/omniauth_callbacks'
    }
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
  namespace :api do
    namespace :v1 do
      get 'users/me', to: 'users#me'
      get "health_check", to: "health_check#index"
      resources :users, only: [] do
        member do
          get :recipes
        end
      end
      resources :recipes, only: [:index, :create, :update, :destroy, :show,] do
        collection do
          post :generate
          get :published
        end
        member do
          patch :publish
        end
      end
    end
  end
end
