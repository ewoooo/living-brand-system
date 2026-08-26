'use client'

import { useState } from 'react'
import { Controller } from '@/components/shared/controller'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { VideoExportSpec } from '@/features/studio-export/export-contract'
import type { PrintPpi } from '@/features/studio-export/print-policy'

export type OutputSizeValue = {
	width: number | null
	height: number | null
}

/**
 * mm↔px 환산 기준. 🔴 디자이너 원본(`HD_PATTERN.js`)은 화면비 프리셋마다 dpi가 달랐다
 * (근접해서 보는 A4는 300, 멀리서 보는 대형 배너는 72). 프리셋을 이식하지 않았으므로
 * 원본의 폴백값 300을 단일 기준으로 쓴다 — 프리셋이 들어오면 이 상수가 프리셋에서 와야 한다.
 */
const MM_DPI = 300
const PX_PER_MM = MM_DPI / 25.4

type OutputSizeUnit = 'px' | 'mm'

const UNIT_OPTIONS = [
	{ value: 'px', label: 'px' },
	{ value: 'mm', label: 'mm' },
] as const

/** 🔑 저장되는 값은 언제나 px다. 단위는 **입력란의 표시·입력만** 바꾼다(원본과 같은 규칙). */
function pxToUnit(px: number, unit: OutputSizeUnit) {
	return unit === 'mm' ? px / PX_PER_MM : px
}

function unitToPx(value: number, unit: OutputSizeUnit) {
	return unit === 'mm' ? value * PX_PER_MM : value
}

/** 정수로만 보여주고 받는다 — 원본의 `formatSizeValue`도 반올림한다. */
function displayValue(px: number | null, unit: OutputSizeUnit) {
	return px === null ? null : Math.round(pxToUnit(px, unit))
}

function displayMax(px: number | undefined, unit: OutputSizeUnit) {
	return px === undefined ? undefined : Math.floor(pxToUnit(px, unit))
}

type SizingControlsProps = {
	value: OutputSizeValue
	maxWidth?: number
	maxHeight?: number
	onChange: (value: { width: number; height: number }) => void
}

/**
 * Footer에서 정적 이미지와 영상 출력 크기를 같은 Width·Height 행으로 편집한다.
 * 단위 선택은 이 컴포넌트가 소유한다 — 세션에 저장할 값이 아니라 보는 방식이다.
 */
export function SizingControls({ value, maxWidth, maxHeight, onChange }: SizingControlsProps) {
	const [unit, setUnit] = useState<OutputSizeUnit>('px')

	return (
		<div data-slot="sizing-controls" className="flex flex-col gap-1">
			<Controller.Row label="Unit">
				<Controller.Segmented
					aria-label="크기 단위"
					options={UNIT_OPTIONS}
					value={unit}
					onChange={(next) => setUnit(next as OutputSizeUnit)}
				/>
			</Controller.Row>
			<NumberRow
				label="Width"
				value={displayValue(value.width, unit)}
				max={displayMax(maxWidth, unit)}
				suffix={unit}
				onChange={(width) => {
					if (value.height !== null) {
						onChange({ width: Math.round(unitToPx(width, unit)), height: value.height })
					}
				}}
			/>
			<NumberRow
				label="Height"
				value={displayValue(value.height, unit)}
				max={displayMax(maxHeight, unit)}
				suffix={unit}
				onChange={(height) => {
					if (value.width !== null) {
						onChange({ width: value.width, height: Math.round(unitToPx(height, unit)) })
					}
				}}
			/>
		</div>
	)
}

type VideoControlsProps = {
	fps: VideoExportSpec['fps']
	fpsOptions: readonly VideoExportSpec['fps'][]
	durationSeconds: number
	maxDurationSeconds: number
	onFpsChange: (fps: VideoExportSpec['fps']) => void
	onDurationChange: (durationSeconds: number) => void
}

/** Footer에서 영상 포맷에만 필요한 FPS와 길이를 편집한다. 해상도는 SizingControls가 소유한다. */
export function VideoControls({
	fps,
	fpsOptions,
	durationSeconds,
	maxDurationSeconds,
	onFpsChange,
	onDurationChange,
}: VideoControlsProps) {
	return (
		<div data-slot="video-controls" className="flex flex-col gap-1">
			<Controller.Row label="FPS" readonly={fpsOptions.length <= 1}>
				{fpsOptions.length <= 1 ? (
					<span className="text-sm text-muted-foreground">{fps}</span>
				) : (
					<Controller.Select
						options={fpsOptions.map((option) => ({
							value: String(option),
							label: String(option),
						}))}
						value={String(fps)}
						onChange={(next) => onFpsChange(Number(next) as VideoExportSpec['fps'])}
					/>
				)}
			</Controller.Row>
			<NumberRow
				label="Duration"
				value={durationSeconds}
				max={maxDurationSeconds}
				suffix="sec"
				onChange={onDurationChange}
			/>
		</div>
	)
}

/**
 * Footer에서 캔버스 좌표계 대비 출력 배율을 고른다.
 * 선택지가 하나뿐이면(캔버스가 이미 인코딩 한도에 가까우면) 읽기 전용으로 둔다.
 */
export function ScaleControls({
	scale,
	options,
	onChange,
}: {
	scale: number
	options: readonly number[]
	onChange: (scale: number) => void
}) {
	return (
		<Controller.Row label="Scale" readonly={options.length <= 1}>
			{options.length <= 1 ? (
				<span className="text-sm text-muted-foreground">{scale}×</span>
			) : (
				<Controller.Select
					options={options.map((value) => ({ value: String(value), label: `${value}×` }))}
					value={String(scale)}
					onChange={(next) => onChange(Number(next))}
				/>
			)}
		</Controller.Row>
	)
}

/** Footer에서 인쇄 포맷에 필요한 Effective PPI만 선택한다. */
export function PrintControls({
	ppi,
	options,
	onChange,
}: {
	ppi: PrintPpi
	options: readonly PrintPpi[]
	onChange: (ppi: PrintPpi) => void
}) {
	return (
		<Controller.Row label="Resolution" readonly={options.length <= 1}>
			{options.length <= 1 ? (
				<span className="text-sm text-muted-foreground">{ppi}ppi</span>
			) : (
				<Controller.Select
					options={options.map((value) => ({
						value: String(value),
						label: `${value}ppi`,
					}))}
					value={String(ppi)}
					onChange={(value) => onChange(Number(value) as PrintPpi)}
				/>
			)}
		</Controller.Row>
	)
}

type ExportActionProps = {
	busy: boolean
	disabled: boolean
	error: string | null
	onExport: () => void
}

/** Footer의 공통 내보내기 실행 상태와 오류 표현을 묶는다. */
export function ExportAction({ busy, disabled, error, onExport }: ExportActionProps) {
	return (
		<div data-slot="export-action" className="flex flex-col gap-2">
			<Button className="h-11 w-full" onClick={onExport} disabled={disabled || busy}>
				{busy ? '내보내는 중...' : '내보내기'}
			</Button>
			{error && (
				<Typography role="alert" size="sm" className="text-destructive">
					{error}
				</Typography>
			)}
		</div>
	)
}

function NumberRow({
	label,
	value,
	max,
	suffix,
	onChange,
}: {
	label: string
	value: number | null
	max?: number
	suffix: string
	onChange: (value: number) => void
}) {
	return (
		<Controller.Row label={label}>
			<div className="flex items-center gap-1 text-muted-foreground">
				<Controller.Input
					key={`${label}-${value ?? 'empty'}`}
					type="number"
					inputMode="numeric"
					min={1}
					max={max}
					step={1}
					defaultValue={value ?? ''}
					placeholder="—"
					className="w-20 text-right"
					onBlur={(event) => {
						const next = event.currentTarget.valueAsNumber
						if (
							Number.isInteger(next) &&
							next > 0 &&
							(max === undefined || next <= max)
						) {
							onChange(next)
						} else {
							event.currentTarget.value = value === null ? '' : String(value)
						}
					}}
					onKeyDown={(event) => {
						if (event.key === 'Enter') event.currentTarget.blur()
					}}
				/>
				<span className="text-sm">{suffix}</span>
			</div>
		</Controller.Row>
	)
}
