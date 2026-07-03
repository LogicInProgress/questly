# Creates a quest: the list, the creator's host membership, template tags/objectives,
# and any starter tags. Runs in a transaction so a quest is all-or-nothing.
class QuestCreator
  TEMPLATE_DIR = Rails.root.join("db/templates")

  Result = Struct.new(:list, :membership, keyword_init: true)

  def initialize(user:, params:)
    @user = user
    @params = params
  end

  def call
    ActiveRecord::Base.transaction do
      list = List.create!(
        name: @params[:name],
        emblem_emoji: @params[:emblem_emoji],
        description: @params[:description],
        cover_color: @params[:cover_color],
        password: @params[:password],
        creator: @user
      )
      membership = list.memberships.create!(user: @user, role: :host)

      apply_template(list)
      create_starter_tags(list)

      Activity.create!(list: list, user: @user, action: "quest.created", target: list)

      Result.new(list: list, membership: membership)
    end
  end

  private

  def apply_template(list)
    template = load_template(@params[:template_key])
    return unless template

    tags_by_name = {}
    Array(template[:tags]).each do |tag|
      tags_by_name[tag[:name]] = list.tags.create!(name: tag[:name], emoji: tag[:emoji], color: tag[:color])
    end

    Array(template[:objectives]).each_with_index do |obj, index|
      objective = list.objectives.create!(
        title: obj[:title],
        priority: (obj[:priority] || "low").to_s,
        creator: @user,
        position: index
      )
      tag = tags_by_name[obj[:tag]]
      objective.tags << tag if tag
    end
  end

  # Accepts tags as [{name, emoji, color}] (matches the S04 emoji pills).
  # Skips names already created by the template.
  def create_starter_tags(list)
    Array(@params[:tags]).each do |tag|
      name = tag[:name].to_s.strip
      next if name.blank?
      next if list.tags.exists?([ "lower(name) = ?", name.downcase ])

      list.tags.create!(name: name, emoji: tag[:emoji], color: tag[:color])
    end
  end

  def load_template(key)
    return if key.blank?

    path = TEMPLATE_DIR.join("#{key}.yml")
    return unless path.exist? && path.to_s.start_with?(TEMPLATE_DIR.to_s)

    YAML.safe_load_file(path, symbolize_names: true)
  end
end
