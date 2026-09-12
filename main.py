from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

import models
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

IS_PRODUCTION = os.getenv("APP_ENV", "development").lower() == "production"
COOKIE_SAMESITE = "none" if IS_PRODUCTION else "lax"
COOKIE_SECURE = IS_PRODUCTION
CORS_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="LifeRPG Auth API")
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

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

@app.get("/health")
def health_check():
    return {"status": "ok"}

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str
    confirm_password: str

class ItemCreate(BaseModel):
    title: str

class QuestCreate(BaseModel):
    title: str
    description: str = ""
    xp_reward: int = 0

class QuestUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    xp_reward: int | None = None

class ShopPurchase(BaseModel):
    item_id: int

@app.get("/check-username")
@limiter.limit("20/minute")
def check_username(request: Request, username: str, db: Session = Depends(get_db)):
    clean_username = username.strip()
    if not clean_username:
        return {"available": False, "detail": "Username cannot be empty"}
    existing = db.query(models.User).filter(models.User.username == clean_username).first()
    return {"available": existing is None}

@app.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
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
    return {"message": "User created successfully"}

@app.post("/login")
@limiter.limit("5/minute")
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
@limiter.limit("10/minute")
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

@app.post("/items", status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_item = models.Item(title=item.title, owner_id=current_user.id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"id": new_item.id, "title": new_item.title}

@app.get("/items")
def read_items(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    items = db.query(models.Item).filter(models.Item.owner_id == current_user.id).all()
    return [{"id": item.id, "title": item.title} for item in items]

@app.get("/me")
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "username": current_user.username
    }

@app.post("/quests", status_code=status.HTTP_201_CREATED)
def create_quest(quest: QuestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_quest = models.Quest(
        title=quest.title,
        description=quest.description,
        xp_reward=quest.xp_reward,
        owner_id=current_user.id
    )
    db.add(new_quest)
    db.commit()
    db.refresh(new_quest)
    return {"id": new_quest.id, "title": new_quest.title, "description": new_quest.description, "xp_reward": new_quest.xp_reward, "completed": new_quest.completed}

@app.get("/quests")
def read_quests(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    quests = db.query(models.Quest).filter(models.Quest.owner_id == current_user.id).all()
    return [{"id": q.id, "title": q.title, "description": q.description, "xp_reward": q.xp_reward, "completed": q.completed} for q in quests]

@app.patch("/quests/{quest_id}")
def update_quest(quest_id: int, payload: QuestUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id, models.Quest.owner_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if payload.title is not None:
        quest.title = payload.title
    if payload.description is not None:
        quest.description = payload.description
    if payload.xp_reward is not None:
        quest.xp_reward = payload.xp_reward
    db.commit()
    db.refresh(quest)
    return {"id": quest.id, "title": quest.title, "description": quest.description, "xp_reward": quest.xp_reward, "completed": quest.completed}

@app.delete("/quests/{quest_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quest(quest_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id, models.Quest.owner_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    db.delete(quest)
    db.commit()

@app.post("/quests/{quest_id}/complete")
def complete_quest(quest_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    quest = db.query(models.Quest).filter(models.Quest.id == quest_id, models.Quest.owner_id == current_user.id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.completed:
        raise HTTPException(status_code=400, detail="Quest already completed")
    quest.completed = True
    db.commit()
    db.refresh(quest)
    return {"message": "Quest completed", "xp_reward": quest.xp_reward, "quest_id": quest.id}

@app.get("/shop")
def list_shop(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    items = db.query(models.ShopItem).all()
    return [{"id": i.id, "name": i.name, "description": i.description, "cost": i.cost} for i in items]

@app.post("/shop/purchase")
def purchase_item(payload: ShopPurchase, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    item = db.query(models.ShopItem).filter(models.ShopItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Shop item not found")
    return {"message": f"Purchased '{item.name}'", "cost": item.cost, "item_id": item.id}
