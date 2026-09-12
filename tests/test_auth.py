def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_check_username(client):
    # Empty username
    res = client.get("/check-username?username=")
    assert res.status_code == 200
    assert res.json()["available"] is False

    # Available username
    res = client.get("/check-username?username=merlin")
    assert res.status_code == 200
    assert res.json()["available"] is True


def test_register_password_mismatch(client):
    res = client.post("/register", json={
        "name": "Merlin",
        "email": "merlin@camelot.com",
        "username": "merlin",
        "password": "password123",
        "confirm_password": "different123"
    })
    assert res.status_code == 400
    assert "Passwords do not match" in res.json()["detail"]


def test_register_short_password(client):
    res = client.post("/register", json={
        "name": "Merlin",
        "email": "merlin@camelot.com",
        "username": "merlin",
        "password": "short",
        "confirm_password": "short"
    })
    assert res.status_code == 400
    assert "at least 8 characters" in res.json()["detail"]


def test_register_success_and_duplicates(client):
    payload = {
        "name": "Merlin The Wizard",
        "email": "merlin@camelot.com",
        "username": "merlin",
        "password": "magicalpassword123",
        "confirm_password": "magicalpassword123"
    }
    # Success
    res = client.post("/register", json=payload)
    assert res.status_code == 201
    assert res.json()["message"] == "User created successfully"

    # Duplicate email
    res2 = client.post("/register", json={
        "name": "Merlin Twin",
        "email": "MERLIN@camelot.com",  # Case-insensitive check
        "username": "merlin2",
        "password": "magicalpassword123",
        "confirm_password": "magicalpassword123"
    })
    assert res2.status_code == 400
    assert "email already exists" in res2.json()["detail"]

    # Duplicate username
    res3 = client.post("/register", json={
        "name": "Another Wizard",
        "email": "wizard2@camelot.com",
        "username": "merlin",
        "password": "magicalpassword123",
        "confirm_password": "magicalpassword123"
    })
    assert res3.status_code == 400
    assert "Username already taken" in res3.json()["detail"]


def test_login_flow(client):
    # Register user
    client.post("/register", json={
        "name": "Gawain",
        "email": "gawain@camelot.com",
        "username": "gawain",
        "password": "gawainpassword123",
        "confirm_password": "gawainpassword123"
    })

    # Wrong password
    res_bad = client.post(
        "/login",
        data={"username": "gawain", "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert res_bad.status_code == 401

    # Login with username
    res_ok = client.post(
        "/login",
        data={"username": "gawain", "password": "gawainpassword123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["message"] == "Login successful"
    assert "access_token" in client.cookies
    assert "refresh_token" in client.cookies

    # Access /me
    res_me = client.get("/me")
    assert res_me.status_code == 200
    assert res_me.json()["username"] == "gawain"

    # Refresh token
    res_refresh = client.post("/refresh")
    assert res_refresh.status_code == 200
    assert res_refresh.json()["message"] == "Token refreshed"

    # Logout
    res_logout = client.post("/logout")
    assert res_logout.status_code == 200

    # Unauthenticated /me now returns 401
    res_me_after = client.get("/me")
    assert res_me_after.status_code == 401
