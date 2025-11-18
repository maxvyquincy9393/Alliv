import pytest
from httpx import AsyncClient
from bson import ObjectId

@pytest.mark.asyncio
async def test_full_user_journey(client: AsyncClient, db):
    """
    Test the full user journey:
    1. Register User A & User B
    2. User A updates profile
    3. User A creates a post
    4. User B likes the post
    5. User B sends connection request to User A
    6. User A accepts connection request
    7. User A sends message to User B
    8. Check stats
    """
    
    # --- 1. Registration ---
    user_a_data = {
        "email": "alice@example.com",
        "password": "Password123!",
        "name": "Alice Engineer"
    }
    user_b_data = {
        "email": "bob@example.com",
        "password": "Password123!",
        "name": "Bob Designer"
    }
    
    # Register User A
    resp_a = await client.post("/auth/register", json=user_a_data)
    assert resp_a.status_code == 201
    token_a = resp_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    user_a_id = resp_a.json()["user"]["id"]

    # Register User B
    resp_b = await client.post("/auth/register", json=user_b_data)
    assert resp_b.status_code == 201
    token_b = resp_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    user_b_id = resp_b.json()["user"]["id"]
    
    print("\n[OK] Users registered")

    # --- 2. Profile Update (User A) ---
    profile_update = {
        "role": "Senior Backend Dev",
        "field": "Software Development",
        "skills": ["Python", "FastAPI", "MongoDB"],
        "bio": "Building scalable systems."
    }
    resp = await client.put("/profile/me", json=profile_update, headers=headers_a)
    assert resp.status_code == 200
    assert resp.json()["role"] == "Senior Backend Dev"
    
    print("[OK] Profile updated")

    # --- 3. Create Post (User A) ---
    post_data = {
        "type": "update",
        "content": {"text": "Just launched the new API!"},
        "visibility": "public",
        "tags": ["api", "launch"]
    }
    resp = await client.post("/api/feed/", json=post_data, headers=headers_a)
    assert resp.status_code == 200
    post_id = resp.json()["_id"]
    
    print(f"[OK] Post created: {post_id}")

    # --- 4. Like Post (User B) ---
    resp = await client.post(f"/api/feed/{post_id}/engage", json={"action": "like"}, headers=headers_b)
    assert resp.status_code == 200
    
    # Verify like count
    resp = await client.get("/api/feed/", headers=headers_a)
    posts = resp.json()
    target_post = next(p for p in posts if p["_id"] == post_id)
    assert target_post["engagement"]["likes"] == 1
    
    print("[OK] Post liked")

    # --- 5. Connection Request (User B -> User A) ---
    conn_req = {
        "user_id": user_a_id,
        "connection_type": "professional",
        "notes": "Let's connect!"
    }
    # Note: The current implementation in connections.py creates a direct connection for simplicity
    # In a real app, this might be a request first. The current code does:
    # result = await connections_collection.insert_one(connection_doc)
    # So it's auto-accepted/created. Let's verify that.
    
    resp = await client.post("/api/connections/", json=conn_req, headers=headers_b)
    assert resp.status_code == 200
    
    print("[OK] Connection created")

    # --- 6. Verify Connection (User A) ---
    resp = await client.get("/api/connections/", headers=headers_a)
    assert resp.status_code == 200
    connections = resp.json()
    assert len(connections) >= 1
    assert connections[0]["user"]["id"] == user_b_id
    
    print("[OK] Connection verified")

    # --- 7. Send Message (User A -> User B) ---
    # First, we need a match_id. In this system, connections might not automatically create a "match" object 
    # for the chat system unless we use the 'swipes' flow or if 'connections' syncs with 'matches'.
    # Let's check if we can create a message directly or if we need to create a match first.
    # The chat endpoint requires a `match_id`.
    # Let's simulate a match creation for these two users.
    
    # Create a match directly in DB for testing chat (bypassing swipe logic for now)
    match_doc = {
        "users": [user_a_id, user_b_id],
        "status": "matched",
        "created_at": "2023-01-01T00:00:00"
    }
    match_res = await db.matches.insert_one(match_doc)
    match_id = str(match_res.inserted_id)
    
    msg_data = {"content": "Hello Bob!"}
    resp = await client.post(f"/chats/{match_id}/messages", json=msg_data, headers=headers_a)
    assert resp.status_code == 200
    assert resp.json()["content"] == "Hello Bob!"
    
    print(f"[OK] Message sent in match {match_id}")

    # --- 8. Check Stats ---
    resp = await client.get("/api/connections/stats", headers=headers_a)
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_connections"] >= 1
    
    print("[OK] Stats verified")
    print("\n[SUCCESS] Full User Journey Test Passed!")
