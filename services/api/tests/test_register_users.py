"""POST /users — register happy / edge / failure."""

from __future__ import annotations

from helpers import login


def test_register_happy_path(client):
    res = client.post(
        "/users",
        json={
            "email": "lucia@brasaland.com",
            "password": "GrillHouse1",
            "profile": {"name": "Lucía Fernández"},
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["user"]["email"] == "lucia@brasaland.com"
    assert body["user"]["role"] == "user"
    assert body["profile"]["name"] == "Lucía Fernández"
    assert "hashed_password" not in body["user"]


def test_register_edge_short_password(client):
    res = client.post(
        "/users",
        json={"email": "short@brasaland.com", "password": "short"},
    )
    assert res.status_code == 422


def test_register_failure_duplicate_email(client, register_user):
    register_user()
    res = client.post(
        "/users",
        json={"email": "chef@brasaland.com", "password": "AnotherPass1"},
    )
    assert res.status_code == 400
    assert "Unable to create account" in res.json()["detail"]


def test_get_user_owner_and_list_forbidden(client, register_user):
    created = register_user()
    token = login(client).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    uid = created["user"]["id"]
    got = client.get(f"/users/{uid}", headers=headers)
    assert got.status_code == 200
    assert got.json()["email"] == "chef@brasaland.com"
    assert client.get("/users", headers=headers).status_code == 403
