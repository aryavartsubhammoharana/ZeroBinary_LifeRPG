import math
from datetime import datetime, timedelta
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Session

from modules.models_ext import UserProfile, Achievement, QuestHistory


def xp_required_for_level(level: int) -> int:
    """Returns the cumulative XP required to reach the given level."""
    if level <= 1:
        return 0
    return int(100 * ((level - 1) ** 1.5))


def calculate_level(total_xp: int) -> int:
    """Calculates the current level based on cumulative XP."""
    if total_xp <= 0:
        return 1
    level = 1
    while xp_required_for_level(level + 1) <= total_xp:
        level += 1
    return level


def get_level_info(total_xp: int) -> Dict[str, Any]:
    """Provides a detailed breakdown of level progression."""
    level = calculate_level(total_xp)
    base_xp = xp_required_for_level(level)
    next_xp = xp_required_for_level(level + 1)
    xp_in_level = total_xp - base_xp
    xp_needed_for_level = next_xp - base_xp

    progress_pct = 0.0
    if xp_needed_for_level > 0:
        progress_pct = round((xp_in_level / xp_needed_for_level) * 100, 1)

    return {
        "level": level,
        "current_xp": total_xp,
        "base_xp_for_level": base_xp,
        "next_level_xp": next_xp,
        "xp_to_next_level": max(0, next_xp - total_xp),
        "progress_pct": min(100.0, max(0.0, progress_pct)),
        "rank_title": get_rank_title(level)
    }


def get_rank_title(level: int) -> str:
    """Returns a RPG title corresponding to player level."""
    if level < 5:
        return "Novice Adventurer"
    elif level < 10:
        return "Apprentice Slayer"
    elif level < 15:
        return "Dungeon Explorer"
    elif level < 25:
        return "Veteran Vanguard"
    elif level < 40:
        return "Master Tactician"
    else:
        return "Legendary Hero"


def classify_quest(title: str, description: str = "", explicit_attr: Optional[str] = None) -> str:
    """
    Classifies a quest into an RPG Attribute:
    - Gym / workout / athletic -> 'strength'
    - Study / reading / coding -> 'knowledge'
    - Cardio / endurance / health -> 'vitality'
    - Habits / focus / meditation -> 'willpower'
    """
    if explicit_attr and explicit_attr.lower() in ("strength", "knowledge", "vitality", "willpower"):
        return explicit_attr.lower()

    text = f"{title} {description}".lower()

    # 1. Strength keywords (Gym, lifting, weights, workout)
    strength_keywords = [
        "gym", "workout", "lift", "lifting", "bench", "squat", "deadlift",
        "pushup", "pullup", "dumbbell", "barbell", "weights", "muscle",
        "bicep", "chest", "calisthenics", "crossfit", "leg day", "arm day"
    ]
    if any(k in text for k in strength_keywords):
        return "strength"

    # 2. Knowledge keywords (Study, reading, coding, research)
    knowledge_keywords = [
        "study", "read", "reading", "book", "code", "coding", "algorithm",
        "python", "lecture", "math", "exam", "homework", "learn", "course",
        "research", "paper", "revision", "flashcard", "document", "debug"
    ]
    if any(k in text for k in knowledge_keywords):
        return "knowledge"

    # 3. Vitality keywords (Cardio, running, steps, endurance)
    vitality_keywords = [
        "run", "running", "jog", "walk", "walking", "cardio", "cycle",
        "cycling", "swim", "swimming", "stretch", "yoga", "hike", "stairs"
    ]
    if any(k in text for k in vitality_keywords):
        return "vitality"

    # Default to Willpower (Habits, focus, discipline, meditation)
    return "willpower"


def calculate_attribute_gain(xp_reward: int) -> int:
    """Calculates attribute points gained based on quest difficulty (minimum +1)."""
    return max(1, min(10, int(xp_reward / 25)))


def update_streak(last_date_str: str, today_str: str, current_streak: int) -> Tuple[int, bool]:
    if not last_date_str:
        return 1, True

    if last_date_str == today_str:
        return current_streak, False

    try:
        last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
        today = datetime.strptime(today_str, "%Y-%m-%d").date()
        delta_days = (today - last_date).days

        if delta_days == 1:
            return current_streak + 1, True
        elif delta_days > 1:
            return 1, True
        else:
            return current_streak, False
    except ValueError:
        return 1, True


def calculate_streak_bonus(streak: int) -> float:
    effective_streak = max(0, min(streak, 10))
    return round(effective_streak * 0.05, 2)


def calculate_coin_reward(xp_reward: int) -> int:
    return max(5, int(xp_reward * 0.5))


def get_or_create_profile(db: Session, user_id: int) -> UserProfile:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(
            user_id=user_id,
            xp=0,
            level=1,
            coins=50,
            streak=0,
            last_quest_date="",
            completed_quests_count=0,
            title=get_rank_title(1),
            strength=10,
            knowledge=10,
            vitality=10,
            willpower=10
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def check_and_award_achievements(db: Session, user_id: int, profile: UserProfile) -> List[Dict[str, Any]]:
    existing_achievements = {
        a.code for a in db.query(Achievement).filter(Achievement.user_id == user_id).all()
    }
    new_unlocked: List[Dict[str, Any]] = []

    milestones = [
        ("FIRST_QUEST", "First Blood", "Completed your very first quest!", 25, 10, profile.completed_quests_count >= 1),
        ("QUEST_5", "Adventurer in Training", "Completed 5 quests!", 50, 25, profile.completed_quests_count >= 5),
        ("QUEST_10", "Consistent Slayer", "Completed 10 quests!", 100, 50, profile.completed_quests_count >= 10),
        ("LEVEL_5", "Power Surge", "Reached Level 5!", 100, 30, profile.level >= 5),
        ("LEVEL_10", "Ascended Hero", "Reached Level 10!", 250, 100, profile.level >= 10),
        ("STREAK_3", "Streak Ignited", "Maintained a 3-day quest streak!", 50, 20, profile.streak >= 3),
        ("STREAK_7", "Unstoppable Momentum", "Maintained a 7-day quest streak!", 150, 75, profile.streak >= 7),
        ("RICH_ADVENTURER", "Coin Hoarder", "Amassed 200 or more coins!", 50, 0, profile.coins >= 200),
        ("IRON_WARRIOR", "Iron Body", "Reached 20+ Strength through workout quests!", 50, 25, getattr(profile, "strength", 10) >= 20),
        ("GRAND_SCHOLAR", "Grand Scholar", "Reached 20+ Knowledge through study quests!", 50, 25, getattr(profile, "knowledge", 10) >= 20),
        ("LOGIN_STREAK_3", "Committed Devotee", "Logged in 3 consecutive days!", 40, 20, getattr(profile, "login_streak", 0) >= 3),
        ("LOGIN_STREAK_7", "Unbroken Loyalty", "Logged in 7 consecutive days!", 120, 60, getattr(profile, "login_streak", 0) >= 7),
    ]

    for code, title, desc, reward_xp, reward_coins, condition in milestones:
        if condition and code not in existing_achievements:
            ach = Achievement(
                user_id=user_id,
                code=code,
                title=title,
                description=desc,
                reward_xp=reward_xp,
                reward_coins=reward_coins
            )
            db.add(ach)
            profile.xp += reward_xp
            profile.coins += reward_coins
            new_unlocked.append({
                "code": code,
                "title": title,
                "description": desc,
                "reward_xp": reward_xp,
                "reward_coins": reward_coins
            })

    if new_unlocked:
        profile.level = calculate_level(profile.xp)
        profile.title = get_rank_title(profile.level)
        db.commit()
        db.refresh(profile)

    return new_unlocked


LOGIN_STREAK_REWARDS = {
    1: {"xp": 25, "coins": 15, "desc": "Day 1: Journey Begins"},
    2: {"xp": 35, "coins": 20, "desc": "Day 2: Habit Forged"},
    3: {"xp": 50, "coins": 30, "desc": "Day 3: Focus Ignited"},
    4: {"xp": 70, "coins": 45, "desc": "Day 4: Iron Routine"},
    5: {"xp": 95, "coins": 60, "desc": "Day 5: Unshakable Will"},
    6: {"xp": 125, "coins": 80, "desc": "Day 6: Master in Training"},
    7: {"xp": 250, "coins": 150, "desc": "Day 7: Weekly Jackpot! +Free Health Potion"},
}


def claim_daily_login_reward(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Evaluates and claims the daily login reward streak:
    - Increments streak if consecutive day
    - Resets to 1 if day was skipped
    - Grants XP, Gold, and potential milestone items
    """
    from modules.models_ext import InventoryItem

    profile = get_or_create_profile(db, user_id)
    today = datetime.utcnow().date()
    today_str = today.strftime("%Y-%m-%d")

    last_login = getattr(profile, "last_login_date", "")
    if last_login == today_str:
        cycle_day = ((profile.login_streak - 1) % 7) + 1
        return {
            "already_claimed": True,
            "login_streak": profile.login_streak,
            "cycle_day": cycle_day,
            "message": f"Daily reward already claimed today! Your streak is {profile.login_streak} days. Return tomorrow for Day {((cycle_day % 7) + 1)} rewards!",
            "xp_awarded": 0,
            "coins_awarded": 0,
            "new_level": profile.level,
            "leveled_up": False,
            "unlocked_achievements": []
        }

    # Calculate streak transition
    if not last_login:
        new_streak = 1
    else:
        try:
            last_date = datetime.strptime(last_login, "%Y-%m-%d").date()
            delta = (today - last_date).days
            if delta == 1:
                new_streak = getattr(profile, "login_streak", 0) + 1
            else:
                new_streak = 1  # Streak broken, reset
        except ValueError:
            new_streak = 1

    profile.login_streak = new_streak
    profile.last_login_date = today_str
    if new_streak > getattr(profile, "highest_login_streak", 0):
        profile.highest_login_streak = new_streak

    # 7-day cyclical rewards
    cycle_day = ((new_streak - 1) % 7) + 1
    reward = LOGIN_STREAK_REWARDS.get(cycle_day, {"xp": 25, "coins": 15, "desc": "Daily Bonus"})

    prev_level = profile.level
    profile.xp += reward["xp"]
    profile.coins += reward["coins"]
    new_level = calculate_level(profile.xp)
    profile.level = new_level
    profile.title = get_rank_title(new_level)
    leveled_up = new_level > prev_level

    # Day 7 bonus: Grant free Health Potion
    if cycle_day == 7:
        potion = InventoryItem(
            user_id=user_id,
            name="Lesser Health Potion",
            description="Granted by Day 7 Login Jackpot. Restores vitality & +30 XP.",
            quantity=1,
            category="consumable"
        )
        db.add(potion)

    # Check achievements (e.g. 3-day or 7-day login streak)
    new_achievements = check_and_award_achievements(db, user_id, profile)

    db.commit()
    db.refresh(profile)

    return {
        "already_claimed": False,
        "login_streak": profile.login_streak,
        "cycle_day": cycle_day,
        "reward_desc": reward["desc"],
        "xp_awarded": reward["xp"],
        "coins_awarded": reward["coins"],
        "new_level": new_level,
        "leveled_up": leveled_up,
        "message": f"Claimed Day {cycle_day} Daily Login Bonus! (+{reward['xp']} XP, +{reward['coins']} Gold)",
        "unlocked_achievements": new_achievements
    }
