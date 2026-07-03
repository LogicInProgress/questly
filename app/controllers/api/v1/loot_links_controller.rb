module Api
  module V1
    class LootLinksController < BaseController
      before_action :set_objective, only: [ :create ]
      before_action :set_loot_link, only: [ :update, :destroy ]

      # POST /api/v1/objectives/:objective_id/loot_links
      def create
        link = @objective.loot_links.create!(loot_link_params)
        LootLinkFetchJob.perform_later(link.id) if link.title.blank?
        Activity.create!(list: @objective.list, user: current_user, action: "loot_link.created", target: link)
        ListBroadcaster.loot_link_created(link, actor: current_user)

        render json: { lootLink: LootLinkResource.new(link).serializable_hash }, status: :created
      end

      # PATCH /api/v1/loot_links/:id
      def update
        @loot_link.update!(loot_link_params)
        ListBroadcaster.loot_link_updated(@loot_link)
        render json: { lootLink: LootLinkResource.new(@loot_link).serializable_hash }
      end

      # DELETE /api/v1/loot_links/:id
      def destroy
        @loot_link.destroy!
        head :no_content
      end

      # POST /api/v1/loot_links/preview — live preview for the add sheet (S10).
      def preview
        result = LinkPreview.fetch(params[:url].to_s)
        render json: { title: result.title, imageUrl: result.image_url, priceCents: result.price_cents }
      end

      private

      def set_objective
        @objective = Objective.find(params[:objective_id])
        require_membership_in!(@objective.list)
      end

      def set_loot_link
        @loot_link = LootLink.find(params[:id])
        require_membership_in!(@loot_link.objective.list)
      end

      def loot_link_params
        params.permit(:url, :title, :kind, :price_cents, :currency, :image_url)
      end
    end
  end
end
