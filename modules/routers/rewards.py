from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import auth
from database import get_db
from modules.models_ext import CustomReward
from modules.progression import get_or_create_profile
from modules.schemas import (
    CustomRewardCreate,
    CustomRewardResponse,
    CustomRewardRedeemResponse,
)

router = APIRouter(prefix="/api/rewards", tags=["Real-World & Custom Rewards"])


@router.get("/custom", response_model=List[CustomRewardResponse])
def list_custom_rewards(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """List all user-defined real-world rewards and live affordability."""
    profile = get_or_create_profile(db, current_user.id)
    rewards = db.query(CustomReward).filter(
        CustomReward.user_id == current_user.id
    ).order_by(CustomReward.cost_coins.asc()).all()

    return [
        CustomRewardResponse(
            id=r.id,
            title=r.title,
            description=r.description or "",
            cost_coins=r.cost_coins,
            icon=r.icon or "🎁",
            redeemed_count=r.redeemed_count,
            can_afford=profile.coins >= r.cost_coins
        )
        for r in rewards
    ]


@router.post("/custom", response_model=CustomRewardResponse, status_code=status.HTTP_201_CREATED)
def create_custom_reward(
    payload: CustomRewardCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new custom real-world reward (e.g., '1 Hour Video Games', 100 Coins)."""
    if payload.cost_coins <= 0:
        raise HTTPException(status_code=400, detail="Reward cost must be greater than 0")

    profile = get_or_create_profile(db, current_user.id)
    new_reward = CustomReward(
        user_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        cost_coins=payload.cost_coins,
        icon=payload.icon or "🎁"
    )
    db.add(new_reward)
    db.commit()
    db.refresh(new_reward)

    return CustomRewardResponse(
        id=new_reward.id,
        title=new_reward.title,
        description=new_reward.description or "",
        cost_coins=new_reward.cost_coins,
        icon=new_reward.icon or "🎁",
        redeemed_count=new_reward.redeemed_count,
        can_afford=profile.coins >= new_reward.cost_coins
    )


@router.post("/custom/{reward_id}/redeem", response_model=CustomRewardRedeemResponse)
def redeem_custom_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Redeem a real-world reward by spending earned RPG coins."""
    reward = db.query(CustomReward).filter(
        CustomReward.id == reward_id,
        CustomReward.user_id == current_user.id
    ).first()

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    profile = get_or_create_profile(db, current_user.id)
    if profile.coins < reward.cost_coins:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient coins. Requires {reward.cost_coins} coins, you have {profile.coins}."
        )

    # Deduct coins and increment redemption count
    profile.coins -= reward.cost_coins
    reward.redeemed_count += 1

    db.commit()
    db.refresh(profile)
    db.refresh(reward)

    return CustomRewardRedeemResponse(
        message=f"Enjoy your reward: '{reward.title}'! You earned it through real-world consistency.",
        reward_title=reward.title,
        cost_coins=reward.cost_coins,
        remaining_coins=profile.coins,
        total_redeemed=reward.redeemed_count
    )


@router.delete("/custom/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a custom reward."""
    reward = db.query(CustomReward).filter(
        CustomReward.id == reward_id,
        CustomReward.user_id == current_user.id
    ).first()

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    db.delete(reward)
    db.commit()
