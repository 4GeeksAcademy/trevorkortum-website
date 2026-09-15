"""Unit tests for security.py business logic (AUTH-088)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

import security


def test_hash_and_verify_password_roundtrip():
    hashed = security.hash_password("GrillHouse1")
    assert hashed != "GrillHouse1"
    assert security.verify_password("GrillHouse1", hashed) is True
    assert security.verify_password("wrong", hashed) is False


def test_verify_password_empty_or_invalid_hash():
    assert security.verify_password("any", "") is False
    assert security.verify_password("any", "not-a-bcrypt-hash") is False


def test_create_access_token_claims_and_expiry():
    token = security.create_access_token("user-1", {"role": "user"})
    payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert payload["sub"] == "user-1"
    assert payload["type"] == "access"
    assert payload["role"] == "user"
    assert "exp" in payload


def test_access_token_rejects_when_expired(monkeypatch):
    monkeypatch.setattr(security, "ACCESS_TOKEN_EXPIRE_MINUTES", -1)
    token = security.create_access_token("user-1")
    with pytest.raises(Exception):
        jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])


def test_create_reset_token_persists_usable_jti(isolated_db):
    token = security.create_reset_token("user-42")
    payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert payload["type"] == "reset"
    assert payload["sub"] == "user-42"
    assert security.is_reset_token_usable(payload["jti"]) is True


def test_reset_token_not_usable_when_used_or_missing(isolated_db):
    token = security.create_reset_token("user-42")
    jti = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])["jti"]
    security.mark_reset_token_used(jti)
    assert security.is_reset_token_usable(jti) is False
    assert security.is_reset_token_usable("missing-jti") is False


def test_reset_token_not_usable_when_expired(isolated_db, monkeypatch):
    past = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    isolated_db["reset_tokens_table"].insert(
        {"jti": "expired-jti", "user_id": "u1", "used": False, "expires_at": past}
    )
    assert security.is_reset_token_usable("expired-jti") is False


def test_public_user_strips_password():
    out = security.public_user(
        {
            "id": "1",
            "email": "a@b.com",
            "hashed_password": "secret",
            "is_active": True,
            "role": "user",
            "created_at": "2026-01-01T00:00:00+00:00",
        }
    )
    assert "hashed_password" not in out
    assert out["email"] == "a@b.com"
