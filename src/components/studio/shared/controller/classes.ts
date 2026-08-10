/**
 * 킷 내부 공용 클래스 — 파츠만 소비한다. 소비자는 Controller.Select/Input/Textarea를
 * 쓰므로 이 상수를 직접 가져다 쓸 일이 없다(index에서 내보내지 않는다).
 */

/** 행 안에 투명하게 앉는 셀렉트 트리거 — 포커스 링은 행이 소유한다. */
export const ROW_SELECT_TRIGGER =
	'h-auto border-transparent bg-transparent p-0 text-muted-foreground focus-visible:ring-0 dark:bg-transparent'

/** Row/Field 안에 투명하게 앉는 입력 — 포커스 링은 행이 소유한다. */
export const BARE_INPUT =
	'h-auto min-h-0 rounded-none border-0 bg-transparent p-0 focus-visible:ring-0 dark:bg-transparent'
