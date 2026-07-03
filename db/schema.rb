# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_04_000111) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "citext"
  enable_extension "pg_catalog.plpgsql"

  create_table "achievements", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "description"
    t.string "icon"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.integer "xp_reward", default: 0, null: false
    t.index ["code"], name: "index_achievements_on_code", unique: true
  end

  create_table "activities", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.bigint "list_id", null: false
    t.jsonb "meta", default: {}, null: false
    t.bigint "target_id"
    t.string "target_type"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["list_id", "created_at"], name: "index_activities_on_list_id_and_created_at", order: { created_at: :desc }
    t.index ["list_id"], name: "index_activities_on_list_id"
    t.index ["target_type", "target_id"], name: "index_activities_on_target_type_and_target_id"
    t.index ["user_id"], name: "index_activities_on_user_id"
  end

  create_table "comments", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.bigint "objective_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["objective_id"], name: "index_comments_on_objective_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "lists", force: :cascade do |t|
    t.string "cover_color"
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.string "emblem_emoji", null: false
    t.string "join_code", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_lists_on_created_by_id"
    t.index ["join_code"], name: "index_lists_on_join_code", unique: true
  end

  create_table "loot_links", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "currency", default: "INR", null: false
    t.string "image_url"
    t.integer "kind", default: 0, null: false
    t.bigint "objective_id", null: false
    t.integer "price_cents"
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.index ["objective_id"], name: "index_loot_links_on_objective_id"
  end

  create_table "memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "joined_at", null: false
    t.bigint "list_id", null: false
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.integer "xp_in_list", default: 0, null: false
    t.index ["list_id", "user_id"], name: "index_memberships_on_list_id_and_user_id", unique: true
    t.index ["list_id"], name: "index_memberships_on_list_id"
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "objective_tags", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "objective_id", null: false
    t.bigint "tag_id", null: false
    t.datetime "updated_at", null: false
    t.index ["objective_id", "tag_id"], name: "index_objective_tags_on_objective_id_and_tag_id", unique: true
    t.index ["objective_id"], name: "index_objective_tags_on_objective_id"
    t.index ["tag_id"], name: "index_objective_tags_on_tag_id"
  end

  create_table "objectives", force: :cascade do |t|
    t.bigint "assignee_id"
    t.datetime "completed_at"
    t.bigint "completed_by_id"
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.date "due_on"
    t.string "emoji"
    t.bigint "list_id", null: false
    t.integer "position", default: 0, null: false
    t.integer "priority", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["assignee_id"], name: "index_objectives_on_assignee_id"
    t.index ["completed_by_id"], name: "index_objectives_on_completed_by_id"
    t.index ["created_by_id"], name: "index_objectives_on_created_by_id"
    t.index ["due_on"], name: "index_objectives_on_due_on"
    t.index ["list_id", "position"], name: "index_objectives_on_list_id_and_position"
    t.index ["list_id", "status"], name: "index_objectives_on_list_id_and_status"
    t.index ["list_id"], name: "index_objectives_on_list_id"
  end

  create_table "tags", force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.string "emoji"
    t.bigint "list_id", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["list_id", "name"], name: "index_tags_on_list_id_and_name", unique: true
    t.index ["list_id"], name: "index_tags_on_list_id"
  end

  create_table "user_achievements", force: :cascade do |t|
    t.bigint "achievement_id", null: false
    t.datetime "created_at", null: false
    t.datetime "earned_at", null: false
    t.bigint "list_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["achievement_id"], name: "index_user_achievements_on_achievement_id"
    t.index ["list_id"], name: "index_user_achievements_on_list_id"
    t.index ["user_id", "achievement_id"], name: "index_user_achievements_on_user_id_and_achievement_id", unique: true
    t.index ["user_id"], name: "index_user_achievements_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_emoji", null: false
    t.datetime "created_at", null: false
    t.string "display_name", null: false
    t.citext "email", null: false
    t.date "last_active_on"
    t.integer "level", default: 1, null: false
    t.integer "streak_count", default: 0, null: false
    t.string "time_zone", default: "UTC", null: false
    t.datetime "updated_at", null: false
    t.integer "xp_total", default: 0, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "activities", "lists"
  add_foreign_key "activities", "users"
  add_foreign_key "comments", "objectives"
  add_foreign_key "comments", "users"
  add_foreign_key "lists", "users", column: "created_by_id"
  add_foreign_key "loot_links", "objectives"
  add_foreign_key "memberships", "lists"
  add_foreign_key "memberships", "users"
  add_foreign_key "objective_tags", "objectives"
  add_foreign_key "objective_tags", "tags"
  add_foreign_key "objectives", "lists"
  add_foreign_key "objectives", "users", column: "assignee_id"
  add_foreign_key "objectives", "users", column: "completed_by_id"
  add_foreign_key "objectives", "users", column: "created_by_id"
  add_foreign_key "tags", "lists"
  add_foreign_key "user_achievements", "achievements"
  add_foreign_key "user_achievements", "lists"
  add_foreign_key "user_achievements", "users"
end
