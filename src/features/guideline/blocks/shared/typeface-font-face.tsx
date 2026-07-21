import type { BrandTypeface } from '@/payload-types'

// 타이포그래피 블록이 공유하는 관계 해석. populate된 객체일 때만 서체 값으로 쓴다.
export function resolveTypeface(value?: number | BrandTypeface | null): BrandTypeface | null {
	return value && typeof value === 'object' ? value : null
}

/**
 * BrandTypeface가 소유한 폰트 파일로 @font-face를 주입한다.
 * 파일이 없는 서체(이름만 등록)는 전역 로드된 폰트에 familyName으로 의존한다.
 */
export function TypefaceFontFace({ typeface }: { typeface?: number | BrandTypeface | null }) {
	const resolved = resolveTypeface(typeface)
	if (!resolved?.url || !resolved.familyName) return null

	const weight = resolved.weightRange?.trim()
	return (
		<style>
			{`@font-face{font-family:"${resolved.familyName}";src:url("${resolved.url}");${
				weight ? `font-weight:${weight};` : ''
			}font-style:normal;font-display:swap;}`}
		</style>
	)
}
