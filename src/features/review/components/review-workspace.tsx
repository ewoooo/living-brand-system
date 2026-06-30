'use client'

import type React from 'react'
import { ImageSelector } from '@/features/review/components/image-selector'
import { ReviewImageProvider } from '@/features/review/image-context'

/**
 * review 작업 영역: 상단 image selector(검수 대상) + 하단 rule 본문(children).
 * 이미지 상태를 provider로 감싸 섹션 라우트가 바뀌어도 선택이 유지되게 한다.
 */
export function ReviewWorkspace({ children }: { children: React.ReactNode }) {
	return (
		<ReviewImageProvider>
			<div className="flex w-full flex-col">
				<ImageSelector />
				<div className="w-full">{children}</div>
			</div>
		</ReviewImageProvider>
	)
}
