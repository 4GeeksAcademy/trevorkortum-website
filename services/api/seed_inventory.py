"""Seed Supabase inventory tables with Brasaland demo ingredients/orders."""

from __future__ import annotations

import sys

from sqlmodel import Session, select

from database import engine, init_inventory_db, users_table
from models import Ingredient, IngredientEntry, IngredientExit

INGREDIENTS = [
    {
        "name": "Beef brisket",
        "sku": "BRS-BEEF-001",
        "unit": "kg",
        "category": "meat",
        "country": "CO",
    },
    {
        "name": "Pork ribs",
        "sku": "BRS-PORK-001",
        "unit": "kg",
        "category": "meat",
        "country": "US",
    },
    {
        "name": "Chimichurri sauce",
        "sku": "BRS-SAUCE-001",
        "unit": "litre",
        "category": "sauce",
        "country": "CO",
    },
    {
        "name": "House BBQ sauce",
        "sku": "BRS-SAUCE-002",
        "unit": "litre",
        "category": "sauce",
        "country": "US",
    },
    {
        "name": "Yuca (cassava)",
        "sku": "BRS-PROD-001",
        "unit": "kg",
        "category": "produce",
        "country": "CO",
    },
    {
        "name": "Takeaway box (M)",
        "sku": "BRS-PKG-001",
        "unit": "unit",
        "category": "packaging",
        "country": "CO",
    },
]


def _pick_user_uuid() -> str:
    users = users_table.all()
    if not users:
        print(
            "Inventory seed failed: no TinyDB users found. Register/login a user first.",
            file=sys.stderr,
        )
        sys.exit(1)
    # Prefer a known ops-style email when present; otherwise first user.
    for user in users:
        email = (user.get("email") or "").lower()
        if "lucia" in email or "brasaland" in email:
            return str(user["id"])
    return str(users[0]["id"])


def seed_inventory(*, exit_on_config_error: bool = True) -> bool:
    if engine is None:
        message = (
            "Inventory seed skipped: DATABASE_URL is missing or still contains a password placeholder."
        )
        print(message, file=sys.stderr)
        if exit_on_config_error:
            sys.exit(1)
        return False

    init_inventory_db()
    user_uuid = _pick_user_uuid()

    with Session(engine) as session:
        by_sku: dict[str, Ingredient] = {}
        inserted_ingredients = 0
        for raw in INGREDIENTS:
            existing = session.exec(
                select(Ingredient).where(Ingredient.sku == raw["sku"])
            ).first()
            if existing:
                by_sku[raw["sku"]] = existing
                continue
            row = Ingredient(**raw)
            session.add(row)
            session.commit()
            session.refresh(row)
            by_sku[raw["sku"]] = row
            inserted_ingredients += 1

        beef = by_sku["BRS-BEEF-001"]
        pork = by_sku["BRS-PORK-001"]
        chimichurri = by_sku["BRS-SAUCE-001"]

        entry_specs = [
            (beef.id, 50.0, "Carnes del Valle S.A.", 1),
            (beef.id, 30.0, "Carnes del Valle S.A.", 1),
            (pork.id, 40.0, "MiamiMeat Co.", 10),
            (chimichurri.id, 20.0, "Salsas Artesanales Ltda.", 2),
        ]
        inserted_entries = 0
        for ingredient_id, qty, supplier, location_id in entry_specs:
            already = session.exec(
                select(IngredientEntry).where(
                    IngredientEntry.ingredient_id == ingredient_id,
                    IngredientEntry.quantity == qty,
                    IngredientEntry.supplier_name == supplier,
                )
            ).first()
            if already:
                continue
            session.add(
                IngredientEntry(
                    ingredient_id=ingredient_id,
                    quantity=qty,
                    supplier_name=supplier,
                    location_id=location_id,
                    user_uuid=user_uuid,
                )
            )
            inserted_entries += 1
        session.commit()

        exit_specs = [
            (beef.id, 12.0, "consumption", 1),
            (pork.id, 8.0, "consumption", 10),
            (chimichurri.id, 2.5, "waste", 2),
        ]
        inserted_exits = 0
        for ingredient_id, qty, reason, location_id in exit_specs:
            already = session.exec(
                select(IngredientExit).where(
                    IngredientExit.ingredient_id == ingredient_id,
                    IngredientExit.quantity == qty,
                    IngredientExit.reason == reason,
                )
            ).first()
            if already:
                continue
            session.add(
                IngredientExit(
                    ingredient_id=ingredient_id,
                    quantity=qty,
                    reason=reason,
                    location_id=location_id,
                    user_uuid=user_uuid,
                )
            )
            inserted_exits += 1
        session.commit()

    print(
        "Inventory seed complete: "
        f"{inserted_ingredients} ingredients, "
        f"{inserted_entries} entries, "
        f"{inserted_exits} exits "
        f"(user_uuid={user_uuid})."
    )
    return True


def main() -> None:
    seed_inventory(exit_on_config_error=True)


if __name__ == "__main__":
    main()
