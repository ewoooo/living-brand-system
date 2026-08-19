'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { TemplateGenerator as TemplateGeneratorImpl } from './template-generator'

/**
 * 템플릿 스튜디오의 클라이언트 전용 경계.
 *
 * 스튜디오는 렌더 중에 합성 HTML을 만들고 그 경로가 DOMParser를 쓴다 — 서버에 없는 API다.
 * `'use client'`는 서버 렌더를 막지 않고 "클라이언트에서 hydrate된다"만 뜻하므로, 그 트리는
 * 서버에서 한 번 더 렌더되며 그때 터진다. 인증 뒤의 편집기라 서버 렌더로 얻을 것도 없다.
 */
const TemplateGenerator = dynamic(
	() => import('./template-generator').then((module) => module.TemplateGenerator),
	{ ssr: false },
)

export function TemplateGeneratorClient(props: ComponentProps<typeof TemplateGeneratorImpl>) {
	return <TemplateGenerator {...props} />
}
