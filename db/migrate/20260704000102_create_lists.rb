class CreateLists < ActiveRecord::Migration[8.1]
  def change
    create_table :lists do |t|
      t.string :name, null: false
      t.string :emblem_emoji, null: false
      t.text :description
      t.string :join_code, null: false
      t.string :password_digest, null: false
      t.string :cover_color
      t.references :created_by, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :lists, :join_code, unique: true
  end
end
