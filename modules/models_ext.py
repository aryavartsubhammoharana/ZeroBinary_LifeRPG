from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    coins = Column(Integer, default=50, nullable=False)  # Starting bonus
    streak = Column(Integer, default=0, nullable=False)
    last_quest_date = Column(String, default="")  # YYYY-MM-DD string
    completed_quests_count = Column(Integer, default=0, nullable=False)
    title = Column(String, default="Novice Adventurer", nullable=False)

    # Core RPG Character Attributes
    strength = Column(Integer, default=10, nullable=False)     # Leveled up by gym/lifting/workout quests
    knowledge = Column(Integer, default=10, nullable=False)    # Leveled up by study/reading/coding quests
    vitality = Column(Integer, default=10, nullable=False)     # Leveled up by cardio/running/health quests
    willpower = Column(Integer, default=10, nullable=False)    # Leveled up by habits/focus/meditation quests

    # Daily Login Streak System
    login_streak = Column(Integer, default=0, nullable=False)
    last_login_date = Column(String, default="", nullable=False)  # YYYY-MM-DD
    highest_login_streak = Column(Integer, default=0, nullable=False)

    user = relationship("User")


class QuestHistory(Base):
    """Immutable audit log of completed quests and attributed stat rewards."""
    __tablename__ = "quest_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    quest_id = Column(Integer, nullable=True)
    quest_title = Column(String, nullable=False)
    attribute_type = Column(String, nullable=False)  # strength, knowledge, vitality, willpower
    attribute_gain = Column(Integer, default=1, nullable=False)
    xp_awarded = Column(Integer, nullable=False)
    coins_awarded = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class CustomReward(Base):
    """Real-world dopamine rewards defined by the player (e.g., Cheat Meal, 1hr Gaming)."""
    __tablename__ = "custom_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, default="")
    cost_coins = Column(Integer, nullable=False)
    icon = Column(String, default="🎁", nullable=False)
    redeemed_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    shop_item_id = Column(Integer, ForeignKey("shop_items.id"), nullable=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, default="")
    quantity = Column(Integer, default=1, nullable=False)
    category = Column(String, default="consumable", nullable=False)  # consumable, gear, scroll
    acquired_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    code = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, default="")
    reward_xp = Column(Integer, default=0)
    reward_coins = Column(Integer, default=0)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
