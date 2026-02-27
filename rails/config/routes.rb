Rails.application.routes.draw do
  mount_devise_token_auth_for 'User', at: 'auth',
    controllers: {
      sessions: 'auth/sessions'
  }
  
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
  
  namespace :api do
    namespace :v1 do
      get "health_check", to: "health_check#index"
      resources :recipes, only: [:index, :create]
    end
  end
end

