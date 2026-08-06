import config from '@payload-config'
import { getPayload } from 'payload'
import type { BrandColor, BrandColorGroup, BrandLogo } from '@/payload-types'
import { type Band, LogoOnBackgroundView, type LogoSources } from './view'

// 위젯(서버): 배경 그룹의 색과 로고 3종 URL을 뽑아 클라 뷰에 넘긴다. 드래그·판정 표시는 뷰가 맡는다.
// 🔴 로고 사용 규칙은 brand-colors가 소유한다 — 여기서 대비로 유도하지 않고 저장값을 그대로 옮긴다.
type GroupRef = number | BrandColorGroup | null | undefined
type LogoRef = number | BrandLogo | null | undefined

/** 파일명 규약 `{lang}-{orientation}-{color}.svg`. 기준 로고에서 나머지 변형을 찾는 데 쓴다. */
const VARIANTS = ['default', 'white', 'mono'] as const

function toBands(group: BrandColorGroup): Band[] {
	return (group.colors ?? [])
		.filter((c): c is BrandColor => typeof c === 'object' && c !== null)
		.map((c) => ({
			id: String(c.id),
			name: c.name,
			hex: c.hex,
			allowsFullColor: Boolean(c.allowsFullColorLogo),
			allowsWhiteWordmark: Boolean(c.allowsWhiteWordmark),
			// 규정에 값이 없으면 대비로 지어내지 않는다 — 검정을 기본으로 두고 admin에서 채우게 한다.
			monoFill: c.monoLogoFill === 'white' ? 'white' : 'black',
		}))
}

export async function LogoOnBackgroundWidget({
	group,
	logo,
	column,
}: {
	group?: GroupRef
	logo?: LogoRef
	column?: 'fullColor' | 'mono' | null
} = {}) {
	const payload = await getPayload({ config })

	// 🔴 group을 그대로 쓰지 않고 id로 다시 조회한다. 페이지 조회가 depth:1이라 group은 populate돼도
	//    그 안의 colors는 id 배열로 남는다(hd-color-palette와 같은 이유).
	const groupId = typeof group === 'object' && group ? group.id : group
	const resolved = groupId != null ? await findGroup(payload, groupId) : await firstGroup(payload)
	if (!resolved) return null

	const bands = toBands(resolved)
	if (bands.length === 0) return null

	const logos = await resolveLogos(payload, logo)
	return <LogoOnBackgroundView bands={bands} logos={logos} column={column ?? 'fullColor'} />
}

/** 삭제된 그룹을 가리키면 null — 위젯 하나가 페이지 전체를 죽이지 않게 한다. */
async function findGroup(
	payload: Awaited<ReturnType<typeof getPayload>>,
	id: number,
): Promise<BrandColorGroup | null> {
	try {
		return await payload.findByID({ collection: 'brand-color-groups', id, depth: 1 })
	} catch {
		return null
	}
}

/** 갤러리는 props 없이 렌더하므로 아무 그룹이라도 잡아 화면이 비지 않게 한다. */
async function firstGroup(
	payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<BrandColorGroup | null> {
	const { docs } = await payload.find({ collection: 'brand-color-groups', limit: 1, depth: 1 })
	return docs[0] ?? null
}

/**
 * 기준 로고의 파일명에서 언어·방향을 떼어 같은 세트의 기본형/WHITE/단색형을 찾는다.
 * 기준이 없으면(갤러리) 아무 3조각 파일이나 하나 잡아 그 세트를 쓴다.
 */
async function resolveLogos(
	payload: Awaited<ReturnType<typeof getPayload>>,
	logo: LogoRef,
): Promise<LogoSources> {
	const { docs } = await payload.find({
		collection: 'brand-logos',
		limit: 200,
		depth: 0,
		overrideAccess: true,
	})

	const picked = typeof logo === 'object' && logo ? logo : null
	// `ko-horizontal-default.svg` → ['ko','horizontal','default']. 조각이 3개가 아닌 파일
	// (`-clearSpace` 같은 레이어)은 세트가 아니라 제외한다.
	const parts = (name: string | null | undefined) => (name ?? '').replace('.svg', '').split('-')
	const base = parts(picked?.filename)
	const prefix =
		base.length === 3
			? base.slice(0, 2)
			: parts(docs.find((d) => parts(d.filename).length === 3)?.filename).slice(0, 2)

	const urlOf = (variant: string) => {
		const filename = `${prefix.join('-')}-${variant}.svg`
		const doc = docs.find((d) => d.filename === filename)
		return doc?.url ?? (doc ? `/api/brand-logos/file/${filename}` : null)
	}

	const [fullColor, white, mono] = VARIANTS.map(urlOf)
	return { default: fullColor, white, mono }
}

export default LogoOnBackgroundWidget
