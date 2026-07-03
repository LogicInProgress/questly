class CreateTags < ActiveRecord::Migration[8.1]
  def change
    create_table :tags do |t|
      t.references :list, null: false, foreign_key: true
      t.string :name, null: false
      t.string :emoji
      t.string :color

      t.timestamps
    end

    add_index :tags, [ :list_id, :name ], unique: true
  end
end
