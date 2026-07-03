class CreateActivities < ActiveRecord::Migration[8.1]
  def change
    create_table :activities do |t|
      t.references :list, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :action, null: false
      t.string :target_type
      t.bigint :target_id
      t.jsonb :meta, null: false, default: {}

      t.timestamps
    end

    add_index :activities, [ :list_id, :created_at ], order: { created_at: :desc }
    add_index :activities, [ :target_type, :target_id ]
  end
end
