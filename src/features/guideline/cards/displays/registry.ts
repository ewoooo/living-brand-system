import type { Block } from 'payload'
import { type DisplayDefinition, displaySchema } from './definition'
import { ciLockup } from './dynamics/ci-lockup/definition'
import { ciLockupHero } from './dynamics/ci-lockup-hero/definition'
import { clearspaceOverlay } from './dynamics/clearspace-overlay/definition'
import { clearspaceViewer } from './dynamics/clearspace-viewer/definition'
import { hdColorPalette } from './dynamics/hd-color-palette/definition'
import { iconGrid } from './dynamics/icon-grid/definition'
import { layoutGrid } from './dynamics/layout-grid/definition'
import { layoutGridOverlay } from './dynamics/layout-grid-overlay/definition'
import { logoBgPicker } from './dynamics/logo-bg-picker/definition'
import { logoColorVariant } from './dynamics/logo-color-variant/definition'
import { logoDisplay } from './dynamics/logo-display/definition'
import { logoOnBackground } from './dynamics/logo-on-background/definition'
import { presetPanel } from './dynamics/preset-panel/definition'
import { stemClearSpace } from './dynamics/stem-clear-space/definition'
import { typeHierarchy } from './dynamics/type-hierarchy/definition'
import { typeLanguage } from './dynamics/type-language/definition'
import { typeScramble } from './dynamics/type-scramble/definition'
import { typeSpecimen } from './dynamics/type-specimen/definition'
import { typeWeight } from './dynamics/type-weight/definition'
import { staticDisplay } from './static/definition'

/**
 * 디스플레이 레지스트리 — 카드 판에 무엇을 그릴 수 있는지의 목록(2026-09-08). 정의는 각 폴더의 `definition.ts`가
 * 소유하고(id·type·dbName·name·description·fields), 렌더는 같은 폴더 `component.tsx`의 기본 export다.
 * 여기는 순서만 정한다 — 배열 순서가 admin 선택기 순서다. 렌더 맵은 `registry.render.tsx`가 같은 id로 갖는다.
 *
 * 🔴 이 모듈은 payload.config가 Node에서 읽는다(`cards/schema.ts` 경유) — React를 넣지 말 것.
 *
 * 위젯은 **전부** 연다(사용자 결정 2026-09-07 "B"). 그 결과 감수하는 것 둘: 컨트롤러 위젯(ci-lockup·
 * clearspace-viewer·layout-grid)은 하단 Floating Controller를 잃고 admin 고정값으로만 그려지며, 콘텐츠 높이형
 * (icon-grid·hd-color-palette·type-hierarchy·logo-on-background)은 규격 비율 판 안에서 스크롤된다.
 * 컨트롤 전용 layout-grid-controls는 그릴 것이 없어 2026-09-08에 지웠고, Do/Don’t 위젯은 카드(프리셋 패널·정적
 * 디스플레이 + 카드 `mark`)로 대체됐다.
 */
export const DISPLAYS = [
	staticDisplay,
	ciLockupHero,
	clearspaceOverlay,
	logoBgPicker,
	logoDisplay,
	typeScramble,
	typeWeight,
	typeSpecimen,
	layoutGridOverlay,
	ciLockup,
	clearspaceViewer,
	layoutGrid,
	presetPanel,
	hdColorPalette,
	iconGrid,
	stemClearSpace,
	logoColorVariant,
	logoOnBackground,
	typeHierarchy,
	typeLanguage,
] as const satisfies readonly DisplayDefinition[]

export type DisplayId = (typeof DISPLAYS)[number]['id']

/** 카드 `display` 필드가 받는 Payload Block 목록. */
export const displayBlocks: Block[] = DISPLAYS.map(displaySchema)
