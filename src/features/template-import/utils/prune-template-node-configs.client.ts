'use client'

import type { TemplateNodeConfigMap } from '@/types/template'

/** 재import한 base HTML에 남아 있는 nodeId의 설정만 보존한다. 외부 I/O는 없다. */
export function pruneTemplateNodeConfigs(
	baseHtml: string,
	nodeConfigs: TemplateNodeConfigMap,
): TemplateNodeConfigMap {
	const doc = new DOMParser().parseFromString(baseHtml, 'text/html')
	const nodeIds = new Set(
		Array.from(doc.querySelectorAll('[data-node-id]'), (element) =>
			element.getAttribute('data-node-id'),
		),
	)
	return Object.fromEntries(Object.entries(nodeConfigs).filter(([nodeId]) => nodeIds.has(nodeId)))
}
