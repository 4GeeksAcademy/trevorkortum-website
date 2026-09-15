"""POST /auth/change-password — happy / edge / failure."""

from __future__ import annotations

from helpers import login


def test_change_password_happy_path(client, register_user):
    register_user()
    token = login(client).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    ok = client.post(
        "/auth/change-password",
        json={"current_password": "GrillHouse1", "new_password": "NewGrill99"},
        headers=headers,
    )
    assert ok.status_code == 200
    assert login(client, password="NewGrill99").status_code == 200


def test_change_password_edge_invalidates_prior_access_token(client, register_user):
    """Regression: AUTH-088 — old JWTs must not survive password change."""
    register_user()
    old = login(client).json()["access_token"]
    headers = {"Authorization": f"Bearer {old}"}
    assert (
        client.post(
            "/auth/change-password",
            json={"current_password": "GrillHouse1", "new_password": "NewGrill99"},
            headers=headers,
        ).status_code
        == 200
    )
    assert client.get("/auth/me", headers=headers).status_code == 401
    fresh = login(client, password="NewGrill99").json()["access_token"]
    assert (
        client.get("/auth/me", headers={"Authorization": f"Bearer {fresh}"}).status_code
        == 200
    )


def test_change_password_failure_wrong_current(client, register_user):
    register_user()
    token = login(client).json()["access_token"]
    wrong = client.post(
        "/auth/change-password",
        json={"current_password": "nope", "new_password": "NewGrill99"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert wrong.status_code == 400
    assert wrong.json()["detail"] == "Current password is incorrect"
