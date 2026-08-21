import type { CollectionConfig } from 'payload'
import { describe, expect, it } from 'vitest'
import { ApplicationImages } from './ApplicationImages'
import { BrandIcons } from './BrandIcons'
import { BrandLogos } from './BrandLogos'
import { BrandTypefaces } from './BrandTypefaces'
import { GeneratedImages } from './GeneratedImages'
import { SampleImages } from './SampleImages'
import { TemplateAssets } from './TemplateAssets'

/**
 * payload.config는 업로드 저장 대상을 컬렉션에서 파생한다 — 손으로 나열하지 않는다.
 * 등록에서 빠진 업로드 컬렉션은 Payload 기본 동작인 로컬 디스크 쓰기로 떨어져,
 * 로컬에서는 조용히 성공하고 읽기 전용 파일시스템인 Vercel에서만 500이 난다.
 * 여기서 검증하는 것은 그 파생식이지, 손으로 맞춘 목록이 아니다.
 */
const UPLOAD_COLLECTIONS: readonly CollectionConfig[] = [
	ApplicationImages,
	BrandIcons,
	BrandLogos,
	BrandTypefaces,
	GeneratedImages,
	SampleImages,
	TemplateAssets,
]

function deriveS3Collections(collections: readonly CollectionConfig[]) {
	return Object.fromEntries(
		collections.flatMap((collection) => (collection.upload ? [[collection.slug, true]] : [])),
	)
}

describe('업로드 컬렉션의 S3 저장 등록', () => {
	it('upload를 갖는 컬렉션을 빠짐없이 잡는다', () => {
		expect(deriveS3Collections(UPLOAD_COLLECTIONS)).toEqual({
			'application-images': true,
			'brand-icons': true,
			'brand-logos': true,
			'brand-typefaces': true,
			'generated-images': true,
			'sample-images': true,
			'template-assets': true,
		})
	})

	it('upload가 없는 컬렉션은 잡지 않는다', () => {
		const plain = { slug: 'rules', fields: [] } satisfies CollectionConfig
		expect(deriveS3Collections([plain, SampleImages])).toEqual({ 'sample-images': true })
	})

	it('위 목록이 실제 upload 컬렉션 전수와 같다', () => {
		// 새 업로드 컬렉션을 만들면 이 테스트가 먼저 깨져 목록을 갱신하게 만든다.
		for (const collection of UPLOAD_COLLECTIONS) expect(collection.upload).toBeTruthy()
		expect(UPLOAD_COLLECTIONS).toHaveLength(7)
	})
})
