# 참조 이미지 생성 — 원본 유지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카메라 조정 결과가 참조 원본을 화면에서 지우지 않게 하고, 참조 이미지를 일반 생성 경로의 선택적 입력으로 통합한다.

**Architecture:** 생성 유스케이스가 `generateImages` 하나로 수렴한다. 참조는 `ImageGenerationPlan.seedImage`로 들어가는 선택 입력이고, 참조가 어디서 왔는지는 `resolveGeneratedImageReference` 같은 소스 해석기가 소유한다. 카메라는 참조를 만들어 내는 주체가 아니라 flat 프롬프트 JSON에 키를 얹는 프롬프트 기여자로 남는다. 클라이언트는 "직전 응답"이 아니라 `{ images, reference }` 세션을 들고, 참조 물려받기 한 줄이 원본 고정을 실현한다.

**Tech Stack:** Next.js App Router, Payload CMS 3 + Drizzle(Postgres), TypeScript, zod, React 19, Vitest + Testing Library, Biome.

**Spec:** `docs/superpowers/specs/2026-08-18-image-reference-generation-design.md`

## Global Constraints

- 모든 테스트·빌드·마이그레이션은 **Node.js 22**에서 실행한다. 각 셸에서 먼저 `source ~/.nvm/nvm.sh && nvm use 22`.
- 작업 브랜치를 먼저 만든다: `git switch -c feat/image-reference-generation` (기준은 로컬 `main`).
- 커밋은 Conventional Commits + 한국어 요약(`<type>: <요약>`). 타입은 `feat`/`fix`/`refactor`/`test`/`docs`/`style`/`chore`.
- 스키마 변경 커밋에는 생성된 마이그레이션 `.ts`, drizzle 스냅샷 `.json`, `migrations/index.ts`를 **같은 커밋**에 넣는다.
- 로컬 개발 DB는 `PAYLOAD_DB_PUSH=true`인 버리는 DB다. 그 DB에 `payload migrate`를 돌리지 않는다.
- 요청 표면 오류 매핑은 `respond-image-generation.ts`의 표 한 곳만 소유한다. 새 오류 클래스를 만들지 않고 기존 `InvalidImageControllerInputError`(400)를 재사용한다.
- 사용자에게 보이는 문구는 한국어로 쓴다.
- 작업 순서는 **확장 → 이전 → 축소**다. Task 7 이전에는 기존 카메라 라우트가 계속 동작해야 한다.

## 파일 구조

| 파일 | 책임 | 변화 |
| --- | --- | --- |
| `src/collections/GeneratedImages.ts` | 생성 이미지 컬렉션 정의 | `sourceImage` 필드 추가 |
| `src/migrations/*` | 스키마 이행 | ADD COLUMN 한 건 |
| `src/features/image-generation/repositories/generated-image.payload.repository.ts` | Payload I/O(참조 조회·결과 저장) | `resolveGeneratedImageReference` 신설, `storeGeneratedImages`가 `sourceImage` 기록 |
| `src/features/image-generation/camera-control.ts` | 각도 상수·해석·프롬프트 키 번역 | 요청 스키마 제거(Task 7), 나머지 유지 |
| `src/features/image-generation/services/generate-image.service.ts` | 생성 유스케이스 경계 | `generateImages`가 `reference`·`camera` 수용, `adjustImageCamera` 제거(Task 7) |
| `src/app/api/generate-image/route.ts` | HTTP 계약 | `reference`·`camera` 수용, `prompt` 선택화 |
| `src/app/api/generate-image/camera-adjustment/` | 카메라 전용 라우트 | 삭제(Task 7) |
| `src/features/image-generation/services/generate-image.client.ts` | 클라이언트 HTTP 계약 | `ImageGenerationRequest`에 `reference`·`camera`, `requestCameraAdjustment` 제거(Task 7) |
| `src/features/image-generation/hooks/use-image-generation.ts` | 생성 요청 실행 + 세션 상태 | `result` → `session` |
| `src/features/image-generation/contexts/image-studio-context.ts` | 스튜디오 컨텍스트 계약 | `results`를 세션 기반으로 |
| `src/features/image-generation/providers/image-studio-provider.tsx` | 세션 소유자 | 참조 파생, 카메라 재생성이 통합 경로 호출 |
| `src/components/studio/image/image-generation-results.tsx` | 결과 그리드 | 참조 카드 + 두 테두리 |
| `src/components/studio/image/image-canvas.tsx` | 캔버스 배선 | 세션 props 전달 |
| `src/components/studio/image/image-generator.tsx` | 워크스페이스 배선 | 저장 대상 파생 |

---

## Task 1: `sourceImage` 필드와 저장 배선

참조 사실을 DB에 남긴다. 이 시점에는 `adjustImageCamera`가 유일한 기록자다.

**Files:**
- Modify: `src/collections/GeneratedImages.ts:104` (`createdBy` 필드 뒤)
- Modify: `src/features/image-generation/repositories/generated-image.payload.repository.ts:106-136`
- Modify: `src/features/image-generation/services/generate-image.service.ts:284-293, 434-462`
- Test: `src/collections/GeneratedImages.test.ts`
- Create: `src/migrations/<timestamp>_generated_image_source_image.ts` + `.json` 스냅샷

**Interfaces:**
- Produces: `storeGeneratedImages(input: { ...기존, sourceImage?: number })` — Task 3이 이 인자를 쓴다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/collections/GeneratedImages.test.ts`에 아래 테스트를 추가한다.

```ts
it('참조 원본을 매니저 전용 관계 필드로 보관한다', async () => {
	const sourceImage = GeneratedImages.fields.find(
		(field) => 'name' in field && field.name === 'sourceImage',
	)
	expect(sourceImage).toBeDefined()
	expect(sourceImage && 'relationTo' in sourceImage ? sourceImage.relationTo : null).toBe(
		'generated-images',
	)
	// 참조 없이 만든 이미지가 다수이므로 필수가 아니어야 한다.
	expect(sourceImage && 'required' in sourceImage ? sourceImage.required : false).toBeFalsy()

	const read =
		sourceImage && 'access' in sourceImage ? sourceImage.access?.read : undefined
	expect(await read?.({ req: { user: { role: 'worker' } } } as never)).toBe(false)
	expect(await read?.({ req: { user: { role: 'manager' } } } as never)).toBe(true)
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm vitest run src/collections/GeneratedImages.test.ts`
Expected: FAIL — `expect(sourceImage).toBeDefined()`에서 `undefined`.

- [ ] **Step 3: 필드를 추가한다**

`src/collections/GeneratedImages.ts`의 `createdBy` 필드 객체 **뒤**, `fields` 배열 끝에 추가한다.

```ts
		{
			name: 'sourceImage',
			type: 'relationship',
			relationTo: 'generated-images',
			access: { read: managerFieldRead },
			admin: {
				position: 'sidebar',
				description: '이 이미지를 만들 때 참조한 원본 생성 이미지입니다.',
			},
		},
```

- [ ] **Step 4: 통과를 확인한다**

Run: `pnpm vitest run src/collections/GeneratedImages.test.ts`
Expected: PASS

- [ ] **Step 5: 저장소가 값을 기록하게 한다**

`generated-image.payload.repository.ts`의 `storeGeneratedImages` 인자 타입에 한 줄 추가한다.

```ts
	profile: Pick<ImageProfile, 'id' | 'name'> & {
		aspectRatio: ImageAspectRatio
		imageSize: ImageOutputSize
	}
	/** 참조해서 만든 결과면 그 원본 생성 이미지 id. 없으면 참조 없이 만든 이미지다. */
	sourceImage?: number
```

같은 함수의 `payload.create` 호출 `data` 객체 끝에 추가한다.

```ts
					scenarioName: input.profile.name,
					...(input.sourceImage ? { sourceImage: input.sourceImage } : {}),
```

- [ ] **Step 6: 서비스가 값을 넘기게 한다**

`generate-image.service.ts`의 `storeProfileGeneration` 인자 타입에 추가한다.

```ts
		user: unknown
		/** 참조해서 만든 결과면 그 원본 생성 이미지 id. */
		sourceImage?: number
	},
```

같은 함수 안에서 구조분해와 전달을 고친다.

```ts
	{
		inputPrompt,
		profile,
		sourceImage,
		user,
	}: {
```

```ts
	const generatedImages = await storeGeneratedImages({
		createdBy,
		effectivePrompt: generated.prompt,
		images: generated.images,
		inputPrompt,
		model: generated.model,
		profile,
		...(sourceImage ? { sourceImage } : {}),
	})
```

`adjustImageCamera`의 `storeProfileGeneration` 호출(`:284`)에 인자를 더한다.

```ts
	const stored = await storeProfileGeneration(result, {
		inputPrompt: seed.inputPrompt,
		profile: {
			id: profile.id,
			name: profile.name,
			aspectRatio: effective.aspectRatio,
			imageSize: effective.imageSize,
		},
		sourceImage: generatedImageId,
		user,
	})
```

- [ ] **Step 7: 서비스 테스트에 기록 검증을 추가한다**

`src/features/image-generation/services/generate-image.service.test.ts`의 `adjustImageCamera` describe 블록 안에 추가한다. 기존 성공 케이스가 세워 둔 mock 설정을 그대로 쓰되, 저장 인자만 본다.

```ts
	it('참조한 원본 생성 이미지 id를 저장 인자에 담는다', async () => {
		await adjustImageCamera({
			camera: { azimuthDeg: 0, elevationDeg: 0 },
			count: 1,
			generatedImageId: 8,
			profileId: 5,
			requestUrl: 'http://localhost/api/generate-image/camera-adjustment',
			user: { id: 1 },
		})

		expect(mocks.storeGeneratedImages).toHaveBeenCalledWith(
			expect.objectContaining({ sourceImage: 8 }),
		)
	})
```

> 이 테스트를 넣기 전에 같은 describe의 기존 성공 케이스를 읽고 `beforeEach`가 세우는 mock 반환값(`findPublishedImageProfile`, `loadGeneratedImage`, `generateBrandImages`, `storeGeneratedImages`)을 그대로 쓴다. 필요한 mock이 그 describe에 없으면 기존 성공 케이스의 설정을 이 테스트 안으로 복사한다.

- [ ] **Step 8: 서비스 테스트를 돌린다**

Run: `pnpm vitest run src/features/image-generation/services/generate-image.service.test.ts`
Expected: PASS

- [ ] **Step 9: 마이그레이션을 만든다**

Run: `pnpm migrate:create generated_image_source_image`
Expected: `src/migrations/`에 `.ts`와 같은 이름의 `.json` 스냅샷이 생기고 `index.ts`가 갱신된다. 생성된 SQL이 `ADD COLUMN "source_image_id"` 한 건인지 눈으로 확인한다. 다른 테이블 변경이 섞여 있으면 스냅샷이 낡은 것이므로 멈추고 보고한다.

- [ ] **Step 10: 타입·린트·전체 테스트**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run
```
Expected: 모두 PASS

- [ ] **Step 11: 커밋**

```bash
git add src/collections/GeneratedImages.ts src/collections/GeneratedImages.test.ts \
  src/features/image-generation/repositories/generated-image.payload.repository.ts \
  src/features/image-generation/services/generate-image.service.ts \
  src/features/image-generation/services/generate-image.service.test.ts \
  src/migrations
git commit -m "feat: 생성 이미지에 참조한 원본을 기록"
```

---

## Task 2: 참조 소스 해석기

`loadGeneratedImage`를 소스 해석기 계약으로 다시 낸다. 이 시점에는 `adjustImageCamera`가 유일한 소비자다.

**Files:**
- Modify: `src/features/image-generation/repositories/generated-image.payload.repository.ts:15-95`
- Modify: `src/features/image-generation/services/generate-image.service.ts:255-263`
- Test: `src/features/image-generation/services/generate-image.service.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ResolvedReference {
      data: Buffer
      /** `sourceImage`에 기록할 대상. 생성 이미지가 아닌 소스는 null. */
      generatedImageId: number | null
      /** 소스가 프롬프트를 함께 제공할 때만 있다. */
      prompt?: { effective: string; input: string }
  }
  export function resolveGeneratedImageReference(input: {
      generatedImageId: number
      profileId: number
      requestUrl: string
      user: unknown
  }): Promise<ResolvedReference | null>
  ```
  Task 3이 이 함수와 타입을 쓴다.

- [ ] **Step 1: 타입과 함수 이름을 바꾼다**

`generated-image.payload.repository.ts`의 `GeneratedImageSeed` 인터페이스(`:15-19`)를 지우고 대신 넣는다.

```ts
/**
 * 참조 생성에 쓸 이미지 한 장의 해석 결과 — 어느 소스에서 왔든 이 형태로 수렴한다.
 * 소스마다 소유권 검증이 다르므로 검증은 각 해석 함수가 소유한다.
 */
export interface ResolvedReference {
	data: Buffer
	/** `sourceImage`에 기록할 대상. 생성 이미지가 아닌 소스는 null. */
	generatedImageId: number | null
	/** 소스가 프롬프트를 함께 제공할 때만 있다. */
	prompt?: { effective: string; input: string }
}
```

`loadGeneratedImage`를 이름과 반환 형태만 바꾼다. 조회 `where`와 크기 검사는 **한 글자도 바꾸지 않는다** — 신뢰 경계다.

```ts
/**
 * 참조 생성에 쓸 published Generated Image를 사용자 권한으로 찾고 원본 파일을 읽는다.
 * Payload 조회와 저장 URL 다운로드 I/O는 이 repository가 소유한다.
 */
export async function resolveGeneratedImageReference(input: {
	generatedImageId: number
	profileId: number
	requestUrl: string
	user: unknown
}): Promise<ResolvedReference | null> {
```

함수 끝의 `return` 문만 아래로 바꾼다.

```ts
	return {
		data: (
			await validateRasterImage(
				Buffer.concat(chunks, size),
				response.headers.get('content-type'),
			)
		).data,
		generatedImageId: input.generatedImageId,
		prompt: { effective: image.effectivePrompt, input: image.inputPrompt },
	}
```

- [ ] **Step 2: 호출부를 고친다**

`generate-image.service.ts`의 import에서 `loadGeneratedImage`를 `resolveGeneratedImageReference`로 바꾸고, `adjustImageCamera` 안(`:255-263`)을 고친다.

```ts
	const seed = await resolveGeneratedImageReference({
		generatedImageId,
		profileId,
		requestUrl,
		user,
	})
	if (!seed?.prompt) throw new InvalidSeedImageError()
	const effectivePrompt = imageEffectivePromptSchema.safeParse(seed.prompt.effective)
	if (!effectivePrompt.success) throw new InvalidSeedImageError()
```

같은 함수 아래쪽 `storeProfileGeneration` 호출의 `inputPrompt`를 고친다.

```ts
		inputPrompt: seed.prompt.input,
```

- [ ] **Step 3: 서비스 테스트의 mock 이름을 맞춘다**

`generate-image.service.test.ts`의 `vi.hoisted` 블록에서 `loadGeneratedImage: vi.fn()`을 `resolveGeneratedImageReference: vi.fn()`으로 바꾸고, `vi.mock('@/features/image-generation/repositories/generated-image.payload.repository', ...)` 팩토리도 같은 이름으로 바꾼다. mock 반환값을 쓰는 모든 곳을 새 형태로 고친다.

```ts
		mocks.resolveGeneratedImageReference.mockResolvedValue({
			data: Buffer.from('seed'),
			generatedImageId: 8,
			prompt: { effective: '{"subject":"유조선"}', input: '유조선' },
		})
```

- [ ] **Step 4: 테스트를 돌린다**

Run: `pnpm vitest run src/features/image-generation/services/generate-image.service.test.ts`
Expected: PASS

- [ ] **Step 5: 타입·린트·전체 테스트**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run
```
Expected: 모두 PASS

- [ ] **Step 6: 커밋**

```bash
git add src/features/image-generation
git commit -m "refactor: 참조 이미지 조회를 소스 해석기 계약으로 낸다"
```

---

## Task 3: `generateImages`가 참조와 카메라를 받는다

여기서 두 유스케이스가 하나로 합쳐진다. 기존 `adjustImageCamera`는 아직 남겨 둔다(Task 7에서 삭제).

**Files:**
- Modify: `src/features/image-generation/services/generate-image.service.ts:155-205`
- Test: `src/features/image-generation/services/generate-image.service.test.ts`

**Interfaces:**
- Consumes: Task 2의 `resolveGeneratedImageReference`, `ResolvedReference`
- Produces:
  ```ts
  export function generateImages(input: {
      userInput: string
      profileId: number
      user: unknown
      count: number
      aspectRatio?: ImageAspectRatio
      imageSize?: ImageOutputSize
      /** 참조 이미지. 지금은 내 생성 결과만 소스다. */
      reference?: { generatedImageId: number; requestUrl: string }
      /** 카메라 컨트롤 값. feature가 열려 있을 때만 허용된다. */
      camera?: CameraControlInput
  }): Promise<GeneratedImages>
  ```
  Task 4(라우트)가 이 시그니처를 쓴다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`generate-image.service.test.ts`의 `describe('generateImages', ...)` 안에 네 개를 추가한다. `beforeEach`가 이미 세워 둔 mock을 쓰고, 참조가 필요한 케이스만 `resolveGeneratedImageReference`를 세운다.

```ts
	it('참조가 있으면 생성 플랜의 seedImage로 넘긴다', async () => {
		mocks.resolveGeneratedImageReference.mockResolvedValue({
			data: Buffer.from('seed'),
			generatedImageId: 8,
			prompt: { effective: '{"subject":"유조선"}', input: '유조선' },
		})

		await generateImages({
			userInput: '유조선',
			profileId: 5,
			user: { id: 1 },
			count: 1,
			reference: { generatedImageId: 8, requestUrl: 'http://localhost/api/generate-image' },
		})

		expect(mocks.generateBrandImages).toHaveBeenCalledWith(
			expect.objectContaining({ seedImage: expect.any(Uint8Array) }),
			expect.anything(),
		)
		expect(mocks.storeGeneratedImages).toHaveBeenCalledWith(
			expect.objectContaining({ sourceImage: 8 }),
		)
	})

	it('프롬프트를 비우고 참조만 보내면 참조의 프롬프트를 물려받는다', async () => {
		mocks.resolveGeneratedImageReference.mockResolvedValue({
			data: Buffer.from('seed'),
			generatedImageId: 8,
			prompt: { effective: '{"subject":"유조선"}', input: '유조선' },
		})

		await generateImages({
			userInput: '',
			profileId: 5,
			user: { id: 1 },
			count: 1,
			reference: { generatedImageId: 8, requestUrl: 'http://localhost/api/generate-image' },
		})

		// 사용자 입력이 없으므로 정규화 모델을 부르지 않는다.
		expect(mocks.normalizeImageProfilePrompt).not.toHaveBeenCalled()
		expect(mocks.storeGeneratedImages).toHaveBeenCalledWith(
			expect.objectContaining({
				effectivePrompt: '{"subject":"유조선"}',
				inputPrompt: '유조선',
			}),
		)
	})

	it('참조도 프롬프트도 없으면 컨트롤러 입력 오류로 거부한다', async () => {
		await expect(
			generateImages({ userInput: '', profileId: 5, user: { id: 1 }, count: 1 }),
		).rejects.toBeInstanceOf(InvalidImageControllerInputError)
	})

	it('카메라 값을 주면 프롬프트에 각도 키를 얹는다', async () => {
		mocks.resolveGeneratedImageReference.mockResolvedValue({
			data: Buffer.from('seed'),
			generatedImageId: 8,
			prompt: { effective: '{"subject":"유조선"}', input: '유조선' },
		})

		await generateImages({
			userInput: '',
			profileId: 5,
			user: { id: 1 },
			count: 1,
			camera: { azimuthDeg: 90, elevationDeg: 0 },
			reference: { generatedImageId: 8, requestUrl: 'http://localhost/api/generate-image' },
		})

		const [plan] = mocks.generateBrandImages.mock.calls[0]
		expect(JSON.parse(plan.prompt)).toMatchObject({
			subject: '유조선',
			camera: expect.stringContaining('right side view'),
		})
	})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm vitest run src/features/image-generation/services/generate-image.service.test.ts -t generateImages`
Expected: FAIL — `generateImages`가 `reference`·`camera`를 모르는 타입 오류 / 참조 없이도 통과.

- [ ] **Step 3: `generateImages`를 고친다**

`generate-image.service.ts:155`의 `generateImages`를 통째로 아래로 바꾼다.

```ts
/**
 * 유스케이스 경계: 선택한 published 프로파일로 이미지를 생성한다.
 * 참조 이미지는 선택 입력이다 — 참조가 없으면 프롬프트만으로, 있으면 그 이미지를 시드로 쓴다.
 * 프로파일 조회·참조 해석·모델 호출·생성 파일 저장 I/O는 각 repository가 소유한다.
 */
export async function generateImages({
	userInput,
	profileId,
	user,
	count,
	aspectRatio,
	imageSize,
	camera,
	reference,
}: {
	userInput: string
	profileId: number
	user: unknown
	count: number
	/** 템플릿 이미지 슬롯 박스에서 유도한 비율 오버라이드 — 없으면 프로파일 비율. */
	aspectRatio?: ImageAspectRatio
	/** 스튜디오 해상도 선택 오버라이드 — 없으면 프로파일 해상도. */
	imageSize?: ImageOutputSize
	/** 카메라 컨트롤 값 — feature가 열려 있을 때만 허용된다. */
	camera?: CameraControlInput
	/** 참조 이미지 — 지금은 내 생성 결과만 소스다. */
	reference?: { generatedImageId: number; requestUrl: string }
}): Promise<GeneratedImages> {
	const profile = await findPublishedImageProfile(user, profileId)
	if (!profile) throw new ImageProfileNotFoundError()
	const config = deriveImageStudioConfig(profile)

	const resolved = reference
		? await resolveGeneratedImageReference({ ...reference, profileId, user })
		: null
	if (reference && !resolved) throw new InvalidSeedImageError()

	// 프롬프트를 새로 썼으면 그것을 정규화해 쓰고, 비워 뒀으면 참조가 준 프롬프트를 물려받는다.
	const trimmed = userInput.trim()
	const effective = trimmed
		? resolveImageGenerationInput(config, { userInput, count, aspectRatio, imageSize })
		: { userInput: '', ...resolveImageGenerationOptions(config, { count, aspectRatio, imageSize }) }
	const inherited = resolved?.prompt
	if (!trimmed && !inherited) throw new InvalidImageControllerInputError('prompt')

	const composed = trimmed
		? JSON.stringify(
				(
					await normalizeImageProfilePrompt({
						profilePrompt: profile.profilePrompt,
						userPromptNormalization: profile.userPromptNormalization ?? [],
						userPrompt: effective.userInput,
					})
				).finalPrompt,
			)
		: (inherited as { effective: string }).effective

	const prompt = camera
		? composeCameraAdjustmentPrompt(assertFlatPrompt(composed), resolveCameraFeature(config, camera))
		: composed

	const plan = planImageGenerationFromProfile(profile, {
		prompt,
		count: effective.count,
		aspectRatio: effective.aspectRatio,
		imageSize: effective.imageSize,
		...(resolved ? { seedImage: resolved.data } : {}),
	})
	const generated = await runImageGeneration(plan, user)
	return storeProfileGeneration(generated, {
		inputPrompt: trimmed ? userInput : (inherited as { input: string }).input,
		// 저장 메타데이터의 비율·해상도는 실제 생성에 쓴 plan이 정본 — 오버라이드 시 프로파일 값과 다르다.
		profile: {
			id: profile.id,
			name: profile.name,
			aspectRatio: plan.aspectRatio,
			imageSize: plan.imageSize,
		},
		...(resolved?.generatedImageId ? { sourceImage: resolved.generatedImageId } : {}),
		user,
	})
}
```

- [ ] **Step 4: 헬퍼 두 개를 더한다**

같은 파일의 `resolveImageGenerationInput`(`:301`) 바로 위에 넣는다.

```ts
/** 카메라 값을 feature 허용 범위 안에서 해석한다. 신뢰 경계에서 다시 검증한다 — UI가 좁혀도 요청은 임의 각도를 보낼 수 있다. */
function resolveCameraFeature(
	config: ImageStudioConfig,
	camera: CameraControlInput,
): ResolvedCameraControl {
	const feature = getImageStudioFeature(config, 'camera-control')
	if (!feature) throw new InvalidImageControllerInputError('camera')
	const resolved = resolveCameraControl(camera)
	if (
		!feature.azimuths.includes(resolved.azimuth) ||
		!feature.elevations.includes(resolved.elevation)
	) {
		throw new InvalidImageControllerInputError('camera')
	}
	return resolved
}

/** 프롬프트 키를 얹으려면 flat JSON이어야 한다. 물려받은 프롬프트가 깨져 있으면 여기서 막는다. */
function assertFlatPrompt(prompt: string): string {
	const parsed = imageEffectivePromptSchema.safeParse(prompt)
	if (!parsed.success) throw new InvalidSeedImageError()
	return parsed.data
}
```

- [ ] **Step 5: 통과를 확인한다**

Run: `pnpm vitest run src/features/image-generation/services/generate-image.service.test.ts`
Expected: PASS (기존 `adjustImageCamera` 테스트도 그대로 통과해야 한다)

- [ ] **Step 6: 타입·린트·전체 테스트**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run
```
Expected: 모두 PASS

- [ ] **Step 7: 커밋**

```bash
git add src/features/image-generation
git commit -m "feat: 일반 생성이 참조 이미지와 카메라 값을 받는다"
```

---

## Task 4: 라우트가 참조와 카메라를 받는다

**Files:**
- Modify: `src/app/api/generate-image/route.ts:14-24, 41-43`
- Test: `src/app/api/generate-image/route.test.ts`

**Interfaces:**
- Consumes: Task 3의 `generateImages` 시그니처
- Produces: 요청 바디 계약 — Task 5(클라이언트)가 이 형태로 보낸다.
  ```ts
  {
      prompt?: string      // reference가 있으면 생략 가능
      count?: number
      profileId: number
      aspectRatio?: ImageAspectRatio
      imageSize?: ImageOutputSize
      reference?: { generatedImageId: number }
      camera?: { azimuthDeg: number; elevationDeg: number }
  }
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/app/api/generate-image/route.test.ts`에 추가한다. 이 파일의 기존 mock 설정(`authenticateRequest`, `isCrossOriginRequest`, `generateImages`)을 그대로 쓴다.

```ts
	it('참조와 카메라 값을 서비스로 넘긴다', async () => {
		const response = await POST(
			imageRequest({
				profileId: 5,
				reference: { generatedImageId: 8 },
				camera: { azimuthDeg: 45, elevationDeg: 20 },
			}),
		)

		expect(response.status).toBe(200)
		expect(mocks.generateImages).toHaveBeenCalledWith(
			expect.objectContaining({
				userInput: '',
				camera: { azimuthDeg: 45, elevationDeg: 20 },
				reference: {
					generatedImageId: 8,
					requestUrl: 'http://localhost/api/generate-image',
				},
			}),
		)
	})

	it('프롬프트도 참조도 없으면 400으로 거부한다', async () => {
		const response = await POST(imageRequest({ profileId: 5 }))

		expect(response.status).toBe(400)
		expect(mocks.generateImages).not.toHaveBeenCalled()
	})
```

> `imageRequest`는 이 테스트 파일이 이미 쓰는 요청 생성 헬퍼다. 이름이 다르면 그 파일의 헬퍼 이름을 그대로 쓰고, 없으면 아래를 파일 상단에 추가한다.
> ```ts
> function imageRequest(body: unknown) {
> 	return new Request('http://localhost/api/generate-image', {
> 		method: 'POST',
> 		headers: { 'Content-Type': 'application/json' },
> 		body: JSON.stringify(body),
> 	})
> }
> ```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm vitest run src/app/api/generate-image/route.test.ts`
Expected: FAIL — `prompt`가 필수라 두 요청 모두 400, 첫 테스트가 200을 못 받는다.

- [ ] **Step 3: 스키마를 고친다**

`route.ts`의 import에 카메라 스키마를 더한다.

```ts
import { cameraControlSchema } from '@/features/image-generation/camera-control'
```

`requestSchema`를 바꾼다.

```ts
const requestSchema = z
	.object({
		// 참조가 있으면 그 프롬프트를 물려받으므로 프롬프트는 선택이다.
		prompt: z.string().trim().max(IMAGE_PROMPT_MAX_LENGTH).default(''),
		count: z.number().int().min(1).max(IMAGE_BATCH_MAX).default(IMAGE_BATCH_DEFAULT),
		profileId: z.number().int().positive(),
		// 템플릿 이미지 슬롯 박스에서 유도한 비율 오버라이드 — 없으면 프로파일 비율로 생성한다.
		aspectRatio: z.enum(IMAGE_ASPECT_RATIOS).optional(),
		// 스튜디오 해상도 선택 오버라이드 — 없으면 프로파일 해상도로 생성한다.
		imageSize: z.enum(IMAGE_OUTPUT_SIZES).optional(),
		// 참조 이미지 — 지금은 내 생성 결과만 소스다.
		reference: z.strictObject({ generatedImageId: z.number().int().positive() }).optional(),
		camera: cameraControlSchema.optional(),
	})
	.strict()
	.refine(
		(value) => value.prompt.length > 0 || value.reference !== undefined,
		'prompt or reference is required.',
	)
```

- [ ] **Step 4: 핸들러를 고친다**

```ts
	const { prompt: userInput, count, profileId, aspectRatio, imageSize, camera, reference } =
		parsed.data

	return respondImageGeneration({
		run: () =>
			generateImages({
				userInput,
				profileId,
				user,
				count,
				aspectRatio,
				imageSize,
				...(camera ? { camera } : {}),
				...(reference
					? { reference: { ...reference, requestUrl: request.url } }
					: {}),
			}),
```

- [ ] **Step 5: 통과를 확인한다**

Run: `pnpm vitest run src/app/api/generate-image/route.test.ts`
Expected: PASS

- [ ] **Step 6: 타입·린트·전체 테스트**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run
```
Expected: 모두 PASS

- [ ] **Step 7: 커밋**

```bash
git add src/app/api/generate-image
git commit -m "feat: 이미지 생성 라우트가 참조와 카메라 값을 받는다"
```

---

## Task 5: 클라이언트 세션 모델

화면 상태를 "직전 응답"에서 "세션"으로 바꾼다. 이 태스크가 끝나면 참조 원본이 그리드에 남는다.

**Files:**
- Modify: `src/features/image-generation/services/generate-image.client.ts:20-28, 91-96`
- Modify: `src/features/image-generation/hooks/use-image-generation.ts`
- Modify: `src/features/image-generation/contexts/image-studio-context.ts:59-68`
- Modify: `src/features/image-generation/providers/image-studio-provider.tsx:112-182`
- Test: `src/features/image-generation/hooks/use-image-generation.test.ts`

**Interfaces:**
- Consumes: Task 4의 요청 바디 계약
- Produces:
  ```ts
  // generate-image.client.ts
  export interface ImageGenerationRequest {
      count: number
      prompt: string
      profileId: number
      aspectRatio?: ImageAspectRatio
      imageSize?: ImageOutputSize
      reference?: { generatedImageId: number }
      camera?: CameraControlInput
  }

  // contexts/image-studio-context.ts
  export type ImageResultImage = {
      src: string
      generatedImageId: number | null
      profileId: number | null
  }
  results: {
      /** 그리드가 그리는 순서 그대로 — 참조가 있으면 0번이 참조다. */
      items: readonly ImageResultImage[]
      /** items에서 참조가 차지하는 자리. 참조가 없으면 null. */
      referenceIndex: number | null
      selected: number | null
      select: (index: number | null) => void
      color: ImageColorAdjustment | null
      requested: number
      output: { aspectRatio: ImageAspectRatio; imageSize: ImageOutputSize } | null
  }
  ```
  Task 6(UI)이 이 계약을 소비한다.

- [ ] **Step 1: 클라이언트 요청 타입을 넓힌다**

`generate-image.client.ts`의 `ImageGenerationRequest`에 두 줄을 더한다.

```ts
export interface ImageGenerationRequest {
	count: number
	prompt: string
	profileId: number
	/** 템플릿 이미지 슬롯 박스에서 유도한 비율 오버라이드 — 없으면 프로파일 비율로 생성한다. */
	aspectRatio?: ImageAspectRatio
	/** 스튜디오 해상도 선택 오버라이드 — 없으면 프로파일 해상도로 생성한다. */
	imageSize?: ImageOutputSize
	/** 참조 이미지 — 없으면 프롬프트만으로 생성한다. */
	reference?: { generatedImageId: number }
	/** 카메라 컨트롤 값 — 프로파일이 카메라를 열었을 때만 보낸다. */
	camera?: CameraControlInput
}
```

- [ ] **Step 2: 실패하는 훅 테스트를 쓴다**

`use-image-generation.test.ts`의 기존 두 테스트를 지우고 아래로 바꾼다.

```ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useImageGeneration } from '@/features/image-generation/hooks/use-image-generation'

const RESPONSE = {
	aspectRatio: '16:9' as const,
	imageSize: '1K' as const,
	images: ['/file/a.png', '/file/b.png'],
	generatedImages: [
		{ collection: 'generated-images', createdAt: '', id: 1, url: '/file/a.png' },
		{ collection: 'generated-images', createdAt: '', id: 2, url: '/file/b.png' },
	],
	model: 'gpt-image-2',
	profileId: 5,
	prompt: '{"subject":"유조선"}',
}

function mockResponse(body: unknown, status = 200) {
	return vi
		.spyOn(globalThis, 'fetch')
		.mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

describe('useImageGeneration', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('참조 없는 생성은 참조가 비어 있는 세션을 만든다', async () => {
		mockResponse(RESPONSE)
		const { result } = renderHook(() => useImageGeneration())

		await act(() =>
			result.current.generate({ count: 2, prompt: '유조선', profileId: 5 }),
		)

		expect(result.current.session?.reference).toBeNull()
		expect(result.current.session?.images).toHaveLength(2)
		expect(result.current.selected).toBe(0)
	})

	it('참조 생성은 참조를 세션에 남긴다', async () => {
		mockResponse(RESPONSE)
		const { result } = renderHook(() => useImageGeneration())
		await act(() =>
			result.current.generate({ count: 2, prompt: '유조선', profileId: 5 }),
		)

		const reference = result.current.session?.images[1]
		mockResponse({ ...RESPONSE, images: ['/file/c.png'], generatedImages: [] })
		await act(() =>
			result.current.generate(
				{
					count: 1,
					prompt: '',
					profileId: 5,
					camera: { azimuthDeg: 90, elevationDeg: 0 },
					reference: { generatedImageId: 2 },
				},
				reference,
			),
		)

		expect(result.current.session?.reference).toEqual(reference)
		expect(result.current.session?.images).toHaveLength(1)
	})

	it('서버의 안전한 오류 메시지를 화면 상태로 보존한다', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined)
		mockResponse({ message: 'Invalid seed image.' }, 400)
		const { result } = renderHook(() => useImageGeneration())

		await act(() =>
			result.current.generate({ count: 1, prompt: '유조선', profileId: 5 }),
		)

		expect(result.current.error).toBe('Invalid seed image.')
	})
})
```

- [ ] **Step 3: 실패를 확인한다**

Run: `pnpm vitest run src/features/image-generation/hooks/use-image-generation.test.ts`
Expected: FAIL — `result.current.session`이 `undefined`.

- [ ] **Step 4: 먼저 컨텍스트에 공용 타입을 낸다**

훅이 이 타입을 import하므로 컨텍스트를 먼저 고친다. `contexts/image-studio-context.ts`에 추가한다.

```ts
/** 그리드 카드 한 장. 참조와 결과가 같은 형태라 그리드가 둘을 구분해 다루지 않아도 된다. */
export type ImageResultImage = {
	src: string
	generatedImageId: number | null
	profileId: number | null
}
```

- [ ] **Step 5: 훅을 세션 소유자로 바꾼다**

`use-image-generation.ts`를 통째로 바꾼다.

```ts
'use client'

import { useCallback, useState } from 'react'
import type { ImageResultImage } from '../contexts/image-studio-context'
import type { ImageAspectRatio, ImageOutputSize } from '../image-size'
import {
	type ImageGenerationRequest,
	requestImageGeneration,
} from '../services/generate-image.client'

const GENERATION_ERROR_MESSAGE = '이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'

export type ImageGenerationSession = {
	/** 이 요청이 만든 것. */
	images: readonly ImageResultImage[]
	/** 무엇을 보고 만들었나 — null이면 프롬프트에서 바로 나온 세션. */
	reference: ImageResultImage | null
	/** 저장 크기 계산에 쓰는 이 요청의 출력 조건 — 응답이 정본이다. */
	output: { aspectRatio: ImageAspectRatio; imageSize: ImageOutputSize }
}

export function useImageGeneration() {
	const [session, setSession] = useState<ImageGenerationSession | null>(null)
	const [requested, setRequested] = useState(0)
	const [selected, setSelected] = useState<number | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	/**
	 * 생성 요청 하나 = 세션 하나. 참조를 함께 주면 그 이미지가 세션에 남아 그리드 0번이 된다.
	 * 참조 고정은 호출자(Provider)가 `session.reference ?? selected`로 정한다.
	 */
	const generate = useCallback(
		async (input: ImageGenerationRequest, reference: ImageResultImage | null = null) => {
			if (loading) return

			setLoading(true)
			setError(null)
			setSelected(null)
			setRequested(input.count)

			try {
				const next = await requestImageGeneration(input)
				const images = next.images.map((src, index) => ({
					src,
					generatedImageId: next.generatedImages?.[index]?.id ?? null,
					profileId: next.profileId ?? null,
				}))
				setSession({
					images,
					reference,
					output: { aspectRatio: next.aspectRatio, imageSize: next.imageSize },
				})
				// 결과가 오면 첫 결과를 고른다 — 선택이 비어 있으면 최하단 저장 CTA가 켜지지 않는다.
				setSelected(images.length > 0 ? (reference ? 1 : 0) : null)
			} catch (requestError) {
				console.error(requestError)
				setError(
					requestError instanceof Error
						? requestError.message
						: GENERATION_ERROR_MESSAGE,
				)
			} finally {
				setLoading(false)
			}
		},
		[loading],
	)

	return { error, generate, loading, requested, selected, session, setSelected }
}
```

- [ ] **Step 6: 통과를 확인한다**

Run: `pnpm vitest run src/features/image-generation/hooks/use-image-generation.test.ts`
Expected: PASS

- [ ] **Step 7: 컨텍스트의 `results` 계약을 바꾼다**

`contexts/image-studio-context.ts`에서 `ImageGenerationResult` import를 지우고 `results` 블록을 바꾼다.

```ts
	results: {
		/** 그리드가 그리는 순서 그대로 — 참조가 있으면 0번이 참조다. */
		items: readonly ImageResultImage[]
		/** items에서 참조가 차지하는 자리. 참조가 없으면 null. */
		referenceIndex: number | null
		/** 결과와 현재 프로파일이 같을 때만 적용할 색. 다른 프로파일의 기능은 소급하지 않는다. */
		color: ImageColorAdjustment | null
		/** 요청한 장수 — 생성 중 자리표시자 개수. */
		requested: number
		selected: number | null
		select: (index: number | null) => void
		/** 저장 크기 계산에 쓰는 직전 요청의 출력 조건. */
		output: { aspectRatio: ImageAspectRatio; imageSize: ImageOutputSize } | null
	}
```

`camera` 블록의 `regenerate`는 그대로 두고 `seedImage` 주석만 "참조"로 바꾼다.

- [ ] **Step 8: Provider를 고친다**

`image-studio-provider.tsx`에서 `useImageGeneration()` 구조분해를 바꾼다.

```ts
	const { error, generate, loading, requested, selected, session, setSelected } =
		useImageGeneration()
```

`resultColor` 파생(`:88`)을 바꾼다.

```ts
	const items = useMemo(
		() =>
			session
				? [...(session.reference ? [session.reference] : []), ...session.images]
				: [],
		[session],
	)
	const referenceIndex = session?.reference ? 0 : null
	const resultColor = items[0]?.profileId === config.id ? colorValue : null
```

`cameraSeed` 파생(`:112-125`)을 바꾼다. **참조 고정이 여기 한 줄이다.**

```ts
	// 참조는 한 번 정해지면 고정된다 — 조정본을 다시 참조로 삼지 않아 세대 누적 열화가 없다.
	const referenceImage = useMemo(() => {
		const pinned = session?.reference
		if (pinned) return pinned
		const picked = selected === null ? undefined : items[selected]
		return picked?.generatedImageId && picked.profileId === config.id ? picked : null
	}, [config.id, items, selected, session])
	const cameraSeed = supportsCamera ? referenceImage : null
```

`generation.run`을 바꾼다.

```ts
				run: () => {
					if (!canRun) return
					void generate({
						aspectRatio: ratioValue as ImageAspectRatio,
						count: Number(batchValue),
						imageSize: resolutionValue as ImageOutputSize,
						profileId: config.id,
						prompt,
					})
				},
```

`camera.regenerate`를 통합 경로로 바꾼다.

```ts
				regenerate: () => {
					if (!supportsCamera || !cameraSeed?.generatedImageId) return
					void generate(
						{
							camera: angles,
							count: 1,
							imageSize: resolutionValue as ImageOutputSize,
							profileId: config.id,
							// 참조가 프롬프트를 물려주므로 비워 보낸다.
							prompt: '',
							reference: { generatedImageId: cameraSeed.generatedImageId },
						},
						cameraSeed,
					)
				},
```

`camera.seedImage`와 `results`를 바꾼다.

```ts
				seedImage: cameraSeed?.src ?? null,
```

```ts
			results: {
				items,
				referenceIndex,
				color: resultColor,
				requested,
				selected,
				select: setSelected,
				output: session?.output ?? null,
			},
```

`useMemo` 의존성 배열에서 `result`·`adjustCamera`를 빼고 `items`·`referenceIndex`·`session`·`referenceImage`를 넣는다.

- [ ] **Step 9: 타입·린트**

Run: `pnpm typecheck`
Expected: `image-canvas.tsx`·`image-generator.tsx`가 `results.result`를 못 찾는 오류만 남는다 — Task 6에서 고친다. 다른 오류가 있으면 여기서 고친다.

- [ ] **Step 10: 커밋**

```bash
git add src/features/image-generation
git commit -m "refactor: 이미지 스튜디오 결과를 세션 모델로 바꾼다"
```

> 이 커밋 시점에는 UI가 아직 컴파일되지 않는다. Task 6과 함께 리뷰한다.

---

## Task 6: 참조 카드와 두 테두리

**Files:**
- Modify: `src/components/studio/image/image-generation-results.tsx:14-85`
- Modify: `src/components/studio/image/image-canvas.tsx:24-45`
- Modify: `src/components/studio/image/image-generator.tsx:41-56`
- Test: `src/components/studio/image/image-generation-results.test.ts`

**Interfaces:**
- Consumes: Task 5의 `results` 계약(`items`, `referenceIndex`, `output`)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`image-generation-results.test.ts`의 `props()` 헬퍼를 새 계약으로 바꾼다.

```ts
function props(overrides: { color?: { line: string; background?: string } | null } = {}) {
	return {
		aspectRatio: '16:9' as const,
		color: overrides.color ?? null,
		items: [
			{ src: SRC, generatedImageId: 1, profileId: 5 },
			{ src: '/api/generated-images/file/generated-2.png', generatedImageId: 2, profileId: 5 },
		],
		loading: false,
		onSelect: vi.fn(),
		referenceIndex: null as number | null,
		requested: 2,
		selected: null as number | null,
	}
}
```

같은 파일에 참조 카드 테스트를 추가한다.

```ts
	it('참조 카드에 참조 이름을 붙이고 결과와 구분한다', () => {
		const base = { ...props(), referenceIndex: 0, selected: 1 }
		render(createElement(ImageGenerationResults, base))

		expect(screen.getByRole('button', { name: '참조 원본' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '생성 결과 1' })).toBeInTheDocument()
		// 참조는 선택 대상이 아니라 기준이므로 눌린 상태가 아니다.
		expect(screen.getByRole('button', { name: '참조 원본' })).toHaveAttribute(
			'aria-pressed',
			'false',
		)
	})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm vitest run src/components/studio/image/image-generation-results.test.ts`
Expected: FAIL — 컴포넌트가 `result` prop을 기대한다.

- [ ] **Step 3: 결과 그리드를 고친다**

`image-generation-results.tsx`의 props 타입과 본문 상단을 바꾼다.

```ts
type ImageGenerationResultsProps = {
	aspectRatio: ImageAspectRatio
	/** 색 조정 값 — 있으면 결과 전부에 얹는다(한 장만 물들이지 않는다). null이면 원본만 보인다. */
	color: ImageColorAdjustment | null
	/** 그리드가 그리는 순서 그대로 — 참조가 있으면 referenceIndex 자리가 참조다. */
	items: readonly ImageResultImage[]
	loading: boolean
	onSelect: (index: number) => void
	referenceIndex: number | null
	requested: number
	selected: number | null
}

export function ImageGenerationResults({
	aspectRatio,
	color,
	items,
	loading,
	onSelect,
	referenceIndex,
	requested,
	selected,
}: ImageGenerationResultsProps) {
```

`ImageGenerationResult` import를 지우고 `ImageResultImage`를 `@/features/image-generation/contexts/image-studio-context`에서 가져온다.

`images` 파생과 조건을 바꾼다.

```ts
			{!loading && items.length > 0 && (
```

`items.length < requested` 안내는 참조를 세지 않아야 한다.

```ts
					{items.length - (referenceIndex === null ? 0 : 1) < requested && (
						<Typography size="sm" tone="muted">
							요청 {requested}장 중{' '}
							{items.length - (referenceIndex === null ? 0 : 1)}장 생성됨 (일부는
							무료 서버 지연으로 실패)
						</Typography>
					)}
```

카드 반복을 바꾼다. 참조는 검정 테두리(`border-foreground`), 선택은 강조 테두리(`border-primary`)다.

```ts
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{items.map((item, index) => {
							const isReference = index === referenceIndex
							const label = isReference
								? '참조 원본'
								: `생성 결과 ${index - (referenceIndex === null ? -1 : 0)}`

							return (
								<div key={item.src} className="flex flex-col gap-1">
									<button
										type="button"
										onClick={() => onSelect(index)}
										aria-pressed={selected === index}
										className={cn(
											'overflow-hidden rounded-md border-2 transition-colors',
											selected === index
												? 'border-primary'
												: isReference
													? 'border-foreground'
													: 'border-border hover:border-ring',
										)}
									>
										<ResultImage
											aspectRatio={aspectRatio}
											color={color}
											label={label}
											src={item.src}
										/>
									</button>
								</div>
							)
						})}
					</div>
```

`ResultImage` 호출이 `result.aspectRatio` 대신 prop `aspectRatio`를 쓰게 된 것을 확인한다.

- [ ] **Step 4: 통과를 확인한다**

Run: `pnpm vitest run src/components/studio/image/image-generation-results.test.ts`
Expected: PASS

- [ ] **Step 5: 캔버스를 고친다**

`image-canvas.tsx`의 `ImageCanvas`를 바꾼다.

```ts
export function ImageCanvas() {
	const { prompt, generation, results } = useImageStudio()

	if (!generation.busy && results.items.length === 0) {
		return <EmptyCanvas onSelectExample={prompt.setValue} />
	}

	return (
		<ImageGenerationResults
			aspectRatio={
				generation.busy
					? generation.ratio
					: (results.output?.aspectRatio ?? generation.ratio)
			}
			color={results.color}
			items={results.items}
			loading={generation.busy}
			onSelect={results.select}
			referenceIndex={results.referenceIndex}
			requested={results.requested}
			selected={results.selected}
		/>
	)
}
```

- [ ] **Step 6: 저장 대상을 고친다**

`image-generator.tsx`의 `ImageWorkspace`를 바꾼다.

```ts
function ImageWorkspace() {
	const { profiles, results } = useImageStudio()
	const items = results.items
	const resultConfig = profiles.options.find(
		(candidate) => candidate.id === items[0]?.profileId,
	)
	const exportSize = results.output
		? toOpenAIImageSize(results.output.aspectRatio, results.output.imageSize)
				.split('x')
				.map(Number)
		: null
	const download = useImageExport({
		artifacts:
			items.length > 0
				? createImageArtifacts({
						images: items.map((item) => item.src),
						color: results.color,
					})
				: null,
		capability: resultConfig?.output ?? { formats: [], original: false },
		selected: results.selected,
		size: exportSize ? { width: exportSize[0], height: exportSize[1] } : null,
	})
```

- [ ] **Step 7: 스튜디오 테스트를 맞춘다**

Run: `pnpm vitest run src/features/image-generation/hooks/use-image-studio.test.tsx src/components/studio/image/image-generator.test.ts`
Expected: FAIL — 두 파일 모두 `useImageGeneration` mock이 `result`를 돌려준다. mock 반환을 Task 5의 훅 반환 형태(`{ error, generate, loading, requested, selected, session, setSelected }`)로 바꾸고, `session`은 `{ images: [...], reference: null, output: { aspectRatio: '16:9', imageSize: '1K' } }` 형태로 준다. 단언에서 `results.result`를 쓰는 곳은 `results.items`로 바꾼다.

- [ ] **Step 8: 다시 돌린다**

Run: `pnpm vitest run src/features/image-generation src/components/studio/image`
Expected: PASS

- [ ] **Step 9: 타입·린트·전체 테스트**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run
```
Expected: 모두 PASS

- [ ] **Step 10: 커밋**

```bash
git add src/components/studio/image src/features/image-generation
git commit -m "feat: 참조 원본을 결과 그리드에 남긴다"
```

---

## Task 7: 옛 카메라 경로 삭제

새 경로가 동작하는 것을 확인한 뒤에만 실행한다.

**Files:**
- Delete: `src/app/api/generate-image/camera-adjustment/route.ts`
- Delete: `src/app/api/generate-image/camera-adjustment/route.test.ts`
- Modify: `src/features/image-generation/services/generate-image.service.ts:233-299` (`adjustImageCamera` 삭제)
- Modify: `src/features/image-generation/camera-control.ts:4, 21-32`
- Modify: `src/features/image-generation/services/generate-image.client.ts:84-89, 105-113`
- Test: `src/features/image-generation/services/generate-image.service.test.ts`, `src/features/image-generation/camera-control.test.ts`

- [ ] **Step 1: 라우트를 지운다**

```bash
git rm -r src/app/api/generate-image/camera-adjustment
```

- [ ] **Step 2: 서비스에서 `adjustImageCamera`와 `CameraAdjustedImages`를 지운다**

`generate-image.service.ts`에서 `interface CameraAdjustedImages`(`:95-100`)와 `export async function adjustImageCamera`(`:233-299`) 블록을 통째로 지운다. 그 결과 쓰이지 않게 되는 import(`CameraControlInput`은 `generateImages`가 계속 쓰므로 남고, `ResolvedCameraControl`은 `resolveCameraFeature` 반환 타입으로 계속 쓴다)만 정리한다.

- [ ] **Step 3: 카메라 요청 스키마를 지운다**

`camera-control.ts`에서 아래를 지운다.

- `MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES` 상수(`:4`)
- `cameraAdjustmentRequestSchema`(`:21-28`)
- `CameraAdjustmentRequest` 타입(`:32`)
- 그 결과 쓰이지 않게 되는 `IMAGE_BATCH_MAX` import

`cameraControlSchema`, `imageEffectivePromptSchema`, 각도 표, `resolveCameraControl`, `composeCameraAdjustmentPrompt`는 **남긴다**.

- [ ] **Step 4: 클라이언트 서비스에서 카메라 전용 계약을 지운다**

`generate-image.client.ts`에서 `CameraAdjustmentResult` 인터페이스와 `requestCameraAdjustment` 함수를 지운다. import에서 `CameraAdjustmentRequest`를 지우고 `CameraControlInput`은 `ImageGenerationRequest`가 쓰므로 남긴다. `postImageGeneration`의 인자 유니온에서 `CameraAdjustmentRequest`를 뺀다.

- [ ] **Step 5: 남은 테스트를 정리한다**

`generate-image.service.test.ts`에서 `adjustImageCamera` import와 그 `describe` 블록을 지운다. Task 3이 추가한 `generateImages` 참조·카메라 테스트가 같은 동작을 이미 덮는다.

`camera-control.test.ts`에서 `MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES`·`cameraAdjustmentRequestSchema`를 검증하는 케이스를 지운다. 각도 해석과 프롬프트 합성 케이스는 남긴다.

- [ ] **Step 6: 죽은 참조가 없는지 확인한다**

```bash
rg -n 'adjustImageCamera|requestCameraAdjustment|cameraAdjustmentRequestSchema|MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES|camera-adjustment' src
```
Expected: 결과 없음

- [ ] **Step 7: 타입·린트·전체 테스트**

```bash
pnpm typecheck && pnpm lint && pnpm vitest run
```
Expected: 모두 PASS

- [ ] **Step 8: 커밋**

```bash
git add -A src
git commit -m "refactor: 카메라 전용 생성 경로를 제거한다"
```

---

## 마무리 확인

- [ ] **마이그레이션을 빈 DB에서 검증한다**

새 Postgres 데이터베이스를 만들고 그 `DATABASE_URL`로 실행한다. push로 갱신한 로컬 개발 DB에 돌리지 않는다.

```bash
PAYLOAD_DB_PUSH=false DATABASE_URL=<새 DB> pnpm payload migrate
```
Expected: `generated_images`에 `source_image_id` 칼럼이 생기고 오류가 없다.

- [ ] **스펙 §8의 화면 시나리오를 손으로 확인한다**

로그인 상태에서 `/studio/generate/image`를 열고 카메라 기능이 켜진 프로파일로:

1. 프롬프트로 여러 장 생성 → 그리드에 결과만 보인다
2. 한 장 선택 → 카메라 섹션이 열린다
3. 각도 조정 후 생성 → 그리드가 `[참조 원본, 조정본]` 두 장이고 참조에 검정 테두리가 있다
4. 각도를 바꿔 다시 생성 → 참조가 여전히 3번의 그 원본이다
5. 새 프롬프트로 생성 → 참조가 사라지고 결과만 남는다

- [ ] **Admin에서 참조 기록을 확인한다**

Payload Admin의 `생성 이미지`에서 3번·4번이 만든 문서의 `sourceImage`가 1번 원본을 가리키고, 1번·5번 문서는 비어 있다.

- [ ] **PR을 연다**

```bash
git push -u origin feat/image-reference-generation
gh pr create --base stage --title "feat: 참조 이미지 생성으로 원본 유지"
```

본문에는 실행한 명령을 그대로 적고, 스키마 변경이 포함되므로 마이그레이션을 어느 DB에 적용했고 어디엔 아직 안 했는지 명시한다.
