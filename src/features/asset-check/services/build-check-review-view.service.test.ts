import { describe, expect, it } from 'vitest'
import type { CheckResult } from '@/features/asset-check/checkers/types'
import { buildCheckReviewView } from '@/features/asset-check/services/build-check-review-view.service'
import type { CheckSection } from '@/features/asset-check/services/get-check-ruleset.service'
import type { CheckImage } from '@/features/asset-check/types'

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
		rules: [
			rule('logo.size.minimum'),
			rule('logo.space.clear'),
			rule('color.palette'),
			{ ...rule('logo.unimplemented'), implemented: false },
			rule('application.stationery.format'),
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
		rules: [rule('color.palette'), rule('color.combination')],
	},
]

describe('buildCheckReviewView', () => {
	it('keeps summary empty before any check result exists', () => {
		const view = buildCheckReviewView({
			sections,
			scenarioKey: 'quick',
			selected: null,
			showFailOnly: false,
		})

		expect(view.summary).toEqual({ pass: 0, ok: 0, fail: 0, pendingManualCheck: 0 })
		expect(view.rows.map((row) => row.rule.key)).toEqual([
			'logo.size.minimum',
			'logo.space.clear',
			'color.palette',
			'color.combination',
		])
	})

	it('builds fail-only rows and merges duplicate rule sections', () => {
		const selected = image({
			'logo.size.minimum': result('logo.size.minimum', 'pass'),
			'logo.space.clear': result('logo.space.clear', 'fail'),
			'color.palette': result('color.palette', 'fail'),
			'color.combination': result('color.combination', 'ok'),
		})

		const view = buildCheckReviewView({
			sections,
			scenarioKey: 'quick',
			selected,
			showFailOnly: true,
		})

		expect(view.summary).toEqual({ pass: 1, ok: 1, fail: 2, pendingManualCheck: 0 })
		expect(view.rows.map((row) => row.rule.key)).toEqual(['logo.space.clear', 'color.palette'])
		expect(view.rows[1]?.appliesTo).toEqual(['Brand Logo', 'Color System'])
	})

	it('uses the selected image scenario before the global fallback scenario', () => {
		const selected = image({}, 'stationery')

		const view = buildCheckReviewView({
			sections,
			scenarioKey: 'quick',
			selected,
			showFailOnly: false,
		})

		expect(view.rows.map((row) => row.rule.key)).toEqual([
			'color.palette',
			'application.stationery.format',
		])
	})
})

function rule(key: string): CheckSection['rules'][number] {
	return {
		key,
		title: key,
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
