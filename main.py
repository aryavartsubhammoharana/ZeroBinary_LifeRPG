import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func, desc
from pydantic import BaseModel, EmailStr
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import models
import auth
from database import engine, get_db

# Create / Migrate SQLite Tables
models.Base.metadata.create_all(bind=engine)

def auto_migrate_db():
    from sqlalchemy import inspect
    try:
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names())
        with engine.connect() as conn:
            raw_conn = conn.connection
            cursor = raw_conn.cursor()
            for cls in models.Base.registry._class_registry.values():
                if not hasattr(cls, '__tablename__'):
                    continue
                table_name = cls.__tablename__
                if table_name not in existing_tables:
                    continue
                db_cols = {c['name'] for c in inspector.get_columns(table_name)}
                for col in cls.__table__.columns:
                    if col.name not in db_cols:
                        col_type_sql = col.type.compile(engine.dialect)
                        default_clause = ""
                        if col.server_default is not None:
                            default_clause = f" DEFAULT {col.server_default.arg}"
                        elif col.default is not None and col.default.is_scalar:
                            val = col.default.arg
                            if isinstance(val, str):
                                escaped_val = val.replace("'", "''")
                                default_clause = f" DEFAULT '{escaped_val}'"
                            elif isinstance(val, bool):
                                default_clause = " DEFAULT TRUE" if val else " DEFAULT FALSE"
                            elif isinstance(val, (int, float)):
                                default_clause = f" DEFAULT {val}"
                        alter_sql = f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type_sql}{default_clause};"
                        try:
                            cursor.execute(alter_sql)
                            raw_conn.commit()
                        except Exception:
                            raw_conn.rollback()
    except Exception as e:
        pass

auto_migrate_db()

IS_PRODUCTION = os.getenv("APP_ENV", "development").lower() == "production"
COOKIE_SAMESITE = "none" if IS_PRODUCTION else "lax"
COOKIE_SECURE = IS_PRODUCTION
CORS_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="LifeRPG Master API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

SPA_PATHS = {
    "/", "/world", "/quests", "/quest", "/campaigns", "/goals",
    "/home", "/base", "/leaderboard", "/rank", "/analytics",
    "/stats", "/hero", "/settings", "/login", "/register",
    "/customize", "/shop", "/achievements", "/coach"
}

@app.middleware("http")
async def spa_middleware(request: Request, call_next):
    if request.method == "GET":
        path = request.url.path.rstrip("/")
        if not path:
            path = "/"
        if path in SPA_PATHS:
            accept = request.headers.get("accept", "")
            if "text/html" in accept:
                return FileResponse("static/index.html")
    return await call_next(request)

@app.get("/")
@app.get("/world")
@app.get("/quest")
@app.get("/goals")
@app.get("/rank")
@app.get("/stats")
@app.get("/hero")
@app.get("/settings")
@app.get("/login")
@app.get("/register")
@app.get("/customize")
def read_root():
    return FileResponse("static/index.html")

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "LifeRPG Master Engine", "version": "2.0.0"}

# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str
    confirm_password: str

class QuestCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "Habit"
    quest_type: str = "daily" # one_time, daily, habit, numeric, timer, milestone, campaign
    difficulty: str = "EASY" # EASY, NORMAL, HARD, EPIC, LEGENDARY
    stat_type: str = "discipline" # strength, intelligence, discipline, vitality, creativity, social
    stat_val: int = 2
    xp_reward: int = 20
    gold_reward: int = 10
    target_value: int = 1
    duration_minutes: int = 25
    campaign_id: Optional[int] = None

class QuestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quest_type: Optional[str] = None
    difficulty: Optional[str] = None
    stat_type: Optional[str] = None
    stat_val: Optional[int] = None
    xp_reward: Optional[int] = None
    gold_reward: Optional[int] = None
    target_value: Optional[int] = None
    current_value: Optional[int] = None

class QuestCompletePayload(BaseModel):
    idempotency_key: Optional[str] = None

class QuestProgressPayload(BaseModel):
    increment: int = 1

class TimerCompletePayload(BaseModel):
    elapsed_seconds: int

class CharacterPayload(BaseModel):
    name: str = "Alex"
    title: str = "The Beginner"
    archetype: str = "WARRIOR"
    gender: str = "M"
    lifestyle: str = "Balanced Lifestyle"
    style: str = "Casual"
    body_type: str = "Athletic"
    height: str = "Average"
    build: str = "Balanced"
    skin_color: str = "#f5c29a"
    face_shape: str = "Standard"
    eye_shape: str = "Standard"
    eye_color: str = "#4a2e18"
    eyebrows: str = "Default"
    nose_style: str = "Standard"
    mouth_style: str = "Smile"
    expression: str = "Confident"
    hair_category: str = "SHORT"
    hair_style: str = "Textured crop"
    hair_color: str = "#2c1a0e"
    hair_highlight: str = "#50301a"
    top_type: str = "Hoodie"
    top_color: str = "#2563eb"
    bottom_type: str = "Joggers"
    bottom_color: str = "#1e293b"
    shoes_type: str = "Sneakers"
    shoes_color: str = "#ffffff"
    jacket_color: str = "#0f172a"
    palette: str = "Royal"
    accessories: str = "[]"
    aura: str = "Energetic"
    pose: str = "Confident"
    companion: str = "None"
    gold: int = 1000
    level: int = 1
    xp: int = 0
    health: int = 100
    energy: int = 100
    focus: int = 50
    strength: int = 10
    intelligence: int = 10
    discipline: int = 10
    vitality: int = 10
    creativity: int = 10
    social: int = 10
    transportation: str = "Walk"
    journey_km: int = 0
    current_zone: str = "Forest Road"
    streak_days: int = 1
    best_streak: int = 1
    construction_xp: int = 100
    home_level: int = 1
    home_xp: int = 0
    home_data: str = "{}"

class HomeSavePayload(BaseModel):
    home_level: int = 1
    home_xp: int = 0
    construction_xp: Optional[int] = None
    gold: Optional[int] = None
    home_data: str = "{}"

class HomeBuyPayload(BaseModel):
    item_id: str
    item_name: str
    category: str
    coin_cost: int = 0
    construction_xp_cost: int = 0

class HomeUnlockRoomPayload(BaseModel):
    room_id: str
    room_name: str
    required_level: int = 1

class FocusSprintStartPayload(BaseModel):
    quest_id: Optional[int] = None
    duration_minutes: int = 25
    title: str = "Deep Work Focus Sprint"

class FocusSprintCompletePayload(BaseModel):
    quest_id: Optional[int] = None
    duration_minutes: int = 25
    title: str = "Deep Work Focus Sprint"
    idempotency_key: Optional[str] = None

class MilestoneClaimPayload(BaseModel):
    idempotency_key: Optional[str] = None

class MilestoneInput(BaseModel):
    title: str
    description: Optional[str] = ""
    xp: Optional[int] = 100
    gold: Optional[int] = 50
    cxp: Optional[int] = 25
    is_boss: Optional[bool] = False

class CampaignCreatePayload(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "Exam Prep"
    target_date: Optional[str] = ""
    target_attribute: Optional[str] = "intelligence"
    milestones: Optional[List[MilestoneInput]] = None

class BaseExpandPayload(BaseModel):
    target_tier: Optional[int] = None

class ShopBuyRequest(BaseModel):
    item_slug: str

class InventoryEquipRequest(BaseModel):
    inventory_id: int
    equip: bool = True

class UserSettingsPayload(BaseModel):
    reduced_motion: bool = False
    sound_enabled: bool = True
    theme: str = "retro_dark"

class TransportEquip(BaseModel):
    transport: str

# =============================================================================
# AUTHENTICATION & USER ENDPOINTS
# =============================================================================

@app.get("/check-username")
@limiter.limit("20/minute")
def check_username(request: Request, username: str, db: Session = Depends(get_db)):
    clean_username = username.strip()
    if not clean_username:
        return {"available": False, "detail": "Username cannot be empty"}
    existing = db.query(models.User).filter(models.User.username == clean_username).first()
    return {"available": existing is None}

@app.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register_user(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    clean_email = user.email.strip().lower()
    clean_username = user.username.strip()

    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")

    if db.query(models.User).filter(models.User.email == clean_email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    if db.query(models.User).filter(models.User.username == clean_username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        name=user.name.strip(),
        email=clean_email,
        username=clean_username,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize Starter Character
    starter_char = models.Character(
        user_id=new_user.id,
        name=new_user.name or clean_username,
        title="The Novice Adventurer",
        archetype="WARRIOR",
        gold=1000,
        xp=0,
        level=1,
        construction_xp=100,
        home_level=1,
        strength=12,
        intelligence=10,
        discipline=10,
        vitality=12,
        creativity=10,
        social=10,
        streak_days=1,
        best_streak=1,
        last_active_date=datetime.utcnow().strftime("%Y-%m-%d")
    )
    db.add(starter_char)

    # Initialize Starter Achievements
    init_user_achievements(db, new_user.id)
    
    # Record Initial Welcome Grant in Ledgers
    gold_tx = models.GoldTransaction(user_id=new_user.id, amount=1000, source="WELCOME_BONUS", source_id="starter_grant")
    db.add(gold_tx)
    
    # Audit log
    audit = models.AuditLog(user_id=new_user.id, action="USER_REGISTERED", details=json.dumps({"username": clean_username}))
    db.add(audit)

    db.commit()
    return {"message": "User created successfully"}

@app.post("/login")
@limiter.limit("10/minute")
def login(request: Request, response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    ident = form_data.username.strip()
    user = db.query(models.User).filter(
        (models.User.email == ident.lower()) | (models.User.username == ident)
    ).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    refresh_token = auth.create_refresh_token(data={"sub": user.username})

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=auth.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        expires=auth.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        path="/"
    )
    return {"message": "Login successful"}

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@app.post("/refresh")
@limiter.limit("20/minute")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    import jwt as pyjwt
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")
    try:
        payload = pyjwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        if payload.get("typ") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        sub: str = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user = db.query(models.User).filter(models.User.username == sub).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        path="/"
    )
    return {"message": "Token refreshed"}

@app.get("/me")
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "username": current_user.username
    }

@app.get("/user/settings")
def get_user_settings(current_user: models.User = Depends(auth.get_current_user)):
    try:
        data = json.loads(current_user.settings_data or "{}")
    except Exception:
        data = {}
    return {
        "reduced_motion": data.get("reduced_motion", False),
        "sound_enabled": data.get("sound_enabled", True),
        "theme": data.get("theme", "retro_dark")
    }

@app.post("/user/settings")
def update_user_settings(payload: UserSettingsPayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    current_user.settings_data = json.dumps({
        "reduced_motion": payload.reduced_motion,
        "sound_enabled": payload.sound_enabled,
        "theme": payload.theme
    })
    db.commit()
    return {"message": "Settings saved", "settings": payload.model_dump()}

@app.delete("/user/account")
def delete_user_account(response: Response, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    user_id = current_user.id
    
    user_campaigns = db.query(models.Campaign.id).filter(models.Campaign.user_id == user_id).all()
    user_campaign_ids = [c[0] for c in user_campaigns]
    if user_campaign_ids:
        db.query(models.CampaignMilestone).filter(models.CampaignMilestone.campaign_id.in_(user_campaign_ids)).delete(synchronize_session=False)
    
    db.query(models.Campaign).filter(models.Campaign.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Character).filter(models.Character.user_id == user_id).delete(synchronize_session=False)
    db.query(models.QuestCompletion).filter(models.QuestCompletion.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Quest).filter(models.Quest.owner_id == user_id).delete(synchronize_session=False)
    db.query(models.XPTransaction).filter(models.XPTransaction.user_id == user_id).delete(synchronize_session=False)
    db.query(models.GoldTransaction).filter(models.GoldTransaction.user_id == user_id).delete(synchronize_session=False)
    db.query(models.BuildXPTransaction).filter(models.BuildXPTransaction.user_id == user_id).delete(synchronize_session=False)
    db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).delete(synchronize_session=False)
    db.query(models.InventoryItem).filter(models.InventoryItem.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Item).filter(models.Item.owner_id == user_id).delete(synchronize_session=False)
    db.query(models.AuditLog).filter(models.AuditLog.user_id == user_id).delete(synchronize_session=False)
    
    for extra_table in ["session_items", "weekly_tasks", "milestones", "goals", "session_sheets", "action_logs", "user_profiles", "quest_history", "custom_rewards", "achievements"]:
        try:
            db.execute(text(f"DELETE FROM {extra_table} WHERE user_id = :uid"), {"uid": user_id})
        except Exception:
            pass

    db.delete(current_user)
    db.commit()

    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Account successfully deleted"}


# =============================================================================
# PRESET ACHIEVEMENTS & SHOP CATALOG
# =============================================================================

PRESET_ACHIEVEMENTS = [
    {"slug": "first_quest", "title": "First Step", "description": "Complete your first real-world quest", "icon": "🌱", "category": "Quests", "rarity": "Common", "xp_reward": 50, "gold_reward": 25, "max_progress": 1},
    {"slug": "quest_10", "title": "Consistent Adventurer", "description": "Complete 10 real-world quests", "icon": "⚔️", "category": "Quests", "rarity": "Uncommon", "xp_reward": 100, "gold_reward": 50, "max_progress": 10},
    {"slug": "quest_50", "title": "Iron Will", "description": "Complete 50 real-world quests", "icon": "🛡️", "category": "Quests", "rarity": "Rare", "xp_reward": 300, "gold_reward": 150, "max_progress": 50},
    {"slug": "quest_100", "title": "Centurion of Growth", "description": "Complete 100 real-world quests", "icon": "👑", "category": "Quests", "rarity": "Epic", "xp_reward": 600, "gold_reward": 300, "max_progress": 100},
    {"slug": "streak_3", "title": "Momentum Spark", "description": "Maintain a 3-day quest streak", "icon": "🔥", "category": "Consistency", "rarity": "Common", "xp_reward": 50, "gold_reward": 25, "max_progress": 3},
    {"slug": "streak_7", "title": "Week Warrior", "description": "Maintain a 7-day quest streak", "icon": "⚡", "category": "Consistency", "rarity": "Uncommon", "xp_reward": 150, "gold_reward": 75, "max_progress": 7},
    {"slug": "streak_30", "title": "Unbreakable Habit", "description": "Maintain a 30-day quest streak", "icon": "🌟", "category": "Consistency", "rarity": "Epic", "xp_reward": 500, "gold_reward": 250, "max_progress": 30},
    {"slug": "scholar_10", "title": "Scholar of Insight", "description": "Complete 10 intelligence and study quests", "icon": "📚", "category": "Mastery", "rarity": "Rare", "xp_reward": 150, "gold_reward": 75, "max_progress": 10},
    {"slug": "fitness_10", "title": "Iron Body", "description": "Complete 10 strength and vitality workouts", "icon": "🏋️", "category": "Mastery", "rarity": "Rare", "xp_reward": 150, "gold_reward": 75, "max_progress": 10},
    {"slug": "first_room", "title": "Master Builder", "description": "Construct your first custom room in your Base", "icon": "🏠", "category": "Building", "rarity": "Common", "xp_reward": 100, "gold_reward": 50, "max_progress": 1},
    {"slug": "base_lvl_5", "title": "Fortress Architect", "description": "Upgrade your Base to Level 5", "icon": "🏰", "category": "Building", "rarity": "Rare", "xp_reward": 250, "gold_reward": 125, "max_progress": 5},
    {"slug": "level_10", "title": "Seasoned Explorer", "description": "Reach Character Level 10", "icon": "💎", "category": "Mastery", "rarity": "Rare", "xp_reward": 200, "gold_reward": 100, "max_progress": 10},
    {"slug": "level_25", "title": "Grand Legend", "description": "Reach Character Level 25", "icon": "🌌", "category": "Mastery", "rarity": "Epic", "xp_reward": 500, "gold_reward": 300, "max_progress": 25},
    {"slug": "first_campaign", "title": "Visionary Goal Setter", "description": "Create your first long-term Goal Campaign", "icon": "🎯", "category": "Campaigns", "rarity": "Common", "xp_reward": 50, "gold_reward": 25, "max_progress": 1},
    {"slug": "campaign_complete", "title": "Vision Achieved", "description": "Complete a full Goal Campaign with all milestones", "icon": "🏆", "category": "Campaigns", "rarity": "Legendary", "xp_reward": 800, "gold_reward": 500, "max_progress": 1},
    {"slug": "deep_work_60", "title": "Deep Work Monk", "description": "Complete 60 minutes of uninterrupted focus timer sessions", "icon": "⏱️", "category": "Quests", "rarity": "Uncommon", "xp_reward": 150, "gold_reward": 80, "max_progress": 60},
    {"slug": "first_cosmetic", "title": "Style Icon", "description": "Purchase and equip a cosmetic item from the Voxel Shop", "icon": "🎒", "category": "Shop", "rarity": "Common", "xp_reward": 50, "gold_reward": 25, "max_progress": 1},
    {"slug": "gold_1000", "title": "Treasure Keeper", "description": "Accumulate 1,500 Gold in your treasury", "icon": "💰", "category": "General", "rarity": "Uncommon", "xp_reward": 100, "gold_reward": 50, "max_progress": 1500}
]

PRESET_SHOP_ITEMS = [
    {"item_slug": "iron_helmet", "name": "Iron Voxel Helm", "description": "Forged voxel protective gear with polished crest", "category": "armor", "rarity": "Common", "cost": 100, "icon": "🪖", "unlock_level": 1, "stat_bonus": '{"strength":2}'},
    {"item_slug": "scholar_robe", "name": "Scholar Enchanted Robe", "description": "Woven with silver thread for study focus", "category": "clothing", "rarity": "Uncommon", "cost": 250, "icon": "🥋", "unlock_level": 2, "stat_bonus": '{"intelligence":3}'},
    {"item_slug": "builder_hard_hat", "name": "Builder Golden Cap", "description": "Essential gear for voxel home expansion", "category": "clothing", "rarity": "Common", "cost": 120, "icon": "👷", "unlock_level": 1, "stat_bonus": '{"discipline":2}'},
    {"item_slug": "zen_cloak", "name": "Zen Meditation Cloak", "description": "Radiates peaceful and calm aura", "category": "clothing", "rarity": "Rare", "cost": 350, "icon": "🧘", "unlock_level": 3, "stat_bonus": '{"vitality":3}'},
    {"item_slug": "pixel_cape", "name": "Prismatic Hero Cape", "description": "Flows with dynamic voxel hues and particle trail", "category": "clothing", "rarity": "Epic", "cost": 500, "icon": "🧣", "unlock_level": 5, "stat_bonus": '{"social":4}'},
    {"item_slug": "voxel_cat", "name": "Pixel Tabby Companion", "description": "Follows your avatar across world road and base", "category": "pets", "rarity": "Rare", "cost": 400, "icon": "🐱", "unlock_level": 3, "stat_bonus": '{"vitality":2}'},
    {"item_slug": "cyber_wolf", "name": "Neon Cyber Wolf", "description": "Loyal voxel beast with electric blue eyes", "category": "pets", "rarity": "Epic", "cost": 750, "icon": "🐺", "unlock_level": 7, "stat_bonus": '{"strength":4}'},
    {"item_slug": "dragon_whelp", "name": "Mini Ember Drake", "description": "Hovers beside you breathing tiny pixel embers", "category": "pets", "rarity": "Legendary", "cost": 1500, "icon": "🐉", "unlock_level": 10, "stat_bonus": '{"creativity":5}'},
    {"item_slug": "aura_fire", "name": "Inferno Flame Aura", "description": "Fiery voxel particles surround your character", "category": "effects", "rarity": "Rare", "cost": 450, "icon": "🔥", "unlock_level": 4, "stat_bonus": '{"strength":3}'},
    {"item_slug": "aura_galaxy", "name": "Cosmic Nebula Aura", "description": "Swirling galaxy dust trails your every step", "category": "effects", "rarity": "Legendary", "cost": 1200, "icon": "✨", "unlock_level": 10, "stat_bonus": '{"intelligence":5}'},
    {"item_slug": "crystal_lamp", "name": "Crystal Desk Lamp", "description": "Emits warm ambient illumination for study", "category": "furniture", "rarity": "Uncommon", "cost": 200, "icon": "💡", "unlock_level": 2, "stat_bonus": '{"creativity":2}'},
    {"item_slug": "arcade_station", "name": "Retro Arcade Machine", "description": "8-bit classic workstation for your game lounge", "category": "furniture", "rarity": "Epic", "cost": 800, "icon": "🕹️", "unlock_level": 6, "stat_bonus": '{"social":3}'}
]

def get_or_create_character(db: Session, user_id: int) -> models.Character:
    char = db.query(models.Character).filter(models.Character.user_id == user_id).first()
    if not char:
        u = db.query(models.User).filter(models.User.id == user_id).first()
        char = models.Character(
            user_id=user_id,
            name=u.name if u and u.name else (u.username if u else "Alex"),
            title="The Novice Adventurer",
            archetype="WARRIOR",
            gold=1000,
            xp=0,
            level=1,
            construction_xp=100,
            home_level=1,
            strength=12,
            intelligence=10,
            discipline=10,
            vitality=12,
            creativity=10,
            social=10,
            streak_days=1,
            best_streak=1,
            last_active_date=datetime.utcnow().strftime("%Y-%m-%d")
        )
        db.add(char)
        db.commit()
        db.refresh(char)
    return char

def init_user_achievements(db: Session, user_id: int):
    """Seed user achievements if missing."""
    existing_slugs = {a.slug for a in db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).all()}
    for pa in PRESET_ACHIEVEMENTS:
        if pa["slug"] not in existing_slugs:
            ua = models.UserAchievement(
                user_id=user_id,
                slug=pa["slug"],
                title=pa["title"],
                description=pa["description"],
                icon=pa["icon"],
                category=pa["category"],
                rarity=pa["rarity"],
                xp_reward=pa["xp_reward"],
                gold_reward=pa["gold_reward"],
                progress=0,
                max_progress=pa["max_progress"],
                unlocked=False
            )
            db.add(ua)

def seed_shop_items(db: Session):
    for item in PRESET_SHOP_ITEMS:
        exists = db.query(models.ShopItem).filter(models.ShopItem.item_slug == item["item_slug"]).first()
        if not exists:
            db.add(models.ShopItem(**item))
    db.commit()

def evaluate_user_achievements(db: Session, user_id: int, char: models.Character) -> List[Dict[str, Any]]:
    init_user_achievements(db, user_id)
    total_completions = db.query(models.QuestCompletion).filter(models.QuestCompletion.user_id == user_id).count()
    user_achievements = db.query(models.UserAchievement).filter(models.UserAchievement.user_id == user_id).all()
    unlocked_now = []

    for ua in user_achievements:
        if ua.unlocked:
            continue
        
        should_unlock = False
        if ua.slug == "first_quest" and total_completions >= 1:
            should_unlock = True
            ua.progress = 1
        elif ua.slug == "quest_10":
            ua.progress = min(10, total_completions)
            should_unlock = total_completions >= 10
        elif ua.slug == "quest_50":
            ua.progress = min(50, total_completions)
            should_unlock = total_completions >= 50
        elif ua.slug == "quest_100":
            ua.progress = min(100, total_completions)
            should_unlock = total_completions >= 100
        elif ua.slug == "streak_3":
            ua.progress = min(3, char.streak_days or 1)
            should_unlock = (char.streak_days or 1) >= 3
        elif ua.slug == "streak_7":
            ua.progress = min(7, char.streak_days or 1)
            should_unlock = (char.streak_days or 1) >= 7
        elif ua.slug == "streak_30":
            ua.progress = min(30, char.streak_days or 1)
            should_unlock = (char.streak_days or 1) >= 30
        elif ua.slug == "level_10":
            ua.progress = min(10, char.level or 1)
            should_unlock = (char.level or 1) >= 10
        elif ua.slug == "level_25":
            ua.progress = min(25, char.level or 1)
            should_unlock = (char.level or 1) >= 25
        elif ua.slug == "gold_1000":
            ua.progress = min(1500, char.gold or 0)
            should_unlock = (char.gold or 0) >= 1500
        elif ua.slug == "base_lvl_5":
            ua.progress = min(5, char.home_level or 1)
            should_unlock = (char.home_level or 1) >= 5

        if should_unlock:
            ua.unlocked = True
            ua.unlocked_at = datetime.utcnow()
            unlocked_now.append({
                "slug": ua.slug,
                "title": ua.title,
                "description": ua.description,
                "icon": ua.icon,
                "rarity": ua.rarity,
                "xp_reward": ua.xp_reward,
                "gold_reward": ua.gold_reward
            })
            # Award achievement XP & Gold in ledgers
            char.xp = (char.xp or 0) + ua.xp_reward
            char.gold = (char.gold or 0) + ua.gold_reward
            db.add(models.XPTransaction(user_id=user_id, amount=ua.xp_reward, source="ACHIEVEMENT", source_id=ua.slug))
            db.add(models.GoldTransaction(user_id=user_id, amount=ua.gold_reward, source="ACHIEVEMENT", source_id=ua.slug))

    return unlocked_now

# =============================================================================
# QUESTS & SERVER-AUTHORITATIVE PROGRESSION
# =============================================================================

DEFAULT_STARTER_QUESTS = [
    {"title": "Master 1 Core Formula or Concept", "description": "Study and master 1 foundational concept in Science, Tech, or Math", "category": "Study", "quest_type": "daily", "difficulty": "EASY", "stat_type": "intelligence", "stat_val": 2, "xp_reward": 20, "gold_reward": 10, "target_value": 1, "duration_minutes": 25},
    {"title": "Complete 1 Subject Problem Set", "description": "Finish assigned study exercises and homework problems", "category": "Study", "quest_type": "daily", "difficulty": "NORMAL", "stat_type": "intelligence", "stat_val": 4, "xp_reward": 50, "gold_reward": 25, "target_value": 1, "duration_minutes": 30},
    {"title": "Deep Work Focus Session (45 min)", "description": "Uninterrupted deep work or revision session with timer", "category": "Study", "quest_type": "timer", "difficulty": "HARD", "stat_type": "discipline", "stat_val": 6, "xp_reward": 100, "gold_reward": 50, "target_value": 1, "duration_minutes": 45},
    {"title": "Bodyweight Calisthenics Routine", "description": "Complete 15 pushups, 20 squats, and core plank sets", "category": "Fitness", "quest_type": "daily", "difficulty": "EASY", "stat_type": "strength", "stat_val": 3, "xp_reward": 20, "gold_reward": 10, "target_value": 1, "duration_minutes": 15},
    {"title": "Active Cardio Run or Brisk Walk (3 KM)", "description": "Aerobic endurance travel for stamina and energy", "category": "Fitness", "quest_type": "daily", "difficulty": "NORMAL", "stat_type": "vitality", "stat_val": 5, "xp_reward": 50, "gold_reward": 25, "target_value": 1, "duration_minutes": 30},
    {"title": "Hydration Target: 2 Liters Water", "description": "Track and complete 2.0L clean water intake today", "category": "Health", "quest_type": "numeric", "difficulty": "EASY", "stat_type": "vitality", "stat_val": 2, "xp_reward": 20, "gold_reward": 10, "target_value": 2, "duration_minutes": 0},
    {"title": "Read 10 Pages of Growth Book", "description": "Habit reading for mind expansion and clarity", "category": "Habit", "quest_type": "habit", "difficulty": "EASY", "stat_type": "intelligence", "stat_val": 2, "xp_reward": 20, "gold_reward": 10, "target_value": 10, "duration_minutes": 15},
    {"title": "Mindful Evening Reflection (5 min)", "description": "Review today's wins and set tomorrow's top 3 priorities", "category": "Mindfulness", "quest_type": "daily", "difficulty": "EASY", "stat_type": "discipline", "stat_val": 2, "xp_reward": 20, "gold_reward": 10, "target_value": 1, "duration_minutes": 5}
]

VEHICLE_TIERS = [
    {"level": 1, "name": "Walk", "icon": "🚶", "speed": 1.0, "desc": "Standard walking pace"},
    {"level": 5, "name": "Bicycle", "icon": "🚲", "speed": 2.2, "desc": "Classic 10-speed city cruiser"},
    {"level": 10, "name": "Skateboard", "icon": "🛹", "speed": 3.0, "desc": "Street deck with high-speed bearings"},
    {"level": 20, "name": "Scooter", "icon": "🛵", "speed": 4.2, "desc": "Vintage motor scooter"},
    {"level": 30, "name": "Motorcycle", "icon": "🏍️", "speed": 5.8, "desc": "Twin-cylinder road beast"},
    {"level": 40, "name": "Cyber Cruiser Car", "icon": "🚗", "speed": 7.5, "desc": "Neon-trimmed retro sports car"},
    {"level": 50, "name": "Futuristic Jet", "icon": "🚀", "speed": 10.0, "desc": "Plasma thruster anti-grav flight"}
]

@app.get("/quests")
def read_quests(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    quests = db.query(models.Quest).filter(models.Quest.owner_id == current_user.id).all()
    if not quests:
        for sq in DEFAULT_STARTER_QUESTS:
            q = models.Quest(
                title=sq["title"],
                description=sq["description"],
                category=sq["category"],
                quest_type=sq.get("quest_type", "daily"),
                difficulty=sq.get("difficulty", "EASY"),
                stat_type=sq["stat_type"],
                stat_val=sq["stat_val"],
                xp_reward=sq["xp_reward"],
                gold_reward=sq["gold_reward"],
                target_value=sq.get("target_value", 1),
                current_value=0,
                duration_minutes=sq.get("duration_minutes", 25),
                completed=False,
                owner_id=current_user.id
            )
            db.add(q)
        db.commit()
        quests = db.query(models.Quest).filter(models.Quest.owner_id == current_user.id).all()

    return [{
        "id": q.id,
        "title": q.title,
        "description": q.description,
        "category": q.category,
        "quest_type": q.quest_type or "daily",
        "difficulty": q.difficulty or "EASY",
        "stat_type": q.stat_type or "discipline",
        "stat_val": q.stat_val or 2,
        "xp_reward": q.xp_reward,
        "gold_reward": q.gold_reward,
        "target_value": q.target_value or 1,
        "current_value": q.current_value or 0,
        "duration_minutes": q.duration_minutes or 25,
        "completed": q.completed,
        "campaign_id": q.campaign_id
    } for q in quests]

@app.post("/quests", status_code=status.HTTP_201_CREATED)
def create_quest(quest: QuestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    diff_map = {"EASY": (20, 10), "NORMAL": (50, 25), "HARD": (100, 50), "EPIC": (200, 100), "LEGENDARY": (500, 250)}
    xp, gold = diff_map.get(quest.difficulty.upper(), (quest.xp_reward, quest.gold_reward))

    new_quest = models.Quest(
        title=quest.title.strip(),
        description=quest.description.strip(),
        category=quest.category,
        quest_type=quest.quest_type,
        difficulty=quest.difficulty.upper(),
        stat_type=quest.stat_type.lower(),
        stat_val=quest.stat_val,
        xp_reward=xp,
        gold_reward=gold,
        target_value=quest.target_value,
        duration_minutes=quest.duration_minutes,
        campaign_id=quest.campaign_id,
        owner_id=current_user.id
    )
    db.add(new_quest)
    db.commit()
    db.refresh(new_quest)
    return {
        "id": new_quest.id,
        "title": new_quest.title,
        "description": new_quest.description,
        "category": new_quest.category,
        "quest_type": new_quest.quest_type,
        "difficulty": new_quest.difficulty,
        "stat_type": new_quest.stat_type,
        "stat_val": new_quest.stat_val,
        "xp_reward": new_quest.xp_reward,
        "gold_reward": new_quest.gold_reward,
        "target_value": new_quest.target_value,
        "current_value": new_quest.current_value,
        "duration_minutes": new_quest.duration_minutes,
        "completed": new_quest.completed,
        "campaign_id": new_quest.campaign_id
    }

# =============================================================================
# USP 1: FOCUS SPRINT & QUEST UTILITIES (STATIC ROUTES BEFORE DYNAMIC ROUTES)
# =============================================================================

@app.post("/quests/focus-sprint/start")
def start_focus_sprint(payload: FocusSprintStartPayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="FOCUS_SPRINT_START",
        details=json.dumps({"title": payload.title, "duration": payload.duration_minutes, "quest_id": payload.quest_id})
    ))
    db.commit()
    return {"status": "started", "duration_minutes": payload.duration_minutes, "title": payload.title}

@app.post("/quests/focus-sprint/complete")
def complete_focus_sprint(payload: FocusSprintCompletePayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        char = models.Character(user_id=current_user.id, name=current_user.name or "Alex")
        db.add(char)
        db.commit()
        db.refresh(char)

    # Server Authoritative Reward Calculation
    base_xp = 50
    base_gold = 25
    base_cxp = 10

    if payload.duration_minutes >= 45:
        base_xp = 90
        base_gold = 45
        base_cxp = 20
    elif payload.duration_minutes >= 60:
        base_xp = 130
        base_gold = 65
        base_cxp = 30

    # Idempotency check if key provided
    if payload.idempotency_key:
        existing = db.query(models.AuditLog).filter(models.AuditLog.user_id == current_user.id, models.AuditLog.action == f"SPRINT_KEY_{payload.idempotency_key}").first()
        if existing:
            return {
                "message": "Focus sprint already validated",
                "xpEarned": 0,
                "goldEarned": 0,
                "cxpEarned": 0,
                "currentXp": char.xp,
                "totalGold": char.gold,
                "newLevel": char.level
            }
        db.add(models.AuditLog(user_id=current_user.id, action=f"SPRINT_KEY_{payload.idempotency_key}", details="idempotency_lock"))

    # Record Transactions in Normalized Tables
    db.add(models.XPTransaction(user_id=current_user.id, amount=base_xp, source="FOCUS_SPRINT", source_id=f"sprint_{payload.duration_minutes}m"))
    db.add(models.GoldTransaction(user_id=current_user.id, amount=base_gold, source="FOCUS_SPRINT", source_id=f"sprint_{payload.duration_minutes}m"))
    db.add(models.BuildXPTransaction(user_id=current_user.id, amount=base_cxp, source="FOCUS_SPRINT", source_id=f"sprint_{payload.duration_minutes}m"))

    char.xp = (char.xp or 0) + base_xp
    char.gold = (char.gold or 0) + base_gold
    char.construction_xp = (char.construction_xp or 0) + base_cxp
    char.discipline = (char.discipline or 10) + 2
    char.intelligence = (char.intelligence or 10) + 1

    # Level Up Check
    level_up = False
    new_transport = None
    while char.xp >= 100:
        char.xp -= 100
        char.level += 1
        level_up = True
        t_tier = next((t for t in VEHICLE_TIERS if t["level"] == char.level), None)
        if t_tier:
            char.transportation = t_tier["name"]
            new_transport = t_tier

    # Track deep work minutes in achievement
    ua = db.query(models.UserAchievement).filter(models.UserAchievement.user_id == current_user.id, models.UserAchievement.slug == "deep_work_60").first()
    if ua and not ua.unlocked:
        ua.progress = (ua.progress or 0) + payload.duration_minutes
        if ua.progress >= ua.max_progress:
            ua.unlocked = True
            ua.unlocked_at = datetime.utcnow()

    unlocked_achievements = evaluate_user_achievements(db, current_user.id, char)

    db.add(models.AuditLog(
        user_id=current_user.id,
        action="FOCUS_SPRINT_COMPLETE",
        details=json.dumps({"title": payload.title, "duration": payload.duration_minutes, "xp": base_xp, "gold": base_gold, "cxp": base_cxp})
    ))

    db.commit()
    db.refresh(char)

    return {
        "success": True,
        "message": f"Focus Sprint Complete! +{base_xp} XP, +{base_gold} Gold, +{base_cxp} Build XP",
        "xpEarned": base_xp,
        "goldEarned": base_gold,
        "cxpEarned": base_cxp,
        "newLevel": char.level,
        "levelUp": level_up,
        "newTransport": new_transport,
        "currentXp": char.xp,
        "totalGold": char.gold,
        "constructionXp": char.construction_xp,
        "achievementsUnlocked": unlocked_achievements
    }

@app.get("/quests/history")
def get_quest_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    completions = db.query(models.QuestCompletion).filter(models.QuestCompletion.user_id == current_user.id).order_by(desc(models.QuestCompletion.completed_at)).limit(30).all()
    res = []
    for c in completions:
        q = db.query(models.Quest).filter(models.Quest.id == c.quest_id).first()
        res.append({
            "id": c.id,
            "quest_id": c.quest_id,
            "title": q.title if q else "Real-World Task",
            "category": q.category if q else "General",
            "xp_awarded": c.xp_awarded,
            "gold_awarded": c.gold_awarded,
            "completed_at": c.completed_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return {"history": res}

@app.get("/quests/recovery-mode")
def get_recovery_mode_quests(current_user: models.User = Depends(auth.get_current_user)):
    """Psychologically safe 5-minute micro-quests to re-ignite momentum with zero shame."""
    return {
        "status": "active",
        "message": "Welcome back! Every small step counts. No streak pressure.",
        "micro_quests": [
            {"title": "5-Minute Study / Read Sprint", "description": "Read just 2 pages or review 1 key note with zero pressure", "stat": "intelligence", "xp": 20, "gold": 10},
            {"title": "5-Minute Full Body Stretch", "description": "Gentle stretches and deep breathing for physical rejuvenation", "stat": "vitality", "xp": 20, "gold": 10},
            {"title": "Clear Desk & 1 Micro-Task", "description": "Organize your immediate workspace for mental clarity", "stat": "discipline", "xp": 20, "gold": 10}
        ]
    }

# =============================================================================
# DYNAMIC QUEST ROUTES
# =============================================================================

@app.patch("/quests/{quest_id}")
def update_quest(quest_id: int, payload: QuestUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id, models.Quest.owner_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(quest, k, v)
    db.commit()
    db.refresh(quest)
    return {"message": "Quest updated", "quest_id": quest.id}

@app.get("/quests/today-stats")
def get_today_quest_stats(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    try:
        today_completions = db.query(models.QuestCompletion).filter(
            models.QuestCompletion.user_id == current_user.id,
            func.date(models.QuestCompletion.completed_at) == today
        ).all()
    except Exception:
        today_completions = []
    today_xp = sum(c.xp_awarded for c in today_completions)
    today_gold = sum(c.gold_awarded for c in today_completions)
    try:
        sprint_count = db.query(models.AuditLog).filter(
            models.AuditLog.user_id == current_user.id,
            models.AuditLog.action == "FOCUS_SPRINT_COMPLETE",
            func.date(models.AuditLog.created_at) == today
        ).count()
    except Exception:
        sprint_count = 0
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    return {
        "quests_completed_today": len(today_completions),
        "xp_earned_today": today_xp,
        "gold_earned_today": today_gold,
        "focus_sprints_today": sprint_count,
        "streak_days": char.streak_days if char else 1,
        "best_streak": char.best_streak if char else 1,
        "daily_xp_target": 100
    }

@app.delete("/quests/{quest_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quest(quest_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id, models.Quest.owner_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    db.delete(quest)
    db.commit()

# =============================================================================
# SERVER-AUTHORITATIVE ATOMIC QUEST COMPLETION & LEDGER LOGGING
# =============================================================================

@app.post("/quests/{quest_id}/complete")
def complete_quest(
    quest_id: int,
    payload: Optional[QuestCompletePayload] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Server-authoritative quest completion:
    1. Validates quest existence & ownership.
    2. Enforces idempotency via QuestCompletion record.
    3. Calculates XP, Gold, Attribute growth, and Construction XP.
    4. Records immutable XPTransaction and GoldTransaction ledgers.
    5. Evaluates and advances user achievements.
    6. Returns structured ProgressionEvent.
    """
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id, models.Quest.owner_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.completed:
        raise HTTPException(status_code=400, detail="Quest already completed")

    # Idempotency Key check
    idempotency_key = (payload.idempotency_key if payload and payload.idempotency_key else None) or f"quest_{quest_id}_{datetime.utcnow().strftime('%Y-%m-%d')}"
    existing_completion = db.query(models.QuestCompletion).filter(
        models.QuestCompletion.user_id == current_user.id,
        models.QuestCompletion.idempotency_key == idempotency_key
    ).first()
    if existing_completion:
        raise HTTPException(status_code=400, detail="Duplicate completion detected via idempotency ledger")

    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        char = models.Character(user_id=current_user.id, name=current_user.name or "Alex")
        db.add(char)
        db.commit()
        db.refresh(char)

    old_level = char.level or 1
    xp_earned = quest.xp_reward or 25
    gold_earned = quest.gold_reward or 10
    stat_type = quest.stat_type or "discipline"
    stat_val = quest.stat_val or 2

    # Construction XP calculation
    diff = (quest.difficulty or "EASY").upper()
    cxp_earned = 50 if diff in ("HARD", "EPIC", "LEGENDARY") else 25 if diff == "NORMAL" else 10

    # 1. Mark Quest Completed
    quest.completed = True
    quest.completed_at = datetime.utcnow()
    quest.current_value = quest.target_value

    # 2. Insert Completion Audit Record
    completion_rec = models.QuestCompletion(
        user_id=current_user.id,
        quest_id=quest.id,
        idempotency_key=idempotency_key,
        xp_awarded=xp_earned,
        gold_awarded=gold_earned,
        completed_at=datetime.utcnow()
    )
    db.add(completion_rec)

    # 3. Insert Immutable XP & Gold Transaction Ledgers
    xp_tx = models.XPTransaction(
        user_id=current_user.id,
        amount=xp_earned,
        source="QUEST_COMPLETION",
        source_id=f"quest_{quest.id}"
    )
    db.add(xp_tx)

    gold_tx = models.GoldTransaction(
        user_id=current_user.id,
        amount=gold_earned,
        source="QUEST_COMPLETION",
        source_id=f"quest_{quest.id}"
    )
    db.add(gold_tx)

    # 4. Update Character Resources & Stats
    char.xp = (char.xp or 0) + xp_earned
    char.gold = (char.gold or 0) + gold_earned
    char.construction_xp = (char.construction_xp or 100) + cxp_earned
    char.journey_km = (char.journey_km or 0) + 2

    # Dynamic attribute increments
    stat_key = stat_type.lower()
    if hasattr(char, stat_key):
        curr_val = getattr(char, stat_key) or 10
        setattr(char, stat_key, curr_val + stat_val)

    # Streak calculation without shame / penalty
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    if char.last_active_date:
        try:
            last_dt = datetime.strptime(char.last_active_date, "%Y-%m-%d")
            diff_days = (datetime.utcnow() - last_dt).days
            if diff_days == 1:
                char.streak_days = (char.streak_days or 1) + 1
            elif diff_days > 1:
                # Safe recovery: keep best streak intact, reset current to 1
                char.streak_days = 1
        except Exception:
            char.streak_days = 1
    char.last_active_date = today_str
    if (char.streak_days or 1) > (char.best_streak or 1):
        char.best_streak = char.streak_days

    # 5. Level Up Calculation (100 XP per Level curve)
    level_up = False
    while char.xp >= 100:
        char.xp -= 100
        char.level = (char.level or 1) + 1
        level_up = True

    # Vehicle threshold unlocks
    new_transport = None
    for tier in VEHICLE_TIERS:
        if old_level < tier["level"] and char.level >= tier["level"]:
            new_transport = tier["name"]
            if tier["level"] == 5 and (char.transportation == "Walk" or not char.transportation):
                char.transportation = "Bicycle"

    # 6. Evaluate Achievements
    unlocked_achievements = evaluate_user_achievements(db, current_user.id, char)

    db.commit()
    db.refresh(char)

    return {
        "questCompleted": True,
        "message": f"Quest Complete! +{xp_earned} XP, +{gold_earned} Gold, +{cxp_earned} Build XP",
        "xpEarned": xp_earned,
        "goldEarned": gold_earned,
        "cxpEarned": cxp_earned,
        "xp_reward": xp_earned,
        "gold_reward": gold_earned,
        "cxp_reward": cxp_earned,
        "newLevel": char.level,
        "levelUp": level_up,
        "currentXp": char.xp,
        "totalGold": char.gold,
        "new_gold": char.gold,
        "total_gold": char.gold,
        "construction_xp": char.construction_xp,
        "constructionXp": char.construction_xp,
        "streakDays": char.streak_days,
        "bestStreak": char.best_streak,
        "newTransport": new_transport,
        "transportation": char.transportation,
        "attributeChanges": {stat_type: stat_val},
        "achievementsUnlocked": unlocked_achievements,
        "allStats": {
            "strength": char.strength or 10,
            "intelligence": char.intelligence or 10,
            "discipline": char.discipline or 10,
            "vitality": char.vitality or 10,
            "creativity": char.creativity or 10,
            "social": char.social or 10
        }
    }

@app.post("/quests/{quest_id}/progress")
def increment_quest_progress(quest_id: int, payload: QuestProgressPayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id, models.Quest.owner_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.completed:
        return {"completed": True, "message": "Quest already finished"}

    quest.current_value = (quest.current_value or 0) + payload.increment
    if quest.current_value >= (quest.target_value or 1):
        db.commit()
        return complete_quest(quest_id=quest_id, db=db, current_user=current_user)
    
    db.commit()
    return {
        "quest_id": quest.id,
        "current_value": quest.current_value,
        "target_value": quest.target_value,
        "completed": False
    }

@app.post("/quests/{quest_id}/timer-complete")
def timer_complete_quest(quest_id: int, payload: TimerCompletePayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Record deep work minutes achievement
    minutes = max(1, payload.elapsed_seconds // 60)
    ua = db.query(models.UserAchievement).filter(models.UserAchievement.user_id == current_user.id, models.UserAchievement.slug == "deep_work_60").first()
    if ua and not ua.unlocked:
        ua.progress = (ua.progress or 0) + minutes
        if ua.progress >= ua.max_progress:
            ua.unlocked = True
            ua.unlocked_at = datetime.utcnow()

    return complete_quest(quest_id=quest_id, db=db, current_user=current_user)

# =============================================================================
# ACHIEVEMENTS ENDPOINTS
# =============================================================================

@app.get("/achievements")
def list_achievements(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    init_user_achievements(db, current_user.id)
    achievements = db.query(models.UserAchievement).filter(models.UserAchievement.user_id == current_user.id).all()
    return [{
        "id": a.id,
        "slug": a.slug,
        "title": a.title,
        "description": a.description,
        "icon": a.icon,
        "category": a.category,
        "rarity": a.rarity,
        "xp_reward": a.xp_reward,
        "gold_reward": a.gold_reward,
        "progress": a.progress,
        "max_progress": a.max_progress,
        "unlocked": a.unlocked,
        "unlocked_at": a.unlocked_at.strftime("%Y-%m-%d %H:%M") if a.unlocked_at else None
    } for a in achievements]

# =============================================================================
# GOAL CAMPAIGNS & CAMPAIGN ROADMAP
# =============================================================================

def init_user_campaigns(db: Session, user_id: int):
    existing = db.query(models.Campaign).filter(models.Campaign.user_id == user_id).first()
    if existing:
        return
    c1 = models.Campaign(
        user_id=user_id,
        title="Semester High Honors & Academic Mastery",
        description="Build flawless study habits, master revision blocks, and conquer exams.",
        category="Academic / Learning",
        target_date="In 4 Weeks",
        status="ACTIVE",
        progress_pct=50,
        total_milestones=4,
        completed_milestones=2
    )
    db.add(c1)
    db.flush()

    m1_1 = models.CampaignMilestone(campaign_id=c1.id, title="Foundation: Core Concepts & Comprehensive Flashcards", description="Review syllabus, organize study materials, and construct 100 active recall cards.", sequence=1, xp_reward=100, gold_reward=150, build_xp_reward=25, is_boss=False, is_completed=True, completed_at=datetime.utcnow())
    m1_2 = models.CampaignMilestone(campaign_id=c1.id, title="Active Application: 10 Timed Past Exam Papers", description="Solve past exam papers under strict timed sprint conditions with zero distractions.", sequence=2, xp_reward=200, gold_reward=250, build_xp_reward=50, is_boss=False, is_completed=True, completed_at=datetime.utcnow())
    m1_3 = models.CampaignMilestone(campaign_id=c1.id, title="Deep Synthesis: Group Review & Mock Defense", description="Teach core concepts to peers and pass exhaustive randomized mock quizzes.", sequence=3, xp_reward=300, gold_reward=350, build_xp_reward=75, is_boss=False, is_completed=False)
    m1_4 = models.CampaignMilestone(campaign_id=c1.id, title="Final Boss: Exam Day Execution with 90%+ Target", description="Walk into examination hall with peak confidence and conquer final semester exams.", sequence=4, xp_reward=500, gold_reward=500, build_xp_reward=150, is_boss=True, is_completed=False)
    db.add_all([m1_1, m1_2, m1_3, m1_4])

    c2 = models.Campaign(
        user_id=user_id,
        title="10K Running & Peak Cardiovascular Fitness",
        description="Systematic endurance progression from 2km jogs to a full 10k finish line.",
        category="Fitness / Health",
        target_date="In 4 Weeks",
        status="ACTIVE",
        progress_pct=25,
        total_milestones=4,
        completed_milestones=1
    )
    db.add(c2)
    db.flush()

    m2_1 = models.CampaignMilestone(campaign_id=c2.id, title="Base Aerobic: 3km Continuous Run Without Breaks", description="Establish comfortable breathing rhythm and finish 3km continuous running.", sequence=1, xp_reward=100, gold_reward=100, build_xp_reward=25, is_boss=False, is_completed=True, completed_at=datetime.utcnow())
    m2_2 = models.CampaignMilestone(campaign_id=c2.id, title="Endurance Build: Reach 5km Distance at Steady Pace", description="Build cardiovascular engine and muscle stamina over a steady 5km course.", sequence=2, xp_reward=200, gold_reward=200, build_xp_reward=50, is_boss=False, is_completed=False)
    m2_3 = models.CampaignMilestone(campaign_id=c2.id, title="Speed Endurance: Sprint Interval Training (8x 400m)", description="High-intensity interval sprints to boost VO2 max and anaerobic threshold.", sequence=3, xp_reward=300, gold_reward=300, build_xp_reward=75, is_boss=False, is_completed=False)
    m2_4 = models.CampaignMilestone(campaign_id=c2.id, title="Final Boss: Official 10K Finish Line Victory", description="Cross the 10km finish line with strength, endurance, and unstoppable stamina.", sequence=4, xp_reward=500, gold_reward=500, build_xp_reward=150, is_boss=True, is_completed=False)
    db.add_all([m2_1, m2_2, m2_3, m2_4])
    db.commit()

@app.get("/campaigns")
def list_campaigns(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    init_user_campaigns(db, current_user.id)
    campaigns = db.query(models.Campaign).filter(models.Campaign.user_id == current_user.id).all()
    out = []
    for c in campaigns:
        milestones = db.query(models.CampaignMilestone).filter(models.CampaignMilestone.campaign_id == c.id).order_by(models.CampaignMilestone.sequence).all()
        quests = db.query(models.Quest).filter(models.Quest.campaign_id == c.id).all()
        out.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "target_date": c.target_date,
            "status": c.status,
            "progress_pct": c.progress_pct,
            "total_milestones": len(milestones),
            "completed_milestones": sum(1 for m in milestones if m.is_completed),
            "milestones": [{
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "sequence": m.sequence,
                "xp_reward": m.xp_reward,
                "gold_reward": m.gold_reward,
                "build_xp_reward": getattr(m, 'build_xp_reward', 25),
                "is_boss": getattr(m, 'is_boss', False),
                "is_completed": m.is_completed
            } for m in milestones],
            "quests": [{
                "id": q.id,
                "title": q.title,
                "difficulty": q.difficulty,
                "completed": q.completed
            } for q in quests]
        })
    return out

@app.post("/campaigns")
@app.post("/campaigns/create")
def create_campaign(
    payload: Optional[CampaignCreatePayload] = None,
    title: Optional[str] = None,
    description: Optional[str] = "",
    category: Optional[str] = "Exam Prep",
    target_date: Optional[str] = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    c_title = (payload.title if payload and payload.title else title or "Goal Campaign").strip()
    c_desc = (payload.description if payload and payload.description else description or "").strip()
    c_cat = (payload.category if payload and payload.category else category or "Exam Prep")
    c_target = (payload.target_date if payload and payload.target_date else target_date or "")
    milestones_list = payload.milestones if payload and payload.milestones else []
    total_m = len(milestones_list) if milestones_list else 4

    c = models.Campaign(
        user_id=current_user.id,
        title=c_title,
        description=c_desc,
        category=c_cat,
        target_date=c_target,
        status="IN_PROGRESS",
        progress_pct=0,
        total_milestones=total_m,
        completed_milestones=0
    )
    db.add(c)
    db.commit()
    db.refresh(c)

    if milestones_list:
        for i, m_item in enumerate(milestones_list):
            m = models.CampaignMilestone(
                campaign_id=c.id,
                title=m_item.title,
                description=m_item.description or f"Complete objectives for milestone {i+1}",
                sequence=i+1,
                xp_reward=m_item.xp or (100 * (i+1)),
                gold_reward=m_item.gold or (50 * (i+1)),
                build_xp_reward=m_item.cxp or 25,
                is_boss=bool(m_item.is_boss),
                is_completed=False
            )
            db.add(m)
    else:
        m_titles = [
            "Phase 1: Foundation & Core Concepts",
            "Phase 2: Practice & Active Application",
            "Phase 3: Deep Revision & Mock Testing",
            "Phase 4: Final Mastery & Summit"
        ]
        for i, t in enumerate(m_titles):
            m = models.CampaignMilestone(
                campaign_id=c.id,
                title=t,
                description=f"Complete core milestone objectives for week {i+1}",
                sequence=i+1,
                xp_reward=100 * (i+1),
                gold_reward=50 * (i+1),
                build_xp_reward=25 * (i+1),
                is_boss=(i == 3),
                is_completed=False
            )
            db.add(m)
    
    # Check first campaign achievement
    ua = db.query(models.UserAchievement).filter(models.UserAchievement.user_id == current_user.id, models.UserAchievement.slug == "first_campaign").first()
    if ua and not ua.unlocked:
        ua.unlocked = True
        ua.progress = 1
        ua.unlocked_at = datetime.utcnow()

    db.commit()
    return {"message": "Campaign created!", "campaign_id": c.id}

@app.get("/campaigns/history")
def get_campaign_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    milestones = db.query(models.CampaignMilestone).join(models.Campaign, models.CampaignMilestone.campaign_id == models.Campaign.id).filter(
        models.Campaign.user_id == current_user.id,
        models.CampaignMilestone.is_completed == True
    ).order_by(desc(models.CampaignMilestone.completed_at)).all()

    return {
        "claimed_milestones": [{
            "id": m.id,
            "campaign_id": m.campaign_id,
            "campaign_title": m.campaign.title if m.campaign else "Goal Campaign",
            "milestone_title": m.title,
            "sequence": m.sequence,
            "is_boss": getattr(m, 'is_boss', False),
            "xp_reward": m.xp_reward,
            "gold_reward": m.gold_reward,
            "completed_at": m.completed_at.strftime("%Y-%m-%d %H:%M:%S") if m.completed_at else ""
        } for m in milestones]
    }

@app.get("/campaigns/{campaign_id}")
def get_campaign_detail(campaign_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    c = db.query(models.Campaign).filter(models.Campaign.id == campaign_id, models.Campaign.user_id == current_user.id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    milestones = db.query(models.CampaignMilestone).filter(models.CampaignMilestone.campaign_id == c.id).order_by(models.CampaignMilestone.sequence).all()
    quests = db.query(models.Quest).filter(models.Quest.campaign_id == c.id).all()
    return {
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "category": c.category,
        "target_date": c.target_date,
        "status": c.status,
        "progress_pct": c.progress_pct,
        "total_milestones": len(milestones),
        "completed_milestones": sum(1 for m in milestones if m.is_completed),
        "milestones": [{
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "sequence": m.sequence,
            "xp_reward": m.xp_reward,
            "gold_reward": m.gold_reward,
            "build_xp_reward": getattr(m, 'build_xp_reward', 25),
            "is_boss": getattr(m, 'is_boss', False),
            "is_completed": m.is_completed
        } for m in milestones],
        "quests": [{
            "id": q.id,
            "title": q.title,
            "difficulty": q.difficulty,
            "completed": q.completed
        } for q in quests]
    }

@app.post("/campaigns/{campaign_id}/milestones/{milestone_id}/claim")
@app.post("/campaigns/{campaign_id}/milestone/{milestone_id}/complete")
def complete_campaign_milestone(campaign_id: int, milestone_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    init_user_campaigns(db, current_user.id)
    c = db.query(models.Campaign).filter(models.Campaign.id == campaign_id, models.Campaign.user_id == current_user.id).first()
    if not c:
        user_camps = db.query(models.Campaign).filter(models.Campaign.user_id == current_user.id).order_by(models.Campaign.id).all()
        if campaign_id == 1 and len(user_camps) >= 1:
            c = user_camps[0]
        elif campaign_id == 2 and len(user_camps) >= 2:
            c = user_camps[1]
        elif user_camps:
            c = user_camps[0]
        else:
            raise HTTPException(status_code=404, detail="Campaign not found")

    m = db.query(models.CampaignMilestone).filter(models.CampaignMilestone.id == milestone_id, models.CampaignMilestone.campaign_id == c.id).first()
    if not m:
        seq = None
        if 101 <= milestone_id <= 104:
            seq = milestone_id - 100
        elif 201 <= milestone_id <= 204:
            seq = milestone_id - 200
        if seq:
            m = db.query(models.CampaignMilestone).filter(models.CampaignMilestone.sequence == seq, models.CampaignMilestone.campaign_id == c.id).first()
        if not m:
            m = db.query(models.CampaignMilestone).filter(models.CampaignMilestone.campaign_id == c.id, models.CampaignMilestone.is_completed == False).order_by(models.CampaignMilestone.sequence).first()

    if not m:
        raise HTTPException(status_code=400, detail="Milestone not found")
    if m.is_completed:
        raise HTTPException(status_code=400, detail="Milestone already complete")

    m.is_completed = True
    m.completed_at = datetime.utcnow()

    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    cxp_gain = getattr(m, 'build_xp_reward', 25) or 25
    leveled_up = False
    if char:
        char.xp = (char.xp or 0) + m.xp_reward
        char.gold = (char.gold or 0) + m.gold_reward
        char.construction_xp = (char.construction_xp or 0) + cxp_gain
        db.add(models.XPTransaction(user_id=current_user.id, amount=m.xp_reward, source="CAMPAIGN_MILESTONE", source_id=f"ms_{m.id}"))
        db.add(models.GoldTransaction(user_id=current_user.id, amount=m.gold_reward, source="CAMPAIGN_MILESTONE", source_id=f"ms_{m.id}"))
        db.add(models.BuildXPTransaction(user_id=current_user.id, amount=cxp_gain, source="CAMPAIGN_MILESTONE", source_id=f"ms_{m.id}"))

        while char.xp >= 100:
            char.xp -= 100
            char.level += 1
            leveled_up = True

    all_m = db.query(models.CampaignMilestone).filter(models.CampaignMilestone.campaign_id == c.id).all()
    done = sum(1 for item in all_m if item.is_completed)
    c.completed_milestones = done
    c.progress_pct = int((done / max(1, len(all_m))) * 100)
    if c.progress_pct == 100:
        c.status = "COMPLETED"
        ua = db.query(models.UserAchievement).filter(models.UserAchievement.user_id == current_user.id, models.UserAchievement.slug == "campaign_complete").first()
        if ua and not ua.unlocked:
            ua.unlocked = True
            ua.progress = 1
            ua.unlocked_at = datetime.utcnow()

    db.add(models.AuditLog(
        user_id=current_user.id,
        action="CAMPAIGN_MILESTONE_CLAIM",
        details=json.dumps({"campaign_id": c.id, "milestone_id": m.id, "xp": m.xp_reward, "gold": m.gold_reward, "cxp": cxp_gain})
    ))

    db.commit()
    return {
        "message": f"Milestone completed! +{m.xp_reward} XP, +{m.gold_reward} Gold, +{cxp_gain} Build XP",
        "campaign_progress": c.progress_pct,
        "xpEarned": m.xp_reward,
        "goldEarned": m.gold_reward,
        "cxpEarned": cxp_gain,
        "level_up": leveled_up,
        "new_level": char.level if char else 1,
        "new_xp": char.xp if char else 0,
        "new_gold": char.gold if char else 1000,
        "newLevel": char.level if char else 1,
        "currentXp": char.xp if char else 0,
        "totalGold": char.gold if char else 1000
    }

# =============================================================================
# LIVE REAL-TIME LEADERBOARD & SSE STREAM
# =============================================================================

@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Returns Global, Weekly, Monthly, and Category Leaderboards with natural competition indicators.
    """
    chars = db.query(models.Character).join(models.User, models.Character.user_id == models.User.id).all()
    leaderboard = []

    for char in chars:
        # Calculate XP earned today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_xp = db.query(func.sum(models.XPTransaction.amount)).filter(
            models.XPTransaction.user_id == char.user_id,
            models.XPTransaction.created_at >= today_start
        ).scalar() or 0

        # Calculate Weekly XP
        week_start = datetime.utcnow() - timedelta(days=7)
        weekly_xp = db.query(func.sum(models.XPTransaction.amount)).filter(
            models.XPTransaction.user_id == char.user_id,
            models.XPTransaction.created_at >= week_start
        ).scalar() or 0

        user_obj = db.query(models.User).filter(models.User.id == char.user_id).first()
        total_xp = (char.level - 1) * 100 + (char.xp or 0)

        leaderboard.append({
            "user_id": char.user_id,
            "username": user_obj.username if user_obj else "Adventurer",
            "name": char.name or "Alex",
            "archetype": char.archetype or "WARRIOR",
            "level": char.level or 1,
            "total_xp": total_xp,
            "weekly_xp": weekly_xp,
            "today_xp": today_xp,
            "transportation": char.transportation or "Walk",
            "streak_days": char.streak_days or 1,
            "is_current_user": char.user_id == current_user.id
        })

    # Sort descending by total_xp
    leaderboard.sort(key=lambda x: x["total_xp"], reverse=True)
    for rank, entry in enumerate(leaderboard, start=1):
        entry["rank"] = rank

    return {
        "leaderboard": leaderboard,
        "natural_competition_note": "Rank changes occur naturally as other adventurers progress. Your lifetime XP & rewards are permanently yours.",
        "weekly_reset_info": "Weekly XP refreshes every Monday at 00:00 UTC for fresh competitive fun."
    }

@app.get("/leaderboard/stream")
async def leaderboard_stream(request: Request, db: Session = Depends(get_db)):
    """Server-Sent Events (SSE) live leaderboard update stream."""
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            try:
                # Poll lightweight leaderboard snapshot
                top_3 = db.query(models.Character).order_by(desc(models.Character.level), desc(models.Character.xp)).limit(3).all()
                top_data = [{"name": c.name, "level": c.level, "xp": c.xp} for c in top_3]
                data = json.dumps({"type": "RANK_HEARTBEAT", "top": top_data, "timestamp": datetime.utcnow().isoformat()})
                yield f"data: {data}\n\n"
            except Exception:
                pass
            await asyncio.sleep(8)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# =============================================================================
# VOXEL SHOP & INVENTORY ENDPOINTS
# =============================================================================

@app.get("/shop")
def list_shop(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    seed_shop_items(db)
    items = db.query(models.ShopItem).all()
    user_inv_slugs = {i.item_slug for i in db.query(models.InventoryItem).filter(models.InventoryItem.user_id == current_user.id).all()}

    return [{
        "id": i.id,
        "item_slug": i.item_slug,
        "name": i.name,
        "description": i.description,
        "category": i.category,
        "rarity": i.rarity,
        "cost": i.cost,
        "icon": i.icon,
        "unlock_level": i.unlock_level,
        "owned": i.item_slug in user_inv_slugs
    } for i in items]

@app.post("/shop/buy")
def buy_shop_item(payload: ShopBuyRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    seed_shop_items(db)
    item = db.query(models.ShopItem).filter(models.ShopItem.item_slug == payload.item_slug).first()
    if not item:
        raise HTTPException(status_code=404, detail="Shop item not found")

    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    if (char.level or 1) < item.unlock_level:
        raise HTTPException(status_code=400, detail=f"Requires Level {item.unlock_level} to unlock {item.name}")

    if (char.gold or 0) < item.cost:
        raise HTTPException(status_code=400, detail=f"Insufficient Gold. Need 🪙 {item.cost} Gold")

    # Deduct gold & record transaction
    char.gold -= item.cost
    db.add(models.GoldTransaction(user_id=current_user.id, amount=-item.cost, source="SHOP_PURCHASE", source_id=item.item_slug))

    # Add to inventory
    existing_inv = db.query(models.InventoryItem).filter(models.InventoryItem.user_id == current_user.id, models.InventoryItem.item_slug == item.item_slug).first()
    if existing_inv:
        existing_inv.quantity += 1
    else:
        inv_item = models.InventoryItem(
            user_id=current_user.id,
            item_slug=item.item_slug,
            name=item.name,
            description=item.description,
            category=item.category,
            rarity=item.rarity,
            price=item.cost,
            visual_asset=item.icon,
            is_equipped=False,
            quantity=1
        )
        db.add(inv_item)

    # Check first cosmetic achievement
    ua = db.query(models.UserAchievement).filter(models.UserAchievement.user_id == current_user.id, models.UserAchievement.slug == "first_cosmetic").first()
    if ua and not ua.unlocked:
        ua.unlocked = True
        ua.progress = 1
        ua.unlocked_at = datetime.utcnow()

    db.commit()
    db.refresh(char)
    return {"message": f"Purchased '{item.name}' for {item.cost} Gold!", "new_gold": char.gold, "item_slug": item.item_slug}

@app.get("/inventory")
def list_inventory(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    inv = db.query(models.InventoryItem).filter(models.InventoryItem.user_id == current_user.id).all()
    return [{
        "id": i.id,
        "item_slug": i.item_slug,
        "name": i.name,
        "description": i.description,
        "category": i.category,
        "rarity": i.rarity,
        "price": i.price,
        "visual_asset": i.visual_asset,
        "is_equipped": i.is_equipped,
        "quantity": i.quantity
    } for i in inv]

@app.post("/inventory/equip")
def equip_inventory_item(payload: InventoryEquipRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == payload.inventory_id, models.InventoryItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not in inventory")

    # If equipping, unequip other items in same category
    if payload.equip:
        others = db.query(models.InventoryItem).filter(
            models.InventoryItem.user_id == current_user.id,
            models.InventoryItem.category == item.category,
            models.InventoryItem.id != item.id
        ).all()
        for o in others:
            o.is_equipped = False

    item.is_equipped = payload.equip
    db.commit()
    return {"message": f"{'Equipped' if payload.equip else 'Unequipped'} {item.name}", "is_equipped": item.is_equipped}

# =============================================================================
# ANALYTICS & AUDIT LEDGER
# =============================================================================

@app.get("/analytics/overview")
def get_analytics_overview(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    total_completions = db.query(models.QuestCompletion).filter(models.QuestCompletion.user_id == current_user.id).count()
    
    # Calculate 7-day daily XP timeline
    daily_xp_timeline = []
    for i in range(6, -1, -1):
        day_date = datetime.utcnow() - timedelta(days=i)
        day_str = day_date.strftime("%b %d")
        start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = day_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        day_xp = db.query(func.sum(models.XPTransaction.amount)).filter(
            models.XPTransaction.user_id == current_user.id,
            models.XPTransaction.created_at >= start,
            models.XPTransaction.created_at <= end
        ).scalar() or 0
        daily_xp_timeline.append({"day": day_str, "xp": day_xp})

    return {
        "level": char.level if char else 1,
        "total_gold": char.gold if char else 1000,
        "total_quests_completed": total_completions,
        "streak_days": char.streak_days if char else 1,
        "best_streak": char.best_streak if char else 1,
        "journey_km": char.journey_km if char else 0,
        "daily_xp_timeline": daily_xp_timeline,
        "radar_stats": {
            "Strength": char.strength if char else 10,
            "Intelligence": char.intelligence if char else 10,
            "Discipline": char.discipline if char else 10,
            "Vitality": char.vitality if char else 10,
            "Creativity": char.creativity if char else 10,
            "Social": char.social if char else 10
        }
    }

@app.get("/analytics/ledger")
def get_audit_ledger(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    xp_txs = db.query(models.XPTransaction).filter(models.XPTransaction.user_id == current_user.id).order_by(desc(models.XPTransaction.created_at)).limit(30).all()
    gold_txs = db.query(models.GoldTransaction).filter(models.GoldTransaction.user_id == current_user.id).order_by(desc(models.GoldTransaction.created_at)).limit(30).all()

    return {
        "xp_ledger": [{
            "id": tx.id,
            "amount": tx.amount,
            "source": tx.source,
            "source_id": tx.source_id,
            "created_at": tx.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for tx in xp_txs],
        "gold_ledger": [{
            "id": tx.id,
            "amount": tx.amount,
            "source": tx.source,
            "source_id": tx.source_id,
            "created_at": tx.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for tx in gold_txs]
    }

# =============================================================================
# CHARACTER & BASE BUILDING ENDPOINTS
# =============================================================================

@app.get("/character")
def get_character(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        return {"character": None}
    return {
        "character": {
            "id": char.id,
            "name": char.name,
            "title": char.title,
            "archetype": char.archetype or "WARRIOR",
            "gender": char.gender,
            "lifestyle": char.lifestyle,
            "style": char.style,
            "body_type": char.body_type,
            "height": char.height,
            "build": char.build,
            "skin_color": char.skin_color,
            "face_shape": char.face_shape,
            "eye_shape": char.eye_shape,
            "eye_color": char.eye_color,
            "eyebrows": char.eyebrows,
            "nose_style": char.nose_style,
            "mouth_style": char.mouth_style,
            "expression": char.expression,
            "hair_category": char.hair_category,
            "hair_style": char.hair_style,
            "hair_color": char.hair_color,
            "hair_highlight": char.hair_highlight,
            "top_type": char.top_type,
            "top_color": char.top_color,
            "bottom_type": char.bottom_type,
            "bottom_color": char.bottom_color,
            "shoes_type": char.shoes_type,
            "shoes_color": char.shoes_color,
            "jacket_color": char.jacket_color,
            "palette": char.palette,
            "accessories": char.accessories,
            "aura": char.aura,
            "pose": char.pose,
            "companion": char.companion,
            "gold": char.gold if char.gold is not None else 1000,
            "level": char.level or 1,
            "xp": char.xp or 0,
            "health": char.health or 100,
            "energy": char.energy or 100,
            "focus": char.focus or 50,
            "strength": char.strength or 10,
            "intelligence": char.intelligence or 10,
            "discipline": char.discipline or 10,
            "vitality": char.vitality or 10,
            "creativity": char.creativity or 10,
            "social": char.social or 10,
            "transportation": char.transportation or "Walk",
            "journey_km": char.journey_km or 0,
            "current_zone": char.current_zone or "Forest Road",
            "streak_days": char.streak_days or 1,
            "best_streak": char.best_streak or 1,
            "construction_xp": char.construction_xp or 100,
            "home_level": char.home_level or 1,
            "home_xp": char.home_xp or 0,
            "home_data": char.home_data or "{}"
        }
    }

@app.post("/character")
def save_character(payload: CharacterPayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        char = models.Character(user_id=current_user.id)
        db.add(char)
    
    char_data = payload.model_dump()
    for key, val in char_data.items():
        setattr(char, key, val)
    
    db.commit()
    db.refresh(char)
    return {
        "message": "Character saved successfully",
        "character_id": char.id,
        "gold": char.gold,
        "level": char.level,
        "archetype": char.archetype,
        "transportation": char.transportation,
        "construction_xp": char.construction_xp,
        "home_level": char.home_level
    }

@app.post("/character/transport")
def equip_transport(payload: TransportEquip, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    
    tier = next((t for t in VEHICLE_TIERS if t["name"].lower() == payload.transport.lower()), None)
    if not tier:
        raise HTTPException(status_code=400, detail="Invalid transportation type")
    if char.level < tier["level"]:
        raise HTTPException(status_code=400, detail=f"Requires Level {tier['level']} to equip {tier['name']}")
    
    char.transportation = tier["name"]
    db.commit()
    return {"message": f"Equipped {tier['name']}!", "transportation": char.transportation}

@app.get("/home")
def get_home_data(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        char = models.Character(user_id=current_user.id, name=current_user.name or "Alex", gold=1000, construction_xp=100, home_level=1, home_xp=0)
        db.add(char)
        db.commit()
        db.refresh(char)

    return {
        "home_level": char.home_level or 1,
        "home_xp": char.home_xp or 0,
        "construction_xp": char.construction_xp or 100,
        "gold": char.gold if char.gold is not None else 1000,
        "home_data": char.home_data or "{}",
        "transportation": char.transportation or "Walk"
    }

@app.post("/home/save")
def save_home_data(payload: HomeSavePayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        char = models.Character(user_id=current_user.id, name=current_user.name or "Alex")
        db.add(char)

    char.home_level = payload.home_level
    char.home_xp = payload.home_xp
    if payload.construction_xp is not None:
        char.construction_xp = payload.construction_xp
    if payload.gold is not None:
        char.gold = payload.gold
    char.home_data = payload.home_data

    db.commit()
    db.refresh(char)
    return {
        "message": "Home blueprint saved successfully",
        "home_level": char.home_level,
        "home_xp": char.home_xp,
        "construction_xp": char.construction_xp,
        "gold": char.gold
    }

@app.post("/home/buy-item")
def buy_home_item(payload: HomeBuyPayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    gold = char.gold if char.gold is not None else 1000
    cxp = char.construction_xp or 100

    if gold < payload.coin_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient Coins. Need 🪙 {payload.coin_cost}")
    if cxp < payload.construction_xp_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient Construction XP. Need ⭐ {payload.construction_xp_cost}")

    char.gold = gold - payload.coin_cost
    char.construction_xp = cxp - payload.construction_xp_cost
    
    # Record Base Building gold transaction
    db.add(models.GoldTransaction(user_id=current_user.id, amount=-payload.coin_cost, source="BASE_BUILDING", source_id=payload.item_id))

    home_xp_gain = max(5, int((payload.coin_cost + payload.construction_xp_cost * 2) * 0.2))
    char.home_xp = (char.home_xp or 0) + home_xp_gain

    home_lvl_up = False
    while char.home_xp >= 100:
        char.home_xp -= 100
        char.home_level = (char.home_level or 1) + 1
        home_lvl_up = True

    db.commit()
    db.refresh(char)
    return {
        "message": f"Constructed {payload.item_name}!",
        "new_gold": char.gold,
        "new_construction_xp": char.construction_xp,
        "home_xp": char.home_xp,
        "home_level": char.home_level,
        "home_level_up": home_lvl_up
    }

@app.post("/home/unlock-room")
def unlock_room(payload: HomeUnlockRoomPayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    if (char.home_level or 1) < payload.required_level:
        raise HTTPException(status_code=400, detail=f"Home Level {payload.required_level} required to unlock {payload.room_name}")

    gold = char.gold if char.gold is not None else 1000
    cxp = char.construction_xp or 100

    if gold < payload.coin_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient Coins. Need 🪙 {payload.coin_cost}")
    if cxp < payload.construction_xp_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient Construction XP. Need ⭐ {payload.construction_xp_cost}")

    char.gold = gold - payload.coin_cost
    char.construction_xp = cxp - payload.construction_xp_cost
    char.home_xp = (char.home_xp or 0) + 50

    db.add(models.GoldTransaction(user_id=current_user.id, amount=-payload.coin_cost, source="BASE_BUILDING_ROOM", source_id=payload.room_id))

    # Check first room achievement
    ua = db.query(models.UserAchievement).filter(models.UserAchievement.user_id == current_user.id, models.UserAchievement.slug == "first_room").first()
    if ua and not ua.unlocked:
        ua.unlocked = True
        ua.progress = 1
        ua.unlocked_at = datetime.utcnow()

    db.commit()
    db.refresh(char)
    return {
        "message": f"Successfully constructed room wing: {payload.room_name}!",
        "room_id": payload.room_id,
        "new_gold": char.gold,
        "new_construction_xp": char.construction_xp,
        "home_level": char.home_level
    }

# =============================================================================
# USP 5: WORLD ENGINE & BASE ARCHITECTURE ENDPOINTS
# =============================================================================

@app.get("/base")
def get_base_data(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return get_home_data(db=db, current_user=current_user)

@app.post("/base/save")
def save_base_data(payload: HomeSavePayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return save_home_data(payload=payload, db=db, current_user=current_user)

@app.post("/base/expand")
def expand_base_tier(payload: BaseExpandPayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    cur_level = char.home_level or 1
    req_cxp = cur_level * 50
    req_gold = cur_level * 100

    if (char.construction_xp or 0) < req_cxp:
        raise HTTPException(status_code=400, detail=f"Insufficient Build XP. Need ⭐ {req_cxp} Build XP")
    if (char.gold or 0) < req_gold:
        raise HTTPException(status_code=400, detail=f"Insufficient Coins. Need 🪙 {req_gold} Coins")

    char.construction_xp -= req_cxp
    char.gold -= req_gold
    char.home_level = cur_level + 1
    char.home_xp = 0

    db.add(models.GoldTransaction(user_id=current_user.id, amount=-req_gold, source="BASE_EXPANSION", source_id=f"tier_{char.home_level}"))
    db.add(models.BuildXPTransaction(user_id=current_user.id, amount=-req_cxp, source="BASE_EXPANSION", source_id=f"tier_{char.home_level}"))

    evaluate_user_achievements(db, current_user.id, char)

    db.add(models.AuditLog(
        user_id=current_user.id,
        action="BASE_EXPAND_TIER",
        details=json.dumps({"new_tier": char.home_level, "spent_gold": req_gold, "spent_cxp": req_cxp})
    ))

    db.commit()
    db.refresh(char)

    return {
        "success": True,
        "message": f"Base upgraded to Fortress Tier {char.home_level}!",
        "home_level": char.home_level,
        "new_gold": char.gold,
        "new_construction_xp": char.construction_xp
    }

@app.get("/base/blueprints")
def get_base_blueprints(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    user_level = char.home_level if char else 1

    blueprints = [
        {"id": "bedroom", "name": "Cozy Master Bedroom", "desc": "Restful sanctuary boosting Vitality recovery", "req_level": 1, "gold_cost": 50, "cxp_cost": 20, "unlocked": user_level >= 1},
        {"id": "study", "name": "Scholar Library & Study", "desc": "Knowledge sanctum boosting Focus sprint rewards", "req_level": 2, "gold_cost": 150, "cxp_cost": 60, "unlocked": user_level >= 2},
        {"id": "gym", "name": "Voxel Fitness Dojo", "desc": "Heavy iron setup boosting Physical quest rewards", "req_level": 3, "gold_cost": 300, "cxp_cost": 120, "unlocked": user_level >= 3},
        {"id": "garage", "name": "Vehicle Garage & Workshop", "desc": "Custom bay to park upgraded speed vehicles", "req_level": 4, "gold_cost": 500, "cxp_cost": 200, "unlocked": user_level >= 4},
        {"id": "trophy_room", "name": "Grand Hall of Trophies", "desc": "Gilded podiums displaying lifetime achievements", "req_level": 5, "gold_cost": 800, "cxp_cost": 350, "unlocked": user_level >= 5}
    ]
    return {"blueprints": blueprints, "current_home_level": user_level}

@app.get("/world/state")
def get_world_state(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    char = db.query(models.Character).filter(models.Character.user_id == current_user.id).first()
    return {
        "realm": "ChronoQuest Overworld",
        "current_zone": char.current_zone if char else "Homestead • Scholar Grove",
        "transportation": char.transportation if char else "Walk",
        "journey_km": char.journey_km if char else 0,
        "landmarks": [
            {"id": "home_base", "name": "Your Base", "x": 520, "y": 520, "actionTab": "home"},
            {"id": "scholar_library", "name": "Scholar Academy", "x": 1280, "y": 480, "actionTab": "quests"},
            {"id": "iron_gym", "name": "Iron Gym", "x": 1980, "y": 580, "actionTab": "quests"},
            {"id": "goal_citadel", "name": "Campaign Obelisk", "x": 1450, "y": 1680, "actionTab": "campaigns"}
        ]
    }





