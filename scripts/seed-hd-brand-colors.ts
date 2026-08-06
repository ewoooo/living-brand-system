import config from '@payload-config'
import { getPayload } from 'payload'
import { isLegacyEssenherbColor } from '@/lib/color'

/**
 * brand-colors + brand-color-groups에 HD현대 브랜드 컬러 정본을 시드한다.
 *
 * 색을 추가·수정할 때는 아래 GROUPS만 고치고 다시 실행한다.
 * - 재실행 안전: 이름으로 찾아 없으면 생성, 있으면 목표 상태로 수렴시킨다(건너뛰기가 아니라 update).
 *   값이 나중에 바뀌므로 "존재하면 skip"이면 틀린 값을 영영 못 고친다.
 * - 🔴 update에 _status를 명시한다. drafts가 켜진 컬렉션이라 생략하면 게시분이 초안으로 내려간다.
 *
 * 실행: pnpm payload run scripts/seed-hd-brand-colors.ts
 * 대상 DB는 DATABASE_URL이 정한다. 공유 DB에 넣으려면 그 URL을 명시적으로 앞에 붙일 것.
 */

type HdColor = {
	name: string
	/** 대문자 hex. SVG 아트워크에서 직접 뽑은 값이다. */
	hex: string
}

// 출처: 0730_HD_Guidlines_All-51.svg (COLOR OVERVIEW 페이지) 아트워크에서 직접 추출, 2026-08-06.
// 🔴 CMYK·PMS는 가이드라인 표기를 그대로 옮긴다(사용자 지시, 2026-08-06). 다만 14칸이 전부 같은 값이라
//    브랜드팀이 템플릿 스와치를 아직 안 채운 것으로 보인다 — 실값이 오면 아래 상수만 색별로 가르면 된다.
//    표에 함께 적힌 RGB·HEX는 옮기지 않는다. 확정된 hex와 어긋나기 때문이다
//    (표의 HEX는 14칸 모두 #F00F0F, DISCOVERY BLUE·grey 4종은 RGB도 같은 플레이스홀더다).
//    화면의 RGB는 저장값이 아니라 hex에서 파생한다.
const CMYK = 'C 0 M 100 Y 90 K 0'
const PANTONE = '485 C'
// 🔴 오버뷰 페이지와 배경 예시 페이지의 값이 어긋나는 색이 둘 있다. 오버뷰를 정본으로 채택했다.
//    HD DISCOVERY BLUE #003087(오버뷰) vs #002F87(배경 예시)
//    HD LIGHT BLUE     #DCF0F5(오버뷰) vs #DFE4F4(배경 예시)
// 🔴 MIDDLE GREY가 두 개다. 정본이 그렇게 부른다 — 임의로 구분자를 붙이지 않는다.
//
// 색과 그룹은 별개다. 같은 색이 여러 그룹에 속할 수 있고 팔레트 순서는 그룹이 소유하므로,
// 색 문서에는 그룹 이름을 쓰지 않고 그룹이 색을 순서 있는 관계로 참조한다.
// ponytail: 그래서 여기 배열 순서가 곧 팔레트 순서다. 별도 정렬 필드를 두지 않는다.
const GROUPS: { name: string; colors: HdColor[] }[] = [
	{
		name: 'Primary Color',
		colors: [
			{ name: 'HD ECO GREEN', hex: '#73D75A' },
			{ name: 'HD HERITAGE GREEN', hex: '#00AF41' },
			{ name: 'HD PROSPERITY GREEN', hex: '#007332' },
			{ name: 'HD DISCOVERY BLUE', hex: '#003087' },
		],
	},
	{
		name: 'Secondary Color',
		colors: [
			{ name: 'HD LIGHT GREEN', hex: '#DCF5D2' },
			{ name: 'HD DEEP GREEN', hex: '#00280A' },
			{ name: 'HD LIGHT BLUE', hex: '#DCF0F5' },
			{ name: 'HD DEEP BLUE', hex: '#000A32' },
		],
	},
	{
		name: 'Mono Color',
		colors: [
			{ name: 'WHITE', hex: '#FFFFFF' },
			{ name: 'LIGHT GREY', hex: '#D3D2D2' },
			{ name: 'MIDDLE GREY', hex: '#A7A6A6' },
			{ name: 'MIDDLE GREY', hex: '#7B7979' },
			{ name: 'DARK GREY', hex: '#4F4C4D' },
			{ name: 'BLACK', hex: '#000000' },
		],
	},
	// 같은 14색을 계열로 다시 묶은 것. 용도별(Primary/Secondary/Mono) 묶음과 공존한다 —
	// 색과 그룹이 별개라 한 색이 두 묶음에 동시에 들어갈 수 있고, 색 문서는 하나뿐이다.
	// 행 안의 순서는 밝은 색 → 어두운 색. Mono가 원래 그 순서라 나머지도 맞췄다.
	{
		name: '초록 계열',
		colors: [
			{ name: 'HD LIGHT GREEN', hex: '#DCF5D2' },
			{ name: 'HD ECO GREEN', hex: '#73D75A' },
			{ name: 'HD HERITAGE GREEN', hex: '#00AF41' },
			{ name: 'HD PROSPERITY GREEN', hex: '#007332' },
			{ name: 'HD DEEP GREEN', hex: '#00280A' },
		],
	},
	{
		name: '파랑 계열',
		colors: [
			{ name: 'HD LIGHT BLUE', hex: '#DCF0F5' },
			{ name: 'HD DISCOVERY BLUE', hex: '#003087' },
			{ name: 'HD DEEP BLUE', hex: '#000A32' },
		],
	},
	{
		name: '검정 계열',
		colors: [
			{ name: 'WHITE', hex: '#FFFFFF' },
			{ name: 'LIGHT GREY', hex: '#D3D2D2' },
			{ name: 'MIDDLE GREY', hex: '#A7A6A6' },
			{ name: 'MIDDLE GREY', hex: '#7B7979' },
			{ name: 'DARK GREY', hex: '#4F4C4D' },
			{ name: 'BLACK', hex: '#000000' },
		],
	},
]

const payload = await getPayload({ config })

// 🔴 조회 키의 스코프가 essenherb를 절대 잡지 않아야 한다. 레거시 팔레트에도 `Black`·`White`가 있어
//    이름만으로 찾으면 그 문서를 덮어써 레거시 페이지 색이 조용히 바뀐다(실제로 한 번 밟았다).
//    스코프는 판별자 하나로 충분하다 — essenherb 색만 이름이 `.essenherb`로 끝난다.
// 이름 비교는 대소문자를 무시한다. 앞선 실행이 `HD prosperity GREEN`처럼 다른 표기로 넣어둬서,
// 대소문자를 따지면 같은 색을 고치는 대신 새로 만들고 틀린 값이 그대로 남는다.
// hex는 키에 넣지 않는다 — 틀린 hex를 고치는 게 이 스크립트의 일인데 키에 넣으면 못 고친다.
const existing = await payload.find({
	collection: 'brand-colors',
	limit: 500,
	depth: 0,
	sort: 'createdAt',
	overrideAccess: true,
})

// 이름당 id 큐. MIDDLE GREY처럼 이름이 겹치는 색은 앞에서부터 하나씩 집어가 서로 다른 문서에 붙는다.
const unclaimed = new Map<string, number[]>()
for (const doc of existing.docs) {
	if (isLegacyEssenherbColor(doc)) continue
	const key = doc.name.toUpperCase()
	const queue = unclaimed.get(key)
	if (queue) queue.push(doc.id)
	else unclaimed.set(key, [doc.id])
}

let created = 0
let updated = 0

// 🔴 색은 그룹마다가 아니라 딱 한 번만 만든다. 같은 색이 여러 그룹에 들어가므로(용도별·계열별)
//    그룹 루프 안에서 upsert하면 같은 색 문서가 묶음 수만큼 복제된다.
//    키는 이름+hex다 — MIDDLE GREY가 hex만 다른 두 건이라 이름만으로는 못 가른다.
const colorKey = (c: HdColor) => `${c.name.toUpperCase()}|${c.hex.toUpperCase()}`
const uniqueColors = new Map<string, HdColor>()
for (const group of GROUPS) {
	for (const color of group.colors) uniqueColors.set(colorKey(color), color)
}

const idByColor = new Map<string, number>()
for (const [key, color] of uniqueColors) {
	const data = {
		name: color.name,
		hex: color.hex,
		// 그룹은 이제 brand-color-groups가 소유한다. 색에 남아 있던 옛 그룹 문자열을 지운다.
		colorGroup: null,
		cmyk: CMYK,
		pantone: PANTONE,
		// 🔴 명시하지 않으면 최신 초안 버전을 따라가 게시분이 초안으로 내려간다.
		_status: 'published' as const,
	}

	const id = unclaimed.get(color.name.toUpperCase())?.shift()
	if (id) {
		await payload.update({ collection: 'brand-colors', id, data, overrideAccess: true })
		idByColor.set(key, id)
		updated++
		console.log(`updated  ${color.name.padEnd(22)} ${color.hex}`)
	} else {
		const doc = await payload.create({ collection: 'brand-colors', data, overrideAccess: true })
		idByColor.set(key, doc.id)
		created++
		console.log(`created  ${color.name.padEnd(22)} ${color.hex}`)
	}
}

for (const group of GROUPS) {
	const colorIds = group.colors
		.map((c) => idByColor.get(colorKey(c)))
		.filter((id): id is number => id != null)

	const groupData = { name: group.name, colors: colorIds, _status: 'published' as const }
	const found = await payload.find({
		collection: 'brand-color-groups',
		where: { name: { equals: group.name } },
		depth: 0,
		limit: 1,
		overrideAccess: true,
	})

	const existingGroup = found.docs[0]
	if (existingGroup) {
		await payload.update({
			collection: 'brand-color-groups',
			id: existingGroup.id,
			data: groupData,
			overrideAccess: true,
		})
		console.log(`group    ${group.name.padEnd(22)} ${colorIds.length}색 갱신\n`)
	} else {
		await payload.create({
			collection: 'brand-color-groups',
			data: groupData,
			overrideAccess: true,
		})
		console.log(`group    ${group.name.padEnd(22)} ${colorIds.length}색 생성\n`)
	}
}

// 정본에 없는데 남아 있는 비-essenherb 색은 알리기만 한다. 다른 문서가 참조 중일 수 있어 지우지 않는다.
const leftover = [...unclaimed.values()].flat()
if (leftover.length > 0)
	console.log(`⚠️ 정본 밖 색 ${leftover.length}건 남음 (id: ${leftover.join(', ')})`)

const total = GROUPS.reduce((n, g) => n + g.colors.length, 0)
console.log(`생성 ${created} · 갱신 ${updated} (총 ${total})`)
process.exit(0)
