import { readdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { logoClearSpaceChecker } from '@/features/review/checkers/logo-clear-space.checker'
import type { PixelGrid } from '@/features/review/checkers/types'
import type { Rgb } from '@/features/review/color-check'

/**
 * 로고 checker 캘리브레이션: logo pass(정상)/fail(위반) 픽스처를 실제 파이프라인과
 * 동일 조건(maxDim 128 nearest 다운샘플 + grid)으로 로고 checker에 돌린다.
 * pass 세트는 통과율↑, fail 세트는 탐지율↑ 이 목표. (checker 추가 시 checkers 배열에 등록)
 */

const SETS = [
	{ label: 'PASS 세트 (정상 — 전부 통과해야)', dir: 'tests/fixtures/review/logo/pass', expect: 'pass' as const },
	{ label: 'FAIL 세트 (위반 — 잡아야)', dir: 'tests/fixtures/review/logo/fail', expect: 'fail' as const },
]
const MAX_DIM = 128

const checkers = [['clear-space', logoClearSpaceChecker]] as const

async function loadGrid(dir: string, file: string): Promise<PixelGrid> {
	const { data, info } = await sharp(path.join(dir, file))
		.resize(MAX_DIM, MAX_DIM, { fit: 'inside', kernel: 'nearest' })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true })
	const w = info.width
	const h = info.height
	const ch = info.channels
	const pixels: Rgb[] = new Array(w * h)
	const alpha = new Uint8Array(w * h)
	for (let i = 0, p = 0; i + ch <= data.length; i += ch, p++) {
		pixels[p] = { r: data[i], g: data[i + 1], b: data[i + 2] }
		alpha[p] = data[i + 3]
	}
	return { width: w, height: h, pixels, alpha }
}

for (const set of SETS) {
	const dir = path.resolve(process.cwd(), set.dir)
	const files = readdirSync(dir)
		.filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
		.sort()

	console.log(`\n########## ${set.label} ##########`)
	if (files.length === 0) {
		console.log('  (픽스처 없음)')
		continue
	}

	const correct: Record<string, number> = {}
	for (const [name] of checkers) correct[name] = 0

	for (const file of files) {
		const grid = await loadGrid(dir, file)
		const cells: string[] = []
		for (const [name, checker] of checkers) {
			const r = checker.check({ pixels: [], grid })
			if (r.status === set.expect) correct[name] += 1
			cells.push(`${r.status.toUpperCase()} ${r.fulfillment}`.padEnd(12) + `${r.detail}`)
		}
		console.log(`${file.padEnd(24)}${cells.join('  ')}`)
	}

	console.log(`-- "기대(${set.expect})대로 판정" 비율 --`)
	for (const [name] of checkers) console.log(`  ${name.padEnd(12)} ${correct[name]}/${files.length}`)
}

process.exit(0)
