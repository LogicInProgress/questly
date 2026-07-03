# Serves the single HTML shell that boots the React SPA.
# Every non-API, non-cable path routes here (see config/routes.rb catch-all);
# React Router takes over client-side.
class AppController < ApplicationController
  def index
    render layout: false
  end
end
