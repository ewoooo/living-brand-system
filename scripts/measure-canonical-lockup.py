"""정본 락업 SVG에서 글자 덩어리별 잉크 상자를 잰다.

'HD'(라틴)와 한글이 정본에서 정말 같은 높이인지가 조립 규칙의 전제다.
브라우저 없이 path를 직접 샘플링한다(곡선은 100점 샘플 — 로고 크기에서 오차 무시 가능).

usage: python3 scripts/measure-canonical-lockup.py <svg> [<svg> ...]
"""

import re
import sys
import xml.etree.ElementTree as ET

NUM = re.compile(r"[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?")
CMD = re.compile(r"([MmLlHhVvCcSsQqTtAaZz])")


def bezier(p, steps=100):
    """p = 제어점 리스트(2 or 3 or 4개). t 샘플링한 점들."""
    n = len(p) - 1
    out = []
    for i in range(steps + 1):
        t = i / steps
        x = y = 0.0
        for k, (px, py) in enumerate(p):
            # 이항계수 × t^k × (1-t)^(n-k)
            c = 1
            for j in range(k):
                c = c * (n - j) // (j + 1)
            w = c * (t**k) * ((1 - t) ** (n - k))
            x += px * w
            y += py * w
        out.append((x, y))
    return out


def points_of(d):
    """path d를 점 목록으로 편다."""
    tokens = [t for t in CMD.split(d) if t.strip()]
    pts, cur, start, prev_ctrl, cmd = [], (0.0, 0.0), (0.0, 0.0), None, None
    i = 0
    while i < len(tokens):
        if CMD.fullmatch(tokens[i]):
            cmd = tokens[i]
            i += 1
            args = [float(v) for v in NUM.findall(tokens[i])] if i < len(tokens) and not CMD.fullmatch(tokens[i]) else []
            if args:
                i += 1
        else:
            args = [float(v) for v in NUM.findall(tokens[i])]
            i += 1

        rel = cmd.islower()
        c = cmd.upper()
        k = 0
        while True:
            if c == "Z":
                cur = start
                pts.append(cur)
                break
            need = {"M": 2, "L": 2, "H": 1, "V": 1, "C": 6, "S": 4, "Q": 4, "T": 2, "A": 7}[c]
            if k + need > len(args):
                break
            a = args[k : k + need]
            k += need
            ox, oy = cur if rel else (0.0, 0.0)
            if c in ("M", "L"):
                cur = (a[0] + ox, a[1] + oy)
                if c == "M" and k == need:
                    start = cur
                pts.append(cur)
            elif c == "H":
                cur = (a[0] + ox, cur[1])
                pts.append(cur)
            elif c == "V":
                cur = (cur[0], a[0] + oy)
                pts.append(cur)
            elif c in ("C", "S"):
                if c == "C":
                    c1, c2, end = (a[0] + ox, a[1] + oy), (a[2] + ox, a[3] + oy), (a[4] + ox, a[5] + oy)
                else:
                    c1 = (2 * cur[0] - prev_ctrl[0], 2 * cur[1] - prev_ctrl[1]) if prev_ctrl else cur
                    c2, end = (a[0] + ox, a[1] + oy), (a[2] + ox, a[3] + oy)
                pts += bezier([cur, c1, c2, end])
                prev_ctrl, cur = c2, end
                continue
            elif c in ("Q", "T"):
                if c == "Q":
                    c1, end = (a[0] + ox, a[1] + oy), (a[2] + ox, a[3] + oy)
                else:
                    c1 = (2 * cur[0] - prev_ctrl[0], 2 * cur[1] - prev_ctrl[1]) if prev_ctrl else cur
                    end = (a[0] + ox, a[1] + oy)
                pts += bezier([cur, c1, end])
                prev_ctrl, cur = c1, end
                continue
            else:  # A — 로고에 안 나오지만 나오면 끝점만
                cur = (a[5] + ox, a[6] + oy)
                pts.append(cur)
            prev_ctrl = None
            if c == "M":
                c = "L"  # M 뒤 좌표 반복은 L
    return pts


def subpaths(d):
    """서브패스(M으로 시작하는 덩어리)마다 나눈다 = 글자 획 하나."""
    out = []
    for chunk in re.split(r"(?=[Mm])", d):
        if chunk.strip():
            p = points_of(chunk)
            if p:
                out.append(p)
    return out


for file in sys.argv[1:]:
    tree = ET.parse(file)
    boxes = []
    for el in tree.iter():
        tag = el.tag.split("}")[-1]
        if tag == "path" and el.get("d"):
            for p in subpaths(el.get("d")):
                xs, ys = [q[0] for q in p], [q[1] for q in p]
                boxes.append((min(xs), min(ys), max(xs), max(ys)))
        elif tag in ("polygon", "polyline") and el.get("points"):
            v = [float(x) for x in NUM.findall(el.get("points"))]
            xs, ys = v[0::2], v[1::2]
            boxes.append((min(xs), min(ys), max(xs), max(ys)))

    # x가 겹치는 획끼리 묶는다 = 글자 한 자(심볼도 한 덩어리).
    groups = []
    for b in sorted(boxes):
        if groups and b[0] <= groups[-1][2] + 0.5:
            g = groups[-1]
            groups[-1] = (g[0], min(g[1], b[1]), max(g[2], b[2]), max(g[3], b[3]))
        else:
            groups.append(b)

    H = groups[0][3] - groups[0][1] if groups else 1  # 첫 덩어리 = 심볼, 그 높이가 H
    print(f"\n{file}  (획 {len(boxes)} → 덩어리 {len(groups)})  H={H:.2f}")
    for i, (x0, y0, x1, y1) in enumerate(groups):
        h = y1 - y0
        print(f"  #{i} x {x0:7.2f}–{x1:7.2f}  top {y0:6.2f} bottom {y1:6.2f}  높이 {h:6.2f} = {h / H:.4f}H")
