import { render, screen } from '@testing-library/react'
import { type ComponentProps, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { CheckEvidence } from './check-evidence'

describe('CheckEvidence', () => {
	it('블록 타입별 evidence와 기준 이미지를 사람이 읽을 수 있게 표시한다', () => {
		const props: ComponentProps<typeof CheckEvidence> = {
			evidence: {
				type: 'document',
				description: '로고 사용 기준',
				blocks: [
					{
						type: 'columnUnit',
						columns: [{ heading: 'Minimum Size', body: '최소 20px' }],
					},
					{
						type: 'colorPalette',
						title: 'Main Colors',
						colors: [{ name: 'Brand Green', hex: '#37614A', pantone: '5605 C' }],
					},
					{
						type: 'doDont',
						groups: [
							{
								category: 'Placement',
								examples: [
									{ kind: 'do', caption: '여백을 확보합니다.' },
									{ kind: 'dont', caption: '가장자리에 붙이지 않습니다.' },
								],
							},
						],
					},
					{ type: 'mediaShowcase' },
				],
			},
			referenceAssets: [
				{
					name: 'page-13.jpg',
					url: '/api/application-images/file/page-13.jpg',
					mimeType: 'image/jpeg',
					role: 'context',
				},
			],
		}
		const { rerender } = render(createElement(CheckEvidence, props))

		expect(screen.getByText('Minimum Size')).toBeTruthy()
		expect(screen.getByText('HEX #37614A · PMS 5605 C')).toBeTruthy()
		expect(screen.getByText('권장')).toBeTruthy()
		expect(screen.getByText('금지')).toBeTruthy()
		expect(screen.getByText('이미지 기준')).toBeTruthy()
		expect(screen.getByRole('link', { name: '참고 · page-13.jpg' })).toHaveAttribute(
			'href',
			'/api/application-images/file/page-13.jpg',
		)

		rerender(
			createElement(CheckEvidence, {
				evidence: '기존 문자열 근거',
				referenceAssets: [],
			}),
		)
		expect(screen.getByText('기존 문자열 근거')).toBeTruthy()
	})
})
