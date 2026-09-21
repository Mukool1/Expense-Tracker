"""
Copy all ExpenseAI data from your LOCAL database into a Neon (Postgres) database.

Works whether your local DB is SQLite or Postgres — it reads through your
existing SQLAlchemy models and inserts row-by-row, so column types translate
automatically.

Prerequisites (do these once):
  1. Create a project at https://neon.tech and copy its connection string
     (it ends with ?sslmode=require).
  2. Create the schema on Neon by running your migrations against it:
         cd ~/Desktop/Programming/expense_tracker/backend
         DATABASE_URL="<your-neon-url>" venv/bin/alembic upgrade head

Then run:
         venv/bin/python migrate_to_neon.py "<your-neon-url>"

The script reads your LOCAL database URL from backend/.env automatically.
Safe to re-run: it clears each Neon table before re-copying, in FK-safe order.
"""
import os
import sys

# Run from backend/ so `app` imports and `.env` resolve correctly.
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())

from sqlalchemy import MetaData, create_engine, select, text  # noqa: E402

from app.core.config import settings  # noqa: E402
import app.models  # noqa: E402,F401  (registers every model on Base.metadata)

# FK-safe order: parents before children.
TABLE_ORDER = ["users", "categories", "transactions", "forecasts", "receipts"]


def main() -> None:
    neon_url = (
        sys.argv[1] if len(sys.argv) > 1 else os.environ.get("NEON_DATABASE_URL", "")
    ).strip()
    if not neon_url:
        print('Usage: python migrate_to_neon.py "<neon-database-url>"')
        sys.exit(1)

    local_url = settings.database_url
    print(f"Source (local):      {local_url.split('@')[-1]}")
    print(f"Destination (Neon):  {neon_url.split('@')[-1]}")
    confirm = input("Copy ALL data from local -> Neon? [y/N] ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    src_engine = create_engine(local_url)
    dst_engine = create_engine(neon_url)

    src_meta = MetaData()
    src_meta.reflect(bind=src_engine)
    dst_meta = MetaData()
    dst_meta.reflect(bind=dst_engine)

    missing = [t for t in TABLE_ORDER if t not in dst_meta.tables]
    if missing:
        print(f"ERROR: these tables don't exist on Neon: {missing}")
        print("Run:  DATABASE_URL=\"<neon-url>\" alembic upgrade head")
        sys.exit(1)

    with src_engine.connect() as src, dst_engine.connect() as dst:
        txn = dst.begin()
        try:
            # Clear destination first (reverse order = children before parents),
            # so the script is idempotent.
            for tname in reversed(TABLE_ORDER):
                dst.execute(dst_meta.tables[tname].delete())

            for tname in TABLE_ORDER:
                src_table = src_meta.tables[tname]
                dst_table = dst_meta.tables[tname]
                rows = [dict(r) for r in src.execute(select(src_table)).mappings().all()]
                if rows:
                    dst.execute(dst_table.insert(), rows)
                print(f"  {tname:<14} copied {len(rows)} rows")

            # Reset Postgres id sequences so new inserts don't clash with
            # the copied primary keys.
            for tname in TABLE_ORDER:
                max_id = dst.execute(text(f"SELECT MAX(id) FROM {tname}")).scalar()
                if max_id:
                    seq = dst.execute(
                        text("SELECT pg_get_serial_sequence(:t, 'id')"),
                        {"t": tname},
                    ).scalar()
                    if seq:
                        dst.execute(
                            text("SELECT setval(:seq, :max_id)"),
                            {"seq": seq, "max_id": max_id},
                        )
                        print(f"  {tname:<14} sequence reset to {max_id}")

            txn.commit()
        except Exception:
            txn.rollback()
            raise

    # Verify
    print("\nVerification (row counts):")
    with src_engine.connect() as src, dst_engine.connect() as dst:
        for tname in TABLE_ORDER:
            s = src.execute(text(f"SELECT COUNT(*) FROM {tname}")).scalar()
            d = dst.execute(text(f"SELECT COUNT(*) FROM {tname}")).scalar()
            mark = "OK " if s == d else "MISMATCH"
            print(f"  [{mark}] {tname:<14} local={s}  neon={d}")

    print("\nDone. Point your app at Neon by setting DATABASE_URL to the Neon URL")
    print("(backend/.env locally, or the Render dashboard env vars for deploy).")


if __name__ == "__main__":
    main()
