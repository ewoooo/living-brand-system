import { describe, expect, it } from 'vitest'
import { pruneTemplateNodeConfigs } from './prune-template-node-configs.client'

describe('pruneTemplateNodeConfigs', () => {
	it('새 base에 없는 노드 설정만 제거한다', () => {
		expect(
			pruneTemplateNodeConfigs('<p data-node-id="kept"></p>', {
				kept: { text: '유지' },
				removed: { text: '제거' },
			}),
		).toEqual({ kept: { text: '유지' } })
	})
})
