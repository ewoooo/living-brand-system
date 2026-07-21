'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { ArrayFieldClientComponent } from 'payload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

type PromptRow = Record<string, unknown>

export function candidatesFromText(value: string) {
	return value
		.split('\n')
		.map((candidate) => candidate.trim())
		.filter(Boolean)
		.map((candidate) => ({ value: candidate }))
}

function candidateText(candidates: unknown) {
	if (!Array.isArray(candidates)) return ''

	return candidates
		.map((candidate) =>
			typeof candidate === 'object' &&
			candidate !== null &&
			typeof candidate.value === 'string'
				? candidate.value
				: '',
		)
		.filter(Boolean)
		.join('\n')
}

const ImageProfilePromptTable: ArrayFieldClientComponent = ({ field, path }) => {
	const { disabled, errorMessage, setValue, showError, value } = useField<unknown>({ path })
	const rows = Array.isArray(value)
		? value.filter((row): row is PromptRow => typeof row === 'object' && row !== null)
		: []
	const isNormalization = field.name === 'userPromptNormalization'

	const updateRow = (index: number, next: PromptRow) => {
		setValue(rows.map((row, rowIndex) => (rowIndex === index ? next : row)))
	}

	return (
		<div className="field-type array image-profile-prompt-table">
			<FieldLabel
				htmlFor={`${path}-key-0`}
				label={field.label}
				path={path}
				required={field.required}
			/>
			<FieldDescription description={field.admin?.description} path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />

			<Table aria-label={isNormalization ? '유저 인풋 프롬프트 정규화' : '프로파일 프롬프트'}>
				<TableHeader>
					<TableRow>
						<TableHead scope="col">키</TableHead>
						<TableHead scope="col">
							{isNormalization ? '값 후보 (한 줄에 하나)' : '값'}
						</TableHead>
						<TableHead scope="col">관리</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.length > 0 ? (
						rows.map((row, index) => (
							<TableRow key={typeof row.id === 'string' ? row.id : index}>
								<TableCell>
									<Input
										id={`${path}-key-${index}`}
										value={typeof row.key === 'string' ? row.key : ''}
										disabled={disabled}
										onChange={(event) =>
											updateRow(index, {
												...row,
												key: event.currentTarget.value,
											})
										}
									/>
								</TableCell>
								<TableCell>
									{isNormalization ? (
										<Textarea
											value={candidateText(row.candidates)}
											disabled={disabled}
											onChange={(event) =>
												updateRow(index, {
													...row,
													candidates: candidatesFromText(
														event.currentTarget.value,
													),
												})
											}
										/>
									) : (
										<Textarea
											value={typeof row.value === 'string' ? row.value : ''}
											disabled={disabled}
											onChange={(event) =>
												updateRow(index, {
													...row,
													value: event.currentTarget.value,
												})
											}
										/>
									)}
								</TableCell>
								<TableCell>
									<Button
										type="button"
										variant="secondary"
										size="xs"
										disabled={disabled}
										onClick={() =>
											setValue(
												rows.filter((_, rowIndex) => rowIndex !== index),
											)
										}
									>
										삭제
									</Button>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={3}>등록된 필드가 없습니다.</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={disabled}
				onClick={() =>
					setValue([
						...rows,
						isNormalization ? { key: '', candidates: [] } : { key: '', value: '' },
					])
				}
			>
				{isNormalization ? '정규화 필드 추가' : '프롬프트 필드 추가'}
			</Button>
		</div>
	)
}

export default ImageProfilePromptTable
