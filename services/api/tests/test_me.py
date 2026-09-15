"""GET /auth/me — happy / edge / failure."""

from __future__ import annotations

import security
from helpers import login


def test_me_happy_path_returns_user_and_profile(client, register_user):
    register_user()
    token = login(client).json()["access_token"]
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "chef@brasaland.com"
    assert data["profile"]["name"] == "Chef Test"
    assert "hashed_password" not in data["user"]


def test_me_edge_reset_token_rejected_as_bearer(client, register_user):
    created = register_user()
    reset = security.create_reset_token(created["user"]["id"])
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {reset}"})
    assert res.status_code == 401


def test_me_failure_missing_or_expired_token(client, register_user, monkeypatch):
    created = register_user()
    assert client.get("/auth/me").status_code == 401

    monkeypatch.setattr(security, "ACCESS_TOKEN_EXPIRE_MINUTES", -1)
    expired = security.create_access_token(
        created["user"]["id"], {"role": "user", "tv": 0}
    )
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {expired}"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid or expired token"
