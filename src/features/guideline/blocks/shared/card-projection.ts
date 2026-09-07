import { compact } from '../../utils/block-text'
import { extractTextFromLexical } from '../../utils/lexical-text'
import type { CardBlockData } from './card-block'

/**
 * 카드 블록이 기계(AI 챗·검색·검수)에 보이는 표현. 디스플레이는 사람이 보는 것이고 제목·설명과
 * 카드 캡션만 평문이 된다. `type`은 블록 종류의 판별자다 — 근거 포매터가 그것으로 분기한다.
 */
export function projectCardBlock<T extends string>(
	block: CardBlockData,
	type: T,
	title = block.title,
) {
	const description = extractTextFromLexical(block.description)
	const captions = compact(
		(block.cards ?? []).flatMap((card) => [
			card.caption?.title,
			extractTextFromLexical(card.caption?.description),
		]),
	)

	return {
		text: compact([title, description, ...captions]).join('\n'),
		evidence: {
			type,
			title: title?.trim() || undefined,
			description: description.trim() || undefined,
			captions,
		},
		referenceAssets: [],
	}
}

export type CardBlockEvidence = ReturnType<typeof projectCardBlock<string>>['evidence']

export function formatCardBlockEvidence(evidence: CardBlockEvidence): string {
	return compact([evidence.title, evidence.description, ...evidence.captions]).join('\n')
}
