"""POST /auth/forgot-password — happy / edge / failure (anti-enumeration)."""

from __future__ import annotations


def test_forgot_password_happy_known_email(client, register_user):
    register_user()
    res = client.post(
        "/auth/forgot-password", json={"email": "chef@brasaland.com"}
    )
    assert res.status_code == 200
    assert "reset link has been sent" in res.json()["detail"].lower()


def test_forgot_password_edge_unknown_email_same_body(client, register_user):
    register_user()
    known = client.post(
        "/auth/forgot-password", json={"email": "chef@brasaland.com"}
    )
    unknown = client.post(
        "/auth/forgot-password", json={"email": "ghost@brasaland.com"}
    )
    assert known.status_code == 200
    assert unknown.status_code == 200
    assert known.json() == unknown.json()


def test_forgot_password_failure_invalid_email_schema(client):
    res = client.post("/auth/forgot-password", json={"email": "not-an-email"})
    assert res.status_code == 422
