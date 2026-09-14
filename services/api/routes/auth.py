"""Authentication routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from tinydb import Query

from database import profiles_table, users_table
from models import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MeResponse,
    ProfileOut,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)
from security import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    create_reset_token,
    get_current_user,
    get_profile_by_user_id,
    get_user_by_email,
    hash_password,
    is_reset_token_usable,
    mark_reset_token_used,
    public_user,
    send_reset_email,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


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


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    user = get_user_by_email(str(payload.email))
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")
    token = create_access_token(user["id"], {"role": user.get("role", "user")})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
def me(current_user: dict = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        user=UserOut(**public_user(current_user)),
        profile=_profile_out(current_user["id"]),
    )


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest) -> dict:
    user = get_user_by_email(str(payload.email))
    if user and user.get("is_active", True):
        token = create_reset_token(user["id"])
        send_reset_email(user["email"], token)
    return {"detail": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest) -> dict:
    try:
        data = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        if data.get("type") != "reset":
            raise JWTError("invalid type")
        jti = data.get("jti")
        user_id = data.get("sub")
        if not jti or not user_id:
            raise JWTError("missing claims")
    except JWTError as exc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token") from exc

    if not is_reset_token_usable(jti):
        raise HTTPException(status_code=400, detail="Reset token already used or expired")

    User = Query()
    rows = users_table.search(User.id == user_id)
    if not rows:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    users_table.update(
        {"hashed_password": hash_password(payload.new_password)},
        doc_ids=[rows[0].doc_id],
    )
    mark_reset_token_used(jti)
    return {"detail": "Password updated."}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if not verify_password(payload.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    User = Query()
    rows = users_table.search(User.id == current_user["id"])
    users_table.update(
        {"hashed_password": hash_password(payload.new_password)},
        doc_ids=[rows[0].doc_id],
    )
    return {"detail": "Password changed."}
