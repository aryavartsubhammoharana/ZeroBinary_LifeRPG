from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import auth
from database import get_db
from modules.models_ext import InventoryItem, UserProfile
from modules.progression import get_or_create_profile, calculate_level, get_rank_title
from modules.schemas import InventoryItemResponse

router = APIRouter(prefix="/api/inventory", tags=["RPG Inventory"])


@router.get("", response_model=List[InventoryItemResponse])
def get_inventory(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """List all RPG equipment, potions, and collectibles owned by the current user."""
    items = db.query(InventoryItem).filter(
        InventoryItem.user_id == current_user.id
    ).order_by(InventoryItem.acquired_at.desc()).all()
    return items


@router.post("/{item_id}/use")
def use_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Use a consumable item from inventory to activate bonus effects."""
    item = db.query(InventoryItem).filter(
        InventoryItem.id == item_id,
        InventoryItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in your inventory"
        )

    profile = get_or_create_profile(db, current_user.id)
    bonus_xp = 0
    effect_msg = f"Used {item.name}!"

    # Apply special effects based on item name/category
    item_lower = item.name.lower()
    if "potion" in item_lower or "elixir" in item_lower:
        bonus_xp = 30
        profile.xp += bonus_xp
        new_lvl = calculate_level(profile.xp)
        profile.level = new_lvl
        profile.title = get_rank_title(new_lvl)
        effect_msg += f" Granted +{bonus_xp} XP!"
    elif "scroll" in item_lower:
        bonus_xp = 100
        profile.xp += bonus_xp
        new_lvl = calculate_level(profile.xp)
        profile.level = new_lvl
        profile.title = get_rank_title(new_lvl)
        effect_msg += f" Knowledge absorbed: +{bonus_xp} XP!"
    else:
        effect_msg += " Consumed item."

    if item.quantity > 1:
        item.quantity -= 1
    else:
        db.delete(item)

    db.commit()
    db.refresh(profile)

    return {
        "message": effect_msg,
        "bonus_xp": bonus_xp,
        "current_xp": profile.xp,
        "current_level": profile.level
    }
