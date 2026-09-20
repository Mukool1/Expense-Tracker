import re
from datetime import datetime
import easyocr

_reader = easyocr.Reader(['en'], gpu=False)

LABEL_LINES = {"date", "bill", "bill no", "invoice", "receipt", "name", "phone",
               "quantity", "rate", "amount", "total", "no.", "no"}


def extract_text(image_path: str) -> tuple[str, float]:
    results = _reader.readtext(image_path)
    if not results:
        return "", 0.0
    full_text = "\n".join(r[1] for r in results)
    avg_confidence = sum(r[2] for r in results) / len(results)
    return full_text, avg_confidence


def _looks_like_a_name(line: str) -> bool:
    """A merchant name is mostly letters, not a label, and not just numbers/dates."""
    stripped = line.strip().lower().rstrip(":._")
    if stripped in LABEL_LINES:
        return False
    if re.fullmatch(r"[\d.\-/\s]+", line):  # pure numbers/date, no letters at all
        return False
    letter_count = sum(c.isalpha() for c in line)
    return letter_count >= 3  # arbitrary but reasonable floor to filter out noise lines


def parse_receipt(text: str) -> dict:
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # --- merchant: first line that actually looks like a name, not a label ---
    merchant = next((line for line in lines if _looks_like_a_name(line)), None)

    # --- total: keyword can be on its own line, with the number on the SAME or NEXT line ---
    total = None
    total_keyword = re.compile(r"^(total|amount due|balance|grand total)\b", re.IGNORECASE)
    number_pattern = re.compile(r"\d+[.,]\d{2}")

    for i, line in enumerate(lines):
        if total_keyword.search(line):
            same_line_match = number_pattern.search(line)
            if same_line_match:
                total = float(same_line_match.group(0).replace(",", "."))
                break
            # not on this line — check the next couple of lines for a standalone number
            for lookahead in lines[i + 1:i + 3]:
                next_match = number_pattern.search(lookahead)
                if next_match:
                    total = float(next_match.group(0).replace(",", "."))
                    break
            if total:
                break

    # --- date: now also matches dot-separated dates like 01.04.15 ---
    date_found = None
    date_pattern = re.compile(r"(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})")
    for line in lines:
        match = date_pattern.search(line)
        if match:
            raw = match.group(1).replace(".", "/").replace("-", "/")
            for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%d/%m/%y", "%m/%d/%y"):
                try:
                    date_found = datetime.strptime(raw, fmt).date()
                    break
                except ValueError:
                    continue
        if date_found:
            break

    return {"merchant": merchant, "total": total, "date": date_found}