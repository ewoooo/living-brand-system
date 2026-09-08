import config from '@payload-config'
import { getPayload } from 'payload'
import type { ReactNode } from 'react'
import { ControllerBar } from '@/components/shared/controller'
import { CiLockupWidget } from '@/features/guideline/cards/displays/dynamics/ci-lockup/component'
import { CI_LOCKUP_MANIFEST } from '@/features/guideline/cards/displays/dynamics/ci-lockup/manifest'
import { CiLockupHeroWidget } from '@/features/guideline/cards/displays/dynamics/ci-lockup-hero/component'
import { ClearspaceOverlayWidget } from '@/features/guideline/cards/displays/dynamics/clearspace-overlay/component'
import { ClearspaceViewerWidget } from '@/features/guideline/cards/displays/dynamics/clearspace-viewer/component'
import { HdColorPaletteWidget } from '@/features/guideline/cards/displays/dynamics/hd-color-palette/component'
import { IconGridWidget } from '@/features/guideline/cards/displays/dynamics/icon-grid/component'
import { LayoutGridWidget } from '@/features/guideline/cards/displays/dynamics/layout-grid/component'
import { LAYOUT_GRID_MANIFEST } from '@/features/guideline/cards/displays/dynamics/layout-grid/manifest'
import { LayoutGridOverlayWidget } from '@/features/guideline/cards/displays/dynamics/layout-grid-overlay/component'
import { LogoBgPickerWidget } from '@/features/guideline/cards/displays/dynamics/logo-bg-picker/component'
import { LogoColorVariantWidget } from '@/features/guideline/cards/displays/dynamics/logo-color-variant/component'
import { LogoDisplayWidget } from '@/features/guideline/cards/displays/dynamics/logo-display/component'
import { LogoOnBackgroundWidget } from '@/features/guideline/cards/displays/dynamics/logo-on-background/component'
import { PresetPanel } from '@/features/guideline/cards/displays/dynamics/preset-panel/component'
import { StemClearSpaceWidget } from '@/features/guideline/cards/displays/dynamics/stem-clear-space/component'
import { TypeHierarchyWidget } from '@/features/guideline/cards/displays/dynamics/type-hierarchy/component'
import { TypeLanguageWidget } from '@/features/guideline/cards/displays/dynamics/type-language/component'
import { TypeScrambleWidget } from '@/features/guideline/cards/displays/dynamics/type-scramble/component'
import { TypeSpecimenWidget } from '@/features/guideline/cards/displays/dynamics/type-specimen/component'
import { TypeWeightWidget } from '@/features/guideline/cards/displays/dynamics/type-weight/component'
import { helperLabel } from '@/features/guideline/components/globals/guideline-helper-label'
import { GuidelineControllerPill } from '@/features/guideline/controllers/pill'
import { GuidelineControllerScope } from '@/features/guideline/controllers/provider'
import type { BrandLogo } from '@/payload-types'

// dev 전용 위젯 갤러리. 위젯 스타일 통일 + 성능 확인용 (로컬에서만 노출, nav 미등록).
// ponytail: registry = 배열 하나, 제너레이터는 반복이 지겨워질 때.
//
// 대부분의 위젯은 인스턴스 입력 없이 자족 렌더하지만, 업로드 관계를 요구하는 위젯은
// 값이 없으면 `return null`이라 빈 칸이 된다. 그래서 여기서 brand-logos를 한 번 조회해
// 그 몇 개에만 실제 파일을 먹인다 — 플레이스홀더로 때우면 위젯이 뭘 그리는지 안 보인다.

/** 파일명으로 로고를 집는다. 갤러리 전용이라 없으면 그 위젯만 빈 칸이 된다. */
function pick(logos: BrandLogo[], filename: string): BrandLogo | null {
	return logos.find((l) => l.filename === filename) ?? null
}

async function buildWidgets(): Promise<{ name: string; node: ReactNode }[]> {
	const payload = await getPayload({ config })
	const { docs: logos } = await payload.find({
		collection: 'brand-logos',
		limit: 200,
		depth: 0,
		overrideAccess: true,
	})

	// 클리어스페이스 위젯은 로고 레이어 + 그리드 레이어를 같은 viewBox로 겹친다.
	const hLogo = pick(logos, 'ko-horizontal-default-logoSpace.svg')
	const hGrid = pick(logos, 'ko-horizontal-default-clearSpace.svg')
	const vLogo = pick(logos, 'ko-vertical-default-logoSpace.svg')
	const vGrid = pick(logos, 'ko-vertical-default-clearSpace.svg')
	// logo-color-variant는 파일명 앞 조각으로 언어를 파싱해 같은 언어의 색상 변형을 조회한다.
	const koLogo = pick(logos, 'ko-horizontal-default.svg')

	// 배경색 위젯은 그룹을 안 주면 첫 그룹(Primary)을 잡는데, Primary 4색은 규정상 기본형·WHITE가
	// 전부 불가라 미리보기가 ✕만 나온다. 결과가 갈리는 그룹을 집어 위젯이 뭘 하는지 보이게 한다.
	const { docs: colorGroups } = await payload.find({
		collection: 'brand-color-groups',
		limit: 50,
		depth: 0,
		overrideAccess: true,
	})
	const bgGroup = colorGroups.find((g) => g.name === 'Background Color') ?? colorGroups[0] ?? null

	return [
		{
			// 🔑 컨트롤은 매니페스트가 만든다 — 갤러리도 스코프 안에서 그려야 실제 화면과 갈리지 않는다.
			//    스코프 없이 두면 컨트롤 없는 정적 락업이 되어 「이 위젯은 조작이 안 된다」로 읽힌다.
			name: 'ci-lockup',
			node: (
				<GuidelineControllerScope manifest={CI_LOCKUP_MANIFEST}>
					<ControllerBar placement="scroll" aria-label={helperLabel('CI 락업')}>
						<GuidelineControllerPill />
					</ControllerBar>
					<CiLockupWidget />
				</GuidelineControllerScope>
			),
		},
		// 히어로는 컨트롤을 열지 않는다 — 스코프 없이도 자기 값으로 그려진다(축을 전부 고정한다).
		{
			name: 'ci-lockup-hero (자회사)',
			node: <CiLockupHeroWidget source="subsidiary" h={120} />,
		},
		{ name: 'ci-lockup-hero (해외지사)', node: <CiLockupHeroWidget source="branch" h={100} /> },
		{ name: 'icon-grid', node: <IconGridWidget /> },
		{ name: 'stem-clear-space', node: <StemClearSpaceWidget /> },
		{ name: 'hd-color-palette (균일)', node: <HdColorPaletteWidget layout="uniform" /> },
		{ name: 'hd-color-palette (위계)', node: <HdColorPaletteWidget layout="ranked" /> },
		{ name: 'type-specimen', node: <TypeSpecimenWidget /> },
		{ name: 'type-scramble', node: <TypeScrambleWidget /> },
		{ name: 'type-weight', node: <TypeWeightWidget /> },
		{ name: 'type-hierarchy', node: <TypeHierarchyWidget /> },
		{ name: 'type-language (단일)', node: <TypeLanguageWidget layout="single" /> },
		{ name: 'type-language (비교)', node: <TypeLanguageWidget layout="compare" /> },

		{ name: 'logo-display', node: <LogoDisplayWidget logo={koLogo} /> },
		{ name: 'logo-color-variant', node: <LogoColorVariantWidget logo={koLogo} /> },
		{ name: 'logo-on-background', node: <LogoOnBackgroundWidget /> },
		{ name: 'logo-bg-picker', node: <LogoBgPickerWidget group={bgGroup} /> },
		{
			name: 'clearspace-overlay',
			node: (
				<ClearspaceOverlayWidget logoLayer={hLogo} gridLayer={hGrid} scalePercent={100} />
			),
		},
		{
			name: 'clearspace-viewer',
			node: (
				<ClearspaceViewerWidget
					horizontalLogo={hLogo}
					horizontalGrid={hGrid}
					verticalLogo={vLogo}
					verticalGrid={vGrid}
				/>
			),
		},
		{
			// 프리셋 패널은 카드 판을 채우는 디스플레이라 판(비율·clip)을 여기서 흉내 낸다. 컬러(로고 얹음)·타이포 하나씩.
			name: 'preset-panel (컬러 프리셋)',
			node: (
				<div className="relative aspect-video overflow-hidden rounded-3xl bg-muted">
					<PresetPanel preset="overlay-stack" logo={koLogo} />
				</div>
			),
		},
		{
			name: 'preset-panel (타이포 프리셋)',
			node: (
				<div className="relative aspect-video overflow-hidden rounded-3xl bg-muted">
					<PresetPanel preset="slanted" />
				</div>
			),
		},
		{ name: 'layout-grid', node: <LayoutGridWidget /> },
		{
			// 컨트롤은 위젯이 아니라 **매니페스트**가 만든다. 갤러리도 같은 경로로 그려야
			// 미리보기가 실제 화면과 갈리지 않는다(제한 없는 = admin이 아무것도 좁히지 않은 상태).
			name: 'layout-grid 컨트롤러',
			node: (
				<GuidelineControllerScope manifest={LAYOUT_GRID_MANIFEST}>
					<ControllerBar placement="scroll" aria-label={helperLabel('Layout')}>
						<GuidelineControllerPill />
					</ControllerBar>
				</GuidelineControllerScope>
			),
		},
		{ name: 'layout-grid-overlay', node: <LayoutGridOverlayWidget /> },
	]
}

export async function GuidelineWidgetGallery() {
	const widgets = await buildWidgets()
	return (
		<div className="flex flex-col gap-16 py-12">
			{widgets.map(({ name, node }) => (
				<section key={name} className="flex flex-col gap-4">
					<h2 className="font-mono text-sm text-muted-foreground">{name}</h2>
					{node}
				</section>
			))}
		</div>
	)
}
