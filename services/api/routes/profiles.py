"""Profile routes for the authenticated user."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from tinydb import Query

from database import profiles_table
from models import ProfileOut, ProfileUpdate
from security import get_current_user, get_profile_by_user_id

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _out(user_id: str) -> ProfileOut:
    profile = get_profile_by_user_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    Profile = Query()
    try:
        rows = profiles_table.search(Profile.user_id == user_id)
    except OSError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc
    return ProfileOut(
        id=rows[0].doc_id if rows else 0,
        user_id=profile["user_id"],
        name=profile.get("name"),
        phone=profile.get("phone"),
        address=profile.get("address"),
    )


@router.get("/me", response_model=ProfileOut)
def get_my_profile(current_user: dict = Depends(get_current_user)) -> ProfileOut:
    return _out(current_user["id"])


@router.put("/me", response_model=ProfileOut)
def update_my_profile(
    payload: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
) -> ProfileOut:
    Profile = Query()
    try:
        rows = profiles_table.search(Profile.user_id == current_user["id"])
        data = payload.model_dump(exclude_unset=True)
        if not rows:
            doc = {"user_id": current_user["id"], "name": None, "phone": None, "address": None}
            doc.update(data)
            profiles_table.insert(doc)
        else:
            profiles_table.update(data, doc_ids=[rows[0].doc_id])
    except OSError as exc:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable") from exc
    return _out(current_user["id"])
