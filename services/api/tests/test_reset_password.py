"""POST /auth/reset-password — happy / edge / failure."""

from __future__ import annotations

import security
from helpers import login


def test_reset_password_happy_and_single_use(client, register_user):
    created = register_user()
    token = security.create_reset_token(created["user"]["id"])
    first = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "NewGrill99"},
    )
    assert first.status_code == 200
    assert login(client, password="NewGrill99").status_code == 200

    second = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "Another99x"},
    )
    assert second.status_code == 400
    detail = second.json()["detail"].lower()
    assert "already used" in detail or "expired" in detail


def test_reset_password_edge_short_new_password(client):
    res = client.post(
        "/auth/reset-password",
        json={"token": "not-a-jwt", "new_password": "short"},
    )
    assert res.status_code == 422


def test_reset_password_failure_access_token_or_garbage(client, register_user):
    created = register_user()
    access = security.create_access_token(created["user"]["id"])
    bad_type = client.post(
        "/auth/reset-password",
        json={"token": access, "new_password": "NewGrill99"},
    )
    assert bad_type.status_code == 400
    garbage = client.post(
        "/auth/reset-password",
        json={"token": "definitely-not-a-jwt", "new_password": "NewGrill99"},
    )
    assert garbage.status_code == 400
