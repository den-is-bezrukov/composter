#!/usr/bin/env python3
"""Builds the single-file page from src/page.html.

Fonts and the sample illustration are inlined as base64, so the result
works as one file both on GitHub Pages and as a claude.ai artifact.

  index.html          full HTML document for GitHub Pages
  dist/artifact.html  page body for claude.ai (the artifact adds its own skeleton)
"""
import base64
import json
from pathlib import Path

ROOT = Path(__file__).parent


def b64(path):
    return base64.b64encode(path.read_bytes()).decode()


def main():
    page = (ROOT / "src/page.html").read_text(encoding="utf-8")
    widths = {
        int(p.stem[2:]): b64(p)
        for p in sorted((ROOT / "fonts/widths").glob("rf*.woff2"))
    }
    page = (
        page.replace("__RF60__", b64(ROOT / "fonts/rf60.woff2"))
        .replace("__LIPS__", b64(ROOT / "assets/sample.webp"))
        .replace("__WIDTHS__", json.dumps(widths))
    )

    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist/artifact.html").write_text(page, encoding="utf-8")

    doc = (
        '<!doctype html>\n<html lang="ru">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        "<style>[hidden]{display:none!important}body{margin:0}</style>\n"
        "</head>\n<body>\n" + page + "\n</body>\n</html>\n"
    )
    (ROOT / "index.html").write_text(doc, encoding="utf-8")
    print(f"index.html: {len(doc) / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
