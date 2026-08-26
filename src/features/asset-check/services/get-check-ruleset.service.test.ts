import { describe, expect, it, vi } from 'vitest'
import {
	type CheckRulesetSourceDocument,
	getCheckSourceDocuments,
} from '@/features/asset-check/repositories/check-ruleset.payload.repository'
import {
	getCheckRuleset,
	getRuntimeChecks,
} from '@/features/asset-check/services/get-check-ruleset.service'
import { toRuntimeCheckMessages } from '@/features/asset-check/utils/check-messages'
import type { GuidelineCheckSource } from '@/features/guideline/checks/collect-guideline-check-sources'
import type { ApplicationImage, Rule, RuleChecker } from '@/payload-types'

vi.mock('@/features/asset-check/repositories/check-ruleset.payload.repository', () => ({
	getCheckSourceDocuments: vi.fn(),
}))

function ruleChecker(overrides: Partial<RuleChecker> = {}): RuleChecker {
	return {
		id: 1,
		name: 'Manual',
		key: 'manual',
		executor: 'manual',
		updatedAt: '',
		createdAt: '',
		...overrides,
	}
}

function referenceAsset(name: string, url: string, role: 'context' | 'negative') {
	return {
		asset: { id: 1, name, alt: name, url, mimeType: 'image/png' } as ApplicationImage,
		role,
	}
}

function source(key: string, rule: Partial<Rule> = {}): GuidelineCheckSource {
	return {
		rule: {
			id: 1,
			key,
			title: key,
			tier: 'required',
			executor: 'manual',
			checker: ruleChecker(),
			criteria: [],
			updatedAt: '',
			createdAt: '',
			...rule,
		},
		blockName: null,
		source: { documentId: 1 },
		evidence: { type: 'document', blocks: [] },
		referenceAssets: [],
	}
}

function document(
	id: number,
	checks: GuidelineCheckSource[],
	overrides: Partial<CheckRulesetSourceDocument> = {},
): CheckRulesetSourceDocument {
	return {
		id,
		title: `Document ${id}`,
		slug: `document-${id}`,
		displayOrder: id,
		breadcrumbDocumentIds: [],
		checks,
		...overrides,
	}
}

describe('getCheckRuleset', () => {
	it('연결된 Checker 설정과 deterministic 구현체를 표시 계약으로 반환한다', async () => {
		vi.mocked(getCheckSourceDocuments).mockResolvedValue({
			documents: [
				document(
					1,
					[
						source('logo.clear-space', {
							title: 'Clear Space',
							checker: ruleChecker({
								key: 'logo-layout',
								executor: 'deterministic',
								checkerKey: 'clear-space',
							}),
						}),
					],
					{ title: 'Primary Logo', slug: 'primary-logo' },
				),
			],
		})

		const sections = await getCheckRuleset()

		expect(sections[0]?.checks[0]).toMatchObject({
			source: { documentId: 1 },
			evidence: { type: 'document', blocks: [] },
			checker: {
				key: 'logo-layout',
				type: 'deterministic',
				implementationKey: 'clear-space',
			},
		})
	})

	it('measure criterion을 HeuristicCriterion으로 매핑하고 불완전 행은 버린다', async () => {
		vi.mocked(getCheckSourceDocuments).mockResolvedValue({
			documents: [
				document(1, [
					source('logo.share', {
						title: 'Logo Share',
						checker: ruleChecker({
							key: 'logo-share',
							executor: 'heuristic',
							model: 'claude-sonnet-5',
						}),
						criteria: [
							{
								id: 'c1',
								question: '로고 점유율(%)은?',
								kind: 'measure',
								operator: 'gte',
								expectedValue: 5,
								unit: '%',
							},
							{ id: 'c2', question: '불완전 수치형', kind: 'measure' },
							{ id: 'c3', question: '관찰형', kind: 'presence', expected: 'present' },
						],
					}),
				]),
			],
		})

		const sections = await getCheckRuleset()
		const check = sections[0]?.checks[0]

		expect(check?.heuristicCriteria).toEqual([
			{
				id: 'c1',
				question: '로고 점유율(%)은?',
				kind: 'measure',
				operator: 'gte',
				expected: 5,
				max: undefined,
				unit: '%',
			},
			{ id: 'c3', question: '관찰형', expected: 'present' },
		])
	})

	it('breadcrumb 배치와 문서 순서를 적용하고 요청된 Check key 순서를 보존한다', async () => {
		const chapter = document(10, [], { title: 'Chapter', displayOrder: 2 })
		const section = document(20, [], {
			title: 'Section',
			displayOrder: 3,
			breadcrumbDocumentIds: [10, 20],
		})
		const first = document(31, [source('check.first')], {
			title: 'First',
			displayOrder: 1,
			breadcrumbDocumentIds: [10, 20, 31],
		})
		const second = document(32, [source('check.second')], {
			title: 'Second',
			displayOrder: 2,
			breadcrumbDocumentIds: [10, 20, 32],
		})
		vi.mocked(getCheckSourceDocuments).mockResolvedValue({
			documents: [second, section, first, chapter],
		})

		const sections = await getCheckRuleset()
		const selected = await getRuntimeChecks(['check.second', 'check.first'])

		expect(sections.map(({ title }) => title)).toEqual(['First', 'Second'])
		expect(sections[0]).toMatchObject({
			chapterTitle: 'Chapter',
			topicTitle: 'Section',
		})
		expect(selected.map(({ key }) => key)).toEqual(['check.second', 'check.first'])
	})

	it('같은 Rule의 다중 배치는 근거와 참조 자산을 병합해 하나의 실행 Check로 만든다', async () => {
		const documentPlacement = source('shared')
		documentPlacement.evidence = {
			type: 'document',
			description: 'Doc A',
			blocks: [{ type: 'callout', kind: 'must', title: undefined, items: [] }],
		}
		documentPlacement.referenceAssets = [referenceAsset('a', '/a.png', 'context')]
		const blockPlacement = source('shared')
		blockPlacement.evidence = { type: 'block', childCount: 2 }
		blockPlacement.referenceAssets = [
			referenceAsset('a', '/a.png', 'context'),
			referenceAsset('b', '/b.png', 'negative'),
		]
		vi.mocked(getCheckSourceDocuments).mockResolvedValue({
			documents: [document(1, [documentPlacement]), document(2, [blockPlacement])],
		})

		const checks = await getRuntimeChecks()

		expect(checks).toHaveLength(1)
		expect(checks[0]?.evidence).toEqual({
			type: 'document',
			description: 'Doc A',
			blocks: [
				{ type: 'callout', kind: 'must', title: undefined, items: [] },
				{ type: 'block', childCount: 2 },
			],
		})
		expect(checks[0]?.referenceAssets.map(({ url, role }) => `${url}:${role}`)).toEqual([
			'/a.png:context',
			'/b.png:negative',
		])
	})

	it('시나리오의 누락·미구현 Check key는 실행 전에 구성 오류로 거부한다', async () => {
		vi.mocked(getCheckSourceDocuments).mockResolvedValue({
			documents: [
				document(1, [
					source('implemented'),
					source('unimplemented', {
						checker: ruleChecker({
							key: 'unknown-checker',
							executor: 'deterministic',
							checkerKey: 'unknown-checker',
						}),
					}),
				]),
			],
		})

		await expect(getRuntimeChecks(['implemented', 'missing', 'unimplemented'])).rejects.toThrow(
			'Check 실행 구성 오류: 누락 [missing]; 미구현 [unimplemented]',
		)
	})

	it('빈 시나리오와 중복 요청 key도 실행 구성 오류로 거부한다', async () => {
		vi.mocked(getCheckSourceDocuments).mockResolvedValue({
			documents: [document(1, [source('implemented')])],
		})

		await expect(getRuntimeChecks([])).rejects.toThrow('실행할 Check key가 없습니다.')
		await expect(getRuntimeChecks(['implemented', 'implemented'])).rejects.toThrow(
			'중복 [implemented]',
		)
	})
})

describe('toRuntimeCheckMessages', () => {
	it('maps Payload Check message fields to runtime status keys', () => {
		expect(
			toRuntimeCheckMessages({
				pass: 'pass message',
				ok: 'ok message',
				needsReview: 'review message',
				fail: 'fail message',
			}),
		).toEqual({
			pass: 'pass message',
			ok: 'ok message',
			needs_review: 'review message',
			fail: 'fail message',
		})
	})
})
