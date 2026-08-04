// Key Layout 정본 규칙의 허용 범위. 🔴 react·에셋을 import하지 않는다 —
// Payload schema(Node)와 위젯(Next) 양쪽에서 참조되어야 한다.
// 슬라이더 범위와 admin 입력 검증이 같은 값을 쓰게 하려는 것: 범위를 넓히면 규칙이 깨진다.

/** 마진 = 판형 긴 축의 3~6%. 짧은 축에도 같은 길이를 쓰므로 수직·수평 마진은 항상 같다. */
export const MARGIN_PCT = { min: 3, max: 6, default: 4.5 }

/** 거터 = 마진의 0~100%. 수직·수평 따로. 0%면 셀 사이 간격이 없다. */
export const GUTTER_RATIO = { min: 0, max: 100, default: 75 }
