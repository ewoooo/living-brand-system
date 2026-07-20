'use client'

import type { ChangeEvent } from 'react'
import { useState } from 'react'
import layoutBaseImage from './images/layout_base_image_1.webp'
import layoutBaseImage2 from './images/layout_base_image_2.webp'

/**
 * 레이아웃 그리드 오버레이 — 이미지 위에 "균일 섹션" 그리드 가이드를 정확히 겹쳐 레이아웃 규칙을 검수한다.
 *
 * 규칙 모델(모든 섹션 동일):
 * - 이미지는 세로로 균등 분할된 동일한 섹션 여러 개로 이뤄진다.
 * - 각 섹션은 상하좌우 동일 패딩 + n개 컬럼 + 컬럼 사이 gap.
 * - 폭·높이는 입력받지 않고 이미지 고유 값(props)을 그대로 쓴다. 편집값은 섹션·패딩·갭·열뿐.
 * - 폭/높이 대비 %(비율)로 환산해 그린다. 단위 셀렉터(mm·px)는 모든 입력값의 라벨 단위를 정하는 표기용 —
 *   ponytail: 실제 그리기는 이미지 픽셀 대비 비율이라 값은 px 기준으로 입력해야 기하학적으로 정확.
 *   mm 스펙을 그대로 반영하려면 이미지 DPI(또는 물리 폭)가 필요.
 *
 * 단일 토글: 켜면 가이드 표시 + 이미지 50%, 끄면 가이드 숨김 + 이미지 100%.
 *
 * @example
 * <LayoutGridOverlay image={img.src} width={img.width} height={img.height} defaults={{ sections: 3, columns: 4 }} />
 */
export type LayoutParams = {
	/** 세로로 쌓이는 섹션 개수(균등 높이). */
	sections: number
	/** 섹션 상하좌우 균일 패딩. */
	padding: number
	/** 컬럼 사이 gap. */
	gap: number
	/** 섹션당 컬럼 수. */
	columns: number
}

const GUIDE = '#ff2d78'
const DEFAULTS: LayoutParams = {
	sections: 3,
	padding: 24,
	gap: 16,
	columns: 4,
}

export function LayoutGridOverlay({
	image,
	width,
	height,
	defaults,
}: {
	image: string
	/** 이미지 고유 폭(px). 입력 아님 — 이미지 값을 그대로 받는다. */
	width: number
	/** 이미지 고유 높이(px). 입력 아님 — 이미지 값을 그대로 받는다. */
	height: number
	defaults?: Partial<LayoutParams>
}) {
	const [params, setParams] = useState<LayoutParams>({ ...DEFAULTS, ...defaults })
	const [unit, setUnit] = useState<'mm' | 'px'>('px')
	// 단일 토글: 가이드 표시 여부 = 이미지 50% 여부.
	const [guidesOn, setGuidesOn] = useState(true)

	const { padding, gap } = params
	const sections = Math.max(params.sections, 1)
	const columns = Math.max(params.columns, 1)
	const sectionHeight = height / sections
	const contentWidth = width - padding * 2
	const colWidth = (contentWidth - gap * (columns - 1)) / columns

	const set = (key: keyof LayoutParams) => (event: ChangeEvent<HTMLInputElement>) => {
		const next = event.target.value === '' ? 0 : Number(event.target.value)
		setParams((prev) => ({ ...prev, [key]: Number.isFinite(next) ? next : prev[key] }))
	}

	const sectionIds = Array.from({ length: sections }, (_, i) => `sec-${i}`)
	const columnIds = Array.from({ length: columns }, (_, i) => `col-${i}`)

	return (
		<div className="w-full">
			{/* 입력 칸 — 폭·높이는 이미지 값을 그대로 쓰므로 입력받지 않는다. */}
			<div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
			</div>

			{/* 단위 셀렉터 + 단일 토글 */}
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<div className="inline-flex overflow-hidden rounded-md border border-border">
					{(['mm', 'px'] as const).map((u) => (
						<button
							key={u}
							type="button"
							onClick={() => setUnit(u)}
							aria-pressed={unit === u}
							className={`px-3 py-1.5 font-body font-medium text-sm ${
								unit === u ? 'bg-foreground text-background' : 'hover:bg-fill-hover'
							}`}
						>
							{u}
						</button>
					))}
				</div>
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
			</div>

			{/* 스테이지 */}
			<div
				className="relative mx-auto w-full max-w-xl overflow-hidden border border-border"
				style={{ aspectRatio: `${width} / ${height}` }}
			>
				{/* biome-ignore lint/performance/noImgElement: 임의 data-URI/원격이라 next/image 미사용. */}
				<img
					src={image}
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

// 하나의 템플릿을 서로 다른 이미지·인자로 여러 번 배치한다. 각 인스턴스는 자기 이미지의 고유
// 폭·높이(static import)를 그대로 쓰고, 독립 state로 라이브 튜닝된다. admin 블록으로 이관할 때
// 이 SAMPLES가 그대로 인스턴스 인자가 된다.
const SAMPLES: { label: string; image: typeof layoutBaseImage; defaults: Partial<LayoutParams> }[] =
	[
		{
			label: '4-column grid',
			image: layoutBaseImage,
			defaults: { sections: 3, columns: 4, padding: 24, gap: 16 },
		},
		{
			label: '12-column grid',
			image: layoutBaseImage2,
			defaults: { sections: 3, columns: 12, padding: 24, gap: 12 },
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
						image={sample.image.src}
						width={sample.image.width}
						height={sample.image.height}
						defaults={sample.defaults}
					/>
				</div>
			))}
		</div>
	)
}
