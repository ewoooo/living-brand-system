'use client'

import { useState } from 'react'

// 폰트 글리프 인스펙터: 좌측 정사각형에 선택된 글자를 크게, 우측에 글리프 목록(정사각형 셀)을 둔다.
// 셀에 호버(또는 포커스)하면 좌측 큰 글자가 그 글리프로 갱신된다.
// 이중 border 방지: 그리드는 컨테이너에 top/left, 각 셀에 right/bottom만 둬서 경계선이 겹치지 않게 한다.
// 한글 등 Essenflux에 없는 글리프는 Pretendard로 폴백.

const GLYPHS = [
	...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	...'abcdefghijklmnopqrstuvwxyz',
	...'0123456789',
	...'&@.,:;!?*#%/()-',
]

const codepoint = (ch: string) =>
	`U+${(ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`

export function GlyphGrid() {
	const [active, setActive] = useState('A')

	return (
		<div className="grid gap-6 md:grid-cols-2">
			<div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-sm border border-border bg-background-tertiary">
				<span
					className="text-foreground"
					style={{
						fontFamily: 'var(--font-title)',
						fontSize: 'clamp(7rem,22vw,16rem)',
						lineHeight: 1,
					}}
				>
					{active}
				</span>
				<span className="type-caption-1 absolute bottom-4 left-4 text-foreground-muted tabular-nums">
					{codepoint(active)}
				</span>
			</div>

			<div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] self-start rounded-sm border-border border-t border-l">
				{GLYPHS.map((ch) => (
					<button
						key={ch}
						type="button"
						onMouseEnter={() => setActive(ch)}
						onFocus={() => setActive(ch)}
						data-active={ch === active}
						aria-label={`${ch} (${codepoint(ch)})`}
						className="flex aspect-square items-center justify-center border-border border-r border-b text-2xl text-foreground transition-colors hover:bg-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 data-[active=true]:bg-fill-selected"
						style={{ fontFamily: 'var(--font-title)' }}
					>
						{ch}
					</button>
				))}
			</div>
		</div>
	)
}
