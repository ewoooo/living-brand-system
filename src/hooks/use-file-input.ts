import { useRef } from 'react'

/**
 * 숨긴 <input type="file">의 열기·리셋 관용구를 공유한다.
 * ref는 input에 걸고, 트리거 버튼 onClick에 open, 같은 파일 재선택을 허용하려 선택값 초기화에 reset을 쓴다.
 */
export function useFileInput() {
	const ref = useRef<HTMLInputElement>(null)
	return {
		ref,
		open: () => ref.current?.click(),
		reset: () => {
			if (ref.current) ref.current.value = ''
		},
	}
}
