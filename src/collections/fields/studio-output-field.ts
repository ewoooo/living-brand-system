import type { Field } from 'payload'

type StudioOutputFieldOptions = {
	formats: readonly { label: string; value: string }[]
	includeOriginal?: boolean
}

/** Runtime 기본 출력을 Admin이 형식 목록과 원본 허용 여부로 좁히는 공통 저작 필드. */
export function studioOutputField({
	formats,
	includeOriginal = false,
}: StudioOutputFieldOptions): Field {
	return {
		name: 'output',
		type: 'group',
		label: '출력',
		admin: {
			description:
				'비우면 Runtime 또는 Template의 기본 출력을 사용합니다. 선택한 형식은 기본 capability를 넓힐 수 없습니다.',
		},
		fields: [
			{
				name: 'formats',
				type: 'select',
				hasMany: true,
				label: '허용 형식',
				options: [...formats],
			},
			...(includeOriginal
				? [
						{
							name: 'original',
							type: 'checkbox' as const,
							defaultValue: true,
							label: '원본 다운로드 허용',
						},
					]
				: []),
		],
	}
}
