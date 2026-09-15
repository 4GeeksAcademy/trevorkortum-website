"""User CRUD routes (TinyDB)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from tinydb import Query

from database import profiles_table, users_table
from models import MeResponse, ProfileOut, UserCreate, UserOut, UserRole, UserUpdate
from security import (
    get_current_user,
    get_profile_by_user_id,
    get_user_by_email,
    get_user_by_id,
    hash_password,
    public_user,
)

router = APIRouter(prefix="/users", tags=["users"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _profile_out(user_id: str) -> Optional[ProfileOut]:
    profile = get_profile_by_user_id(user_id)
    if not profile:
        return None
    Profile = Query()
    rows = profiles_table.search(Profile.user_id == user_id)
    return ProfileOut(
        id=rows[0].doc_id if rows else 0,
        user_id=profile["user_id"],
        name=profile.get("name"),
        phone=profile.get("phone"),
        address=profile.get("address"),
    )


def _assert_owner_or_admin(current: dict, user_id: str) -> None:
    if current.get("role") == "admin" or current["id"] == user_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("", response_model=MeResponse, status_code=201)
@router.post("/", response_model=MeResponse, status_code=201, include_in_schema=False)
def create_user(payload: UserCreate) -> MeResponse:
    if get_user_by_email(str(payload.email)):
        raise HTTPException(
            status_code=400,
            detail="Unable to create account with the provided details",
        )

    user_id = str(uuid4())
    user_doc = {
        "id": user_id,
        "email": str(payload.email).lower(),
        "hashed_password": hash_password(payload.password),
        "is_active": True,
        "role": UserRole.user.value,
        "created_at": _now(),
    }
    try:
        users_table.insert(user_doc)
        profile_data = payload.profile
        profiles_table.insert(
            {
                "user_id": user_id,
                "name": profile_data.name if profile_data else None,
                "phone": profile_data.phone if profile_data else None,
                "address": profile_data.address if profile_data else None,
            }
        )
    except OSError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc

    return MeResponse(user=UserOut(**public_user(user_doc)), profile=_profile_out(user_id))


@router.get("", response_model=List[UserOut])
@router.get("/", response_model=List[UserOut], include_in_schema=False)
def list_users(current_user: dict = Depends(get_current_user)) -> List[UserOut]:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    try:
        rows = users_table.all()
    except OSError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc
    return [UserOut(**public_user(dict(row))) for row in rows]


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, current_user: dict = Depends(get_current_user)) -> UserOut:
    _assert_owner_or_admin(current_user, user_id)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(**public_user(user))


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    current_user: dict = Depends(get_current_user),
) -> UserOut:
    _assert_owner_or_admin(current_user, user_id)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = payload.model_dump(exclude_unset=True)
    if "role" in updates and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can change roles")
    if "is_active" in updates and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can change active state")
    if "role" in updates and hasattr(updates["role"], "value"):
        updates["role"] = updates["role"].value
    if "email" in updates:
        updates["email"] = str(updates["email"]).lower()

    User = Query()
    try:
        rows = users_table.search(User.id == user_id)
        if not rows:
            raise HTTPException(status_code=404, detail="User not found")
        users_table.update(updates, doc_ids=[rows[0].doc_id])
    except OSError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc
    updated = get_user_by_id(user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(**public_user(updated))


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: str, current_user: dict = Depends(get_current_user)) -> Response:
    _assert_owner_or_admin(current_user, user_id)
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    User = Query()
    try:
        rows = users_table.search(User.id == user_id)
        users_table.remove(doc_ids=[rows[0].doc_id])
        Profile = Query()
        for row in profiles_table.search(Profile.user_id == user_id):
            profiles_table.remove(doc_ids=[row.doc_id])
    except OSError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc
    return Response(status_code=204)
