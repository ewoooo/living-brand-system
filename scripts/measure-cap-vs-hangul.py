"""라틴 대문자 cap 높이와 한글 글자 잉크 높이가 같은지 잰다.

CI 락업 조립은 "영문 대문자 높이 = 한글 높이"를 전제한다(정본 락업이 그렇다).
배포 HD체가 그 전제를 안 지키면 조립 규칙을 화면으로 검증할 수 없다.

usage: python3 scripts/measure-cap-vs-hangul.py <font> [<font> ...]
"""

import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont

LATIN = "HDHYUNDAI"
HANGUL = "현대중공업한국조선해양"


def ink(font, glyphset, text):
    """글자들의 잉크 상자 위/아래 끝(em 비율)."""
    cmap = font.getBestCmap()
    top, bottom = None, None
    for ch in dict.fromkeys(text):
        name = cmap.get(ord(ch))
        if not name:
            continue
        pen = BoundsPen(glyphset)
        glyphset[name].draw(pen)
        if not pen.bounds:
            continue
        _, y_min, _, y_max = pen.bounds
        top = y_max if top is None else max(top, y_max)
        bottom = y_min if bottom is None else min(bottom, y_min)
    return top, bottom


for path in sys.argv[1:]:
    font = TTFont(path, fontNumber=0)
    upm = font["head"].unitsPerEm
    glyphset = font.getGlyphSet()

    lat_top, lat_bot = ink(font, glyphset, LATIN)
    han_top, han_bot = ink(font, glyphset, HANGUL)
    os2 = font["OS/2"]
    cap = getattr(os2, "sCapHeight", None)

    print(f"\n{path}  (upm {upm})")
    print(f"  OS/2 sCapHeight  {cap / upm:.4f}" if cap else "  OS/2 sCapHeight  없음")
    print(f"  라틴 대문자 잉크  top {lat_top / upm:+.4f}  bottom {lat_bot / upm:+.4f}")
    if han_top is None:
        print("  한글             없음(서브셋)")
        continue
    print(f"  한글 잉크        top {han_top / upm:+.4f}  bottom {han_bot / upm:+.4f}")
    print(f"  🔴 높이 차이     top {(han_top - lat_top) / upm:+.4f}em"
          f"  bottom {(han_bot - lat_bot) / upm:+.4f}em")
