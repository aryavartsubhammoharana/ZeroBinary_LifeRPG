import models


def test_rpg_profile_initial_state(auth_client):
    res = auth_client.get("/api/profile")
    assert res.status_code == 200
    data = res.json()
    assert data["level"] == 1
    assert data["xp"] == 0
    assert data["coins"] == 50  # Starting bonus
    assert data["streak"] == 0
    assert data["rank_title"] == "Novice Adventurer"
    assert data["username"] == "arthur"


def test_rpg_quest_claim_and_progression(auth_client):
    # 1. Create a high XP quest
    q_res = auth_client.post("/quests", json={
        "title": "Conquer the Codebase Dungeon",
        "description": "Refactor and test the entire backend architecture",
        "xp_reward": 150
    })
    quest_id = q_res.json()["id"]

    # 2. Claim the quest
    claim_res = auth_client.post(f"/api/quests/{quest_id}/claim")
    assert claim_res.status_code == 200
    claim_data = claim_res.json()

    assert claim_data["quest_id"] == quest_id
    assert claim_data["base_xp"] == 150
    assert claim_data["total_xp_awarded"] >= 150
    assert claim_data["coins_awarded"] >= 75
    assert claim_data["streak"] == 1

    # Should have unlocked first quest achievement
    unlocked = claim_data["unlocked_achievements"]
    assert any(a["code"] == "FIRST_QUEST" for a in unlocked)

    # 3. Check updated profile
    prof_res = auth_client.get("/api/profile")
    prof_data = prof_res.json()
    assert prof_data["xp"] >= 150
    assert prof_data["coins"] >= 50 + 75  # original 50 + coins awarded
    assert prof_data["completed_quests_count"] == 1

    # 4. Cannot claim twice
    dup_res = auth_client.post(f"/api/quests/{quest_id}/claim")
    assert dup_res.status_code == 400


def test_quest_summary(auth_client):
    # Create 2 quests, complete 1
    q1 = auth_client.post("/quests", json={"title": "Q1", "xp_reward": 40}).json()["id"]
    auth_client.post("/quests", json={"title": "Q2", "xp_reward": 60})

    auth_client.post(f"/api/quests/{q1}/claim")

    res = auth_client.get("/api/quests/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_quests"] == 2
    assert data["completed_quests"] == 1
    assert data["active_quests"] == 1
    assert data["completion_rate_pct"] == 50.0
    assert data["total_xp_earned"] == 40


def test_shop_and_inventory_system(auth_client, db_session):
    # Add shop items to DB
    potion = models.ShopItem(name="Test Potion of Health", description="Restores 30 XP", cost=20)
    legendary_armor = models.ShopItem(name="Excalibur Armor", description="Very costly", cost=9999)
    db_session.add(potion)
    db_session.add(legendary_armor)
    db_session.commit()
    db_session.refresh(potion)
    db_session.refresh(legendary_armor)

    # 1. View shop catalog
    cat_res = auth_client.get("/api/shop/catalog")
    assert cat_res.status_code == 200
    catalog = cat_res.json()
    assert any(item["id"] == potion.id and item["can_afford"] is True for item in catalog)
    assert any(item["id"] == legendary_armor.id and item["can_afford"] is False for item in catalog)

    # 2. Buy potion (costs 20 coins, user has 50)
    buy_res = auth_client.post(f"/api/shop/{potion.id}/buy")
    assert buy_res.status_code == 200
    assert buy_res.json()["remaining_coins"] == 30

    # 3. Verify item in inventory
    inv_res = auth_client.get("/api/inventory")
    assert inv_res.status_code == 200
    inv = inv_res.json()
    assert len(inv) == 1
    assert inv[0]["name"] == "Test Potion of Health"
    assert inv[0]["quantity"] == 1
    inv_item_id = inv[0]["id"]

    # 4. Use potion from inventory
    use_res = auth_client.post(f"/api/inventory/{inv_item_id}/use")
    assert use_res.status_code == 200
    assert "Granted +30 XP" in use_res.json()["message"]

    # Inventory is now empty (consumed)
    inv_after = auth_client.get("/api/inventory").json()
    assert len(inv_after) == 0

    # 5. Attempt to buy unaffordable item -> 400
    fail_res = auth_client.post(f"/api/shop/{legendary_armor.id}/buy")
    assert fail_res.status_code == 400
    assert "Insufficient coins" in fail_res.json()["detail"]


def test_leaderboard(auth_client, auth_client_two):
    # Arthur claims a quest
    q = auth_client.post("/quests", json={"title": "Arthur's Quest", "xp_reward": 500}).json()["id"]
    auth_client.post(f"/api/quests/{q}/claim")

    # Check leaderboard
    lead_res = auth_client.get("/api/leaderboard")
    assert lead_res.status_code == 200
    board = lead_res.json()
    assert len(board) >= 1
    top_player = board[0]
    assert top_player["username"] == "arthur"
    assert top_player["xp"] >= 500


def test_gym_increases_strength(auth_client):
    # Initial strength is 10
    init_prof = auth_client.get("/api/profile").json()
    init_str = init_prof["strength"]

    # Create Gym quest
    q = auth_client.post("/quests", json={
        "title": "Gym Heavy Squats & Bench Press",
        "description": "Leg day workout 5x5 sets",
        "xp_reward": 100
    }).json()["id"]

    # Claim quest
    claim_res = auth_client.post(f"/api/quests/{q}/claim")
    assert claim_res.status_code == 200
    claim_data = claim_res.json()

    assert claim_data["attribute_type"] == "strength"
    assert claim_data["attribute_gain"] >= 4
    assert claim_data["new_strength"] == init_str + claim_data["attribute_gain"]

    # Profile verifies updated strength
    prof = auth_client.get("/api/profile").json()
    assert prof["strength"] == claim_data["new_strength"]


def test_study_increases_knowledge(auth_client):
    # Initial knowledge is 10
    init_prof = auth_client.get("/api/profile").json()
    init_know = init_prof["knowledge"]

    # Create Study quest
    q = auth_client.post("/quests", json={
        "title": "Study Python Systems Architecture & Algorithms",
        "description": "Read chapter 4 and solve 3 LeetCode problems",
        "xp_reward": 75
    }).json()["id"]

    # Claim quest
    claim_res = auth_client.post(f"/api/quests/{q}/claim")
    assert claim_res.status_code == 200
    claim_data = claim_res.json()

    assert claim_data["attribute_type"] == "knowledge"
    assert claim_data["attribute_gain"] >= 3
    assert claim_data["new_knowledge"] == init_know + claim_data["attribute_gain"]

    # Profile verifies updated knowledge
    prof = auth_client.get("/api/profile").json()
    assert prof["knowledge"] == claim_data["new_knowledge"]


def test_custom_rewards_and_redemption(auth_client):
    # Create custom real-life reward
    create_res = auth_client.post("/api/rewards/custom", json={
        "title": "1 Hour Guilt-Free Gaming",
        "description": "Play favorite RPG without worrying about work",
        "cost_coins": 20,
        "icon": "🎮"
    })
    assert create_res.status_code == 201
    reward_id = create_res.json()["id"]

    # List rewards
    list_res = auth_client.get("/api/rewards/custom")
    assert list_res.status_code == 200
    assert any(r["id"] == reward_id for r in list_res.json())

    # Redeem reward (Arthur has initial 50 coins, costs 20 -> 30 left)
    redeem_res = auth_client.post(f"/api/rewards/custom/{reward_id}/redeem")
    assert redeem_res.status_code == 200
    assert redeem_res.json()["remaining_coins"] >= 0
    assert redeem_res.json()["total_redeemed"] == 1

    # Check history
    hist_res = auth_client.get("/api/quests/history")
    assert hist_res.status_code == 200


def test_daily_login_streak(auth_client):
    # 1. Claim Day 1 login reward
    res = auth_client.post("/api/profile/claim-daily-login")
    assert res.status_code == 200
    data = res.json()
    assert data["already_claimed"] is False
    assert data["login_streak"] == 1
    assert data["cycle_day"] == 1
    assert data["xp_awarded"] == 25
    assert data["coins_awarded"] == 15

    # 2. Attempt to claim again on the same day -> already claimed
    dup_res = auth_client.post("/api/profile/claim-daily-login")
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["already_claimed"] is True
    assert dup_data["login_streak"] == 1
    assert dup_data["xp_awarded"] == 0

    # 3. Profile shows claimed today
    prof = auth_client.get("/api/profile").json()
    assert prof["daily_login_claimed_today"] is True
    assert prof["login_streak"] == 1
