import { revalidatePath } from 'next/cache'
import type {
	CollectionAfterChangeHook,
	CollectionAfterDeleteHook,
	CollectionConfig,
	CollectionSlug,
	PayloadRequest,
} from 'payload'

// 프리렌더된 화면(`/`·`/guideline`·`/studio`)의 껍데기는 root layout이 그리고, 그 layout이
// 가이드라인 nav·문서명·파비콘·primary 색을 Payload에서 읽는다. 그래서 콘텐츠를 고치면 그
// 캐시를 버려야 한다 — 안 버리면 재배포 전까지 옛 화면이 남는다(삭제한 챕터 카드가 목록에
// 남아 클릭하면 404였다). 챕터·섹션 페이지는 매 요청 렌더라 원래 신선하다.
//
// 🔴 컬렉션마다 손으로 달지 않는다. config에서 배열째 감싸므로 새 컬렉션이 자동으로 덮인다.
//    실수의 결과가 비대칭이기 때문이다 — 과하게 무효화하면 조회 한 번이 낭비될 뿐이지만,
//    빠뜨리면 화면이 조용히 틀린 채 남는다. 실제로 이 버그가 그렇게 생겼다(글로벌에만 달려 있었다).

/**
 * 기계가 쓰는 기록 컬렉션. 프리렌더된 화면에 나타나지 않으면서 쓰기가 잦아
 * (AI 챗은 메시지마다, 로그인은 접속마다 쓴다) 무효화하면 낭비만 된다.
 *
 * 이름 목록을 손으로 들고 있지 않도록 컬렉션이 이미 선언한 `admin.group`으로 가른다.
 * 그룹 라벨이 바뀌면 이 판별이 풀리지만, 그 결과는 "과하게 무효화"라 안전한 방향이다.
 */
const RECORD_GROUPS = new Set(['운영 기록', '시스템 관리'])

/** 프리렌더된 껍데기를 버린다. 경로 지식은 이 함수 하나만 갖는다. */
export function revalidateFrontendShell(req: Pick<PayloadRequest, 'context'>): void {
	if (req.context?.disableRevalidate) return
	try {
		revalidatePath('/', 'layout')
	} catch {
		// CLI(`payload run`)에는 Next 요청 컨텍스트가 없어 revalidatePath가 던진다.
		// 그 경로에는 버릴 캐시도 없으므로 무시하는 것이 맞다.
	}
}

/**
 * 이 문서가 아직 사이트의 게시 목록에 있는가.
 *
 * 🔴 `draft ← published` 전이는 **autosave와 게시 해제가 같은 모양이다**(2026-08-11 실측).
 *    초안을 저장하는 동안에도 사이트는 옛 게시본을 계속 보고 있어 nav 출력이 바뀌지 않으므로,
 *    그 둘을 가르지 못하면 편집 중 2초마다 껍데기를 다시 만들게 된다.
 */
async function stillPublished(
	req: PayloadRequest,
	slug: string,
	id: number | string,
): Promise<boolean> {
	const { totalDocs } = await req.payload.count({
		collection: slug as CollectionSlug,
		where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
		req,
		overrideAccess: true,
	})
	return totalDocs > 0
}

const revalidateAfterChange: CollectionAfterChangeHook = async ({
	collection,
	doc,
	previousDoc,
	req,
}) => {
	const status = doc?._status

	// 초안 개념이 없는 컬렉션은 모든 쓰기가 곧 라이브다.
	if (status === undefined || status === 'published') {
		revalidateFrontendShell(req)
		return doc
	}

	if (
		previousDoc?._status === 'published' &&
		!(await stillPublished(req, collection.slug, doc.id))
	) {
		revalidateFrontendShell(req)
	}

	return doc
}

const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
	revalidateFrontendShell(req)
	return doc
}

/** 기록 컬렉션을 뺀 전부에 무효화 훅을 주입한다. 기존 훅 뒤에 붙는다. */
export function withFrontendRevalidation(collections: CollectionConfig[]): CollectionConfig[] {
	return collections.map((collection) => {
		if (RECORD_GROUPS.has(String(collection.admin?.group ?? ''))) return collection

		return {
			...collection,
			hooks: {
				...collection.hooks,
				afterChange: [...(collection.hooks?.afterChange ?? []), revalidateAfterChange],
				afterDelete: [...(collection.hooks?.afterDelete ?? []), revalidateAfterDelete],
			},
		}
	})
}
