import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import type {
	CheckSection,
	RuntimeCheck,
} from '@/features/asset-check/services/get-check-ruleset.service'
import { CheckCatalog } from './check-catalog'

describe('CheckCatalog', () => {
	it('검색과 판정 방식 필터를 함께 적용하고 결과 개수를 표시한다', () => {
		render(createElement(CheckCatalog, { sections }))

		expect(screen.getByText('필터 결과 3개 / 전체 3개')).toBeTruthy()
		expect(screen.getByRole('option', { name: '자동 측정' })).toBeTruthy()
		expect(screen.getByRole('option', { name: 'AI 평가' })).toBeTruthy()
		expect(screen.getByRole('option', { name: '담당자 확인' })).toBeTruthy()

		fireEvent.change(screen.getByLabelText('판정 방식'), {
			target: { value: 'heuristic' },
		})

		expect(screen.getByText('필터 결과 1개 / 전체 3개')).toBeTruthy()
		expect(screen.getByText('Brand color usage')).toBeTruthy()
		expect(screen.queryByText('Minimum logo size')).toBeNull()

		fireEvent.change(screen.getByLabelText('판정 방식'), {
			target: { value: 'all' },
		})
		fireEvent.change(screen.getByLabelText('검수 항목 검색'), {
			target: { value: 'Brand Green' },
		})

		expect(screen.getByText('필터 결과 1개 / 전체 3개')).toBeTruthy()
		expect(screen.getByText('Brand color usage')).toBeTruthy()
		expect(screen.queryByText('Minimum logo size')).toBeNull()

		fireEvent.change(screen.getByLabelText('검수 항목 검색'), {
			target: { value: '없는 검수 항목' },
		})

		expect(screen.getByText('필터 결과 0개 / 전체 3개')).toBeTruthy()
		expect(screen.getByText('조건에 맞는 검수 항목이 없습니다.')).toBeTruthy()
	})
})

const sections: CheckSection[] = [
	{
		title: 'Primary Logo',
		slug: 'primary-logo',
		groupTitle: 'Brand Logo',
		groupSlug: 'brand-logo',
		chapterTitle: 'Design Elements',
		chapterSlug: 'design-elements',
		chapterOrder: 1,
		sectionTitle: 'Brand Logo',
		sectionSlug: 'brand-logo',
		sectionOrder: 1,
		checks: [
			check('logo.size.minimum', 'Minimum logo size', 'deterministic', '최소 20px'),
			check('logo.color.brand', 'Brand color usage', 'heuristic', {
				type: 'colorPalette',
				colors: [{ name: 'Brand Green', hex: '#37614A' }],
			}),
			check('logo.placement', 'Logo placement', 'manual', '담당자가 배치를 확인합니다.'),
		],
	},
]

function check(
	key: string,
	title: string,
	executor: RuntimeCheck['executor'],
	evidence: RuntimeCheck['evidence'],
): RuntimeCheck {
	return {
		key,
		title,
		checker: { key: `${key}.checker`, type: executor },
		executor,
		implemented: true,
		evidence,
		referenceAssets: [],
	}
}
