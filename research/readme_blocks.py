"""Read and write the generated tables inside README.md.

The readiness matrix and the claims register used to live in their own files
under docs/. They are generated, not written, and the point of generating them
is that the table cannot quietly disagree with the evidence it came from. Now
that the repository keeps a single README, the tables live inside it, fenced by
HTML comments, and the generators keep writing them.

A block looks like this:

    <!-- generated:readiness-matrix -->
    ...table...
    <!-- /generated:readiness-matrix -->

Everything between the markers belongs to the generator. Everything outside is
prose, and no generator touches it.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / "README.md"


def _markers(name: str) -> tuple[str, str]:
    return f"<!-- generated:{name} -->", f"<!-- /generated:{name} -->"


def _split(name: str, text: str) -> tuple[str, str, str]:
    """Return the text before the block, the block body, and the text after."""
    opening, closing = _markers(name)
    start = text.find(opening)
    if start < 0:
        raise SystemExit(f"README.md has no '{opening}' marker; cannot write the {name} block.")
    end = text.find(closing, start)
    if end < 0:
        raise SystemExit(f"README.md has no '{closing}' marker; cannot write the {name} block.")
    return text[: start + len(opening)], text[start + len(opening) : end], text[end:]


def read_block(name: str) -> str:
    return _split(name, README.read_text(encoding="utf-8"))[1]


def write_block(name: str, body: str) -> None:
    text = README.read_text(encoding="utf-8")
    head, _, tail = _split(name, text)
    README.write_text(f"{head}\n{body.strip()}\n{tail}", encoding="utf-8", newline="\n")


def block_is_current(name: str, body: str) -> bool:
    return read_block(name).strip() == body.strip()
