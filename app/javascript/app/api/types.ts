export type Role = "member" | "host"

export interface User {
  id: number
  email: string
  displayName: string
  avatarEmoji: string
  xpTotal: number
  level: number
  streakCount: number
  levelTitle: string
}

export interface ListSummary {
  id: number
  name: string
  emblemEmoji: string
  description: string | null
  joinCode: string
  coverColor: string | null
}

export interface Membership {
  role: Role
  xpInList: number
}

export interface JoinResponse {
  user: User
  list: ListSummary & { membership: Membership }
  isNewUser: boolean
}

export interface IdentifyResponse {
  user: User
  isNewUser: boolean
}

export interface MembershipWithList extends Membership {
  list: ListSummary & { progress: { total: number; done: number } }
}

export interface MeResponse {
  user: User
  memberships: MembershipWithList[]
  stats: { questsCount: number; clearedCount: number; badgesCount: number }
}

export interface JoinInput {
  email: string
  join_code: string
  password: string
  display_name?: string
  avatar_emoji?: string
  time_zone?: string
}

export interface IdentifyInput {
  email: string
  display_name?: string
  avatar_emoji?: string
  time_zone?: string
}

export interface TagInput {
  name: string
  emoji: string
  color: string
}

export interface CreateQuestInput {
  name: string
  emblem_emoji: string
  password: string
  description?: string
  template_key?: string
  tags?: TagInput[]
}

export type Priority = "low" | "high" | "epic"
export type Status = "open" | "done"

export interface MiniUser {
  id: number
  displayName: string
  avatarEmoji: string
  level: number
}

export interface Tag {
  id: number
  name: string
  emoji: string | null
  color: string | null
  objectivesCount?: number | null
}

export interface LootLink {
  id: number
  url: string
  title: string
  kind: "buy" | "reference"
  priceCents: number | null
  currency: string
  imageUrl: string | null
  objectiveId: number
}

export interface Objective {
  id: number
  listId: number
  title: string
  description: string | null
  emoji: string | null
  dueOn: string | null
  priority: Priority
  status: Status
  position: number
  completedAt: string | null
  potentialXp: number
  awardedXp: number | null
  assignee: MiniUser | null
  completer: MiniUser | null
  tags: Tag[]
  lootLinks: LootLink[]
}

export interface Member extends MiniUser {
  role: Role
  xpInList: number
  doneCount: number
}

export interface QuestProgress {
  total: number
  done: number
}

export interface QuestCardData {
  role: Role
  xpInList: number
  list: ListSummary & { progress: QuestProgress; members: MiniUser[] }
}

export interface QuestDetail extends ListSummary {
  progress: QuestProgress
  membersCount: number
  role: Role
}

export interface CreateObjectiveInput {
  title: string
  description?: string
  due_on?: string
  priority?: Priority
  assignee_id?: number
  tag_ids?: number[]
}

export interface ObjectiveFilters {
  tag?: number
  status?: Status
  due?: "soon"
}

export interface Comment {
  id: number
  body: string
  objectiveId: number
  createdAt: string
  user: MiniUser
}

export interface ObjectiveDetail extends Objective {
  comments: Comment[]
}

export interface LootLinkPreview {
  title: string | null
  imageUrl: string | null
  priceCents: number | null
}

export interface CreateLootLinkInput {
  url: string
  kind: "buy" | "reference"
  title?: string
  price_cents?: number
  currency?: string
  image_url?: string
}

export interface Badge {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
  xpReward: number
}

export interface AchievementCatalogItem extends Badge {
  earned: boolean
  earnedAt: string | null
  progress: { current: number; target: number } | null
}

export interface LeaderboardRow extends MiniUser {
  rank: number
  role: Role
  xpInList: number
  doneCount: number
}

export interface CompleteResult {
  objective: ObjectiveDetail
  xpAwarded: number
  xpTotal: number
  level: number
  leveledUp: boolean
  newAchievements: Badge[]
}

export interface ActivityItem {
  id: number
  action: string
  createdAt: string
  meta: Record<string, unknown>
  user: MiniUser
  target: { type: string | null; id: number | null; label: string | null }
}
