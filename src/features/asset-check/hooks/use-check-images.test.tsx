import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ImageCheckControls } from '@/components/studio/review/upload/image-check-controls'
import { CheckImageProvider } from './use-check-images'

describe('CheckImageProvider', () => {
	it('renders review controls when no CheckScenario is published', () => {
		render(
			<CheckImageProvider scenarios={[]}>
				<ImageCheckControls />
			</CheckImageProvider>,
		)

		expect(screen.getByText('발행된 검수 시나리오 없음')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '검사하기' })).toBeDisabled()
	})
})
