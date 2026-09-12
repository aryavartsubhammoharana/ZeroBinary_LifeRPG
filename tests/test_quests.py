def test_quest_lifecycle(auth_client):
    # 1. Create Quest
    create_res = auth_client.post("/quests", json={
        "title": "Slay the Procrastination Dragon",
        "description": "Study 2 hours without phone distractions",
        "xp_reward": 50
    })
    assert create_res.status_code == 201
    quest_data = create_res.json()
    assert quest_data["title"] == "Slay the Procrastination Dragon"
    assert quest_data["xp_reward"] == 50
    assert quest_data["completed"] is False
    quest_id = quest_data["id"]

    # 2. Read Quests
    list_res = auth_client.get("/quests")
    assert list_res.status_code == 200
    quests = list_res.json()
    assert len(quests) == 1
    assert quests[0]["id"] == quest_id

    # 3. Patch Quest
    patch_res = auth_client.patch(f"/quests/{quest_id}", json={
        "title": "Slay the Procrastination Dragon (Updated)",
        "xp_reward": 60
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Slay the Procrastination Dragon (Updated)"
    assert patch_res.json()["xp_reward"] == 60

    # 4. Complete Quest (original endpoint)
    complete_res = auth_client.post(f"/quests/{quest_id}/complete")
    assert complete_res.status_code == 200
    assert complete_res.json()["message"] == "Quest completed"

    # Cannot complete twice
    dup_res = auth_client.post(f"/quests/{quest_id}/complete")
    assert dup_res.status_code == 400

    # 5. Delete Quest
    del_res = auth_client.delete(f"/quests/{quest_id}")
    assert del_res.status_code == 204


def test_quest_data_isolation(auth_client, auth_client_two):
    # User A creates a quest
    create_res = auth_client.post("/quests", json={
        "title": "Arthur's Secret Holy Grail Quest",
        "description": "Classified knight information",
        "xp_reward": 100
    })
    quest_id = create_res.json()["id"]

    # Switch session to User B (Lancelot)
    auth_client.post("/logout")
    login_res = auth_client.post(
        "/login",
        data={"username": auth_client_two["username"], "password": auth_client_two["password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200

    # User B lists quests -> should be empty
    list_res = auth_client.get("/quests")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 0

    # User B attempts to access Arthur's quest -> 404 (prevents data enumeration)
    patch_res = auth_client.patch(f"/quests/{quest_id}", json={"title": "Hacked Title"})
    assert patch_res.status_code == 404

    del_res = auth_client.delete(f"/quests/{quest_id}")
    assert del_res.status_code == 404

    comp_res = auth_client.post(f"/quests/{quest_id}/complete")
    assert comp_res.status_code == 404


def test_items_endpoints(auth_client):
    create_res = auth_client.post("/items", json={"title": "Excalibur"})
    assert create_res.status_code == 201
    assert create_res.json()["title"] == "Excalibur"

    read_res = auth_client.get("/items")
    assert read_res.status_code == 200
    assert any(item["title"] == "Excalibur" for item in read_res.json())
