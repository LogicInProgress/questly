class CreateObjectiveTags < ActiveRecord::Migration[8.1]
  def change
    create_table :objective_tags do |t|
      t.references :objective, null: false, foreign_key: true
      t.references :tag, null: false, foreign_key: true

      t.timestamps
    end

    add_index :objective_tags, [ :objective_id, :tag_id ], unique: true
  end
end
