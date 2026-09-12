from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import auth
from database import get_db
from modules.models_ext import UserProfile
from modules.schemas import LeaderboardEntry

router = APIRouter(prefix="/api/leaderboard", tags=["RPG Leaderboard"])


@router.get("", response_model=List[LeaderboardEntry])
def get_leaderboard(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """View the global player ranking sorted by XP and Level."""
    profiles = (
        db.query(UserProfile, models.User)
        .join(models.User, UserProfile.user_id == models.User.id)
        .order_by(UserProfile.level.desc(), UserProfile.xp.desc())
        .limit(min(100, max(1, limit)))
        .all()
    )

    results = []
    for rank, (profile, user) in enumerate(profiles, start=1):
        results.append(
            LeaderboardEntry(
                rank=rank,
                username=user.username,
                name=user.name or user.username,
                level=profile.level,
                xp=profile.xp,
                title=profile.title,
                streak=profile.streak
            )
        )

    return results
