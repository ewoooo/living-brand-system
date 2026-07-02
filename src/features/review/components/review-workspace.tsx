'use client'

import type React from 'react'
import { ImageSelector } from '@/features/review/components/image-selector'

/**
 * review 작업 영역: 상단 image selector(검수 대상) + 하단 rule 본문(children).
 * 이미지 상태 provider는 상위 레이아웃에 있어 사이드 nav와 공유한다.
 */
export function ReviewWorkspace({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex w-full max-w-[1250px] flex-col">
			<ImageSelector />
			<div className="w-full">{children}</div>
		</div>
	)
}
