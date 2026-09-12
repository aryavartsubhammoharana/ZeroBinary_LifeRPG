"""
LifeRPG Database Seeder
Populates initial RPG shop items and creates required tables.
Safe to run multiple times (idempotent).
"""
import os
import sys

from database import engine, SessionLocal
import models
from modules import models_ext

# Create all tables (both foundation and extended)
models.Base.metadata.create_all(bind=engine)
models_ext.Base.metadata.create_all(bind=engine)

DEFAULT_SHOP_ITEMS = [
    {
        "name": "Lesser Health Potion",
        "description": "Restores vitality and focus after an exhausting work session. Grants +30 XP on use.",
        "cost": 15
    },
    {
        "name": "Elixir of Deep Focus",
        "description": "Brewed for intense productivity blocks. Grants +30 XP on use.",
        "cost": 30
    },
    {
        "name": "Iron Sword of Habit",
        "description": "A sturdy blade forged through unbroken consistency and daily discipline.",
        "cost": 100
    },
    {
        "name": "Dragon Scale Armor",
        "description": "Legendary armor that protects against the fires of procrastination.",
        "cost": 250
    },
    {
        "name": "Scroll of Time Mastery",
        "description": "An ancient tome revealing secrets of chronological efficiency. Grants +100 XP on use.",
        "cost": 450
    },
    {
        "name": "Crown of the LifeRPG Champion",
        "description": "The ultimate prestige item for players who have conquered their daily goals.",
        "cost": 1000
    }
]


def seed():
    db = SessionLocal()
    try:
        print("[*] Checking LifeRPG Shop Catalog...")
        added_count = 0
        for item_data in DEFAULT_SHOP_ITEMS:
            existing = db.query(models.ShopItem).filter(
                models.ShopItem.name == item_data["name"]
            ).first()
            if not existing:
                new_item = models.ShopItem(
                    name=item_data["name"],
                    description=item_data["description"],
                    cost=item_data["cost"]
                )
                db.add(new_item)
                added_count += 1
                print(f"  + Added: '{item_data['name']}' ({item_data['cost']} coins)")

        db.commit()
        if added_count > 0:
            print(f"[+] Successfully seeded {added_count} new shop items!")
        else:
            print("[+] Shop catalog is already up to date.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
