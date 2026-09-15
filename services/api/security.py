"""Auth security helpers and FastAPI dependencies."""

from __future__ import annotations

import logging
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

logger = logging.getLogger("brasaland.auth")

_DEV_SECRET = "brasaland-dev-secret-change-me"
_ENV = os.getenv("ENV", os.getenv("APP_ENV", "development")).lower()
SECRET_KEY = os.getenv("SECRET_KEY", _DEV_SECRET)
if _ENV not in {"development", "dev", "local", "test"} and (
    not SECRET_KEY or SECRET_KEY == _DEV_SECRET
):
    raise RuntimeError(
        "SECRET_KEY must be set to a strong unique value outside development."
    )

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
    if not hashed:
        return False
    try:
        return bcrypt.verify(password, hashed)
    except (ValueError, TypeError):
        return False


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
    try:
        reset_tokens_table.insert(
            {
                "jti": jti,
                "user_id": user_id,
                "used": False,
                "expires_at": expire.isoformat(),
            }
        )
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc
    return token


def mark_reset_token_used(jti: str) -> None:
    Token = Query()
    try:
        rows = reset_tokens_table.search(Token.jti == jti)
        for row in rows:
            reset_tokens_table.update({"used": True}, doc_ids=[row.doc_id])
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc


def is_reset_token_usable(jti: str) -> bool:
    Token = Query()
    try:
        rows = reset_tokens_table.search(Token.jti == jti)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc
    if not rows:
        return False
    row = rows[0]
    if row.get("used"):
        return False
    raw_expires = row.get("expires_at")
    if not raw_expires:
        return False
    try:
        expires_at = datetime.fromisoformat(raw_expires)
    except (TypeError, ValueError):
        logger.warning("Ignoring reset token with invalid expires_at")
        return False
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at > datetime.now(timezone.utc)


def get_user_by_id(user_id: str) -> Optional[dict]:
    User = Query()
    try:
        rows = users_table.search(User.id == user_id)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc
    return dict(rows[0]) if rows else None


def get_user_by_email(email: str) -> Optional[dict]:
    User = Query()
    try:
        rows = users_table.search(User.email == email.lower())
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc
    return dict(rows[0]) if rows else None


def get_profile_by_user_id(user_id: str) -> Optional[dict]:
    Profile = Query()
    try:
        rows = profiles_table.search(Profile.user_id == user_id)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable",
        ) from exc
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
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Reject access tokens minted before the latest password change/reset.
    claim_tv = payload.get("tv", 0)
    user_tv = int(user.get("token_version", 0))
    if claim_tv != user_tv:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user


class EmailDeliveryError(RuntimeError):
    """Raised when a password-reset email cannot be delivered."""


def send_reset_email(to_email: str, token: str) -> None:
    """Send a password-reset email. Never logs the token or full reset URL."""
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    if not RESEND_API_KEY:
        # Local/dev fallback: acknowledge without leaking the secret token.
        logger.info(
            "RESEND_API_KEY unset; reset email not sent for user ending %s",
            to_email[-4:] if to_email else "????",
        )
        if _ENV in {"development", "dev", "local", "test"}:
            # Dev-only: print a placeholder so engineers know mail was skipped.
            print(
                "[auth] Password reset requested (email provider unset). "
                "Token issued but not logged. Configure RESEND_API_KEY to send mail."
            )
        return

    try:
        import resend
    except ImportError as exc:
        logger.error("Resend package unavailable: %s", type(exc).__name__)
        raise EmailDeliveryError("Email provider unavailable") from exc

    try:
        resend.api_key = RESEND_API_KEY
        resend.Emails.send(
            {
                "from": EMAIL_FROM,
                "to": [to_email],
                "subject": "Brasaland password reset",
                "html": f'<p>Reset your password:</p><p><a href="{reset_url}">Reset password</a></p>',
            }
        )
    except (OSError, TimeoutError, ConnectionError, ValueError, RuntimeError) as exc:
        logger.error("Failed to send reset email: %s", type(exc).__name__)
        raise EmailDeliveryError("Failed to send reset email") from exc
    except Exception as exc:  # noqa: BLE001 — Resend SDK may raise custom types
        logger.error("Failed to send reset email: %s", type(exc).__name__)
        raise EmailDeliveryError("Failed to send reset email") from exc
