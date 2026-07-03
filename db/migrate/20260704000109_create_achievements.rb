class CreateAchievements < ActiveRecord::Migration[8.1]
  def change
    create_table :achievements do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.string :description
      t.string :icon
      t.integer :xp_reward, null: false, default: 0

      t.timestamps
    end

    add_index :achievements, :code, unique: true
  end
end
