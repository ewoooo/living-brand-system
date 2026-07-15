import { describe, expect, it } from 'vitest'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import { INITIAL_CHECK_SCENARIOS } from '@/features/asset-check/scenarios'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import type { CheckImage } from '@/features/asset-check/types'
import { buildCheckReviewView } from '@/features/asset-check/utils/build-check-review-view'

const sections: CheckSection[] = [
	{
		title: 'Brand Logo',
		slug: 'brand-logo',
		groupTitle: 'Brand Design Elements',
		groupSlug: 'brand-design-elements',
		chapterTitle: 'Brand Design Elements',
		chapterSlug: 'brand-design-elements',
		chapterOrder: 1,
		sectionTitle: 'Brand Logo',
		sectionSlug: 'brand-logo',
		sectionOrder: 1,
		checks: [
			check('logo.size.minimum'),
			check('logo.space.clear'),
			check('color.palette'),
			{ ...check('logo.unimplemented'), implemented: false },
			check('application.stationery.format'),
		],
	},
	{
		title: 'Color System',
		slug: 'color-system',
		groupTitle: 'Brand Design Elements',
		groupSlug: 'brand-design-elements',
		chapterTitle: 'Brand Design Elements',
		chapterSlug: 'brand-design-elements',
		chapterOrder: 1,
		sectionTitle: 'Color System',
		sectionSlug: 'color-system',
		sectionOrder: 2,
		checks: [check('color.palette'), check('color.combination'), check('color.contrast')],
	},
]

describe('buildCheckReviewView', () => {
	it('keeps summary empty before any check result exists', () => {
		const view = buildCheckReviewView({
			sections,
			scenarios: INITIAL_CHECK_SCENARIOS,
			scenarioKey: 'quick',
			selected: null,
			showFailOnly: false,
		})

		expect(view.summary).toEqual({ pass: 0, ok: 0, fail: 0, advisory: 0, pendingManualCheck: 0 })
		expect(view.rows[0]?.guidelineHref).toBe('/guideline/brand-design-elements/brand-logo')
		expect(view.rows.map((row) => row.check.key)).toEqual([
			'logo.size.minimum',
			'logo.space.clear',
			'color.palette',
			'color.combination',
			'color.contrast',
		])
	})

	it('builds fail-only rows and merges duplicate Check sections', () => {
		const selected = image({
			'logo.size.minimum': result('logo.size.minimum', 'pass'),
			'logo.space.clear': result('logo.space.clear', 'fail'),
			'color.palette': result('color.palette', 'fail'),
			'color.combination': result('color.combination', 'ok'),
			'color.contrast': result('color.contrast', 'pass'),
		})

		const view = buildCheckReviewView({
			sections,
			scenarios: INITIAL_CHECK_SCENARIOS,
			scenarioKey: 'quick',
			selected,
			showFailOnly: true,
		})

		expect(view.summary).toEqual({ pass: 2, ok: 1, fail: 2, advisory: 0, pendingManualCheck: 0 })
		expect(view.rows.map((row) => row.check.key)).toEqual(['logo.space.clear', 'color.palette'])
		expect(view.rows[1]?.appliesTo).toEqual(['Brand Logo', 'Color System'])
	})

	it('advisory 결과는 통과/미통과가 아닌 별도 카운트로 센다', () => {
		const selected = image({
			'logo.size.minimum': result('logo.size.minimum', 'pass'),
			'logo.space.clear': result('logo.space.clear', 'advisory'),
		})

		const view = buildCheckReviewView({
			sections,
			scenarios: INITIAL_CHECK_SCENARIOS,
			scenarioKey: 'quick',
			selected,
			showFailOnly: false,
		})

		expect(view.summary).toEqual({
			pass: 1,
			ok: 0,
			fail: 0,
			advisory: 1,
			pendingManualCheck: 3,
		})
	})

	it('uses the session ruleset snapshot for criteria and evidence', () => {
		const selected = {
			...image({ 'color.contrast': result('color.contrast', 'pass') }),
			rulesetSnapshot: [
				{
					...check('color.contrast'),
					evidence: '검수 당시 저장된 근거',
					options: {
						criteria: [
							{ measurement: 'contrastRatio', operator: 'gte', expected: 4.5 },
						],
					},
				},
			],
		}

		const view = buildCheckReviewView({
			sections,
			scenarios: INITIAL_CHECK_SCENARIOS,
			scenarioKey: 'quick',
			selected,
			showFailOnly: false,
		})

		const contrastRow = view.rows.find((row) => row.check.key === 'color.contrast')
		expect(contrastRow?.check).toMatchObject({
			evidence: '검수 당시 저장된 근거',
			options: {
				criteria: [{ measurement: 'contrastRatio', operator: 'gte', expected: 4.5 }],
			},
		})
	})

	it('uses the selected image scenario before the global fallback scenario', () => {
		const selected = image({}, 'stationery')

		const view = buildCheckReviewView({
			sections,
			scenarios: INITIAL_CHECK_SCENARIOS,
			scenarioKey: 'quick',
			selected,
			showFailOnly: false,
		})

		expect(view.rows.map((row) => row.check.key)).toEqual([
			'color.palette',
			'application.stationery.format',
		])
	})
})

function check(key: string): CheckSection['checks'][number] {
	return {
		key,
		title: key,
		checker: {
			key: 'test-checker',
			type: 'deterministic',
			implementationKey: 'test-implementation',
		},
		executor: 'deterministic',
		implemented: true,
		evidence: '',
		referenceAssets: [],
	}
}

function image(results: NonNullable<CheckImage['results']>, scenarioKey = 'quick'): CheckImage {
	return {
		id: 'image-1',
		url: 'blob:test',
		name: 'test.png',
		file: {} as File,
		scenarioKey,
		status: 'completed',
		results,
	}
}

function result(key: string, status: CheckResult['rawResult']['status']): CheckResult {
	return {
		rule: { key, title: key, executor: 'deterministic' },
		checker: { key, type: 'algorithm' },
		rawResult: { status, fulfillment: null, detail: status },
		message: status,
	}
}
