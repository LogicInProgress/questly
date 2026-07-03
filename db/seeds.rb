# Idempotent seeds — safe to run repeatedly.
# Seeds the achievements catalog (static). Templates live as YAML in db/templates/
# and are applied at quest creation, not stored in a table.

ACHIEVEMENTS = [
  { code: "first_blood",  name: "First Blood",       description: "Complete your first objective.",                 icon: "🩸", xp_reward: 25 },
  { code: "speedrunner",  name: "Speedrunner",       description: "Complete 5 objectives before their due date.",   icon: "⚡", xp_reward: 50 },
  { code: "streak_7",     name: "7-Day Streak",      description: "Reach a 7-day completion streak.",               icon: "🔥", xp_reward: 75 },
  { code: "team_player",  name: "Team Player",       description: "Complete objectives in 3 different quests.",     icon: "🤝", xp_reward: 50 },
  { code: "sharpshooter", name: "Sharpshooter",      description: "Complete 10 high or epic objectives.",           icon: "🎯", xp_reward: 75 },
  { code: "completionist", name: "Completionist",    description: "Be in a quest when every objective is done.",    icon: "🏔️", xp_reward: 100 },
  { code: "night_owl",    name: "Night Owl",         description: "Complete an objective between 12am and 4am.",    icon: "🌙", xp_reward: 25 },
  { code: "xp_1000",      name: "Grand Adventurer",  description: "Reach 1,000 lifetime XP.",                       icon: "💎", xp_reward: 100 },
  { code: "quest_master", name: "Quest Master",      description: "Host a quest that reaches 100% completion.",     icon: "👑", xp_reward: 150 }
].freeze

ACHIEVEMENTS.each do |attrs|
  Achievement.find_or_initialize_by(code: attrs[:code]).update!(attrs)
end

puts "Seeded #{Achievement.count} achievements."
