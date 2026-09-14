"""Auth security helpers and FastAPI dependencies."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.hash import bcrypt
from tinydb import Query

from database import profiles_table, reset_tokens_table, users_table

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "brasaland-dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "Brasaland <onboarding@resend.dev>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3004")

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.verify(password, hashed)


def create_access_token(subject: str, extra: Optional[dict] = None) -> str:
    payload: dict[str, Any] = {"sub": subject, "type": "access"}
    if extra:
        payload.update(extra)
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload["exp"] = expire
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_reset_token(user_id: str) -> str:
    jti = str(uuid4())
    expire = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode(
        {"sub": user_id, "type": "reset", "jti": jti, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    reset_tokens_table.insert(
        {
            "jti": jti,
            "user_id": user_id,
            "used": False,
            "expires_at": expire.isoformat(),
        }
    )
    return token


def mark_reset_token_used(jti: str) -> None:
    Token = Query()
    rows = reset_tokens_table.search(Token.jti == jti)
    for row in rows:
        reset_tokens_table.update({"used": True}, doc_ids=[row.doc_id])


def is_reset_token_usable(jti: str) -> bool:
    Token = Query()
    rows = reset_tokens_table.search(Token.jti == jti)
    if not rows:
        return False
    row = rows[0]
    if row.get("used"):
        return False
    expires_at = datetime.fromisoformat(row["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at > datetime.now(timezone.utc)


def get_user_by_id(user_id: str) -> Optional[dict]:
    User = Query()
    rows = users_table.search(User.id == user_id)
    return dict(rows[0]) if rows else None


def get_user_by_email(email: str) -> Optional[dict]:
    User = Query()
    rows = users_table.search(User.email == email.lower())
    return dict(rows[0]) if rows else None


def get_profile_by_user_id(user_id: str) -> Optional[dict]:
    Profile = Query()
    rows = profiles_table.search(Profile.user_id == user_id)
    return dict(rows[0]) if rows else None


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "is_active": user.get("is_active", True),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at"),
    }


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise JWTError("wrong token type")
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("missing sub")
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = get_user_by_id(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User inactive or not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user


def send_reset_email(to_email: str, token: str) -> None:
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    if not RESEND_API_KEY:
        print(f"[auth] Reset link for {to_email}: {reset_url}")
        return
    try:
        import resend

        resend.api_key = RESEND_API_KEY
        resend.Emails.send(
            {
                "from": EMAIL_FROM,
                "to": [to_email],
                "subject": "Brasaland password reset",
                "html": f"<p>Reset your password:</p><p><a href=\"{reset_url}\">{reset_url}</a></p>",
            }
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[auth] Failed to send reset email: {exc}")
        print(f"[auth] Reset link for {to_email}: {reset_url}")
