import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Ensure test environment variables
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "test_secret_key_for_unit_tests_32_bytes_long_minimum!"
os.environ["APP_ENV"] = "development"

from database import Base, get_db
import models
from modules import models_ext
from extended_main import app

# Create in-memory SQLite engine for fast, isolated tests
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh tables for each test function and roll back."""
    Base.metadata.create_all(bind=test_engine)
    models_ext.Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)
        models_ext.Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency and rate limiter disabled."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Disable rate limiter for testing
    limiter = getattr(app.state, "limiter", None)
    if limiter:
        limiter.enabled = False

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    if limiter:
        limiter.enabled = True


@pytest.fixture
def auth_client(client):
    """Client with an authenticated test user and active cookies."""
    # Register
    reg_payload = {
        "name": "Knight Arthur",
        "email": "arthur@camelot.com",
        "username": "arthur",
        "password": "strongpassword123",
        "confirm_password": "strongpassword123"
    }
    client.post("/register", json=reg_payload)

    # Login
    login_res = client.post(
        "/login",
        data={"username": "arthur", "password": "strongpassword123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200

    return client


@pytest.fixture
def auth_client_two(client):
    """Second authenticated user for testing row-level isolation."""
    reg_payload = {
        "name": "Sir Lancelot",
        "email": "lancelot@camelot.com",
        "username": "lancelot",
        "password": "strongpassword123",
        "confirm_password": "strongpassword123"
    }
    client.post("/register", json=reg_payload)

    # We return the client and credentials for login switching
    return {
        "username": "lancelot",
        "password": "strongpassword123"
    }
