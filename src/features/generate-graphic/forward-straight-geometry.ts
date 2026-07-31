import type { ForwardStraightInput } from './forward-straight'

const STYLE = {
	backgroundColor: '#030402',
	lineColor: '#ffffff',
	originColor: '#ff2a2a',
	strokeWeight: 1,
	lineLength: 30,
	columnGap: 40,
	rowGap: 32,
	horizontalMargin: 30,
	verticalMargin: 30,
	maxLineWeight: 5,
	minLineWeight: 0.5,
	weightFalloffDistance: 1000,
	originRadius: 2.5,
} as const

const LOW_ANGLE = {
	weak: { depthGamma: 1.5, scaleMin: 0.45 },
	medium: { depthGamma: 2.5, scaleMin: 0.25 },
	strong: { depthGamma: 4, scaleMin: 0.08 },
} as const

type Point = {
	x: number
	y: number
}

export type ForwardStraightDash = {
	x1: number
	y1: number
	x2: number
	y2: number
	weight: number
}

export type ForwardStraightScene = {
	width: number
	height: number
	backgroundColor: string
	lineColor: string
	originColor: string
	originRadius: number
	origin: Point
	dashes: ForwardStraightDash[]
}

export function createForwardStraightScene(
	input: ForwardStraightInput,
	viewport: { width: number; height: number },
): ForwardStraightScene {
	const origin = {
		x: input.origin.x * viewport.width,
		y: input.origin.y * viewport.height,
	}
	const columns = Math.max(
		0,
		Math.floor((viewport.width - STYLE.horizontalMargin * 2) / STYLE.columnGap) + 1,
	)
	const rows = Math.max(
		0,
		Math.floor((viewport.height - STYLE.verticalMargin * 2) / STYLE.rowGap) + 1,
	)
	const dashes: ForwardStraightDash[] = []

	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			const position = getGridPosition(input, viewport, origin, rows, columns, row, column)
			const angle = Math.atan2(origin.y - position.y, origin.x - position.x)
			const length = STYLE.lineLength * position.depthScale
			const halfX = Math.cos(angle) * length * 0.5
			const halfY = Math.sin(angle) * length * 0.5
			const weight = input.variableWeightEnabled
				? getVariableWeight(position, origin)
				: STYLE.strokeWeight

			dashes.push({
				x1: position.x + halfX,
				y1: position.y + halfY,
				x2: position.x - halfX,
				y2: position.y - halfY,
				weight: weight * position.depthScale,
			})
		}
	}

	return {
		width: viewport.width,
		height: viewport.height,
		backgroundColor: STYLE.backgroundColor,
		lineColor: STYLE.lineColor,
		originColor: STYLE.originColor,
		originRadius: STYLE.originRadius,
		origin,
		dashes,
	}
}

function getGridPosition(
	input: ForwardStraightInput,
	viewport: { width: number; height: number },
	origin: Point,
	rows: number,
	columns: number,
	row: number,
	column: number,
) {
	const flatX = STYLE.horizontalMargin + column * STYLE.columnGap
	const flatY = STYLE.verticalMargin + row * STYLE.rowGap
	if (input.viewpoint === 'flat') return { x: flatX, y: flatY, depthScale: 1 }

	const intensity = LOW_ANGLE[input.angleIntensity]
	const dx = origin.x - viewport.width / 2
	const dy = origin.y - viewport.height / 2
	const tiltAngle = Math.atan2(dy, dx)
	const rowWeight = Math.abs(Math.sin(tiltAngle))
	const columnWeight = Math.abs(Math.cos(tiltAngle))
	const rawRow = rows > 1 ? row / (rows - 1) : 0
	const rawColumn = columns > 1 ? column / (columns - 1) : 0
	const rowNearBottom = dy >= 0
	const columnNearRight = dx >= 0
	const rowNearness = rowNearBottom ? rawRow : 1 - rawRow
	const columnNearness = columnNearRight ? rawColumn : 1 - rawColumn
	const rowDepth = rowNearness ** intensity.depthGamma
	const columnDepth = columnNearness ** intensity.depthGamma
	const rowSpatial = rowNearBottom
		? rawRow ** intensity.depthGamma
		: 1 - (1 - rawRow) ** intensity.depthGamma
	const columnSpatial = columnNearRight
		? rawColumn ** intensity.depthGamma
		: 1 - (1 - rawColumn) ** intensity.depthGamma
	const minX = STYLE.horizontalMargin
	const maxX = STYLE.horizontalMargin + (columns - 1) * STYLE.columnGap
	const minY = STYLE.verticalMargin
	const maxY = STYLE.verticalMargin + (rows - 1) * STYLE.rowGap
	const totalWeight = rowWeight + columnWeight
	const normalizedRowWeight = totalWeight > 0 ? rowWeight / totalWeight : 0.5
	const normalizedColumnWeight = totalWeight > 0 ? columnWeight / totalWeight : 0.5
	const depth = normalizedRowWeight * rowDepth + normalizedColumnWeight * columnDepth

	return {
		x: lerp(flatX, lerp(minX, maxX, columnSpatial), columnWeight),
		y: lerp(flatY, lerp(minY, maxY, rowSpatial), rowWeight),
		depthScale: lerp(intensity.scaleMin, 1, depth),
	}
}

function getVariableWeight(position: Point, origin: Point) {
	const distance = Math.hypot(origin.x - position.x, origin.y - position.y)
	const progress = Math.min(1, distance / STYLE.weightFalloffDistance)
	const eased = progress * progress * (3 - 2 * progress)
	return lerp(STYLE.maxLineWeight, STYLE.minLineWeight, eased)
}

function lerp(start: number, end: number, progress: number) {
	return start + (end - start) * progress
}
