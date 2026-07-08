/**
 * 저장된 선호(localStorage.theme) 또는 OS 설정으로 `dark` 클래스를 토글한다.
 * 이 함수 하나가 테마 판정의 단일 원본이다 — layout은 이 함수를 문자열화해
 * 하이드레이션 전 인라인 부트스트랩 스크립트로 주입하고, ThemeToggle은 런타임에 호출한다.
 * 그래서 전역(document/localStorage/window)만 참조해야 하며, 모듈 스코프 값을 닫으면 안 된다.
 */
export function applyTheme() {
	document.documentElement.classList.toggle(
		'dark',
		localStorage.theme === 'dark' ||
			(!('theme' in localStorage) &&
				window.matchMedia('(prefers-color-scheme: dark)').matches),
	)
}
