import { readdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { colorPaletteChecker } from '@/features/review/checkers/color-palette.checker'
import type { Rgb } from '@/features/review/color-check'

/**
 * 캘리브레이션 진단: pass(정상, 전부 통과해야) / fail(위반, 잡아야) 픽스처를
 * 실제 파이프라인과 동일 조건(maxDim 128 nearest 다운샘플 + 알파>0)으로 color checker에 돌린다.
 * pass 세트는 통과율↑, fail 세트는 탐지율↑ 이 목표. (pairing 구현 시 여기에 추가)
 */

const SETS = [
	{
		label: 'PASS 세트 (정상 — 전부 통과해야)',
		dir: 'tests/fixtures/review/pass',
		expect: 'pass' as const,
	},
	{
		label: 'FAIL 세트 (위반 — 잡아야)',
		dir: 'tests/fixtures/review/fail',
		expect: 'fail' as const,
	},
]
const MAX_DIM = 128

const checkers = [['palette', colorPaletteChecker]] as const

async function loadPixels(dir: string, file: string): Promise<Rgb[]> {
	const { data, info } = await sharp(path.join(dir, file))
		.resize(MAX_DIM, MAX_DIM, { fit: 'inside', kernel: 'nearest' })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true })
	const ch = info.channels
	const pixels: Rgb[] = []
	for (let i = 0; i + ch <= data.length; i += ch) {
		if (data[i + 3] > 0) pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
	}
	return pixels
}

const header = 'file'.padEnd(14) + checkers.map(([name]) => name.padEnd(16)).join('')

for (const set of SETS) {
	const dir = path.resolve(process.cwd(), set.dir)
	const files = readdirSync(dir)
		.filter((f) => f.endsWith('.png'))
		.sort()

	console.log(`\n########## ${set.label} ##########`)
	console.log(header)

	const correct: Record<string, number> = {}
	for (const [name] of checkers) correct[name] = 0

	for (const file of files) {
		const pixels = await loadPixels(dir, file)
		const cells: string[] = []
		for (const [name, checker] of checkers) {
			const result = checker.check({ pixels })
			if (result.status === set.expect) correct[name] += 1
			const mark = result.status === 'pass' ? 'PASS' : 'FAIL'
			cells.push(`${mark} ${result.fulfillment}`.padEnd(16))
		}
		console.log(file.padEnd(14) + cells.join(''))
	}

	console.log(`-- "기대(${set.expect})대로 판정" 비율 --`)
	for (const [name] of checkers)
		console.log(`  ${name.padEnd(10)} ${correct[name]}/${files.length}`)
}

process.exit(0)
