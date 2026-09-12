from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import auth
from database import get_db
from modules.models_ext import Achievement
from modules.progression import (
    get_or_create_profile,
    get_level_info,
    claim_daily_login_reward,
)
from modules.schemas import (
    UserProfileResponse,
    AchievementResponse,
    DailyLoginClaimResponse,
    UnlockedAchievement,
)

router = APIRouter(prefix="/api/profile", tags=["RPG Profile & Progression"])


@router.get("", response_model=UserProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Retrieve full RPG character profile, attributes, and level progression stats."""
    profile = get_or_create_profile(db, current_user.id)
    level_info = get_level_info(profile.xp)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    last_login = getattr(profile, "last_login_date", "")

    return UserProfileResponse(
        user_id=current_user.id,
        username=current_user.username,
        name=current_user.name,
        level=level_info["level"],
        xp=profile.xp,
        base_xp_for_level=level_info["base_xp_for_level"],
        next_level_xp=level_info["next_level_xp"],
        xp_to_next_level=level_info["xp_to_next_level"],
        progress_pct=level_info["progress_pct"],
        coins=profile.coins,
        streak=profile.streak,
        completed_quests_count=profile.completed_quests_count,
        rank_title=level_info["rank_title"],
        strength=getattr(profile, "strength", 10),
        knowledge=getattr(profile, "knowledge", 10),
        vitality=getattr(profile, "vitality", 10),
        willpower=getattr(profile, "willpower", 10),
        login_streak=getattr(profile, "login_streak", 0),
        highest_login_streak=getattr(profile, "highest_login_streak", 0),
        daily_login_claimed_today=(last_login == today_str)
    )


@router.post("/claim-daily-login", response_model=DailyLoginClaimResponse)
def claim_daily_login(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Claim daily login reward:
    - Increments daily login streak
    - Awards XP and Gold bonuses
    - Day 7 awards jackpot + free potion
    - Evaluates streak milestones
    """
    result = claim_daily_login_reward(db, current_user.id)
    return DailyLoginClaimResponse(
        already_claimed=result["already_claimed"],
        login_streak=result["login_streak"],
        cycle_day=result["cycle_day"],
        reward_desc=result.get("reward_desc"),
        xp_awarded=result["xp_awarded"],
        coins_awarded=result["coins_awarded"],
        new_level=result["new_level"],
        leveled_up=result["leveled_up"],
        message=result["message"],
        unlocked_achievements=[UnlockedAchievement(**a) for a in result["unlocked_achievements"]]
    )


@router.get("/achievements", response_model=List[AchievementResponse])
def get_achievements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """List all badges and achievements unlocked by the player."""
    achievements = db.query(Achievement).filter(
        Achievement.user_id == current_user.id
    ).order_by(Achievement.unlocked_at.desc()).all()
    return achievements
