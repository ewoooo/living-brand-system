'use client'

import type React from 'react'
import { ImageSelector } from '@/features/review/components/image-selector'

/**
 * review 작업 영역: 페이지 헤더 + 상단 image selector(검수 대상) + 하단 rule 본문(children).
 * 이미지 상태 provider는 상위 레이아웃에 있어 사이드 nav와 공유한다.
 */
export function ReviewWorkspace({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex w-full max-w-[1250px] flex-col">
			<header className="px-8 pt-8">
				<h1 className="text-3xl">Essenherb Brand Design Review</h1>
				<p className="mt-4 max-w-2xl text-muted-foreground leading-7">
					제작한 디자인 산출물을 업로드하면 브랜드 가이드라인 기준에 맞는지 자동으로
					검수합니다. 색·로고·명함 등 항목별로 통과·미통과를 한눈에 확인하고,
					가이드라인에서 벗어난 부분을 빠르게 바로잡을 수 있습니다.
				</p>
			</header>
			<ImageSelector />
			<div className="w-full">{children}</div>
		</div>
	)
}
