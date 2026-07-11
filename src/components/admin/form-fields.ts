import type { FormState } from 'payload'

export function fieldValue<T>(fields: FormState, path: string) {
	return fields[path]?.value as T | undefined
}

export function fieldString(fields: FormState, path: string) {
	const value = fieldValue<unknown>(fields, path)

	return typeof value === 'string' ? value : null
}

export function fieldNumber(fields: FormState, path: string) {
	const value = fieldValue<unknown>(fields, path)

	return typeof value === 'number' ? value : null
}

export function fieldRowCount(fields: FormState, path: string) {
	return fields[path]?.rows?.length ?? fieldNumber(fields, path) ?? 0
}

export function formatNumber(value?: number | null) {
	return typeof value === 'number' ? value.toLocaleString('ko-KR') : '-'
}
