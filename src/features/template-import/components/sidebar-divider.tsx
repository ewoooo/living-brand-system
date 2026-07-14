/**
 * Templates 편집 폼 사이드바의 시각적 구분선. ui 필드로 배치한다(데이터 없음).
 */
export default function SidebarDivider() {
	return (
		<hr
			style={{
				border: 'none',
				borderTop: '1px solid var(--theme-elevation-150)',
				margin: 'calc(var(--base) * 0.75) 0',
			}}
		/>
	)
}
