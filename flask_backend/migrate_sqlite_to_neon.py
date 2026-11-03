"""
Migrate all data from local SQLite (cyber_intel.db) to Neon PostgreSQL
Run from flask_backend directory: python migrate_sqlite_to_neon.py
"""
import sqlite3
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SQLITE_PATH = str(Path(__file__).parent / 'cyber_intel.db')
NEON_URL = os.getenv('DATABASE_URL')

if not NEON_URL or ('neon' not in NEON_URL and 'postgresql' not in NEON_URL):
    print("ERROR: DATABASE_URL is not a PostgreSQL/Neon URL in .env")
    sys.exit(1)

print(f"Source: {SQLITE_PATH}")
print(f"Target: {NEON_URL[:60]}...")

import psycopg2
import psycopg2.extras

sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cur = sqlite_conn.cursor()

pg_conn = psycopg2.connect(NEON_URL)
pg_conn.autocommit = False
pg_cur = pg_conn.cursor()

# Defer FK checks until commit
try:
    pg_cur.execute("SET CONSTRAINTS ALL DEFERRED")
except Exception:
    pass

def get_sqlite_tables():
    sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'alembic_version'")
    return [row[0] for row in sqlite_cur.fetchall()]

def get_sqlite_columns(table):
    sqlite_cur.execute(f"PRAGMA table_info({table})")
    return [(row[1], row[2]) for row in sqlite_cur.fetchall()]  # (name, type)

def get_pg_column_types(table):
    pg_cur.execute("""
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=%s
    """, (table,))
    return {row[0]: (row[1], row[2]) for row in pg_cur.fetchall()}

def coerce_value(val, pg_type):
    """Convert SQLite value to PostgreSQL-compatible type"""
    if val is None:
        return None
    dtype, udt = pg_type
    # Boolean conversion: SQLite stores as 0/1
    if dtype == 'boolean' or udt == 'bool':
        return bool(int(val)) if val is not None else None
    # JSON stored as string
    if dtype == 'json' or dtype == 'jsonb':
        return str(val) if val is not None else None
    return val

def migrate_table(table):
    sqlite_cur.execute(f"SELECT * FROM [{table}]")
    rows = sqlite_cur.fetchall()
    if not rows:
        print(f"  [{table}] empty - skipping")
        return 0

    # Check table exists in Neon
    pg_cur.execute("SELECT to_regclass(%s)", (f'public.{table}',))
    if pg_cur.fetchone()[0] is None:
        print(f"  [{table}] not in Neon - skipping")
        return 0

    sqlite_cols = get_sqlite_columns(table)
    sqlite_col_names = [c[0] for c in sqlite_cols]
    pg_col_types = get_pg_column_types(table)

    # Only use columns that exist in both
    common_cols = [c for c in sqlite_col_names if c in pg_col_types]
    if not common_cols:
        print(f"  [{table}] no common columns - skipping")
        return 0

    # Clear existing data (TRUNCATE CASCADE to handle FK deps)
    pg_cur.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE')

    col_str = ', '.join(f'"{c}"' for c in common_cols)
    placeholders = ', '.join(['%s'] * len(common_cols))
    insert_sql = f'INSERT INTO "{table}" ({col_str}) VALUES ({placeholders})'

    # Get valid enum values for this table's columns
    pg_cur.execute("""
        SELECT a.attname, t.typname, e.enumlabel
        FROM pg_attribute a
        JOIN pg_type t ON a.atttypid = t.oid
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_class c ON a.attrelid = c.oid
        WHERE c.relname = %s AND c.relkind = 'r'
    """, (table,))
    enum_map = {}
    for col_name, type_name, enum_val in pg_cur.fetchall():
        enum_map.setdefault(col_name, set()).add(enum_val)

    batch = []
    skipped = 0
    for row in rows:
        values = []
        skip_row = False
        for col in common_cols:
            raw = row[col] if col in sqlite_col_names else None
            coerced = coerce_value(raw, pg_col_types[col])
            # Validate enum values - set to None if invalid
            if col in enum_map and coerced is not None:
                if coerced not in enum_map[col]:
                    coerced = None
            # Null out broken FK references for created_by_id in content
            if col == 'created_by_id' and table == 'content':
                coerced = None
            # Skip rows where enum nulled out but column is NOT NULL
            if coerced is None and col in enum_map:
                skip_row = True
            values.append(coerced)
        if not skip_row:
            batch.append(tuple(values))
        else:
            skipped += 1

    if skipped:
        print(f"    (skipped {skipped} rows with invalid data)")

    psycopg2.extras.execute_batch(pg_cur, insert_sql, batch, page_size=100)
    print(f"  [{table}] migrated {len(rows)} rows")
    return len(rows)

sqlite_tables = get_sqlite_tables()
print(f"\nSQLite tables: {sqlite_tables}\n")

# Ordered to respect FKs (parent tables first)
priority_order = [
    'system_users', 'sources', 'keywords', 'users', 'identifiers',
    'cases', 'case_requests', 'content', 'osint_results',
    'user_case_links', 'active_cases', 'detections',
    'osint_identifier_links', 'case_content_links', 'case_activities'
]
ordered = [t for t in priority_order if t in sqlite_tables]
ordered += [t for t in sqlite_tables if t not in ordered]

total_rows = 0
failed = []

for table in ordered:
    try:
        count = migrate_table(table)
        total_rows += count
        pg_conn.commit()
    except Exception as e:
        pg_conn.rollback()
        try:
            pg_cur.execute("SET CONSTRAINTS ALL DEFERRED")
        except Exception:
            pass
        print(f"  [{table}] FAILED: {e}")
        failed.append((table, str(e)))

# Fix sequences
print("\nFixing PostgreSQL ID sequences...")
pg_cur.execute("SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public'")
for (seq,) in pg_cur.fetchall():
    table_guess = seq.replace('_id_seq', '')
    try:
        pg_cur.execute(f'SELECT setval(\'{seq}\', COALESCE((SELECT MAX(id) FROM "{table_guess}"), 1))')
        print(f"  Reset: {seq}")
    except Exception:
        pg_conn.rollback()
pg_conn.commit()
pg_conn.close()
sqlite_conn.close()

print(f"\nMigration complete: {total_rows} rows migrated.")
if failed:
    print(f"Failed tables ({len(failed)}): {[t for t,_ in failed]}")
    for t, e in failed:
        print(f"  {t}: {e}")
else:
    print("All tables migrated successfully!")
