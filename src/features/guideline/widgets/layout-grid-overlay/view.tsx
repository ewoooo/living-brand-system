'use client'

import type { ChangeEvent } from 'react'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { WIDGET_CAPTION } from '../readout'

/**
 * 레이아웃 그리드 오버레이 — 이미지 위에 "균일 섹션" 그리드 가이드를 겹쳐 레이아웃 규칙을 검수한다.
 * 하나의 규칙(params·크기)을 여러 이미지에 병렬 적용. 토글로 가이드 표시(이미지 50%)/숨김(100%) 전환.
 * (GUIDE 리터럴 → accent prop, localStorage 임시저장/SAMPLES/Demo 제거)
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

const BASE_DEFAULTS = { sections: 3, padding: 24, gap: 16, columns: 4 }

const toNumber = (event: ChangeEvent<HTMLInputElement>) =>
	event.target.value === '' ? 0 : Number(event.target.value)

export function LayoutGridOverlay({
	images,
	defaults,
	accent,
}: {
	/** 같은 규칙(params)을 병렬로 적용할 이미지들. 크기는 첫 이미지 기준으로 공유. */
	images: ImageSpec[]
	defaults?: Partial<LayoutParams>
	/** 그리드 가이드 라인 색(hex). 브랜드 색에서 주입. */
	accent: string
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

	const set = (key: keyof LayoutParams) => (event: ChangeEvent<HTMLInputElement>) => {
		const value = toNumber(event)
		if (!Number.isFinite(value)) return
		setParams((prev) => ({ ...prev, [key]: value }))
	}

	const reset = () => setParams(initial)

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

			{/* 토글 + 초기화 */}
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<Switch
					id="layout-grid-overlay-guides"
					checked={guidesOn}
					onCheckedChange={setGuidesOn}
				/>
				<Label
					htmlFor="layout-grid-overlay-guides"
					className="font-body font-medium text-sm"
				>
					가이드 {guidesOn ? '켜짐 (이미지 50%)' : '꺼짐'}
				</Label>
				<button
					type="button"
					onClick={reset}
					className="rounded-md border border-border px-3 py-1.5 font-body font-medium text-muted-foreground text-sm hover:bg-fill-hover"
				>
					초기화
				</button>
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
						accent={accent}
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
	accent,
}: {
	src: string
	width: number
	height: number
	sections: number
	padding: number
	gap: number
	columns: number
	guidesOn: boolean
	accent: string
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
								outline: `1px solid ${accent}`,
							}}
						>
							{columnIds.map((cid, c) => (
								<div
									key={cid}
									className="absolute top-0 h-full"
									style={{
										left: `${((c * (colWidth + gap)) / contentWidth) * 100}%`,
										width: `${(colWidth / contentWidth) * 100}%`,
										outline: `1px solid ${accent}`,
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
			<span className={`font-medium ${WIDGET_CAPTION}`}>{label}</span>
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
