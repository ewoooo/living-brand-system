import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * icon-colorway Global에 아이콘별 색 조합을 시드한다.
 * 색은 raw hex가 아니라 brand-colors 참조로 저장한다(SAMPLED hex → brand-colors doc 매칭).
 * 아이콘은 filename(<n>.svg)으로 brand-icons doc과 매칭한다.
 *
 * 실행: pnpm payload run scripts/seed-icon-colorway.ts
 */

// svg 파일번호 → { fg, bg } hex. component의 SAMPLED와 동일.
const COLORS: Record<number, { fg: string; bg: string }> = {
	1: { bg: '#EA5343', fg: '#FFF095' },
	2: { bg: '#E1F0FF', fg: '#EA5343' },
	3: { bg: '#FFE65F', fg: '#503200' },
	4: { bg: '#FAEBFF', fg: '#A546BE' },
	5: { bg: '#50AE5F', fg: '#FFE65F' },
	6: { bg: '#FFFAC2', fg: '#50AE5F' },
	7: { bg: '#FAEBFF', fg: '#EA5343' },
	8: { bg: '#002B1E', fg: '#50AE5F' },
	11: { bg: '#3C87CD', fg: '#A5CDFF' },
	12: { bg: '#A546BE', fg: '#FFB4AA' },
	13: { bg: '#E6FFE6', fg: '#50AE5F' },
	14: { bg: '#EA5343', fg: '#FFFFFF' },
	15: { bg: '#A5CDFF', fg: '#001941' },
	16: { bg: '#FAEBFF', fg: '#50AE5F' },
	17: { bg: '#A7F5AE', fg: '#3C87CD' },
	18: { bg: '#3C87CD', fg: '#FFFFFF' },
	21: { bg: '#FFFAC2', fg: '#A07D0F' },
	22: { bg: '#EA5343', fg: '#871400' },
	23: { bg: '#3C87CD', fg: '#001941' },
	24: { bg: '#E1F0FF', fg: '#EA5343' },
	25: { bg: '#FFE65F', fg: '#871400' },
	26: { bg: '#E1F0FF', fg: '#A5CDFF' },
	27: { bg: '#FFE65F', fg: '#EA5343' },
	28: { bg: '#001941', fg: '#3C87CD' },
	31: { bg: '#E6FFE6', fg: '#EA5343' },
	32: { bg: '#E1F0FF', fg: '#50AE5F' },
	33: { bg: '#A7F5AE', fg: '#195F30' },
	34: { bg: '#3C0046', fg: '#FFE65F' },
	35: { bg: '#A5CDFF', fg: '#3C87CD' },
	37: { bg: '#EA5343', fg: '#FFB4AA' },
	38: { bg: '#50AE5F', fg: '#A7F5AE' },
	41: { bg: '#FAEBFF', fg: '#A546BE' },
	42: { bg: '#FFE65F', fg: '#EA5343' },
	43: { bg: '#FFF0EB', fg: '#A5CDFF' },
	44: { bg: '#A5CDFF', fg: '#EA5343' },
	45: { bg: '#50AE5F', fg: '#FFE65F' },
	46: { bg: '#EA5343', fg: '#FFFAC2' },
	47: { bg: '#FFE65F', fg: '#3C87CD' },
	48: { bg: '#3C0046', fg: '#A7F5AE' },
	363: { bg: '#FFE65F', fg: '#503200' },
}

// 렌더 순서(seed-brand-icons와 동일 DISPLAY_ORDER).
const DISPLAY_ORDER = [
	1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32,
	33, 34, 35, 37, 38, 363, 41, 42, 43, 44, 45, 46, 47, 48,
]

const payload = await getPayload({ config })

// brand-colors: hex(대문자) → id
const colorsRes = await payload.find({
	collection: 'brand-colors',
	limit: 200,
	overrideAccess: true,
})
const colorByHex = new Map<string, number>()
for (const c of colorsRes.docs) {
	const hex = typeof c.hex === 'string' ? c.hex.trim().toUpperCase() : null
	if (hex) colorByHex.set(hex.startsWith('#') ? hex : `#${hex}`, c.id)
}

// brand-icons: filename → id
const iconsRes = await payload.find({ collection: 'brand-icons', limit: 200, overrideAccess: true })
const iconByFile = new Map<string, number>()
for (const d of iconsRes.docs) {
	if (d.filename) iconByFile.set(d.filename, d.id)
}

const resolveColor = (hex: string) => colorByHex.get(hex.toUpperCase())

const entries: { icon: number; fg: number; bg: number }[] = []
const missing: string[] = []

for (const fileNumber of DISPLAY_ORDER) {
	const iconId = iconByFile.get(`${fileNumber}.svg`)
	const combo = COLORS[fileNumber]
	const fgId = resolveColor(combo.fg)
	const bgId = resolveColor(combo.bg)
	if (iconId == null || fgId == null || bgId == null) {
		missing.push(
			`${fileNumber}.svg (icon:${iconId ?? '없음'} fg:${combo.fg}→${fgId ?? '없음'} bg:${combo.bg}→${bgId ?? '없음'})`,
		)
		continue
	}
	entries.push({ icon: iconId, fg: fgId, bg: bgId })
}

await payload.updateGlobal({ slug: 'icon-colorway', data: { entries }, overrideAccess: true })

console.log(`완료 — colorway 엔트리 ${entries.length}개 저장`)
if (missing.length > 0) {
	console.warn(`매칭 실패 ${missing.length}개:\n  ${missing.join('\n  ')}`)
}
