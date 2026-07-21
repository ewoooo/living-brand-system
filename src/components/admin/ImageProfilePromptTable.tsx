'use client'

import { FieldDescription, FieldError, FieldLabel, useField, useForm } from '@payloadcms/ui'
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

type PromptRowProps = {
	disabled: boolean
	onRemove: () => void
	path: string
}

function ProfilePromptRow({ disabled, onRemove, path }: PromptRowProps) {
	const key = useField<string>({ path: `${path}.key` })
	const value = useField<string>({ path: `${path}.value` })

	return (
		<TableRow>
			<TableCell>
				<Input
					value={key.value ?? ''}
					disabled={disabled || key.disabled}
					onChange={(event) => key.setValue(event.currentTarget.value)}
				/>
			</TableCell>
			<TableCell>
				<Textarea
					value={value.value ?? ''}
					disabled={disabled || value.disabled}
					onChange={(event) => value.setValue(event.currentTarget.value)}
				/>
			</TableCell>
			<TableCell>
				<Button
					type="button"
					variant="secondary"
					size="xs"
					disabled={disabled}
					onClick={onRemove}
				>
					삭제
				</Button>
			</TableCell>
		</TableRow>
	)
}

function CandidateRow({ disabled, onRemove, path }: PromptRowProps) {
	const field = useField<string>({ path })

	return (
		<div className="image-profile-prompt-table__candidate">
			<Textarea
				value={field.value ?? ''}
				disabled={disabled || field.disabled}
				onChange={(event) => field.setValue(event.currentTarget.value)}
			/>
			<Button
				type="button"
				variant="secondary"
				size="xs"
				disabled={disabled}
				onClick={onRemove}
			>
				삭제
			</Button>
		</div>
	)
}

function NormalizationPromptRow({
	disabled,
	onRemove,
	path,
	schemaPath,
}: {
	disabled: boolean
	onRemove: () => void
	path: string
	schemaPath: string
}) {
	const key = useField<string>({ path: `${path}.key` })
	const candidatesPath = `${path}.candidates`
	const {
		errorMessage,
		rows = [],
		showError,
	} = useField({
		hasRows: true,
		potentiallyStalePath: candidatesPath,
	})
	const { addFieldRow, removeFieldRow } = useForm()

	return (
		<TableRow>
			<TableCell>
				<Input
					value={key.value ?? ''}
					disabled={disabled || key.disabled}
					onChange={(event) => key.setValue(event.currentTarget.value)}
				/>
			</TableCell>
			<TableCell>
				<FieldError message={errorMessage} path={candidatesPath} showError={showError} />
				<div className="image-profile-prompt-table__candidates">
					{rows.map((row, index) => (
						<CandidateRow
							key={row.id}
							disabled={disabled || Boolean(row.isLoading)}
							onRemove={() =>
								removeFieldRow({ path: candidatesPath, rowIndex: index })
							}
							path={`${candidatesPath}.${index}.value`}
						/>
					))}
					<Button
						type="button"
						variant="outline"
						size="xs"
						disabled={disabled}
						onClick={() =>
							addFieldRow({
								path: candidatesPath,
								rowIndex: rows.length,
								schemaPath,
							})
						}
					>
						값 후보 추가
					</Button>
				</div>
			</TableCell>
			<TableCell>
				<Button
					type="button"
					variant="secondary"
					size="xs"
					disabled={disabled}
					onClick={onRemove}
				>
					삭제
				</Button>
			</TableCell>
		</TableRow>
	)
}

const ImageProfilePromptTable: ArrayFieldClientComponent = ({
	field,
	path: pathFromProps,
	readOnly,
	schemaPath: schemaPathFromProps,
}) => {
	const { addFieldRow, removeFieldRow } = useForm()
	const {
		disabled,
		errorMessage,
		path,
		rows = [],
		showError,
	} = useField({
		hasRows: true,
		potentiallyStalePath: pathFromProps,
	})
	const isDisabled = disabled || Boolean(readOnly)
	const isNormalization = field.name === 'userPromptNormalization'
	const schemaPath = schemaPathFromProps ?? field.name

	return (
		<div className="field-type array image-profile-prompt-table">
			<FieldLabel label={field.label} path={path} required={field.required} />
			<FieldDescription description={field.admin?.description} path={path} />
			<FieldError message={errorMessage} path={path} showError={showError} />

			<Table aria-label={isNormalization ? '유저 인풋 프롬프트 정규화' : '프로파일 프롬프트'}>
				<TableHeader>
					<TableRow>
						<TableHead scope="col">키</TableHead>
						<TableHead scope="col">{isNormalization ? '값 후보' : '값'}</TableHead>
						<TableHead scope="col">관리</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.length > 0 ? (
						rows.map((row, index) => {
							const rowPath = `${path}.${index}`
							const rowDisabled = isDisabled || Boolean(row.isLoading)

							return isNormalization ? (
								<NormalizationPromptRow
									key={row.id}
									disabled={rowDisabled}
									onRemove={() => removeFieldRow({ path, rowIndex: index })}
									path={rowPath}
									schemaPath={`${schemaPath}.candidates`}
								/>
							) : (
								<ProfilePromptRow
									key={row.id}
									disabled={rowDisabled}
									onRemove={() => removeFieldRow({ path, rowIndex: index })}
									path={rowPath}
								/>
							)
						})
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
				disabled={isDisabled}
				onClick={() => addFieldRow({ path, rowIndex: rows.length, schemaPath })}
			>
				{isNormalization ? '정규화 필드 추가' : '프롬프트 필드 추가'}
			</Button>
		</div>
	)
}

export default ImageProfilePromptTable
