// CI 사용 금지 규정 위젯(PDF 패턴 E, p15~16의 12종). 좌 본문 1회 + 금지 카드(빨간 X + 캡션).
// 금지 항목은 상수(01-specs E). 나쁜예시 이미지는 실자산 확보 전이라 placeholder 박스로 표시.
// 자족 렌더(입력 없음) — color-palette 위젯과 동형.
const PROHIBITIONS: string[] = [
	'심볼을 단독 표기할 수 없습니다',
	'심볼과 텍스트를 조합하여 사용할 수 없습니다',
	'컬러 심볼을 분리형 심볼 형태로 사용할 수 없습니다',
	'CI에 별도의 시각효과를 적용할 수 없습니다',
	'CI에 스트로크 효과를 적용할 수 없습니다',
	'CI의 색상을 임의대로 변경할 수 없습니다',
	'CI의 비율을 변경할 수 없습니다',
	'어떠한 형태로든 CI를 변경할 수 없습니다',
	'CI의 간격을 임의로 조정할 수 없습니다',
	'CI의 형태를 임의로 변경할 수 없습니다',
	'CI의 가시성을 해치는 배경 컬러와 함께 사용할 수 없습니다',
	'CI의 가시성을 해치는 배경 이미지와 함께 사용할 수 없습니다',
]

export function IncorrectUsageWidget() {
	return (
		<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
			{/* 좌 본문 (1회) */}
			<aside className="text-sm">
				<h3 className="font-semibold text-neutral-800">사용 금지 규정</h3>
				<p className="mt-2 text-neutral-500 text-xs leading-relaxed">
					브랜드 아이덴티티를 철저히 관리하기 위한 규정입니다. 로고의 색상·형태·비례
					변형은 불가하며, 잘못 사용하기 쉬운 예를 수록했습니다. 의문이 생길 경우 유관
					부서로 문의합니다.
				</p>
			</aside>
			{/* 금지 카드 그리드 */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{PROHIBITIONS.map((caption, i) => (
					<div
						key={caption}
						className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-2"
					>
						<div className="relative flex aspect-video items-center justify-center rounded bg-neutral-100">
							<span className="text-neutral-300 text-xs">예시 {i + 1}</span>
							{/* 빨간 X (금지 표식) */}
							<span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
								✕
							</span>
						</div>
						<p className="text-[11px] text-red-600 leading-snug">{caption}</p>
					</div>
				))}
			</div>
		</div>
	)
}

export default IncorrectUsageWidget
