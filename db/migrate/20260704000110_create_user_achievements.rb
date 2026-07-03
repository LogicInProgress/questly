class CreateUserAchievements < ActiveRecord::Migration[8.1]
  def change
    create_table :user_achievements do |t|
      t.references :user, null: false, foreign_key: true
      t.references :achievement, null: false, foreign_key: true
      t.references :list, foreign_key: true
      t.datetime :earned_at, null: false

      t.timestamps
    end

    add_index :user_achievements, [ :user_id, :achievement_id ], unique: true
  end
end
