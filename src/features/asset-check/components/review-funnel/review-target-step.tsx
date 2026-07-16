import { ImageUploadCarousel } from '@/features/asset-check/components/upload/image-upload-carousel'

/**
 * 브라우저 입력 형식: `FileList | File[]`의 PNG/JPEG/WebP 파일.
 * 업로드 이후의 `CheckImage[]` 상태와 실행은 상위 CheckImageProvider가 소유한다.
 */
export function ReviewTargetStep() {
	return <ImageUploadCarousel />
}
