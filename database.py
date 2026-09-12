import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./liferpg.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def auto_migrate():
    if not DATABASE_URL.startswith("sqlite"):
        return
    import sqlite3
    db_path = DATABASE_URL.replace("sqlite:///", "").replace("sqlite://", "")
    if not os.path.exists(db_path):
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(characters)")
        cols = [c[1] for c in cursor.fetchall()]
        if cols:
            char_additions = [
                ("gold", "INTEGER DEFAULT 1000"),
                ("companion", "VARCHAR DEFAULT 'None'"),
                ("knowledge", "INTEGER DEFAULT 15"),
                ("fitness", "INTEGER DEFAULT 10"),
                ("vitality", "INTEGER DEFAULT 20"),
                ("finance", "INTEGER DEFAULT 5"),
                ("transportation", "VARCHAR DEFAULT 'Walk'"),
                ("journey_km", "INTEGER DEFAULT 0"),
                ("current_zone", "VARCHAR DEFAULT 'Forest Road'"),
                ("streak_days", "INTEGER DEFAULT 1"),
                ("construction_xp", "INTEGER DEFAULT 100"),
                ("home_level", "INTEGER DEFAULT 1"),
                ("home_xp", "INTEGER DEFAULT 0"),
                ("home_data", "TEXT DEFAULT '{}'")
            ]
            for col_name, col_def in char_additions:
                if col_name not in cols:
                    cursor.execute(f"ALTER TABLE characters ADD COLUMN {col_name} {col_def}")
        
        cursor.execute("PRAGMA table_info(quests)")
        q_cols = [c[1] for c in cursor.fetchall()]
        if q_cols:
            quest_additions = [
                ("gold_reward", "INTEGER DEFAULT 50"),
                ("xp_reward", "INTEGER DEFAULT 25"),
                ("category", "VARCHAR DEFAULT 'School'"),
                ("difficulty", "VARCHAR DEFAULT 'EASY'"),
                ("stat_type", "VARCHAR DEFAULT 'knowledge'"),
                ("stat_val", "INTEGER DEFAULT 5")
            ]
            for col_name, col_def in quest_additions:
                if col_name not in q_cols:
                    cursor.execute(f"ALTER TABLE quests ADD COLUMN {col_name} {col_def}")
        conn.commit()
    except Exception as e:
        print("Auto migrate exception:", e)
    finally:
        conn.close()

auto_migrate()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
