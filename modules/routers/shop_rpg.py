from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import auth
from database import get_db
from modules.models_ext import InventoryItem
from modules.progression import get_or_create_profile
from modules.schemas import ShopCatalogItemResponse, ShopBuyResponse

router = APIRouter(prefix="/api/shop", tags=["RPG Shop & Economy"])


@router.get("/catalog", response_model=List[ShopCatalogItemResponse])
def get_shop_catalog(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """List all available shop items with live affordability flags for the user."""
    profile = get_or_create_profile(db, current_user.id)
    items = db.query(models.ShopItem).all()

    return [
        ShopCatalogItemResponse(
            id=i.id,
            name=i.name,
            description=i.description or "",
            cost=i.cost,
            can_afford=profile.coins >= i.cost
        )
        for i in items
    ]


@router.post("/{item_id}/buy", response_model=ShopBuyResponse)
def buy_shop_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Purchase an item with earned RPG coins:
    - Validates coin balance
    - Deducts cost
    - Adds or stacks item into player inventory
    """
    item = db.query(models.ShopItem).filter(models.ShopItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop item not found"
        )

    profile = get_or_create_profile(db, current_user.id)
    if profile.coins < item.cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient coins. Item costs {item.cost} coins, but you only have {profile.coins}."
        )

    # Deduct coins
    profile.coins -= item.cost

    # Add to inventory (or stack if already owned)
    existing_inventory = db.query(InventoryItem).filter(
        InventoryItem.user_id == current_user.id,
        InventoryItem.shop_item_id == item.id
    ).first()

    category = "consumable" if any(k in item.name.lower() for k in ["potion", "elixir", "scroll"]) else "gear"

    if existing_inventory:
        existing_inventory.quantity += 1
    else:
        new_inv = InventoryItem(
            user_id=current_user.id,
            shop_item_id=item.id,
            name=item.name,
            description=item.description or "",
            quantity=1,
            category=category
        )
        db.add(new_inv)

    db.commit()
    db.refresh(profile)

    return ShopBuyResponse(
        message=f"Successfully purchased '{item.name}'!",
        item_id=item.id,
        item_name=item.name,
        cost=item.cost,
        remaining_coins=profile.coins
    )
