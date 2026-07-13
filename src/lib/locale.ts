/**
 * 서버 read 경로의 기본 로케일 전략.
 * repository들이 각자 리터럴을 들고 있으면 전략 변경 시 누락이 생기므로 여기 한 곳만 고친다.
 */
export const DEFAULT_LOCALE = 'ko' as const
export const FALLBACK_LOCALE = false as const
