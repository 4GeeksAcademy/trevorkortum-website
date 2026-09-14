"""Pydantic models for the Brasaland supplier directory."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


VALID_CATEGORIES = [
    "carne",
    "verduras_y_hortalizas",
    "salsas_y_condimentos",
    "bebidas",
    "packaging",
    "productos_limpieza",
    "lacteos",
    "carbon_y_combustible",
]

COUNTRY_CURRENCY = {"Colombia": "COP", "USA": "USD"}


class SupplierStatus(str, Enum):
    active = "active"
    suspended = "suspended"


class Country(str, Enum):
    Colombia = "Colombia"
    USA = "USA"


class Currency(str, Enum):
    COP = "COP"
    USD = "USD"


class SupplierCreate(BaseModel):
    name: str = Field(..., min_length=1)
    country: Country
    categories: List[str] = Field(..., min_length=1)
    rate_per_unit: float = Field(..., gt=0)
    currency: Currency
    status: SupplierStatus = SupplierStatus.active
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, value: List[str]) -> List[str]:
        if not value:
            raise ValueError("categories must contain at least one item")
        invalid = [c for c in value if c not in VALID_CATEGORIES]
        if invalid:
            raise ValueError(f"invalid categories: {invalid}")
        return value

    @model_validator(mode="after")
    def validate_currency_matches_country(self) -> "SupplierCreate":
        expected = COUNTRY_CURRENCY[self.country.value]
        if self.currency.value != expected:
            raise ValueError(
                f"currency for {self.country.value} must be {expected}, got {self.currency.value}"
            )
        return self


class RateUpdate(BaseModel):
    rate_per_unit: float = Field(..., gt=0)


class StatusUpdate(BaseModel):
    status: SupplierStatus


class Supplier(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    country: Country
    categories: List[str]
    rate_per_unit: float = Field(..., gt=0)
    currency: Currency
    updated_at: datetime
    status: SupplierStatus
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None


class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    user = "user"


class ProfileData(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    profile: Optional[ProfileData] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None


class UserOut(BaseModel):
    id: str
    email: EmailStr
    is_active: bool
    role: UserRole
    created_at: datetime


class ProfileOut(BaseModel):
    id: int
    user_id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class MeResponse(BaseModel):
    user: UserOut
    profile: Optional[ProfileOut] = None


# --- Incident Manager ---


class IncidentCategory(str, Enum):
    equipment_failure = "equipment_failure"
    supply_issue = "supply_issue"
    customer_complaint = "customer_complaint"
    staff_issue = "staff_issue"
    facility_issue = "facility_issue"
    pos_system = "pos_system"
    delivery_issue = "delivery_issue"
    other = "other"


class IncidentStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    discarded = "discarded"


class IncidentOrigin(str, Enum):
    customer = "customer"
    branch = "branch"
    internal = "internal"


class IncidentBranch(str, Enum):
    central = "central"
    medellin_centro = "medellin_centro"
    medellin_laureles = "medellin_laureles"
    medellin_envigado = "medellin_envigado"
    medellin_bello = "medellin_bello"
    medellin_itagui = "medellin_itagui"
    bogota_chapinero = "bogota_chapinero"
    bogota_usaquen = "bogota_usaquen"
    cali_granada = "cali_granada"
    barranquilla_norte = "barranquilla_norte"
    miami_doral = "miami_doral"
    miami_hialeah = "miami_hialeah"
    miami_kendall = "miami_kendall"
    orlando_international = "orlando_international"
    fort_lauderdale = "fort_lauderdale"


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    category: IncidentCategory
    status: IncidentStatus = IncidentStatus.open
    origin: IncidentOrigin
    branch: IncidentBranch = IncidentBranch.central

    @field_validator("title", "description")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be empty")
        return cleaned


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus


class Incident(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: IncidentCategory
    status: IncidentStatus
    origin: IncidentOrigin
    branch: IncidentBranch
    created_at: datetime
    updated_at: datetime


class IncidentSummary(BaseModel):
    total: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    by_origin: dict[str, int]
    by_branch: dict[str, int]


class FieldError(BaseModel):
    field: str
    message: str
