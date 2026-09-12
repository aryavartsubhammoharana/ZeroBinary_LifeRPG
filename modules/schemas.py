from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class UserProfileResponse(BaseModel):
    user_id: int
    username: str
    name: str
    level: int
    xp: int
    base_xp_for_level: int
    next_level_xp: int
    xp_to_next_level: int
    progress_pct: float
    coins: int
    streak: int
    completed_quests_count: int
    rank_title: str

    # RPG Attributes
    strength: int
    knowledge: int
    vitality: int
    willpower: int

    # Daily Login Streak System
    login_streak: int
    highest_login_streak: int
    daily_login_claimed_today: bool


class DailyLoginClaimResponse(BaseModel):
    already_claimed: bool
    login_streak: int
    cycle_day: int
    reward_desc: Optional[str] = None
    xp_awarded: int
    coins_awarded: int
    new_level: int
    leveled_up: bool
    message: str
    unlocked_achievements: List["UnlockedAchievement"]


class UnlockedAchievement(BaseModel):
    code: str
    title: str
    description: str
    reward_xp: int
    reward_coins: int


class QuestClaimResponse(BaseModel):
    quest_id: int
    title: str
    base_xp: int
    streak_bonus_xp: int
    total_xp_awarded: int
    coins_awarded: int
    new_level: int
    leveled_up: bool
    streak: int
    unlocked_achievements: List[UnlockedAchievement]

    # Attribute Rewards
    attribute_type: str
    attribute_gain: int
    new_strength: int
    new_knowledge: int
    new_vitality: int
    new_willpower: int


class QuestHistoryResponse(BaseModel):
    id: int
    quest_title: str
    attribute_type: str
    attribute_gain: int
    xp_awarded: int
    coins_awarded: int
    completed_at: datetime


class CustomRewardCreate(BaseModel):
    title: str
    description: str = ""
    cost_coins: int
    icon: str = "🎁"


class CustomRewardResponse(BaseModel):
    id: int
    title: str
    description: str
    cost_coins: int
    icon: str
    redeemed_count: int
    can_afford: bool


class CustomRewardRedeemResponse(BaseModel):
    message: str
    reward_title: str
    cost_coins: int
    remaining_coins: int
    total_redeemed: int


class InventoryItemResponse(BaseModel):
    id: int
    shop_item_id: Optional[int]
    name: str
    description: str
    quantity: int
    category: str
    acquired_at: datetime


class ShopCatalogItemResponse(BaseModel):
    id: int
    name: str
    description: str
    cost: int
    can_afford: bool


class ShopBuyResponse(BaseModel):
    message: str
    item_id: int
    item_name: str
    cost: int
    remaining_coins: int


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    name: str
    level: int
    xp: int
    title: str
    streak: int


class AchievementResponse(BaseModel):
    id: int
    code: str
    title: str
    description: str
    reward_xp: int
    reward_coins: int
    unlocked_at: datetime


class QuestSummaryResponse(BaseModel):
    total_quests: int
    completed_quests: int
    active_quests: int
    completion_rate_pct: float
    total_xp_earned: int
