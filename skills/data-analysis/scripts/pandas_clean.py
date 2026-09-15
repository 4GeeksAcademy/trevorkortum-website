"""
Safe snippet for basic pandas cleaning. Copy and adapt for your dataset.
Run: python pandas_clean.py  (ensure pandas is installed)
"""
from __future__ import annotations

import sys

try:
    import pandas as pd
except ImportError:
    print("Error: pandas is not installed. Run: pip install pandas", file=sys.stderr)
    sys.exit(1)

DATA_PATH = "data.csv"

try:
    df = pd.read_csv(DATA_PATH)  # or read_json, read_excel
except FileNotFoundError:
    print(f"Error: file not found -> {DATA_PATH}", file=sys.stderr)
    sys.exit(1)
except OSError as exc:
    print(f"Error: unable to read {DATA_PATH} ({type(exc).__name__})", file=sys.stderr)
    sys.exit(1)
except Exception as exc:  # noqa: BLE001 — pandas raises varied parse errors
    print(f"Error: unable to parse {DATA_PATH} ({type(exc).__name__})", file=sys.stderr)
    sys.exit(1)

print("df_shape", df.shape)
print("df_dtypes", df.dtypes)

# Drop fully null columns
df = df.dropna(axis=1, how="all")
print("df_shape_after_drop_all_null_cols", df.shape)

# Fill or drop nulls in key columns (customise columns)
# df = df.dropna(subset=["required_col"])
# df["optional_col"] = df["optional_col"].fillna(0)

# Normalise column names (optional)
df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
print("df_columns", list(df.columns))

# Deduplicate (optional)
before = len(df)
df = df.drop_duplicates()
print("rows_dropped_duplicates", before - len(df))

# Sample output
print("df_head", df.head())
