# 참조 이미지 생성 — 원본 유지 설계

작성일: 2026-08-18
대상: 이미지 스튜디오(`/studio/generate/image`)
디자인 SSOT: Figma HD_LBS_UI `4zXBMnMCPay346ohMBrMFA`, `16:7258` (Image - Generated & Select for Camera Control)

## 1. 문제

카메라 컨트롤로 시점을 다시 잡으면 조정 결과가 이전 결과 그리드를 통째로 대체한다. 참조한 원본이 화면에서 사라져 조정 전후를 나란히 볼 수 없다. Figma `16:7258`은 원본과 조정본 두 장을 함께 그린다.

원인은 렌더가 아니라 두 가지 계약 선택이다.

### 1.1 응답 DTO를 세션 상태로 쓰고 있다

`ImageStudioValue.results.result`의 타입은 `ImageGenerationResult` — `/api/generate-image` 응답 타입 그 자체다. 응답은 본질적으로 "직전 요청 한 번"이므로 `useImageGeneration.run()`이 `setResult(next)`로 통째로 교체하는 것은 이 타입 선택의 논리적 귀결이다. 원본이 사라지는 것은 버그가 아니라 전송 계약의 성질이 세션 의미론으로 새어 든 결과다.

### 1.2 `selected` 하나가 두 역할을 겸한다

| 위치 | `selected`의 의미 |
| --- | --- |
| `image-studio-provider.tsx:114-125` | 카메라 조정 대상(시드) |
| `image-generator.tsx:53` | 저장 대상 |

Figma는 이 둘을 다른 테두리로 나눠 그린다. 디자인이 이미 별개 개념으로 선언해 둔 것을 코드만 하나로 겸하고 있다.

### 1.3 참조 사실이 저장되지 않는다

`adjustImageCamera`는 요청에서 `generatedImageId`(시드)를 받아 소유자·프로파일을 검증까지 하지만(`generate-image.service.ts:255-261`), `storeProfileGeneration`에 넘기지 않는다. DB에는 원본과 조정본이 아무 관계 없는 낱장 두 개로 남는다.

## 2. 결정

1. **참조 원본을 고정한다.** 카메라를 여러 번 조정해도 시드는 언제나 최초 원본이다. 세대 누적 열화가 없다.
2. **생성마다 새 세션을 만든다.** 세션은 `images`와 `reference` 두 필드를 갖고, 참조 여부만으로 원본 유지가 결정된다.
3. **참조는 이미지 한 장이다.** 세션 참조(이전 배치 전체 복원)는 만들지 않는다.
4. **`generated-images`에 `sourceImage` 관계를 추가한다.** 기능 종류(카메라 조정인지 여부)는 기록하지 않는다.
5. **요청 표면은 그대로 둔다.** `/api/generate-image/camera-adjustment`와 `cameraAdjustmentRequestSchema`는 변경하지 않는다.

## 3. 세션 모델

```ts
type ImageResultImage = {
	src: string
	generatedImageId: number | null
	profileId: number | null
}

type ImageGenerationSession = {
	/** 이 요청이 만든 것 — 프롬프트 생성은 N장, 카메라 조정은 1장. */
	images: readonly ImageResultImage[]
	/** 무엇을 보고 만들었나 — null이면 프롬프트에서 바로 나온 세션. */
	reference: ImageResultImage | null
}
```

전이는 둘뿐이다.

```ts
// 프롬프트 생성 — 참조 없는 새 세션
setSession({ images: response.images, reference: null })

// 카메라 조정 — 참조를 물려받는다. 이 한 줄이 "원본 고정"이다.
const reference = session.reference ?? selectedImage
setSession({ images: [adjusted], reference })
```

그리드는 `[reference, ...images]`를 그리고, 참조 카드의 테두리는 `reference`인지 여부에서 파생된다.

### 3.1 참조를 추론하지 않는 이유

대안으로 아이템에 `role: 'generated' | 'camera-adjusted'` 태그를 달고 "조정 후 `generated`는 정확히 하나"라는 불변식에서 시드를 파생하는 방법을 검토했다. 동작하지만 시드 규칙이 목록 구성에 암묵적으로 의존하므로, 누적을 켜거나 다른 출처의 아이템이 하나 들어오는 순간 규칙의 의미가 조용히 바뀐다. 참조를 추론하지 않고 그대로 들고 있으면 유지할 불변식이 없다. 서버가 이미 참조 하나(`generatedImageId`)를 받는 구조이므로 클라이언트 모델이 요청 계약과 같은 모양이 된다는 이점도 있다.

### 3.2 누적은 지금 켜지 않는다

세션이 매 요청 교체되므로 화면에는 참조 1장 + 최신 결과만 남는다. Figma `16:7258`이 요구하는 상태이며, 이전 조정본은 `generated-images`에 남으므로 소실이 아니다. 여러 조정본을 비교해야 할 때는 세션을 배열로 쌓으면 되고, 그때도 `reference` 규칙은 그대로 성립한다.

## 4. 스키마

`generated-images`에 필드 하나를 더한다.

```ts
{
	name: 'sourceImage',
	type: 'relationship',
	relationTo: 'generated-images',
	access: { read: managerFieldRead },
	admin: { description: '이 이미지를 만들 때 참조한 원본 생성 이미지입니다.' },
}
```

- nullable이다. 비어 있으면 프롬프트에서 바로 나온 이미지다.
- 기존 필드와 같이 `managerFieldRead`를 따른다.
- 마이그레이션은 ADD COLUMN 한 건이다.

### 4.1 기능 종류를 기록하지 않는 이유

`derivationType: 'camera-adjustment'` 같은 enum이나 `cameraAzimuth` / `cameraElevation` 칼럼은 만들지 않는다. 저장하는 사실은 "이 이미지는 저 이미지를 참조해 만들어졌다" 하나이고, 참조 생성은 카메라 조정보다 일반적인 방식이다. 색 변형·배경 교체 같은 참조 생성 기능이 뒤에 붙어도 스키마와 세션 모델은 그대로여야 한다.

각도는 이미 저장돼 있기도 하다. `composeCameraAdjustmentPrompt`(`camera-control.ts:105-116`)가 해석된 각도를 flat 프롬프트 JSON의 `camera` 키로 넣고, 그 결과가 `effectivePrompt`에 그대로 들어간다. 전용 칼럼은 같은 사실을 두 곳에 적는 일이 된다.

### 4.2 이 필드가 지금 필요한 이유

화면 동작에는 필요 없다. 그러나 `generated-images`는 스스로 "생성 결과와 생성 당시 **입력**·실행 조건을 보관한다"고 선언한다(`GeneratedImages.ts:35`). 참조 이미지는 프롬프트와 나란한 입력이며, `inputPrompt`·`effectivePrompt`·`model`·`aspectRatio`를 모두 남기면서 참조만 빠져 있는 것은 설계 의도라기보다 누락이다. 또한 나중에 추가하더라도 그 이전에 만들어진 이미지의 출처는 복원할 수 없다.

## 5. 범위 밖

- `/api/generate-image/camera-adjustment` 라우트와 요청 스키마 — 카메라 조정은 각도라는 자기 입력과 자기 검증(`cameraFeature.azimuths.includes(...)`)을 가진 구체적 기능이다. 일반화 대상은 결과가 남는 형태이지 요청 표면이 아니다. 지금 범용 라우트를 만들면 소비자 하나짜리 추상이 된다.
- `AssetGenerationSession`(`docs/04-domain-model.md`의 계획 모델) — 사용량 추적이 필요해질 때의 별도 판단이다.
- 세션 영속화 — 새로고침하면 세션이 사라지는 현재 동작을 유지한다.
- 색 조정 계약 — `results.color` 파생 규칙은 그대로 둔다.

## 6. 영향 범위

`useImageGeneration`의 소비자는 `ImageStudioProvider` 하나뿐이므로 클라이언트 변경이 갇힌다.

| 파일 | 변경 |
| --- | --- |
| `collections/GeneratedImages.ts` | `sourceImage` 필드 추가 |
| `migrations/` | ADD COLUMN 마이그레이션 + drizzle 스냅샷 |
| `services/generate-image.service.ts` | `adjustImageCamera`가 시드 id를 `storeProfileGeneration`에 전달 |
| `hooks/use-image-generation.ts` | `result` → `session` 소유, §3의 두 전이 |
| `providers/image-studio-provider.tsx` | `cameraSeed`(114-125) → `session.reference ?? selected` 파생 |
| `contexts/image-studio-context.ts` | `results` 계약을 세션 모델로 교체 |
| `components/studio/image/image-canvas.tsx`, `image-generation-results.tsx` | `[reference, ...images]` 렌더, 참조 테두리 |
| `components/studio/image/image-generator.tsx` | 저장 대상 파생 |

별도 도메인 파일은 만들지 않는다. 전이가 두 줄이라 훅 안에 두는 편이 읽기 쉽다.

## 7. 검증

- 카메라 조정 후 그리드에 참조 원본과 조정본이 함께 남는다.
- 카메라 조정을 두 번 해도 두 번째 요청의 `generatedImageId`가 최초 원본과 같다.
- 프롬프트 생성을 새로 실행하면 참조가 사라지고 배치 결과만 남는다.
- 조정 결과 문서의 `sourceImage`가 시드 문서를 가리킨다.
- 프로파일에서 카메라 기능을 끄면 조정 경로가 400으로 거부된다(기존 동작 유지).
- `pnpm typecheck`, `pnpm vitest run`, `pnpm lint`를 Node 22에서 실행한다.
- 마이그레이션은 push로 갱신한 로컬 DB가 아니라 `PAYLOAD_DB_PUSH=false`인 새 DB에서 검증한다.
