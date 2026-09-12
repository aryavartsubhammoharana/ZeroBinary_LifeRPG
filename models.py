from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    settings_data = Column(Text, default='{"reduced_motion":false,"sound_enabled":true,"theme":"retro_dark"}')

    items = relationship("Item", back_populates="owner")
    quests = relationship("Quest", back_populates="owner")
    character = relationship("Character", back_populates="owner", uselist=False)
    xp_transactions = relationship("XPTransaction", back_populates="user")
    gold_transactions = relationship("GoldTransaction", back_populates="user")
    completions = relationship("QuestCompletion", back_populates="user")
    inventory = relationship("InventoryItem", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")
    campaigns = relationship("Campaign", back_populates="user")
    build_xp_transactions = relationship("BuildXPTransaction", back_populates="user")

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    name = Column(String, default="Alex")
    title = Column(String, default="The Beginner")
    archetype = Column(String, default="WARRIOR") # WARRIOR, SCHOLAR, BUILDER, MONK, CREATOR
    gender = Column(String, default="M")
    lifestyle = Column(String, default="Balanced Lifestyle")
    style = Column(String, default="Casual")
    body_type = Column(String, default="Athletic")
    height = Column(String, default="Average")
    build = Column(String, default="Balanced")
    skin_color = Column(String, default="#f5c29a")
    face_shape = Column(String, default="Standard")
    eye_shape = Column(String, default="Standard")
    eye_color = Column(String, default="#4a2e18")
    eyebrows = Column(String, default="Default")
    nose_style = Column(String, default="Standard")
    mouth_style = Column(String, default="Smile")
    expression = Column(String, default="Confident")
    hair_category = Column(String, default="SHORT")
    hair_style = Column(String, default="Textured crop")
    hair_color = Column(String, default="#2c1a0e")
    hair_highlight = Column(String, default="#50301a")
    top_type = Column(String, default="Hoodie")
    top_color = Column(String, default="#2563eb")
    bottom_type = Column(String, default="Joggers")
    bottom_color = Column(String, default="#1e293b")
    shoes_type = Column(String, default="Sneakers")
    shoes_color = Column(String, default="#ffffff")
    jacket_color = Column(String, default="#0f172a")
    palette = Column(String, default="Royal")
    accessories = Column(String, default="[]")
    aura = Column(String, default="Energetic")
    pose = Column(String, default="Confident")
    companion = Column(String, default="None")
    gold = Column(Integer, default=1000)
    level = Column(Integer, default=1)

    xp = Column(Integer, default=0)
    health = Column(Integer, default=100)
    energy = Column(Integer, default=100)
    focus = Column(Integer, default=50)

    # 6 RPG Core Attributes
    strength = Column(Integer, default=10)
    intelligence = Column(Integer, default=10)
    discipline = Column(Integer, default=10)
    vitality = Column(Integer, default=10)
    creativity = Column(Integer, default=10)
    social = Column(Integer, default=10)

    # Legacy mappings (for backward compatibility)
    confidence = Column(Integer, default=10)
    wisdom = Column(Integer, default=10)
    knowledge = Column(Integer, default=15)
    fitness = Column(Integer, default=10)
    finance = Column(Integer, default=5)

    transportation = Column(String, default="Walk")
    journey_km = Column(Integer, default=0)
    current_zone = Column(String, default="Forest Road")
    streak_days = Column(Integer, default=1)
    best_streak = Column(Integer, default=1)
    last_active_date = Column(String, default="")
    construction_xp = Column(Integer, default=100)
    home_level = Column(Integer, default=1)
    home_xp = Column(Integer, default=0)
    home_data = Column(Text, default="{}")

    owner = relationship("User", back_populates="character")

class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, default="")
    category = Column(String, default="Habit") # Fitness, Study, Organization, Mindfulness, Creative, Social
    quest_type = Column(String, default="daily") # one_time, daily, habit, numeric, timer, milestone, campaign
    difficulty = Column(String, default="EASY") # EASY, NORMAL, HARD, EPIC, LEGENDARY
    stat_type = Column(String, default="discipline") # strength, intelligence, discipline, vitality, creativity, social
    stat_val = Column(Integer, default=2)
    xp_reward = Column(Integer, default=20)
    gold_reward = Column(Integer, default=10)
    target_value = Column(Integer, default=1)
    current_value = Column(Integer, default=0)
    duration_minutes = Column(Integer, default=25)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="quests")
    campaign = relationship("Campaign", back_populates="quests")

class QuestCompletion(Base):
    __tablename__ = "quest_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    quest_id = Column(Integer, ForeignKey("quests.id"), index=True)
    idempotency_key = Column(String, unique=True, index=True)
    xp_awarded = Column(Integer, default=0)
    gold_awarded = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="completions")

class XPTransaction(Base):
    __tablename__ = "xp_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Integer, nullable=False)
    source = Column(String, nullable=False) # QUEST_COMPLETION, ACHIEVEMENT, CAMPAIGN_MILESTONE, STREAK_BONUS, RECOVERY_QUEST
    source_id = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="xp_transactions")

class GoldTransaction(Base):
    __tablename__ = "gold_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Integer, nullable=False) # positive for earn, negative for spend
    source = Column(String, nullable=False) # QUEST_COMPLETION, SHOP_PURCHASE, BASE_BUILDING, ACHIEVEMENT
    source_id = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="gold_transactions")

class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    slug = Column(String, index=True)
    title = Column(String)
    description = Column(String)
    icon = Column(String, default="🏆")
    category = Column(String, default="General") # Quests, Building, Mastery, Consistency, Social
    rarity = Column(String, default="Common") # Common, Uncommon, Rare, Epic, Legendary
    xp_reward = Column(Integer, default=50)
    gold_reward = Column(Integer, default=25)
    progress = Column(Integer, default=0)
    max_progress = Column(Integer, default=1)
    unlocked = Column(Boolean, default=False)
    unlocked_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="achievements")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    item_slug = Column(String, index=True)
    name = Column(String)
    description = Column(String, default="")
    category = Column(String, default="clothing") # clothing, armor, furniture, blocks, pets, effects, badges
    rarity = Column(String, default="Common") # Common, Uncommon, Rare, Epic, Legendary
    price = Column(Integer, default=50)
    visual_asset = Column(String, default="")
    is_equipped = Column(Boolean, default=False)
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="inventory")

class ShopItem(Base):
    __tablename__ = "shop_items"

    id = Column(Integer, primary_key=True, index=True)
    item_slug = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(String, default="")
    category = Column(String, default="clothing") # clothing, armor, furniture, blocks, pets, effects
    rarity = Column(String, default="Common") # Common, Uncommon, Rare, Epic, Legendary
    cost = Column(Integer, default=50)
    icon = Column(String, default="📦")
    unlock_level = Column(Integer, default=1)
    stat_bonus = Column(String, default="{}") # e.g. {"discipline": 2}

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String)
    description = Column(String, default="")
    category = Column(String, default="Exam Prep")
    target_date = Column(String, default="")
    status = Column(String, default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, PAUSED
    progress_pct = Column(Integer, default=0)
    total_milestones = Column(Integer, default=4)
    completed_milestones = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="campaigns")
    milestones = relationship("CampaignMilestone", back_populates="campaign")
    quests = relationship("Quest", back_populates="campaign")

class CampaignMilestone(Base):
    __tablename__ = "campaign_milestones"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), index=True)
    title = Column(String)
    description = Column(String, default="")
    sequence = Column(Integer, default=1)
    xp_reward = Column(Integer, default=100)
    gold_reward = Column(Integer, default=50)
    build_xp_reward = Column(Integer, default=25)
    is_boss = Column(Boolean, default=False)
    requirements_json = Column(Text, default="[]")
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    campaign = relationship("Campaign", back_populates="milestones")

class BuildXPTransaction(Base):
    __tablename__ = "build_xp_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(Integer, nullable=False)
    source = Column(String, nullable=False) # BASE_BUILDING, QUEST_COMPLETION, CAMPAIGN_MILESTONE, FOCUS_SPRINT
    source_id = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="build_xp_transactions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, default="{}")
    ip_address = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="items")


