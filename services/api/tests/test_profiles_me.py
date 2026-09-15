"""GET/PUT /profiles/me — happy / edge / failure."""

from __future__ import annotations

from helpers import login


def test_profiles_me_happy_update_and_read(client, register_user):
    register_user()
    token = login(client).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    res = client.put(
        "/profiles/me",
        json={"name": "Camila Ospina", "phone": "+57-300", "address": "Medellín"},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Camila Ospina"
    got = client.get("/profiles/me", headers=headers)
    assert got.status_code == 200
    assert got.json()["address"] == "Medellín"


def test_profiles_me_edge_partial_update(client, register_user):
    register_user()
    token = login(client).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    res = client.put("/profiles/me", json={"phone": "+1-305"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["phone"] == "+1-305"
    assert res.json()["name"] == "Chef Test"


def test_profiles_me_failure_requires_auth(client):
    assert client.get("/profiles/me").status_code == 401
    assert client.put("/profiles/me", json={"name": "X"}).status_code == 401
