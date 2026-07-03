class List < ApplicationRecord
  has_secure_password

  belongs_to :creator, class_name: "User", foreign_key: :created_by_id, inverse_of: :created_lists

  has_many :memberships, dependent: :destroy
  has_many :members, through: :memberships, source: :user
  has_many :objectives, dependent: :destroy
  has_many :tags, dependent: :destroy
  has_many :activities, dependent: :destroy

  validates :name, presence: true, length: { maximum: 80 }
  validates :emblem_emoji, presence: true
  validates :join_code, presence: true, uniqueness: true
  validates :password, length: { minimum: 4 }, allow_nil: true

  before_validation :assign_join_code, on: :create

  # Characters without ambiguous 0/O/1/I (spec §7).
  CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".chars.freeze

  # Routes use :code — deep links resolve by join_code.
  def to_param
    join_code
  end

  def host
    memberships.host.first&.user
  end

  private

  def assign_join_code
    return if join_code.present?

    self.join_code = loop do
      candidate = Array.new(7) { CODE_ALPHABET.sample }.join
      break candidate unless self.class.exists?(join_code: candidate)
    end
  end
end
