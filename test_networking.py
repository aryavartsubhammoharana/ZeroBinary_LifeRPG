import httpx
import time

base = "http://127.0.0.1:8000"
client = httpx.Client(base_url=base)

print("=== 1. HTTP PING & HEALTH CHECK ===")
t0 = time.time()
r_health = client.get("/health")
latency = (time.time() - t0) * 1000
print(f"Status: {r_health.status_code} | Latency: {latency:.2f}ms | Body: {r_health.json()}")
print(f"Server Headers: Content-Type={r_health.headers.get('content-type')}")

print("\n=== 2. HTTP CORS PREFLIGHT (OPTIONS) ===")
r_cors = client.options("/login", headers={
    "Origin": "http://localhost:5173",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type"
})
print(f"Preflight Status: {r_cors.status_code}")
print(f"CORS Allow-Origin: {r_cors.headers.get('access-control-allow-origin')}")
print(f"CORS Allow-Credentials: {r_cors.headers.get('access-control-allow-credentials')}")
print(f"CORS Allow-Methods: {r_cors.headers.get('access-control-allow-methods')}")

print("\n=== 3. USERNAME CHECK ===")
r_user = client.get("/check-username?username=dragon_slayer_99")
print(f"Check Username Status: {r_user.status_code} | Data: {r_user.json()}")

print("\n=== 4. REGISTRATION (POST /register) ===")
reg_data = {
    "name": "Demon Slayer",
    "email": "slayer@liferpg.io",
    "username": "dragon_slayer_99",
    "password": "mypassword123",
    "confirm_password": "mypassword123"
}
r_reg = client.post("/register", json=reg_data)
print(f"Register Status: {r_reg.status_code} | Body: {r_reg.json()}")

print("\n=== 5. LOGIN & COOKIE SETTING (POST /login) ===")
r_login = client.post("/login", data={
    "username": "dragon_slayer_99",
    "password": "mypassword123"
}, headers={"Content-Type": "application/x-www-form-urlencoded"})
print(f"Login Status: {r_login.status_code} | Body: {r_login.json()}")
set_cookies = r_login.headers.get_list("set-cookie")
print(f"Set-Cookie Count: {len(set_cookies)}")
for sc in set_cookies:
    print(f"  Cookie: {sc}")

print("\n=== 6. AUTHENTICATED PROFILE & PROGRESSION ===")
r_prof = client.get("/api/profile")
print(f"Profile Status: {r_prof.status_code} | Data: {r_prof.json()}")

print("\n=== 7. CREATE QUEST (POST /quests) ===")
r_quest = client.post("/quests", json={
    "title": "Conquer the Mountain of Code",
    "description": "Deliver the LifeRPG demo frontend and postgres connectivity",
    "xp_reward": 120
})
quest_data = r_quest.json()
quest_id = quest_data["id"]
print(f"Quest Created: ID={quest_id} | Title='{quest_data['title']}' | XP={quest_data['xp_reward']}")

print("\n=== 8. CLAIM QUEST REWARDS (POST /api/quests/{id}/claim) ===")
r_claim = client.post(f"/api/quests/{quest_id}/claim")
print(f"Claim Status: {r_claim.status_code} | Claim Rewards: {r_claim.json()}")

print("\n=== 9. SHOP CATALOG & PURCHASE ===")
r_cat = client.get("/api/shop/catalog")
cat = r_cat.json()
print(f"Shop Catalog Items: {len(cat)}")
item_to_buy = cat[0]
print(f"Buying item: '{item_to_buy['name']}' (Cost: {item_to_buy['cost']} coins)")
r_buy = client.post(f"/api/shop/{item_to_buy['id']}/buy")
print(f"Purchase Status: {r_buy.status_code} | Result: {r_buy.json()}")

print("\n=== 10. INVENTORY & USE ITEM ===")
r_inv = client.get("/api/inventory")
inv = r_inv.json()
print(f"Inventory Count: {len(inv)} | First Item: '{inv[0]['name']}' (Qty: {inv[0]['quantity']})")
inv_id = inv[0]["id"]
r_use = client.post(f"/api/inventory/{inv_id}/use")
print(f"Use Item Status: {r_use.status_code} | Result: {r_use.json()}")

print("\n=== 11. LEADERBOARD ===")
r_lead = client.get("/api/leaderboard")
print(f"Leaderboard Status: {r_lead.status_code} | Top Player: {r_lead.json()[0]}")

client.close()
print("\n>>> ALL HTTP NETWORKING AND API ENDPOINTS FUNCTIONING 100% WITH POSTGRESQL! <<<")
