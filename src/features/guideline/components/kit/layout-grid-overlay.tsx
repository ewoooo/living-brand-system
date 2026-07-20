'use client'

import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import layoutBaseImage from './images/layout_base_image_1.webp'
import layoutBaseImage2 from './images/layout_base_image_2.webp'

/**
 * 레이아웃 그리드 오버레이 — 이미지 위에 "균일 섹션" 그리드 가이드를 겹쳐 레이아웃 규칙을 검수한다.
 *
 * 규칙 모델(섹션은 균등 높이·균등 열):
 * - 이미지는 세로로 균등 분할된 섹션 여러 개로 이뤄지고, 모든 섹션은 같은 열 개수를 쓴다.
 * - 각 섹션은 상하좌우 동일 패딩 + n개 컬럼 + 열 사이 gap.
 * - 폭·높이는 컴포넌트 단위로 한 번만 입력하고 모든 이미지가 공유한다(같은 규격 리플릿 전제).
 * - 폭/높이·패딩·갭이 같은 단위이기만 하면 %(비율)로 환산해 그리므로 단위는 무관 — 셀렉터 없음.
 *
 * 컨트롤 한 세트(=하나의 규칙)를 여러 이미지에 동시 적용해 병렬로 검수한다.
 * 단일 토글: 켜면 가이드 표시 + 이미지 50%, 끄면 가이드 숨김 + 이미지 100%.
 * storageKey를 주면 현재 입력값을 브라우저에 임시 저장/복원한다.
 *
 * @example
 * <LayoutGridOverlay images={[img1, img2]} defaults={{ sections: 3, columns: 4 }} storageKey="leaflet" />
 */
export type LayoutParams = {
	/** 세로로 쌓이는 섹션 개수(균등 높이). */
	sections: number
	/** 섹션 상하좌우 균일 패딩. */
	padding: number
	/** 열 사이 gap. */
	gap: number
	/** 섹션당 열 개수(모든 섹션 동일). */
	columns: number
	/** 모든 이미지가 공유하는 폭. */
	width: number
	/** 모든 이미지가 공유하는 높이. */
	height: number
}

/** 오버레이 대상 이미지. width·height는 폭·높이 초기값(시드)으로 첫 이미지 것만 쓴다. */
type ImageSpec = { src: string; width: number; height: number }

const GUIDE = '#ff2d78'
const STORAGE_PREFIX = 'kit:layout-overlay:'
const BASE_DEFAULTS = { sections: 3, padding: 24, gap: 16, columns: 4 }

const toNumber = (event: ChangeEvent<HTMLInputElement>) =>
	event.target.value === '' ? 0 : Number(event.target.value)

export function LayoutGridOverlay({
	images,
	defaults,
	storageKey,
}: {
	/** 같은 규칙(params)을 병렬로 적용할 이미지들. 크기는 첫 이미지 기준으로 공유. */
	images: ImageSpec[]
	defaults?: Partial<LayoutParams>
	/** 주면 입력값을 브라우저 localStorage에 임시 저장/복원한다. */
	storageKey?: string
}) {
	const initial: LayoutParams = {
		sections: defaults?.sections ?? BASE_DEFAULTS.sections,
		padding: defaults?.padding ?? BASE_DEFAULTS.padding,
		gap: defaults?.gap ?? BASE_DEFAULTS.gap,
		columns: defaults?.columns ?? BASE_DEFAULTS.columns,
		width: defaults?.width ?? images[0]?.width ?? 1000,
		height: defaults?.height ?? images[0]?.height ?? 1000,
	}
	const [params, setParams] = useState<LayoutParams>(initial)
	// 단일 토글: 가이드 표시 여부 = 이미지 50% 여부.
	const [guidesOn, setGuidesOn] = useState(true)
	const [justSaved, setJustSaved] = useState(false)

	// 임시 저장값 복원 — 마운트 후 1회(SSR 하이드레이션 안전).
	useEffect(() => {
		if (!storageKey) return
		const raw = localStorage.getItem(STORAGE_PREFIX + storageKey)
		if (!raw) return
		try {
			setParams((prev) => ({ ...prev, ...(JSON.parse(raw) as Partial<LayoutParams>) }))
		} catch {
			// 손상된 값은 무시하고 기본값 유지
		}
	}, [storageKey])

	const set = (key: keyof LayoutParams) => (event: ChangeEvent<HTMLInputElement>) => {
		const value = toNumber(event)
		if (!Number.isFinite(value)) return
		setJustSaved(false)
		setParams((prev) => ({ ...prev, [key]: value }))
	}

	const save = () => {
		if (!storageKey) return
		localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(params))
		setJustSaved(true)
	}

	const reset = () => {
		if (storageKey) localStorage.removeItem(STORAGE_PREFIX + storageKey)
		setParams(initial)
		setJustSaved(false)
	}

	const sections = Math.max(params.sections, 1)
	const columns = Math.max(params.columns, 1)
	const { padding, gap, width, height } = params

	return (
		<div className="w-full">
			{/* 규칙 컨트롤 (모든 이미지 공통) */}
			<div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
				<NumberField
					label="섹션 개수"
					value={params.sections}
					onChange={set('sections')}
					min={1}
				/>
				<NumberField label="섹션 패딩" value={params.padding} onChange={set('padding')} />
				<NumberField label="갭" value={params.gap} onChange={set('gap')} />
				<NumberField
					label="열 개수"
					value={params.columns}
					onChange={set('columns')}
					min={1}
				/>
				<NumberField
					label="이미지 폭"
					value={params.width}
					onChange={set('width')}
					min={1}
				/>
				<NumberField
					label="이미지 높이"
					value={params.height}
					onChange={set('height')}
					min={1}
				/>
			</div>

			{/* 토글 + 임시 저장 */}
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={() => setGuidesOn((v) => !v)}
					aria-pressed={guidesOn}
					className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm hover:bg-fill-hover"
				>
					<span
						className={`h-2.5 w-2.5 rounded-full ${guidesOn ? 'bg-foreground' : 'bg-border'}`}
					/>
					가이드 {guidesOn ? '켜짐 (이미지 50%)' : '꺼짐'}
				</button>
				<button
					type="button"
					onClick={save}
					disabled={!storageKey}
					className="rounded-md border border-border px-3 py-1.5 font-body font-medium text-sm hover:bg-fill-hover disabled:opacity-50"
				>
					임시 저장
				</button>
				<button
					type="button"
					onClick={reset}
					className="rounded-md border border-border px-3 py-1.5 font-body font-medium text-muted-foreground text-sm hover:bg-fill-hover"
				>
					초기화
				</button>
				{justSaved && (
					<span className="font-body text-muted-foreground text-xs">✓ 저장됨</span>
				)}
			</div>

			{/* 스테이지 — 공유 규칙·크기를 여러 이미지에 병렬 적용 */}
			<div className="flex flex-col gap-4 sm:flex-row">
				{images.map((image) => (
					<GridStage
						key={image.src}
						src={image.src}
						width={Math.max(width, 1)}
						height={Math.max(height, 1)}
						sections={sections}
						padding={padding}
						gap={gap}
						columns={columns}
						guidesOn={guidesOn}
					/>
				))}
			</div>
		</div>
	)
}

// 이미지 한 장 + 그리드 오버레이. 모든 섹션이 같은 열 개수를 쓴다.
function GridStage({
	src,
	width,
	height,
	sections,
	padding,
	gap,
	columns,
	guidesOn,
}: {
	src: string
	width: number
	height: number
	sections: number
	padding: number
	gap: number
	columns: number
	guidesOn: boolean
}) {
	const sectionHeight = height / sections
	const contentWidth = width - padding * 2
	const colWidth = (contentWidth - gap * (columns - 1)) / columns
	const sectionIds = Array.from({ length: sections }, (_, i) => `sec-${i}`)
	const columnIds = Array.from({ length: columns }, (_, i) => `col-${i}`)

	return (
		<div
			className="relative w-full overflow-hidden border border-border"
			style={{ aspectRatio: `${width} / ${height}` }}
		>
			{/* biome-ignore lint/performance/noImgElement: 임의 data-URI/원격이라 next/image 미사용. */}
			<img
				src={src}
				alt="레이아웃 대상"
				className="h-full w-full object-cover transition-opacity"
				style={{ opacity: guidesOn ? 0.5 : 1 }}
			/>

			{guidesOn && (
				<div className="pointer-events-none absolute inset-0">
					{sectionIds.map((sid, s) => (
						<div
							key={sid}
							className="absolute"
							style={{
								left: `${(padding / width) * 100}%`,
								top: `${((s * sectionHeight + padding) / height) * 100}%`,
								width: `${(contentWidth / width) * 100}%`,
								height: `${((sectionHeight - padding * 2) / height) * 100}%`,
								outline: `1px solid ${GUIDE}`,
							}}
						>
							{columnIds.map((cid, c) => (
								<div
									key={cid}
									className="absolute top-0 h-full"
									style={{
										left: `${((c * (colWidth + gap)) / contentWidth) * 100}%`,
										width: `${(colWidth / contentWidth) * 100}%`,
										outline: `1px solid ${GUIDE}`,
									}}
								/>
							))}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

function NumberField({
	label,
	value,
	onChange,
	min = 0,
}: {
	label: string
	value: number
	onChange: (event: ChangeEvent<HTMLInputElement>) => void
	min?: number
}) {
	return (
		<label className="flex flex-col gap-1">
			<span className="font-body font-medium text-muted-foreground text-xs">{label}</span>
			<input
				type="number"
				value={value}
				onChange={onChange}
				min={min}
				className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-body text-foreground text-sm"
			/>
		</label>
	)
}

// 하나의 규칙(params)을 두 리플릿 페이지에 병렬 적용한다. 크기는 첫 이미지 기준 공유.
// storageKey로 입력값을 브라우저에 임시 저장한다. admin 블록 이관 시 이 SAMPLES가 인스턴스 인자가 된다.
const SAMPLES: { label: string; images: ImageSpec[]; defaults: Partial<LayoutParams> }[] = [
	{
		label: 'Brand Leaflet Design/Specification',
		images: [layoutBaseImage, layoutBaseImage2],
		defaults: { sections: 3, columns: 4, padding: 24, gap: 16 },
	},
]

export function LayoutGridOverlayDemo() {
	return (
		<div className="flex flex-col gap-8">
			{SAMPLES.map((sample) => (
				<div key={sample.label} className="flex flex-col gap-2">
					<h4 className="font-body font-semibold text-foreground text-sm">
						{sample.label}
					</h4>
					<LayoutGridOverlay
						images={sample.images}
						defaults={sample.defaults}
						storageKey={sample.label}
					/>
				</div>
			))}
		</div>
	)
}
