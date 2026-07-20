'use client'

import type { ChangeEvent } from 'react'
import { useState } from 'react'
import layoutBaseImage from './images/layout_base_image_1.webp'

/**
 * 레이아웃 그리드 오버레이 — 이미지 위에 "균일 섹션" 그리드 가이드를 정확히 겹쳐 레이아웃 규칙을 검수한다.
 *
 * 규칙 모델(모든 섹션 동일):
 * - 이미지는 세로로 균등 분할된 동일한 섹션 여러 개로 이뤄진다.
 * - 각 섹션은 상하좌우 동일 패딩 + n개 컬럼 + 컬럼 사이 gap.
 * - 입력값(섹션 개수·패딩·갭·열·이미지 폭·높이)만 알면 나머지는 계산된다.
 * - 폭/높이 대비 %(비율)로 환산해 그리므로 단위(mm·px)는 무관 — 폭·높이·패딩·갭만 같은 단위면
 *   이미지에 정확히 맞는다(바깥/안쪽 오차 없이). 단위 셀렉터는 라벨 표기용.
 *
 * 단일 토글: 켜면 가이드 표시 + 이미지 50%, 끄면 가이드 숨김 + 이미지 100%.
 *
 * @example
 * <LayoutGridOverlay image="/x.webp" defaults={{ sections: 3, columns: 4, width: 2481, height: 3509 }} />
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
	/** 이미지 고유 폭. */
	width: number
	/** 이미지 고유 높이. */
	height: number
}

const GUIDE = '#ff2d78'
const DEFAULTS: LayoutParams = {
	sections: 3,
	padding: 24,
	gap: 16,
	columns: 4,
	width: 2481,
	height: 3509,
}

export function LayoutGridOverlay({
	image,
	defaults,
}: {
	image: string
	defaults?: Partial<LayoutParams>
}) {
	const [params, setParams] = useState<LayoutParams>({ ...DEFAULTS, ...defaults })
	const [unit, setUnit] = useState<'mm' | 'px'>('px')
	// 단일 토글: 가이드 표시 여부 = 이미지 50% 여부.
	const [guidesOn, setGuidesOn] = useState(true)

	const { padding, gap, width, height } = params
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
			{/* 입력 칸 */}
			<div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
				<NumberField
					label="섹션 개수"
					value={params.sections}
					onChange={set('sections')}
					min={1}
				/>
				<NumberField
					label={`섹션 패딩 (${unit})`}
					value={params.padding}
					onChange={set('padding')}
				/>
				<NumberField label={`갭 (${unit})`} value={params.gap} onChange={set('gap')} />
				<NumberField
					label="열 개수"
					value={params.columns}
					onChange={set('columns')}
					min={1}
				/>
				<NumberField
					label={`이미지 폭 (${unit})`}
					value={params.width}
					onChange={set('width')}
					min={1}
				/>
				<NumberField
					label={`이미지 높이 (${unit})`}
					value={params.height}
					onChange={set('height')}
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

// 실제 base 이미지(static import → src·width·height 자동 획득). 폭/높이는 이미지 픽셀로 시드하고,
// 섹션·패딩·갭·열은 웹에서 라이브로 맞춘다.
export function LayoutGridOverlayDemo() {
	return (
		<LayoutGridOverlay
			image={layoutBaseImage.src}
			defaults={{
				sections: 3,
				columns: 4,
				padding: 24,
				gap: 16,
				width: layoutBaseImage.width,
				height: layoutBaseImage.height,
			}}
		/>
	)
}
