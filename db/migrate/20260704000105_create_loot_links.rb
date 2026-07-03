class CreateLootLinks < ActiveRecord::Migration[8.1]
  def change
    create_table :loot_links do |t|
      t.references :objective, null: false, foreign_key: true
      t.string :url, null: false
      t.string :title
      t.integer :kind, null: false, default: 0
      t.integer :price_cents
      t.string :currency, null: false, default: "INR"
      t.string :image_url

      t.timestamps
    end
  end
end
