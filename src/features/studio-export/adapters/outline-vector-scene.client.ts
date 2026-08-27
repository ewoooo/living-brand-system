'use client'

import type { VectorPrimitive, VectorScene } from '@/modules/studio-artifact/studio-artifact'

/**
 * 씬의 글자를 윤곽선 path로 굽는다. 인쇄용 벡터의 마지막 단계다.
 *
 * 🔑 굽기를 워커가 아니라 여기서 하는 이유는 **서체 파일이 서버에 있어서**다. 워커는 화면을 재기만
 *    하고, 서체를 아는 것은 이 단계다(`/api/studio-exports/outline`).
 * 🔴 굽지 못한 글줄은 `text`로 남긴다 — 다른 서체로 대신 그리면 인쇄물이 조용히 틀린다.
 *    남은 것은 `notOutlined`로 돌려주므로 호출부가 경고하거나 래스터로 떨어뜨릴 수 있다.
 */
export type OutlineSceneResult = {
	scene: VectorScene
	notOutlined: readonly { text: string; fontFamily: string; reason: string }[]
}

type TextPrimitive = Extract<VectorPrimitive, { kind: 'text' }>

type OutlineResponse = {
	runs: (
		| { outlined: true; d: string; width: number; family: string }
		| {
				outlined: false
				reason: string
		  }
	)[]
}

export async function outlineVectorScene(scene: VectorScene): Promise<OutlineSceneResult> {
	const texts = collectText(scene.primitives)
	if (texts.length === 0) return { scene, notOutlined: [] }

	const response = await fetch('/api/studio-exports/outline', {
		body: JSON.stringify({
			runs: texts.map((text) => ({
				text: text.text,
				fontFamily: text.fontFamily,
				fontSize: text.fontSize,
				...(text.fontWeight === undefined ? {} : { fontWeight: text.fontWeight }),
				...(text.letterSpacing === undefined ? {} : { letterSpacing: text.letterSpacing }),
			})),
		}),
		headers: { 'Content-Type': 'application/json' },
		method: 'POST',
	})
	if (!response.ok) throw new Error('글자 윤곽선을 만들지 못했습니다.')
	const { runs } = (await response.json()) as OutlineResponse

	const outlines = new Map<TextPrimitive, OutlineResponse['runs'][number]>()
	texts.forEach((text, index) => {
		const run = runs[index]
		if (run) outlines.set(text, run)
	})
	const notOutlined = texts.flatMap((text) => {
		const run = outlines.get(text)
		return run && !run.outlined
			? [{ text: text.text, fontFamily: text.fontFamily, reason: run.reason }]
			: []
	})

	return {
		scene: { ...scene, primitives: replaceText(scene.primitives, outlines) },
		notOutlined,
	}
}

function collectText(primitives: readonly VectorPrimitive[]): TextPrimitive[] {
	return primitives.flatMap((primitive) => {
		if (primitive.kind === 'text') return [primitive]
		return primitive.kind === 'group' ? collectText(primitive.children) : []
	})
}

function replaceText(
	primitives: readonly VectorPrimitive[],
	outlines: Map<TextPrimitive, OutlineResponse['runs'][number]>,
): VectorPrimitive[] {
	return primitives.map((primitive) => {
		if (primitive.kind === 'group') {
			return { ...primitive, children: replaceText(primitive.children, outlines) }
		}
		if (primitive.kind !== 'text') return primitive
		const run = outlines.get(primitive)
		if (!run?.outlined) return primitive

		// 서버 path는 baseline이 원점인 지역 좌표다. 정렬은 실측 폭으로 여기서 옮긴다 —
		// `text-anchor`는 글자에만 있는 개념이라 path로 바뀌는 순간 사라진다.
		const anchorShift =
			primitive.textAnchor === 'middle'
				? -run.width / 2
				: primitive.textAnchor === 'end'
					? -run.width
					: 0
		return {
			kind: 'path' as const,
			d: run.d,
			fill: primitive.fill,
			...(primitive.opacity === undefined ? {} : { opacity: primitive.opacity }),
			x: primitive.x + anchorShift,
			y: primitive.y,
		}
	})
}
