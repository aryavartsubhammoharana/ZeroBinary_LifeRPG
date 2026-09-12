import sys
import httpx

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

client = httpx.Client(base_url="http://127.0.0.1:8000")

# 1. Login
login_res = client.post(
    "/login",
    data={"username": "dragon_slayer_99", "password": "mypassword123"},
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)
print("[1] Authentication:")
print(f"    POST /login -> Status: {login_res.status_code} ({login_res.json().get('message')})")

# 2. Check initial profile & attributes
prof = client.get("/api/profile").json()
print("\n[2] Character Sheet & Core RPG Attributes:")
print(f"    Player: {prof['name']} (@{prof['username']}) | Level: {prof['level']} | Title: {prof['rank_title']}")
print(f"    XP: {prof['xp']} / {prof['next_level_xp']} ({prof['progress_pct']}%) | Gold: {prof['coins']} | Streak: {prof['streak']}")
print(f"    • Strength (STR) : {prof['strength']}  [Gym & Workout]")
print(f"    • Knowledge (INT): {prof['knowledge']}  [Study & Reading]")
print(f"    • Vitality (VIT) : {prof['vitality']}  [Cardio & Endurance]")
print(f"    • Willpower (WIL): {prof['willpower']}  [Habits & Focus]")

# 3. Gym Quest -> Strength Increase
gym_q = client.post("/quests", json={
    "title": "Gym Heavy Squats & Bench Press",
    "description": "Leg day workout 5x5 sets with maximum effort",
    "xp_reward": 100
}).json()
print(f"\n[3] Gym Quest Execution:")
print(f"    Created Quest ID={gym_q['id']}: \"{gym_q['title']}\"")
claim_gym = client.post(f"/api/quests/{gym_q['id']}/claim").json()
print("    Claim Rewards Response:")
print(f"    -> Attribute Boost: +{claim_gym['attribute_gain']} {claim_gym['attribute_type'].upper()} (Strength rose from {prof['strength']} to {claim_gym['new_strength']})")
print(f"    -> XP Awarded: +{claim_gym['total_xp_awarded']} (Base: {claim_gym['base_xp']}, Streak Bonus: +{claim_gym['streak_bonus_xp']})")
print(f"    -> Gold Awarded: +{claim_gym['coins_awarded']} Gold")

# 4. Study Quest -> Knowledge Increase
study_q = client.post("/quests", json={
    "title": "Study Distributed Systems Architecture & Algorithms",
    "description": "Read 2 chapters and implement consensus algorithm",
    "xp_reward": 80
}).json()
print(f"\n[4] Study Quest Execution:")
print(f"    Created Quest ID={study_q['id']}: \"{study_q['title']}\"")
claim_study = client.post(f"/api/quests/{study_q['id']}/claim").json()
print("    Claim Rewards Response:")
print(f"    -> Attribute Boost: +{claim_study['attribute_gain']} {claim_study['attribute_type'].upper()} (Knowledge rose from {prof['knowledge']} to {claim_study['new_knowledge']})")
print(f"    -> XP Awarded: +{claim_study['total_xp_awarded']} XP | Gold Awarded: +{claim_study['coins_awarded']} Gold")

# 5. Custom Real-Life Reward System
cust_reward = client.post("/api/rewards/custom", json={
    "title": "Cheat Day Pizza & Movie Night",
    "description": "Large woodfired pizza earned through real-world consistency",
    "cost_coins": 50,
    "icon": "🍕"
}).json()
print(f"\n[5] Custom Real-Life Reward Bazaar:")
print(f"    Created Reward ID={cust_reward['id']}: {cust_reward['icon']} \"{cust_reward['title']}\" (Cost: {cust_reward['cost_coins']} Gold)")
redeem_res = client.post(f"/api/rewards/custom/{cust_reward['id']}/redeem").json()
print("    Redemption Result:")
print(f"    -> {redeem_res['message']}")
print(f"    -> Remaining Gold Balance: {redeem_res['remaining_coins']} Gold")
print(f"    -> Lifetime Redemptions: {redeem_res['total_redeemed']}")

# 6. Immutable Historical Audit Log
history = client.get("/api/quests/history").json()
print(f"\n[6] Immutable Audit Log (Total Logged: {len(history)}):")
for h in history[:3]:
    print(f"    • [{h['completed_at'][:19]}] \"{h['quest_title']}\" -> +{h['attribute_gain']} {h['attribute_type'].upper()} (+{h['xp_awarded']} XP, +{h['coins_awarded']} Gold)")

# 7. Global Leaderboard
lead = client.get("/api/leaderboard").json()
print("\n[7] Global Leaderboard Top Players:")
for p in lead[:3]:
    print(f"    #{p['rank']} {p['name']} (@{p['username']}) — Level {p['level']} | {p['xp']} XP | Title: {p['title']}")

# 8. Web Frontend Endpoint
demo_res = client.get("/demo")
print(f"\n[8] Interactive Frontend Dashboard:")
print(f"    GET /demo -> Status: {demo_res.status_code} OK (HTML Payload: {len(demo_res.text)} bytes)")
print("    Accessible in browser at: http://localhost:8000/demo")

client.close()
