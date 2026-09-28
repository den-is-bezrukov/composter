#!/usr/bin/env python3
"""Builds the single-file page from src/.

  src/page.html    markup with __CSS__ and __JS__ slots
  src/style.css    styles
  src/js/*.js      script, concatenated in JS_ORDER into one <script>
  src/prompt.txt   the illustration prompt shown in the help

Fonts and the sample pictures are inlined as base64, so the result
works as one file both on GitHub Pages and as a claude.ai artifact.

  index.html          full HTML document for GitHub Pages
  dist/artifact.html  page body for claude.ai (the artifact adds its own skeleton)
"""
import base64
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

# One shared scope: later parts use what earlier ones define, main.js starts the page
JS_ORDER = ["core", "help", "theme", "article", "color", "case", "preview", "inline", "files", "export", "main"]


def b64(path):
    return base64.b64encode(path.read_bytes()).decode()


def read(path):
    return path.read_text(encoding="utf-8")


def main():
    js = "\n".join(read(SRC / "js" / f"{name}.js") for name in JS_ORDER)
    page = read(SRC / "page.html").replace("__CSS__", read(SRC / "style.css").rstrip("\n")).replace("__JS__", js.rstrip("\n"))

    widths = {
        int(p.stem[2:]): b64(p)
        for p in sorted((ROOT / "fonts/widths").glob("rf*.woff2"))
    }
    prompt = read(SRC / "prompt.txt").rstrip("\n")
    page = (
        page.replace("__PROMPT__", json.dumps(prompt, ensure_ascii=False))
        .replace("__RF60__", b64(ROOT / "fonts/rf60.woff2"))
        .replace("__LIPS__", b64(ROOT / "assets/sample.webp"))
        .replace("__CASE__", b64(ROOT / "assets/case-sample.jpg"))
        .replace("__WIDTHS__", json.dumps(widths))
    )
    left = sorted(set(re.findall(r"__[A-Z0-9]+__", page)))
    if left:
        sys.exit(f"Unfilled placeholders: {', '.join(left)}")

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
