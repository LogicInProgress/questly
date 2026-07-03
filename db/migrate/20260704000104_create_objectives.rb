class CreateObjectives < ActiveRecord::Migration[8.1]
  def change
    create_table :objectives do |t|
      t.references :list, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :emoji
      t.date :due_on
      t.integer :priority, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.references :assignee, foreign_key: { to_table: :users }
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :completed_by, foreign_key: { to_table: :users }
      t.datetime :completed_at
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :objectives, [ :list_id, :status ]
    add_index :objectives, [ :list_id, :position ]
    add_index :objectives, :due_on
  end
end
