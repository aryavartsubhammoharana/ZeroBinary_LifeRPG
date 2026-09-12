"""
LifeRPG Extended Application Entrypoint
Mounts the modular RPG progression engine, inventory, daily quests, and economy
on top of the original FastAPI foundation without altering any previous code.
"""
import uvicorn
from database import engine
from modules import models_ext
from modules.routers import (
    profile_router,
    quests_ext_router,
    inventory_router,
    shop_rpg_router,
    leaderboard_router,
    rewards_router,
)
from seed import seed

# Import the original app intact
from main import app

# Ensure extension tables are initialized in the database
models_ext.Base.metadata.create_all(bind=engine)

# Update application metadata for OpenAPI documentation
app.title = "LifeRPG API (Enhanced with RPG Progression Engine)"
app.description = (
    "Complete Gamified Life Management Backend with Secure Auth, Quests CRUD, "
    "Level & XP Progression Engine, Coin Economy, Inventory, and Leaderboards."
)
app.version = "1.2.0"

# Mount modular RPG extension routers
app.include_router(profile_router)
app.include_router(quests_ext_router)
app.include_router(inventory_router)
app.include_router(shop_rpg_router)
app.include_router(leaderboard_router)
app.include_router(rewards_router)

from fastapi.responses import FileResponse


@app.get("/demo")
def demo_page():
    """Serves the interactive LifeRPG demo frontend."""
    return FileResponse("static/demo.html")


@app.on_event("startup")
def startup_event():
    """Seed initial shop items and ensure catalog readiness."""
    try:
        seed()
    except Exception as exc:
        print(f"[!] Warning: Startup seeding encountered: {exc}")


if __name__ == "__main__":
    uvicorn.run("extended_main:app", host="0.0.0.0", port=8000, reload=True)
