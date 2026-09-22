import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { AiUsageStudioRow } from '@/modules/ai-usage/ai-usage'
import { AI_USAGE_STUDIOS, type AiUsageStudio } from '@/modules/ai-usage/ai-usage-catalog'
import { AiUsageStudioTable } from './ai-usage-studio-table'

afterEach(cleanup)

function rowsWith(used: Partial<Record<AiUsageStudio, number>>): AiUsageStudioRow[] {
	return AI_USAGE_STUDIOS.map(({ value: studio }) => {
		const total = used[studio] ?? 0
		return {
			studio,
			callCount: total > 0 ? 1 : 0,
			inputTokens: total > 0 ? Math.floor(total / 2) : 0,
			outputTokens: total > 0 ? Math.ceil(total / 2) : 0,
			totalTokens: total,
		}
	})
}

describe('AiUsageStudioTable', () => {
	// 🔴 사용자 지시의 핵심 — 「안 썼습니다」가 아니라 0이 보여야 한다.
	it('아무도 안 썼어도 스튜디오 전부가 0으로 선다', () => {
		render(<AiUsageStudioTable rows={rowsWith({})} />)

		const body = screen.getAllByRole('rowgroup')[1] as HTMLElement
		expect(within(body).getAllByRole('row')).toHaveLength(AI_USAGE_STUDIOS.length)
		expect(screen.getByText('이미지')).toBeInTheDocument()
		expect(screen.getByText('그래픽')).toBeInTheDocument()
		// 「사용한 적 없습니다」 같은 빈 상태로 도망가지 않는다.
		expect(screen.queryByText(/없습니다/)).not.toBeInTheDocument()
	})

	it('쓴 스튜디오는 숫자를, 안 쓴 스튜디오는 0을 같은 표에 그린다', () => {
		render(<AiUsageStudioTable rows={rowsWith({ image: 4030 })} />)

		const imageRow = screen.getByText('이미지').closest('tr') as HTMLElement
		expect(within(imageRow).getByText('4,030')).toBeInTheDocument()

		const graphRow = screen.getByText('그래프').closest('tr') as HTMLElement
		// 호출·입력·출력·합계가 모두 0이다.
		expect(within(graphRow).getAllByText('0')).toHaveLength(4)
	})
})
