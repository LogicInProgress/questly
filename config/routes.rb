Rails.application.routes.draw do
  # Health check for load balancers / uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check

  # JSON API.
  namespace :api do
    namespace :v1 do
      # Auth / access
      post   "auth/join",     to: "auth#create"
      post   "auth/identify", to: "auth#identify"
      delete "auth/session",  to: "auth#destroy"
      post   "auth/verify",   to: "auth#verify"
      get    "me",             to: "me#show"
      patch  "me",             to: "me#update"
      get    "me/stats",       to: "me#stats"
      get    "me/achievements", to: "me#achievements"

      # Quests
      resources :lists, only: [ :index, :create, :show, :update, :destroy ], param: :code do
        member do
          get    :members,             to: "members#index"
          get    :leaderboard,         to: "leaderboard#index"
          delete :leave,               to: "lists#leave"
          delete "members/:user_id",   to: "members#destroy", as: :remove_member
        end
        resources :objectives, only: [ :index, :create ]
        resources :tags, only: [ :index, :create ]
        resources :activities, only: [ :index ]
      end

      # Objectives (shallow) + nested loot links / comments
      resources :objectives, only: [ :show, :update, :destroy ] do
        member do
          post :complete
          post :reopen
        end
        resources :loot_links, only: [ :create ]
        resources :comments, only: [ :index, :create ]
      end

      # Loot links
      post "loot_links/preview", to: "loot_links#preview"
      resources :loot_links, only: [ :update, :destroy ]

      # Comments / tags (shallow)
      resources :comments, only: [ :destroy ]
      resources :tags, only: [ :update, :destroy ]
    end
  end

  # Real-time WebSocket endpoint (authenticated by the session cookie).
  mount ActionCable.server => "/cable"

  # Catch-all: every non-API, non-cable, non-rails path serves the React shell
  # so deep links work; React Router takes over client-side.
  get "*path", to: "app#index",
      constraints: ->(req) { !req.path.start_with?("/api", "/cable", "/rails", "/up") }

  root "app#index"
end
