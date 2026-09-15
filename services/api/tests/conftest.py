"""Isolated TinyDB + TestClient fixtures for AUTH-088."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
from tinydb import TinyDB

# Ensure API root is importable and tests never use the production secret default path.
API_ROOT = Path(__file__).resolve().parents[1]
TESTS_ROOT = Path(__file__).resolve().parent
for path in (API_ROOT, TESTS_ROOT):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

os.environ.setdefault("ENV", "test")
os.environ.setdefault("SECRET_KEY", "auth-088-test-secret-key")
os.environ.setdefault("RESEND_API_KEY", "")


@pytest.fixture()
def isolated_db(tmp_path, monkeypatch):
    db = TinyDB(tmp_path / "auth_test.json")
    tables = {
        "users_table": db.table("users"),
        "profiles_table": db.table("profiles"),
        "reset_tokens_table": db.table("reset_tokens"),
    }
    for mod_name in (
        "database",
        "security",
        "routes.auth",
        "routes.users",
        "routes.profiles",
    ):
        mod = __import__(mod_name, fromlist=["*"])
        for attr, table in tables.items():
            if hasattr(mod, attr):
                monkeypatch.setattr(mod, attr, table)
    yield tables
    db.close()


@pytest.fixture()
def client(isolated_db):
    from fastapi.testclient import TestClient
    from main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def register_user(client):
    def _register(
        email: str = "chef@brasaland.com",
        password: str = "GrillHouse1",
        name: str = "Chef Test",
    ) -> dict:
        res = client.post(
            "/users",
            json={
                "email": email,
                "password": password,
                "profile": {"name": name, "phone": None, "address": None},
            },
        )
        assert res.status_code == 201, res.text
        return res.json()

    return _register
