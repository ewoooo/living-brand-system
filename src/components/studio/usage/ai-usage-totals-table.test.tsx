import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { AiUsageTotalsRow } from '@/modules/ai-usage/ai-usage'
import { AiUsageTotalsTable } from './ai-usage-totals-table'

afterEach(cleanup)

const rows: AiUsageTotalsRow[] = [
	{
		userId: 1,
		userEmail: 'worker@example.com',
		feature: 'image-generation',
		model: 'gemini-3.1-flash-image',
		callCount: 3,
		inputTokens: 30,
		outputTokens: 4000,
		totalTokens: 4030,
	},
	{
		userId: 2,
		userEmail: 'manager@example.com',
		feature: 'asset-check',
		model: 'claude-opus-5',
		callCount: 2,
		inputTokens: 900,
		outputTokens: 70,
		totalTokens: 970,
	},
]

describe('AiUsageTotalsTable', () => {
	it('누적 합계를 모든 행의 합으로 보여준다', () => {
		render(<AiUsageTotalsTable rows={rows} showUser />)

		expect(screen.getByText('5,000')).toBeInTheDocument()
	})

	it('기능을 사용자가 읽는 말로 보여준다', () => {
		render(<AiUsageTotalsTable rows={rows} showUser />)

		expect(screen.getByText('이미지 생성')).toBeInTheDocument()
		expect(screen.getByText('이미지 검수')).toBeInTheDocument()
	})

	// 🔴 worker 화면에 남의 이메일이 뜨면 안 된다 — 열 자체가 없어야 한다.
	it('showUser가 꺼지면 사용자 열을 그리지 않는다', () => {
		render(<AiUsageTotalsTable rows={rows} showUser={false} />)

		expect(screen.queryByRole('columnheader', { name: '사용자' })).not.toBeInTheDocument()
		expect(screen.queryByText('manager@example.com')).not.toBeInTheDocument()
	})

	it('showUser가 켜지면 누구 것인지 보여준다', () => {
		render(<AiUsageTotalsTable rows={rows} showUser />)

		expect(screen.getByRole('columnheader', { name: '사용자' })).toBeInTheDocument()
		expect(screen.getByText('worker@example.com')).toBeInTheDocument()
	})

	it('기록이 없으면 빈 상태를 보여준다', () => {
		render(<AiUsageTotalsTable rows={[]} showUser={false} />)

		expect(screen.getByText('아직 사용한 토큰이 없습니다')).toBeInTheDocument()
		expect(screen.queryByRole('table')).not.toBeInTheDocument()
	})
})
