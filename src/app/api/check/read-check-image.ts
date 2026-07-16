import { detectCheckImageMediaType } from '@/features/asset-check/utils/image-format'

const MAX_IMAGE_BYTES = 20_000_000

type ReadCheckImageResult = { buffer: Buffer; name: string } | { response: Response }

/** 두 검수 API가 공유하는 이미지 업로드 크기·형식 검증 경계. */
export async function readCheckImage(
	value: FormDataEntryValue | null | undefined,
): Promise<ReadCheckImageResult> {
	if (!(value instanceof File)) {
		return { response: Response.json({ message: 'image is required.' }, { status: 400 }) }
	}
	if (value.size > MAX_IMAGE_BYTES) {
		return { response: Response.json({ message: 'Image is too large.' }, { status: 413 }) }
	}

	const buffer = Buffer.from(await value.arrayBuffer())
	if (!detectCheckImageMediaType(buffer)) {
		return {
			response: Response.json(
				{ message: 'Unsupported image type. Use JPEG, PNG, or WebP.' },
				{ status: 415 },
			),
		}
	}

	return { buffer, name: value.name }
}
