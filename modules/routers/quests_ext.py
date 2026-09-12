from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

import models
import auth
from database import get_db
from modules.models_ext import QuestHistory
from modules.progression import (
    get_or_create_profile,
    update_streak,
    calculate_streak_bonus,
    calculate_coin_reward,
    calculate_level,
    get_rank_title,
    check_and_award_achievements,
    classify_quest,
    calculate_attribute_gain,
)
from modules.schemas import (
    QuestClaimResponse,
    QuestSummaryResponse,
    UnlockedAchievement,
    QuestHistoryResponse,
)

router = APIRouter(prefix="/api/quests", tags=["RPG Quests & Claims"])


@router.post("/{quest_id}/claim", response_model=QuestClaimResponse)
def claim_quest(
    quest_id: int,
    attribute: Optional[str] = Query(None, description="Optional manual attribute override: strength, knowledge, vitality, willpower"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Complete a quest and claim rewards:
    - Analyzes quest content: Gym -> Strength increase, Study -> Knowledge increase, etc.
    - Calculates base XP + Streak bonus XP
    - Awards RPG coins
    - Recalculates player level and detects level-ups
    - Unlocks eligible achievements
    - Logs immutable historical transaction in QuestHistory
    """
    quest = db.query(models.Quest).filter(
        models.Quest.id == quest_id,
        models.Quest.owner_id == current_user.id
    ).first()

    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")

    if quest.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quest already completed"
        )

    # 1. Mark quest completed
    quest.completed = True

    # 2. Get profile and calculate streak
    profile = get_or_create_profile(db, current_user.id)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    new_streak, _ = update_streak(profile.last_quest_date, today_str, profile.streak)
    profile.streak = new_streak
    profile.last_quest_date = today_str

    # 3. Classify attribute and compute attribute gain
    attr_type = classify_quest(quest.title, quest.description or "", attribute)
    base_xp = quest.xp_reward or 10
    attr_gain = calculate_attribute_gain(base_xp)

    # Apply attribute gain to profile
    if attr_type == "strength":
        profile.strength = getattr(profile, "strength", 10) + attr_gain
    elif attr_type == "knowledge":
        profile.knowledge = getattr(profile, "knowledge", 10) + attr_gain
    elif attr_type == "vitality":
        profile.vitality = getattr(profile, "vitality", 10) + attr_gain
    else:
        profile.willpower = getattr(profile, "willpower", 10) + attr_gain

    # 4. Calculate rewards
    streak_bonus_pct = calculate_streak_bonus(profile.streak)
    bonus_xp = int(base_xp * streak_bonus_pct)
    total_xp = base_xp + bonus_xp
    coins_awarded = calculate_coin_reward(base_xp)

    # 5. Update profile progression stats
    prev_level = profile.level
    profile.xp += total_xp
    profile.coins += coins_awarded
    profile.completed_quests_count += 1

    new_level = calculate_level(profile.xp)
    profile.level = new_level
    profile.title = get_rank_title(new_level)
    leveled_up = new_level > prev_level

    # 6. Check milestones
    new_achievements = check_and_award_achievements(db, current_user.id, profile)

    # 7. Write immutable audit history log
    history_entry = QuestHistory(
        user_id=current_user.id,
        quest_id=quest.id,
        quest_title=quest.title,
        attribute_type=attr_type,
        attribute_gain=attr_gain,
        xp_awarded=total_xp,
        coins_awarded=coins_awarded,
        completed_at=datetime.utcnow()
    )
    db.add(history_entry)

    db.commit()
    db.refresh(quest)
    db.refresh(profile)

    return QuestClaimResponse(
        quest_id=quest.id,
        title=quest.title,
        base_xp=base_xp,
        streak_bonus_xp=bonus_xp,
        total_xp_awarded=total_xp,
        coins_awarded=coins_awarded,
        new_level=new_level,
        leveled_up=leveled_up,
        streak=profile.streak,
        unlocked_achievements=[UnlockedAchievement(**a) for a in new_achievements],
        attribute_type=attr_type,
        attribute_gain=attr_gain,
        new_strength=profile.strength,
        new_knowledge=profile.knowledge,
        new_vitality=profile.vitality,
        new_willpower=profile.willpower
    )


@router.get("/history", response_model=List[QuestHistoryResponse])
def get_quest_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Retrieve the player's historical log of completed quests and attribute gains."""
    history = db.query(QuestHistory).filter(
        QuestHistory.user_id == current_user.id
    ).order_by(QuestHistory.completed_at.desc()).limit(min(100, max(1, limit))).all()

    return history


@router.get("/summary", response_model=QuestSummaryResponse)
def get_quest_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Provides quest completion metrics and XP breakdown for the player."""
    user_quests = db.query(models.Quest).filter(models.Quest.owner_id == current_user.id).all()
    total = len(user_quests)
    completed = sum(1 for q in user_quests if q.completed)
    active = total - completed
    rate = round((completed / total * 100), 1) if total > 0 else 0.0
    total_xp = sum((q.xp_reward or 0) for q in user_quests if q.completed)

    return QuestSummaryResponse(
        total_quests=total,
        completed_quests=completed,
        active_quests=active,
        completion_rate_pct=rate,
        total_xp_earned=total_xp
    )
