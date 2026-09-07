import { compact } from '../../utils/block-text'
import { extractTextFromLexical } from '../../utils/lexical-text'
import type { CardBlockData } from './card-block'

/**
 * 카드 블록이 기계(AI 챗·검색·검수)에 보이는 표현. 디스플레이는 사람이 보는 것이고 제목·설명과
 * 카드 캡션만 평문이 된다. `type`은 블록 종류의 판별자다 — 근거 포매터가 그것으로 분기한다.
 */
export function projectCardBlock<T extends string>(
	block: CardBlockData & { anchor?: string | null },
	type: T,
	title = block.title,
) {
	const description = extractTextFromLexical(block.description)
	// 🔴 앵커도 평문에 넣는다. 섹션이 문서였을 때는 그 문서의 slug가 searchText에 들어가 검색에 걸렸다(2026-08-26).
	const anchor = block.anchor?.trim() || undefined
	const captions = compact(
		(block.cards ?? []).flatMap((card) => [
			card.caption?.title,
			extractTextFromLexical(card.caption?.description),
		]),
	)

	return {
		text: compact([title, anchor, description, ...captions]).join('\n'),
		evidence: {
			type,
			anchor,
			title: title?.trim() || undefined,
			description: description.trim() || undefined,
			captions,
		},
		referenceAssets: [],
	}
}

export type CardBlockEvidence = ReturnType<typeof projectCardBlock<string>>['evidence']

/** 근거 평문. 문단 사이는 빈 줄 — 동결 스냅샷을 읽던 옛 섹션 포매터와 같은 꼴이다. */
export function formatCardBlockEvidence(
	evidence: Omit<CardBlockEvidence, 'captions'> & { captions?: string[] },
): string {
	return compact([evidence.title, evidence.description, ...(evidence.captions ?? [])]).join(
		'\n\n',
	)
}
