'use client'

import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FieldLegend, FieldSet } from '@/components/ui/field'
import {
	type ImageProfileOption,
	requestPublishedImageProfiles,
} from '@/features/image-generation/services/generate-image.client'
import type {
	TemplateBackgroundPolicy,
	TemplateBackgroundType,
} from '@/features/template-customization/domain/template-studio-config'

const TYPE_ROWS: readonly { value: TemplateBackgroundType; label: string }[] = [
	{ value: 'color', label: '색' },
	{ value: 'image', label: '이미지' },
	{ value: 'graphic', label: '그래픽' },
]

type Props = ComponentProps<JSONFieldClientComponent> & {
	graphicOptions?: readonly { value: string; label: string }[]
}

function readPolicy(value: unknown): TemplateBackgroundPolicy {
	return value && typeof value === 'object' ? (value as TemplateBackgroundPolicy) : {}
}

/**
 * 목록을 켜고 끈다. 전부 켜진 상태는 목록 자체를 지워 "전부 허용"으로 되돌린다.
 * 저장값에 현재 보이지 않는 id(미발행 등)가 섞여 있을 수 있으므로 `all`로 먼저 걸러야
 * length 비교가 "보이는 옵션을 전부 켰다"를 정확히 뜻한다 — 안 그러면 그 값들이 다 켜진
 * 것으로 잘못 세어져 하나를 꺼도 "전부 허용"으로 조용히 넓어진다.
 */
function toggleId<T>(current: readonly T[] | undefined, all: readonly T[], id: T): T[] | undefined {
	const base = (current ?? all).filter((value) => all.includes(value))
	const next = base.includes(id) ? base.filter((value) => value !== id) : [...base, id]
	return next.length === all.length ? undefined : next
}

export function TemplateBackgroundPolicyField({ path, graphicOptions = [] }: Props) {
	const { disabled, setValue, value } = useField<unknown>({ path })
	const policy = readPolicy(value)
	const [profiles, setProfiles] = useState<ImageProfileOption[]>([])
	const [profilesLoadError, setProfilesLoadError] = useState(false)

	useEffect(() => {
		void requestPublishedImageProfiles()
			.then(setProfiles)
			.catch(() => setProfilesLoadError(true))
	}, [])

	const types = policy.types ?? TYPE_ROWS.map((row) => row.value)
	const allows = (type: TemplateBackgroundType) => types.includes(type)

	function patch(next: Partial<TemplateBackgroundPolicy>) {
		setValue({ ...policy, ...next })
	}

	return (
		<div className="field-type json mb-5 flex flex-col gap-4">
			<FieldLabel label="배경 설정" path={path} />

			<FieldSet className="gap-2 rounded-md border p-3">
				<FieldLegend variant="label">형식</FieldLegend>
				<div className="flex flex-wrap gap-2">
					{TYPE_ROWS.map((row) => (
						<Button
							key={row.value}
							type="button"
							size="sm"
							// 형식이 하나만 켜져 있으면 그 버튼은 끌 수 없다 — getTemplateRuntimeManifest가
							// 배경 형식이 전부 비면 던지고, 그 함수는 어드민 폼 렌더 중에도 불린다.
							disabled={disabled || (allows(row.value) && types.length === 1)}
							aria-pressed={allows(row.value)}
							variant={allows(row.value) ? 'muted' : 'outline'}
							onClick={() =>
								patch({
									types: types.includes(row.value)
										? types.filter((type) => type !== row.value)
										: [...types, row.value],
								})
							}
						>
							{row.label}
						</Button>
					))}
				</div>
				<FieldDescription
					description="최소 하나는 켜야 합니다 — 마지막 형식은 끌 수 없습니다."
					path={path}
				/>
			</FieldSet>

			{allows('image') ? (
				<FieldSet className="gap-2 rounded-md border p-3">
					<FieldLegend variant="label">허용 이미지 프로파일</FieldLegend>
					{profilesLoadError ? (
						<p className="text-sm text-muted-foreground">
							이미지 프로파일을 불러오지 못했습니다.
						</p>
					) : profiles.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							발행된 이미지 프로파일이 없습니다.
						</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{profiles.map((profile) => {
								const all = profiles.map((candidate) => candidate.id)
								const on = (policy.imageConfigIds ?? all).includes(profile.id)
								return (
									<Button
										key={profile.id}
										type="button"
										size="sm"
										disabled={disabled}
										aria-pressed={on}
										variant={on ? 'muted' : 'outline'}
										onClick={() =>
											patch({
												imageConfigIds: toggleId(
													policy.imageConfigIds,
													all,
													profile.id,
												),
											})
										}
									>
										{profile.name}
									</Button>
								)
							})}
						</div>
					)}
				</FieldSet>
			) : null}

			{allows('graphic') ? (
				<FieldSet className="gap-2 rounded-md border p-3">
					<FieldLegend variant="label">허용 그래픽</FieldLegend>
					{graphicOptions.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							허용 가능한 그래픽이 없습니다.
						</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{graphicOptions.map((option) => {
								const all = graphicOptions.map((candidate) => candidate.value)
								const on = (policy.graphicConfigIds ?? all).includes(option.value)
								return (
									<Button
										key={option.value}
										type="button"
										size="sm"
										disabled={disabled}
										aria-pressed={on}
										variant={on ? 'muted' : 'outline'}
										onClick={() =>
											patch({
												graphicConfigIds: toggleId(
													policy.graphicConfigIds,
													all,
													option.value,
												),
											})
										}
									>
										{option.label}
									</Button>
								)
							})}
						</div>
					)}
				</FieldSet>
			) : null}
		</div>
	)
}
