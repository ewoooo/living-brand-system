import type {
	ImageAspectRatio,
	ImageOutputSize,
} from '@/features/image-generation/domain/image-size'

/**
 * 좌측 갤러리가 그리는 생성 이미지 한 장.
 *
 * 🔴 복원 값이 전부 nullable인 것은 실수가 아니다 — `generated-images`의 메타 필드는
 *    manager 전용 field access를 갖는다(컬렉션 선언). 권한이 없는 사용자에게는 Payload가
 *    그 필드를 빼고 내려주므로, 갤러리는 그림만 보이고 복원은 열리지 않는다.
 *    그 경계를 조회에서 우회하지 않는다(`overrideAccess: false`).
 */
export interface GeneratedImageHistoryItem {
	id: number
	url: string
	createdAt: string
	profileId: number | null
	profileName: string | null
	prompt: string | null
	aspectRatio: ImageAspectRatio | null
	imageSize: ImageOutputSize | null
}

/** 컨트롤러를 채울 수 있는 항목인가 — 프로파일과 프롬프트가 함께 있어야 복원이 성립한다. */
export function acceptsHistoryRestore(
	item: GeneratedImageHistoryItem,
): item is GeneratedImageHistoryItem & { profileId: number; prompt: string } {
	return typeof item.profileId === 'number' && typeof item.prompt === 'string'
}

export type GeneratedImageHistoryGroup = {
	/** 로컬 시간 기준 날짜 키(YYYY-MM-DD). 라벨과 달리 날마다 유일하다. */
	key: string
	label: string
	items: GeneratedImageHistoryItem[]
}

function dayKey(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0')
	return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * 최신순 목록을 날짜 구간으로 자른다 — 519장을 한 덩어리로 훑을 수 없어서 넣은 구분이다.
 *
 * 🔑 입력 순서를 그대로 유지하고 같은 날짜가 이어질 때만 묶는다. 날짜별로 다시 모으면
 *    페이지가 이어 붙을 때 이미 그린 그룹에 항목이 끼어들어 격자가 흔들린다.
 * 🔴 경계는 UTC가 아니라 **보는 사람의 로컬 자정**이다 — 저장은 UTC지만 「오늘」은 화면의 말이다.
 */
export function groupHistoryByDate(
	items: readonly GeneratedImageHistoryItem[],
	today: Date = new Date(),
): GeneratedImageHistoryGroup[] {
	const todayKey = dayKey(today)
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)
	const yesterdayKey = dayKey(yesterday)

	const groups: GeneratedImageHistoryGroup[] = []
	for (const item of items) {
		const date = new Date(item.createdAt)
		// 날짜를 못 읽는 항목은 앞 그룹에 붙인다 — 그림을 버리는 것보다 낫다.
		const key = Number.isNaN(date.getTime()) ? (groups.at(-1)?.key ?? todayKey) : dayKey(date)
		const last = groups.at(-1)
		if (last?.key === key) {
			last.items.push(item)
			continue
		}
		groups.push({
			items: [item],
			key,
			label: dateLabel(key, date, today, todayKey, yesterdayKey),
		})
	}
	return groups
}

function dateLabel(
	key: string,
	date: Date,
	today: Date,
	todayKey: string,
	yesterdayKey: string,
): string {
	if (key === todayKey) return '오늘'
	if (key === yesterdayKey) return '어제'
	const [year, month, day] = key.split('-').map(Number)
	if (Number.isNaN(date.getTime()) || year === undefined) return key
	return year === today.getFullYear() ? `${month}월 ${day}일` : `${year}년 ${month}월 ${day}일`
}
