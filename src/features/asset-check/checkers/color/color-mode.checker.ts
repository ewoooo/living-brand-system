/**
 * Checker: 오프셋 인쇄 별색 1도(Pantone Warm Red C) 규정을 본다.
 * ruleKey는 `color.mode`. 파일 색모드 메타는 래스터에 없으므로 spot-color checker와
 * 동일한 픽셀 프록시(Essenherb Red + White 구성)로 판정한다 — 로직 별칭 등록.
 */
import { spotColorChecker } from './spot-color.checker'

export const colorModeChecker = spotColorChecker
