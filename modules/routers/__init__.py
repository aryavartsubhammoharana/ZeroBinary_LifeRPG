"""
LifeRPG Extension Routers
"""
from .profile import router as profile_router
from .quests_ext import router as quests_ext_router
from .inventory import router as inventory_router
from .shop_rpg import router as shop_rpg_router
from .leaderboard import router as leaderboard_router
from .rewards import router as rewards_router

__all__ = [
    "profile_router",
    "quests_ext_router",
    "inventory_router",
    "shop_rpg_router",
    "leaderboard_router",
    "rewards_router",
]
