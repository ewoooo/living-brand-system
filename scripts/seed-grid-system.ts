/**
 * [POC] grid system 기반 Template 여러 개를 payload에 생성한다(서로 다른 그리드).
 * jsonTemplate에 grid(행/열 정수비)를 저장 → Create의 GridComposer가 이를 읽어 복원한다.
 * 텍스트는 셀 하나에 대응(셀 좌상단 배치)하고, GridComposer가 x/y를 역매핑해 셀로 복원한다.
 * 실행: source ~/.nvm/nvm.sh && nvm use 22 && pnpm exec payload run scripts/seed-grid-system.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

const CANVAS = 1080
const INK = '#1f2a24'
const CREAM = '#f5f2e9'

// ── grid system: 정수비 → 셀 좌표 계산기 ──
function makeGrid(width: number, height: number, rows: number[], cols: number[]) {
	const track = (weights: number[], total: number) => {
		const sum = weights.reduce((a, b) => a + b, 0) || 1
		return weights.map((w) => (total * w) / sum)
	}
	const rowSizes = track(rows, height)
	const colSizes = track(cols, width)
	const offset = (sizes: number[], i: number) => sizes.slice(0, i).reduce((a, b) => a + b, 0)
	return (r: number, c: number) => ({
		x: offset(colSizes, c),
		y: offset(rowSizes, r),
		width: colSizes[c],
		height: rowSizes[r],
	})
}

interface CellText {
	r: number
	c: number
	text: string
}

/** (행/열 정수비 + 셀 텍스트) → jsonTemplate(grid 포함, 셀 배경 rect + 좌상단 텍스트). */
function buildGridTemplate(rows: number[], cols: number[], texts: CellText[]) {
	const cell = makeGrid(CANVAS, CANVAS, rows, cols)
	const cellRects = rows.flatMap((_, r) =>
		cols.map((__, c) => {
			const box = cell(r, c)
			return {
				id: `bg-${r}-${c}`,
				type: 'rect' as const,
				...box,
				zIndex: 1,
				locked: true,
				fill: (r + c) % 2 === 0 ? CREAM : '#ece7d9',
				opacity: 1,
				borderRadius: 0,
			}
		}),
	)
	const textEls = texts.map(({ r, c, text }, i) => {
		const box = cell(r, c)
		return {
			id: `text-${i}`,
			type: 'text' as const,
			...box,
			zIndex: 2,
			locked: false,
			text,
			fontSize: 40,
			fontFamily: 'Pretendard, sans-serif',
			fontWeight: '400',
			color: INK,
			lineHeight: 1.4,
			letterSpacing: 0,
			textAlign: 'left' as const,
			textFit: 'fixed' as const,
			verticalAlign: 'top' as const,
			inputFormat: 'free' as const,
		}
	})
	return {
		width: CANVAS,
		height: CANVAS,
		background: CREAM,
		grid: { rows, columns: cols },
		elements: [...cellRects, ...textEls],
	}
}

// ── 서로 다른 그리드 템플릿 정의 ──
const TEMPLATES = [
	{
		name: 'Grid · 2×2',
		rows: [1, 1],
		cols: [1, 1],
		texts: [
			{ r: 0, c: 0, text: '제목' },
			{ r: 1, c: 1, text: '본문' },
		],
	},
	{
		name: 'Grid · 3×3 비대칭',
		rows: [1, 2, 1],
		cols: [2, 1, 1],
		texts: [
			{ r: 0, c: 0, text: '헤드라인' },
			{ r: 1, c: 0, text: '설명 문구가 들어갑니다' },
			{ r: 2, c: 2, text: '2026' },
		],
	},
	{
		name: 'Grid · 2×3 배너',
		rows: [1, 1],
		cols: [1, 1, 1],
		texts: [
			{ r: 0, c: 0, text: 'ESSENHERB' },
			{ r: 1, c: 2, text: 'essenherb.com' },
		],
	},
]

// ── 카테고리 upsert ──
const existingCat = await payload.find({
	collection: 'template-categories',
	locale: 'ko',
	where: { slug: { equals: 'grid-lab' } },
	limit: 1,
	overrideAccess: true,
})
const category =
	existingCat.docs[0] ??
	(await payload.create({
		collection: 'template-categories',
		data: {
			title: 'Grid Lab',
			slug: 'grid-lab',
			displayOrder: 0,
			_status: 'published',
		} as never,
		locale: 'ko',
		overrideAccess: true,
	}))

// ── 기존 grid-lab 템플릿 정리(깨끗한 분리 시연) ──
await payload.delete({
	collection: 'templates',
	where: { category: { equals: category.id } },
	overrideAccess: true,
})

// ── 서로 다른 템플릿 생성 ──
for (const def of TEMPLATES) {
	const doc = await payload.create({
		collection: 'templates',
		data: {
			name: def.name,
			description: `grid system POC (${def.rows.length}×${def.cols.length})`,
			category: category.id,
			jsonTemplate: buildGridTemplate(def.rows, def.cols, def.texts),
			_status: 'published',
		} as never,
		locale: 'ko',
		overrideAccess: true,
	})
	payload.logger.info(`template #${doc.id} (${def.name}) published — /create/grid-lab/${doc.id}`)
}

process.exit(0)
