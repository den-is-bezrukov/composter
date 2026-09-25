#!/usr/bin/env python3
"""Regenerates the static Roboto Flex instances used by the page.

Canvas can't set variable-font axes, so every headline width is baked into
its own static font with the rest of the axes taken from the Figma posts.

  pip install fonttools brotli
  python tools/make_fonts.py "path/to/RobotoFlex[GRAD,XOPQ,...,wght].ttf"
"""
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent

# Axis values from the Title layers in Figma (Evrone SMM, "Evrone Instagram")
AXES = dict(wght=800, GRAD=0, slnt=0, XOPQ=96, YOPQ=60, XTRA=468,
            YTUC=712, YTLC=514, YTAS=750, YTDE=-203, YTFI=738, opsz=144)

# Basic Latin, Latin-1, Latin Extended-A, Cyrillic, dashes, quotes, ellipsis, ₽, №
UNICODES = (list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x400, 0x460))
            + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x20BD, 0x2116])


def build(src, wdth, out):
    font = instantiateVariableFont(TTFont(src), dict(AXES, wdth=wdth))
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "lnum", "pnum", "case", "cpsp"]
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(font)
    font.flavor = "woff2"
    font.save(out)


def main():
    src = sys.argv[1]
    build(src, 60, ROOT / "fonts/rf60.woff2")
    for w in range(25, 60):
        build(src, w, ROOT / f"fonts/widths/rf{w}.woff2")
    print("done")


if __name__ == "__main__":
    main()
