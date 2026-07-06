/**
 * 이미지에 어떤 디자인 요소가 포함됐는지 나타내는 플래그. 유저가 업로드 후 체크로 선택한다.
 * 현재 검수 로직엔 미반영(전 룰 검수) — 섹션 게이팅을 붙일 때 다시 소비한다.
 */
export interface ImageContentFlags {
	logo: boolean
	typography: boolean
	illustration: boolean
	photography: boolean
}

export const DEFAULT_CONTENT_FLAGS: ImageContentFlags = {
	logo: false,
	typography: false,
	illustration: false,
	photography: false,
}

/** 체크박스 UI 라벨 (안내 문구에도 재사용). 표시 순서도 이 순서를 따른다. */
export const CONTENT_FLAG_LABELS: Record<keyof ImageContentFlags, string> = {
	logo: 'Logo',
	typography: 'Typography',
	illustration: 'Illustration',
	photography: 'Photography',
}
