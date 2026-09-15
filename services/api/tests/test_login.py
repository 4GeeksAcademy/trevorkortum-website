"""POST /auth/login — happy / edge / failure."""

from __future__ import annotations

from jose import jwt
from tinydb import Query

import security
from helpers import login


def test_login_happy_path_issues_access_token(client, register_user):
    register_user()
    res = login(client)
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    claims = jwt.decode(
        body["access_token"], security.SECRET_KEY, algorithms=[security.ALGORITHM]
    )
    assert claims["type"] == "access"
    assert claims["role"] == "user"
    assert "tv" in claims


def test_login_edge_empty_password(client, register_user):
    register_user()
    assert login(client, password="").status_code == 401


def test_login_failure_wrong_password_and_inactive(
    client, register_user, isolated_db
):
    created = register_user()
    wrong = login(client, password="wrong")
    assert wrong.status_code == 401
    assert wrong.json()["detail"] == "Invalid credentials"

    isolated_db["users_table"].update(
        {"is_active": False}, Query().id == created["user"]["id"]
    )
    inactive = login(client)
    assert inactive.status_code == 401
    assert inactive.json()["detail"] == "Invalid credentials"
