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

/** 프리셋에 속하지 않는 크기의 mm 환산 기준. 원본(`HD_PATTERN.js`)의 폴백값과 같다. */
const DEFAULT_MM_DPI = 300

type OutputSizeUnit = 'px' | 'mm'

/**
 * 대지 프리셋. 값·단위·dpi는 디자이너 원본 `RATIO_PRESETS`를 그대로 옮겼다.
 *
 * 🔑 dpi가 프리셋마다 다르다 — 근접해서 보는 인쇄물은 300, 멀리서 보는 대형 배너는 72다.
 * 원본 주석: 배너에 300dpi를 쓰면 그리드 칸이 수만 개로 늘어나 매 프레임이 무거워진다.
 * `unit`은 그 규격을 사람이 말할 때 쓰는 단위이고, 고르면 입력란도 그 단위로 맞춘다.
 */
const ARTBOARD_PRESETS = {
	square: {
		label: '1:1',
		caption: '인스타·프로필',
		width: 1080,
		height: 1080,
		unit: 'px',
		dpi: 300,
	},
	banner: { label: '1:3', caption: '배너·현수막', width: 600, height: 1800, unit: 'mm', dpi: 72 },
	wide: {
		label: '16:9',
		caption: '프레젠테이션·미디어',
		width: 1920,
		height: 1080,
		unit: 'px',
		dpi: 300,
	},
	a: { label: 'A size', caption: '홍보인쇄물', width: 210, height: 297, unit: 'mm', dpi: 300 },
} as const satisfies Record<
	string,
	{
		label: string
		caption: string
		width: number
		height: number
		unit: OutputSizeUnit
		dpi: number
	}
>

export type ArtboardKey = keyof typeof ARTBOARD_PRESETS
/** 어느 프리셋과도 맞지 않는 크기. 사용자가 직접 넣은 값이다. */
export const CUSTOM_ARTBOARD = 'custom'

/** 프리셋이 선언한 규격을 px로 환산한다 — mm 규격은 그 프리셋의 dpi로 환산한다. */
export function presetSizeInPx(key: ArtboardKey) {
	const preset = ARTBOARD_PRESETS[key]
	const perMm = preset.dpi / 25.4
	return preset.unit === 'mm'
		? { width: Math.round(preset.width * perMm), height: Math.round(preset.height * perMm) }
		: { width: preset.width, height: preset.height }
}

/** 현재 크기와 정확히 같은 프리셋을 찾는다. 없으면 직접 입력이다. */
export function matchArtboard(value: OutputSizeValue): ArtboardKey | typeof CUSTOM_ARTBOARD {
	const keys = Object.keys(ARTBOARD_PRESETS) as ArtboardKey[]
	return (
		keys.find((key) => {
			const size = presetSizeInPx(key)
			return size.width === value.width && size.height === value.height
		}) ?? CUSTOM_ARTBOARD
	)
}

const UNIT_OPTIONS = [
	{ value: 'px', label: 'px' },
	{ value: 'mm', label: 'mm' },
] as const

/** 🔑 저장되는 값은 언제나 px다. 단위는 **입력란의 표시·입력만** 바꾼다(원본과 같은 규칙). */
function pxToUnit(px: number, unit: OutputSizeUnit, dpi: number) {
	return unit === 'mm' ? px / (dpi / 25.4) : px
}

function unitToPx(value: number, unit: OutputSizeUnit, dpi: number) {
	return unit === 'mm' ? value * (dpi / 25.4) : value
}

/** 정수로만 보여주고 받는다 — 원본의 `formatSizeValue`도 반올림한다. */
function displayValue(px: number | null, unit: OutputSizeUnit, dpi: number) {
	return px === null ? null : Math.round(pxToUnit(px, unit, dpi))
}

function displayMax(px: number | undefined, unit: OutputSizeUnit, dpi: number) {
	return px === undefined ? undefined : Math.floor(pxToUnit(px, unit, dpi))
}

/**
 * 고를 수 있는 대지 목록. 🔴 한도를 넘는 규격은 **목록에서 뺀다** — `ControllerOption`에
 * `disabled`가 없어서 비활성으로 남기면 고를 수 있어 보이는데 조용히 무시된다.
 * 현재 크기가 어느 프리셋과도 다를 때만 「직접 입력」 항목을 실어 선택 상태를 표현한다.
 */
export function listArtboardOptions({
	maxWidth,
	maxHeight,
	current,
}: {
	maxWidth?: number
	maxHeight?: number
	current: ArtboardKey | typeof CUSTOM_ARTBOARD
}) {
	const presets = (Object.keys(ARTBOARD_PRESETS) as ArtboardKey[])
		.filter((key) => {
			const size = presetSizeInPx(key)
			return (
				(maxWidth === undefined || size.width <= maxWidth) &&
				(maxHeight === undefined || size.height <= maxHeight)
			)
		})
		.map((key) => ({
			value: key as string,
			label: `${ARTBOARD_PRESETS[key].label} · ${ARTBOARD_PRESETS[key].caption}`,
		}))
	return current === CUSTOM_ARTBOARD
		? [...presets, { value: CUSTOM_ARTBOARD, label: '직접 입력' }]
		: presets
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
	// 🔑 선택 상태를 따로 들지 않는다 — 현재 크기에서 파생한다. 크기를 직접 고치면 저절로 「직접 입력」이 된다.
	const artboard = matchArtboard(value)
	const dpi = artboard === CUSTOM_ARTBOARD ? DEFAULT_MM_DPI : ARTBOARD_PRESETS[artboard].dpi

	const artboardOptions = listArtboardOptions({ maxWidth, maxHeight, current: artboard })

	return (
		<div data-slot="sizing-controls" className="flex flex-col gap-1">
			<Controller.Row label="대지">
				<Controller.Select
					options={artboardOptions}
					value={artboard}
					onChange={(next) => {
						if (next === CUSTOM_ARTBOARD) return
						const key = next as ArtboardKey
						onChange(presetSizeInPx(key))
						// 규격을 말할 때 쓰는 단위로 입력란을 맞춘다(원본도 프리셋 단위를 따라간다).
						setUnit(ARTBOARD_PRESETS[key].unit)
					}}
				/>
			</Controller.Row>
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
				value={displayValue(value.width, unit, dpi)}
				max={displayMax(maxWidth, unit, dpi)}
				suffix={unit}
				onChange={(width) => {
					if (value.height !== null) {
						onChange({
							width: Math.round(unitToPx(width, unit, dpi)),
							height: value.height,
						})
					}
				}}
			/>
			<NumberRow
				label="Height"
				value={displayValue(value.height, unit, dpi)}
				max={displayMax(maxHeight, unit, dpi)}
				suffix={unit}
				onChange={(height) => {
					if (value.width !== null) {
						onChange({
							width: value.width,
							height: Math.round(unitToPx(height, unit, dpi)),
						})
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
	/**
	 * 실패는 아니지만 결과물이 원본과 다른 점. 🔴 인쇄물은 되돌릴 수 없어서 조용히 넘기면 안 된다 —
	 * 파일은 나왔는데 무엇이 빠졌는지 모르는 상태가 가장 나쁘다.
	 */
	warnings?: readonly string[]
	onExport: () => void
}

/** Footer의 공통 내보내기 실행 상태와 오류·경고 표현을 묶는다. */
export function ExportAction({ busy, disabled, error, warnings, onExport }: ExportActionProps) {
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
			{warnings?.map((warning) => (
				<Typography key={warning} role="status" size="sm" className="text-warning">
					{warning}
				</Typography>
			))}
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
