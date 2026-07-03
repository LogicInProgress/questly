class CommentResource
  include Alba::Resource

  transform_keys :lower_camel

  attributes :id, :body, :objective_id, :created_at

  association :user, resource: MiniUserResource
end
