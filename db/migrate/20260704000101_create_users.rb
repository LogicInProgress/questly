class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    enable_extension "citext" unless extension_enabled?("citext")

    create_table :users do |t|
      t.citext :email, null: false
      t.string :display_name, null: false
      t.string :avatar_emoji, null: false
      t.integer :xp_total, null: false, default: 0
      t.integer :level, null: false, default: 1
      t.integer :streak_count, null: false, default: 0
      t.date :last_active_on
      t.string :time_zone, null: false, default: "UTC"

      t.timestamps
    end

    add_index :users, :email, unique: true
  end
end
