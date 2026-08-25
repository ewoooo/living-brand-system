import { describe, expect, it } from 'vitest'
import { KEY_VISUAL_PATTERN_DEFAULT_INPUT } from './graphic-runtimes/key-visual-pattern/definition'
import {
	createKeyVisualPatternScene,
	createKeyVisualPatternVectorArtifact,
	type KeyVisualPatternDash,
	type KeyVisualPatternScene,
} from './graphic-runtimes/key-visual-pattern/model'

/** 브랜드팀 원본이 간격·여백·라인 길이를 정한 기준 캔버스. 골든 값은 전부 이 크기에서 뽑았다. */
const BASE = { width: 720, height: 720 }
const FLAT = { ...KEY_VISUAL_PATTERN_DEFAULT_INPUT, viewpoint: 'flat' } as const

describe('createKeyVisualPatternScene', () => {
	it('기본값은 정중앙에 기준점을 둔 23×23 격자를 만든다', () => {
		const scene = createKeyVisualPatternScene(FLAT, BASE)

		expect(scene.origin).toEqual({ x: 360, y: 360 })
		expect(scene.dashes).toHaveLength(23 * 23)
		expect(scene.dashes.every(isFiniteDash)).toBe(true)
		// 첫 dash는 좌상단 칸에서 기준점(대각선 45°)을 향한다.
		expect(scene.dashes[0].x1).toBeCloseTo(36.363961, 6)
		expect(scene.dashes[0].y1).toBeCloseTo(36.363961, 6)
		expect(scene.dashes[0].x2).toBeCloseTo(23.636039, 6)
		expect(scene.dashes[0].y2).toBeCloseTo(23.636039, 6)
		expect(scene.dashes[0].weight).toBeCloseTo(2.828571, 6)
		expect(scene.backgroundColor).toBe('#00280A')
		expect(scene.lineColor).toBe('#007332')
	})

	// 짝수 칸에는 정중앙이 없다. 🔴 칸 수는 기준 공간(720)에서 세므로 뷰포트 크기가 개수를 바꾸지 않는다 —
	// 스케일된 간격으로 나누면 부동소수 오차가 floor를 떨어뜨려 개수가 2씩 튄다.
	it('칸 수를 항상 홀수로 맞추고 뷰포트 크기와 무관하게 유지한다', () => {
		for (const gap of [10, 11, 13, 17, 21, 29, 30]) {
			const size = gridSize(
				createKeyVisualPatternScene({ ...FLAT, columnGap: gap, rowGap: gap }, BASE),
			)
			expect(size.columns % 2, `columnGap ${gap}`).toBe(1)
			expect(size.rows % 2, `rowGap ${gap}`).toBe(1)
		}
		expect(gridSize(createKeyVisualPatternScene(FLAT, BASE))).toEqual({ columns: 23, rows: 23 })
		expect(gridSize(createKeyVisualPatternScene(FLAT, { width: 1920, height: 1080 }))).toEqual({
			columns: 23,
			rows: 23,
		})
	})

	it('평면 시점은 균등 격자를 대칭 여백 안에 놓는다', () => {
		const scene = createKeyVisualPatternScene(FLAT, { width: 1920, height: 1080 })
		const columnPositions = axisPositions(scene, 'x')
		const rowPositions = axisPositions(scene, 'y')

		expect(new Set(neighborGaps(columnPositions).map((gap) => gap.toFixed(6))).size).toBe(1)
		expect(new Set(neighborGaps(rowPositions).map((gap) => gap.toFixed(6))).size).toBe(1)
		// 칸을 다 채우고 남은 공간을 반씩 나눈 여백이라 좌우·상하가 같다(입력 여백 30과는 다른 값이다).
		expect(columnPositions[0]).toBeCloseTo(80, 6)
		expect(1920 - (columnPositions.at(-1) as number)).toBeCloseTo(80, 6)
		expect(rowPositions[0]).toBeCloseTo(45, 6)
		expect(1080 - (rowPositions.at(-1) as number)).toBeCloseTo(45, 6)
	})

	it('같은 입력은 캔버스 크기와 무관하게 닮은 구도를 만든다', () => {
		const small = createKeyVisualPatternScene(KEY_VISUAL_PATTERN_DEFAULT_INPUT, BASE)
		const large = createKeyVisualPatternScene(KEY_VISUAL_PATTERN_DEFAULT_INPUT, {
			width: 1080,
			height: 1080,
		})

		expect(large.dashes).toHaveLength(small.dashes.length)
		for (const [index, dash] of large.dashes.entries()) {
			const reference = small.dashes[index]
			expect(dash.x1).toBeCloseTo(reference.x1 * 1.5, 6)
			expect(dash.y1).toBeCloseTo(reference.y1 * 1.5, 6)
			expect(dash.weight).toBeCloseTo(reference.weight * 1.5, 6)
		}
	})

	it('입체 시점에서도 기준 칸이 평면 위치를 지키고 행·열이 수평·수직을 유지한다', () => {
		const scene = createKeyVisualPatternScene(KEY_VISUAL_PATTERN_DEFAULT_INPUT, BASE)
		const centers = centersOf(scene)

		// 행의 y는 행 번호에서만, 열의 x는 열 번호에서만 나온다.
		for (let row = 0; row < 23; row++) {
			const rowCenters = centers.slice(row * 23, row * 23 + 23)
			expect(
				new Set(rowCenters.map((center) => center.y.toFixed(9))).size,
				`row ${row}`,
			).toBe(1)
		}
		for (let column = 0; column < 23; column++) {
			const columnCenters = centers.filter((_, index) => index % 23 === column)
			expect(
				new Set(columnCenters.map((center) => center.x.toFixed(9))).size,
				`column ${column}`,
			).toBe(1)
		}
		// 기준 칸은 압축되지 않으므로 길이·두께가 축소 없는 원본 값이고 평면 격자점 위에 그대로 있다.
		expect(scene.origin).toEqual({ x: 360, y: 360 })
		const originDash = scene.dashes[11 * 23 + 11]
		expect(dashLength(originDash)).toBeCloseTo(35, 6)
		expect(originDash.weight).toBeCloseTo(10, 6)
	})

	// 🔴 minCellGap은 보정 **전** 하한이라 최종 간격은 그 값 아래로 내려간다(8 → 7.734). 하한이 막는 것은
	// 경계 쪽 간격이 0으로 붕괴하는 것이고, 그것이 이 단정의 내용이다.
	it('최소 칸 간격이 압축된 간격의 붕괴를 막는다', () => {
		const withFloor = createKeyVisualPatternScene(KEY_VISUAL_PATTERN_DEFAULT_INPUT, BASE)
		const withoutFloor = createKeyVisualPatternScene(
			{ ...KEY_VISUAL_PATTERN_DEFAULT_INPUT, minCellGap: 0 },
			BASE,
		)

		expect(Math.min(...neighborGaps(axisPositions(withFloor, 'x')))).toBeCloseTo(7.734035, 6)
		expect(Math.min(...neighborGaps(axisPositions(withoutFloor, 'x')))).toBeCloseTo(0.822304, 6)
	})

	it('오버슈트 보정은 압축된 축을 그리드 경계 안에 둔다', () => {
		const centered = axisPositions(
			createKeyVisualPatternScene(KEY_VISUAL_PATTERN_DEFAULT_INPUT, BASE),
			'x',
		)
		const corner = axisPositions(
			createKeyVisualPatternScene(
				{ ...KEY_VISUAL_PATTERN_DEFAULT_INPUT, origin: { x: 0, y: 0 } },
				BASE,
			),
			'x',
		)

		// 평면 격자의 첫·마지막 칸(30, 690)이 경계다.
		expect(centered[0]).toBeCloseTo(30, 6)
		expect(centered.at(-1) as number).toBeCloseTo(690, 6)
		// 코너 기준점은 한 방향만 압축되고, 보정이 먼 쪽 끝을 경계에 정확히 착지시킨다.
		expect(corner[0]).toBeCloseTo(30, 6)
		expect(corner.at(-1) as number).toBeCloseTo(690, 6)
		expect(Math.min(...neighborGaps(corner))).toBeCloseTo(7.7221455, 6)
	})

	it('수직·수평은 각도를 고정하고 사선은 기준점을 향한다', () => {
		const vertical = createKeyVisualPatternScene({ ...FLAT, direction: 'vertical' }, BASE)
		const horizontal = createKeyVisualPatternScene({ ...FLAT, direction: 'horizontal' }, BASE)
		const diagonal = createKeyVisualPatternScene(FLAT, BASE)

		expect(Math.max(...vertical.dashes.map((dash) => Math.abs(dash.x1 - dash.x2)))).toBeCloseTo(
			0,
			9,
		)
		expect(
			Math.max(...horizontal.dashes.map((dash) => Math.abs(dash.y1 - dash.y2))),
		).toBeCloseTo(0, 9)
		expect(dashLength(vertical.dashes[0])).toBeCloseTo(18, 6)

		for (const dash of diagonal.dashes) {
			const center = centerOf(dash)
			if (center.x === diagonal.origin.x && center.y === diagonal.origin.y) continue
			const expected = Math.atan2(diagonal.origin.y - center.y, diagonal.origin.x - center.x)
			const actual = Math.atan2(dash.y1 - center.y, dash.x1 - center.x)
			expect(Math.cos(expected - actual)).toBeCloseTo(1, 9)
		}
	})

	// 기준 칸은 기준점과 거리가 0이라 방향을 못 구한다. 🔴 원본의 설명 주석이 코드와 반대라(끝 행을 세로로
	// 적어 놓았다) 화면을 만든 코드를 정본으로 옮겼다 — 끝 행은 가로, 끝 열은 세로다.
	it('기준 칸의 각도는 끝 행·끝 열 규칙으로 갈린다', () => {
		const columnEdge = createKeyVisualPatternScene({ ...FLAT, origin: { x: 0, y: 0.5 } }, BASE)
		const rowEdge = createKeyVisualPatternScene({ ...FLAT, origin: { x: 0.5, y: 0 } }, BASE)
		const inside = createKeyVisualPatternScene(FLAT, BASE)

		// 끝 열(x=0) 기준 칸 → 세로
		expect(columnEdge.dashes[11 * 23].x1).toBeCloseTo(columnEdge.dashes[11 * 23].x2, 9)
		// 끝 행(y=0) 기준 칸 → 가로
		expect(rowEdge.dashes[11].y1).toBeCloseTo(rowEdge.dashes[11].y2, 9)
		// 안쪽 칸은 더 좁은 축을 따르고, 간격이 같으면 가로다.
		expect(inside.dashes[11 * 23 + 11].y1).toBeCloseTo(inside.dashes[11 * 23 + 11].y2, 9)
	})

	it('가변 두께를 끄면 평면 전체가 같은 두께다', () => {
		const off = createKeyVisualPatternScene({ ...FLAT, variableWeight: false }, BASE)
		const on = createKeyVisualPatternScene(FLAT, BASE)

		// 가변 두께를 끄면 maxWeight가 아니라 minWeight 쪽이 쓰인다(1 × safetyScale 0.514286).
		expect(new Set(off.dashes.map((dash) => dash.weight.toFixed(6)))).toEqual(
			new Set(['0.514286']),
		)
		expect(new Set(on.dashes.map((dash) => dash.weight.toFixed(6))).size).toBeGreaterThan(1)
	})

	it('두께는 기준점에서 최대, 그리드 대각선 끝에서 최소다', () => {
		const scene = createKeyVisualPatternScene({ ...FLAT, origin: { x: 0, y: 0 } }, BASE)

		// 평면에서는 축소 배율이 전 칸 공통이라 두께 비가 곧 max/min 비다(10:1).
		expect(scene.dashes[0].weight).toBeCloseTo(5.142857, 6)
		expect(scene.dashes.at(-1)?.weight).toBeCloseTo(0.514286, 6)
		expect(Math.max(...scene.dashes.map((dash) => dash.weight))).toBeCloseTo(
			scene.dashes[0].weight,
			9,
		)
		expect(Math.min(...scene.dashes.map((dash) => dash.weight))).toBeCloseTo(
			scene.dashes.at(-1)?.weight as number,
			9,
		)
	})

	it('선 길이는 옆 칸 간격의 lengthFillRatio를 넘지 않는다', () => {
		const scene = createKeyVisualPatternScene(FLAT, BASE)
		const half = createKeyVisualPatternScene({ ...FLAT, lengthFillRatio: 0.3 }, BASE)

		// 평면 간격 30 × 0.6 = 18. 라인 길이 35가 그대로 쓰이면 옆 칸을 침범한다.
		for (const dash of scene.dashes) expect(dashLength(dash)).toBeCloseTo(18, 6)
		for (const dash of half.dashes) expect(dashLength(dash)).toBeCloseTo(9, 6)
	})

	it('격자가 1×1이거나 뷰포트가 0이어도 NaN을 만들지 않는다', () => {
		// 여백이 기준 공간을 다 먹은 경계 — 두께 감쇠의 정규화 기준(그리드 대각선)이 0이 된다.
		const single = createKeyVisualPatternScene(
			{ ...KEY_VISUAL_PATTERN_DEFAULT_INPUT, horizontalMargin: 360, verticalMargin: 360 },
			BASE,
		)
		// 레이아웃 도중 들어오는 0 크기 뷰포트 — 간격이 0이라 스냅이 0으로 나눈다.
		const empty = createKeyVisualPatternScene(KEY_VISUAL_PATTERN_DEFAULT_INPUT, {
			width: 0,
			height: 0,
		})

		expect(single.dashes).toHaveLength(1)
		expect(single.dashes.every(isFiniteDash)).toBe(true)
		expect(empty.dashes.every(isFiniteDash)).toBe(true)
	})

	it('기준점을 칸에 스냅하므로 저장된 좌표와 반 칸까지 어긋난다', () => {
		// 🔴 이 이격이 커서, 미리보기의 기준점 드래그 히트 판정을 scene.origin에 걸면 안 된다
		//    (핸들을 그리지 않으므로 어긋난 만큼은 다시 잡을 방법이 없다).
		//    runtime.client는 저장된 input.origin에 히트를 건다.
		const scene = createKeyVisualPatternScene(
			{ ...KEY_VISUAL_PATTERN_DEFAULT_INPUT, origin: { x: 0, y: 0 } },
			{ width: 720, height: 720 },
		)

		expect(scene.origin).toEqual({ x: 30, y: 30 })
		expect(Math.hypot(scene.origin.x, scene.origin.y)).toBeCloseTo(42.426, 3)
	})
})

describe('createKeyVisualPatternVectorArtifact', () => {
	it('shared geometry를 파일 형식과 무관한 Vector Artifact로 투영한다', () => {
		const scene = createKeyVisualPatternScene(FLAT, BASE)
		const artifact = createKeyVisualPatternVectorArtifact(scene)

		expect(artifact).toMatchObject({
			kind: 'vector',
			source: { width: 720, height: 720, background: '#00280A' },
		})
		// 기준점 마커는 산출물에 남지 않는다 — primitive는 dash 뿐이다.
		expect(artifact.source.primitives).toHaveLength(scene.dashes.length)
		expect(artifact.source.primitives.every((primitive) => primitive.kind === 'line')).toBe(
			true,
		)
		expect(artifact.source.primitives[0]).toMatchObject({
			kind: 'line',
			stroke: '#007332',
			lineCap: 'square',
		})
	})
})

function centerOf(dash: KeyVisualPatternDash) {
	return { x: (dash.x1 + dash.x2) / 2, y: (dash.y1 + dash.y2) / 2 }
}

function centersOf(scene: KeyVisualPatternScene) {
	return scene.dashes.map(centerOf)
}

/** 씬에서 관찰되는 한 축의 격자 위치. 같은 행·열이 좌표를 공유하므로 중복을 걷어 오름차순으로 준다. */
function axisPositions(scene: KeyVisualPatternScene, axis: 'x' | 'y') {
	const values = new Set(centersOf(scene).map((center) => center[axis].toFixed(9)))
	return [...values].map(Number).sort((a, b) => a - b)
}

function neighborGaps(positions: number[]) {
	return positions.slice(1).map((value, index) => value - positions[index])
}

function gridSize(scene: KeyVisualPatternScene) {
	return {
		columns: axisPositions(scene, 'x').length,
		rows: axisPositions(scene, 'y').length,
	}
}

function dashLength(dash: KeyVisualPatternDash) {
	return Math.hypot(dash.x1 - dash.x2, dash.y1 - dash.y2)
}

function isFiniteDash(dash: KeyVisualPatternDash) {
	return [dash.x1, dash.y1, dash.x2, dash.y2, dash.weight].every(Number.isFinite)
}
