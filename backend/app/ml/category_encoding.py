CANONICAL_CATEGORIES = ["rent", "groceries", "transport", "entertainment", "shopping"]
CATEGORY_FEATURE_COLS = [f"cat_{c}" for c in CANONICAL_CATEGORIES + ["other"]]


def normalize_category_name(name: str) -> str:
    """Maps any category name to one of our known types, or 'other' if unrecognized."""
    normalized = (name or "").strip().lower()
    return normalized if normalized in CANONICAL_CATEGORIES else "other"