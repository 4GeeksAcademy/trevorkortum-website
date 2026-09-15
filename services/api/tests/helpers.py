"""Shared helpers for AUTH-088 route tests."""

from __future__ import annotations


def login(client, email: str = "chef@brasaland.com", password: str = "GrillHouse1"):
    return client.post("/auth/login", json={"email": email, "password": password})
