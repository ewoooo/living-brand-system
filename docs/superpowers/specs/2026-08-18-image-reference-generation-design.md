# 참조 이미지 생성 — 원본 유지 설계

작성일: 2026-08-18
대상: 이미지 스튜디오(`/studio/generate/image`)
디자인 SSOT: Figma HD_LBS_UI `4zXBMnMCPay346ohMBrMFA`, `16:7258` (Image - Generated & Select for Camera Control)

## 1. 문제

카메라 컨트롤로 시점을 다시 잡으면 조정 결과가 이전 결과 그리드를 통째로 대체한다. 참조한 원본이 화면에서 사라져 조정 전후를 나란히 볼 수 없다. Figma `16:7258`은 원본과 조정본 두 장을 함께 그린다.

원인은 렌더가 아니라 네 가지 계약 선택이다.

### 1.1 응답 DTO를 세션 상태로 쓰고 있다

`ImageStudioValue.results.result`의 타입은 `ImageGenerationResult` — `/api/generate-image` 응답 타입 그 자체다. 응답은 본질적으로 "직전 요청 한 번"이므로 `useImageGeneration.run()`이 `setResult(next)`로 통째로 교체하는 것은 이 타입 선택의 논리적 귀결이다. 원본이 사라지는 것은 버그가 아니라 전송 계약의 성질이 세션 의미론으로 새어 든 결과다.

### 1.2 `selected` 하나가 두 역할을 겸한다

| 위치 | `selected`의 의미 |
| --- | --- |
| `image-studio-provider.tsx:114-125` | 카메라 조정 대상(참조) |
| `image-generator.tsx:53` | 저장 대상 |

Figma는 이 둘을 다른 테두리로 나눠 그린다. 디자인이 이미 별개 개념으로 선언해 둔 것을 코드만 하나로 겸하고 있다.

### 1.3 참조 사실이 저장되지 않는다

`adjustImageCamera`는 요청에서 `generatedImageId`(참조)를 받아 소유자·프로파일을 검증까지 하지만(`generate-image.service.ts:255-261`), `storeProfileGeneration`에 넘기지 않는다. DB에는 원본과 조정본이 아무 관계 없는 낱장 두 개로 남는다.

### 1.4 참조가 유스케이스 경계에서만 갈라져 있다

생성 플랜 IR은 이미 참조를 일급 입력으로 갖는다 — `ImageGenerationPlan.seedImage`(`generate-image.service.ts:109`). 러너도 모델 호출도 참조 유무로 갈라지지 않는다. 그런데 그 위 유스케이스만 `generateImages`와 `adjustImageCamera` 둘로 갈라져 있고, 라우트도 둘이다. 두 함수의 실제 차이는 셋뿐이다.

| | `generateImages` | `adjustImageCamera` |
| --- | --- | --- |
| 참조 로딩 | 없음 | `loadGeneratedImage` |
| 프롬프트 | 사용자 입력을 정규화 | 참조의 `effectivePrompt`를 상속 |
| 프롬프트 추가 키 | 없음 | `camera`, `camera_rules` |

세 번째 줄은 프롬프트 합성의 문제이지 생성 방식의 문제가 아니다. `composeCameraAdjustmentPrompt`(`camera-control.ts:110-115`)는 flat 프롬프트 JSON에 키 두 개를 더할 뿐이고, 이는 프로파일 시스템 프롬프트 행이나 유저 프롬프트 정규화 결과가 같은 JSON에 키를 얹는 것과 같은 종류다. 값의 출처만 다르다(Admin 고정 / AI 선택 / 컨트롤러 값).

즉 **카메라 조정은 별도의 생성 방식이 아니라, 참조가 붙고 프롬프트에 키가 두 개 더 얹힌 일반 생성이다.**

## 2. 결정

1. **참조 원본을 고정한다.** 카메라를 여러 번 조정해도 참조는 언제나 최초 원본이다. 세대 누적 열화가 없다.
2. **생성마다 새 세션을 만든다.** 세션은 `images`와 `reference` 두 필드를 갖고, 참조 여부만으로 원본 유지가 결정된다.
3. **참조는 이미지 한 장이다.** 세션 참조(이전 배치 전체 복원)는 만들지 않는다.
4. **참조를 일반 생성의 선택적 입력으로 올린다.** `adjustImageCamera`와 `/api/generate-image/camera-adjustment`를 없애고 `generateImages` 하나로 수렴한다.
5. **참조 소스를 확장 지점으로 둔다.** 지금 입주자는 "내 생성 결과" 하나이며, 업로드·브랜드 자산은 이번 범위 밖이다.
6. **카메라는 프롬프트 기여 feature로 남는다.** `ImageRuntimeFeature`에 참조 개념을 넣지 않는다.
7. **`generated-images`에 `sourceImage` 관계를 추가한다.** 기능 종류(카메라 조정인지 여부)는 기록하지 않는다.

## 3. 세션 모델

```ts
type ImageResultImage = {
	src: string
	generatedImageId: number | null
	profileId: number | null
}

type ImageGenerationSession = {
	/** 이 요청이 만든 것 — 참조 없는 생성은 N장, 참조 생성도 N장 가능. */
	images: readonly ImageResultImage[]
	/** 무엇을 보고 만들었나 — null이면 프롬프트에서 바로 나온 세션. */
	reference: ImageResultImage | null
}
```

전이는 둘뿐이다.

```ts
// 참조 없는 생성 — 새 세션
setSession({ images: response.images, reference: null })

// 참조 생성 — 참조를 물려받는다. 이 한 줄이 "원본 고정"이다.
const reference = session.reference ?? selectedImage
setSession({ images: response.images, reference })
```

그리드는 `[reference, ...images]`를 그리고, 참조 카드의 테두리는 `reference`인지 여부에서 파생된다.

### 3.1 참조를 추론하지 않는 이유

대안으로 아이템에 `role` 태그를 달고 "참조 생성 후 `generated`는 정확히 하나"라는 불변식에서 참조를 파생하는 방법을 검토했다. 동작하지만 규칙이 목록 구성에 암묵적으로 의존하므로, 누적을 켜거나 다른 출처의 아이템이 하나 들어오는 순간 의미가 조용히 바뀐다. 참조를 추론하지 않고 그대로 들고 있으면 유지할 불변식이 없다.

### 3.2 누적은 지금 켜지 않는다

세션이 매 요청 교체되므로 화면에는 참조 1장 + 최신 결과만 남는다. Figma `16:7258`이 요구하는 상태이며, 이전 결과는 `generated-images`에 남으므로 소실이 아니다. 여러 결과를 비교해야 할 때는 세션을 배열로 쌓으면 되고, 그때도 `reference` 규칙은 그대로 성립한다.

## 4. 참조는 생성의 선택적 입력이다

```
생성 = 프로파일 + 프롬프트(합성) + [참조 이미지]
```

### 4.1 참조 소스

참조가 어디서 오든 결과는 하나로 수렴한다. 이것이 확장 지점이다.

```ts
type ResolvedReference = {
	data: Uint8Array
	/** 소스가 프롬프트를 함께 제공하면 담는다. 없으면 사용자 프롬프트만 쓴다. */
	prompt?: string
	/** `sourceImage`에 기록할 대상. 생성 이미지가 아닌 소스는 null. */
	generatedImageId: number | null
}
```

| 소스 | 소유권 검증 | 프롬프트 제공 | 이번 범위 |
| --- | --- | --- | --- |
| 내 생성 결과 | `id ∧ scenario ∧ createdBy ∧ published` | ✅ `effectivePrompt` | 포함 |
| 사용자 업로드 | 이번 범위 밖 | ❌ | 제외 |
| 브랜드 자산 | 이번 범위 밖 | ❌ | 제외 |

`loadGeneratedImage`(`generated-image.payload.repository.ts:25`)가 이미 이 인터페이스의 첫 구현이다. `{data, effectivePrompt, inputPrompt}`를 돌려주고 있으므로 반환 형태를 위 타입에 맞추는 정도의 변경이다. **현재의 4중 `where` 게이트는 소스 해석기 안에 그대로 남는다** — 참조를 일반 라우트로 올려도 신뢰 경계가 약해지지 않는다.

### 4.2 프롬프트 상속 규칙

> 사용자가 프롬프트를 새로 썼으면 그것을 정규화해 쓰고, 비워 뒀으면 참조가 제공한 프롬프트를 물려받는다. 참조도 없고 프롬프트도 없으면 400이다.

카메라 조정은 후자에 해당한다. 사이드바의 Prompt 입력이 카메라 조정 중에도 열려 있는 현재 UI와 일치한다.

장수는 참조 유무가 정하지 않는다. 카메라 재생성은 현행대로 클라이언트가 `count: 1`을 보내고, 세션 모델(§3)은 N장을 받을 수 있게 열어 둔다.

라우트 스키마에서 `prompt`는 `.min(1)` 필수에서 선택으로 바뀌고, `prompt` 또는 `reference` 중 최소 하나를 요구하는 refine이 붙는다.

### 4.3 카메라는 프롬프트 기여자다

카메라 feature가 소유하는 것은 셋이다.

- 컨트롤 정의(orbit 위젯)와 Admin이 좁힐 축(`azimuths`·`elevations`)
- 신뢰 경계에서의 각도 재검증(`cameraFeature.azimuths.includes(...)`)
- 컨트롤러 값 → flat 프롬프트 키 번역(`composeCameraAdjustmentPrompt`)

참조 이미지는 카메라 feature가 소유하지 않는다. 카메라를 켜면 참조가 사실상 필수가 되지만, 그것은 프롬프트가 "input image를 정체성 참조로 쓰라"고 지시하기 때문이지 feature가 참조를 만들어 내기 때문이 아니다.

## 5. 스키마

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

- nullable이다. 비어 있으면 참조 없이 만든 이미지다.
- 기존 필드와 같이 `managerFieldRead`를 따른다.
- 마이그레이션은 ADD COLUMN 한 건이다.
- 업로드·브랜드 자산 소스를 열면 self relationship으로는 부족해진다. 그 소스를 실제로 넣을 때 다시 판단한다.

### 5.1 기능 종류를 기록하지 않는 이유

`derivationType: 'camera-adjustment'` 같은 enum이나 `cameraAzimuth` / `cameraElevation` 칼럼은 만들지 않는다. 저장하는 사실은 "이 이미지는 저 이미지를 참조해 만들어졌다" 하나다.

각도는 이미 저장돼 있기도 하다. 카메라가 얹은 키가 `effectivePrompt`에 그대로 들어간다. 전용 칼럼은 같은 사실을 두 곳에 적는 일이 된다.

### 5.2 이 필드가 지금 필요한 이유

화면 동작에는 필요 없다. 그러나 `generated-images`는 스스로 "생성 결과와 생성 당시 **입력**·실행 조건을 보관한다"고 선언한다(`GeneratedImages.ts:35`). 참조 이미지는 프롬프트와 나란한 입력이며, `inputPrompt`·`effectivePrompt`·`model`·`aspectRatio`를 모두 남기면서 참조만 빠져 있는 것은 설계 의도라기보다 누락이다. 또한 나중에 추가하더라도 그 이전에 만들어진 이미지의 출처는 복원할 수 없다.

## 6. 범위 밖

- **업로드·브랜드 자산 참조 소스** — `POST /api/generate-image`가 임의 이미지를 유료 모델로 보내는 표면이 되므로 `docs/07-security.md` 기준의 별도 판단이 필요하다. 4.1의 소스 인터페이스가 자리를 비워 둔다.
- **참조 생성기 레지스트리** — 참조를 "어떻게 쓰는가"에는 변주가 없으므로(§1.4) 만들지 않는다.
- **`AssetGenerationSession`**(`docs/04-domain-model.md`의 계획 모델) — 사용량 추적이 필요해질 때의 별도 판단이다.
- **세션 영속화** — 새로고침하면 세션이 사라지는 현재 동작을 유지한다.
- **색 조정 계약** — `results.color` 파생 규칙은 그대로 둔다. 색 조정은 생성이 아니라 결과 표시 후처리이므로 이 설계에 들어오지 않는다.

## 7. 영향 범위

`useImageGeneration`의 소비자는 `ImageStudioProvider` 하나뿐이므로 클라이언트 변경이 갇힌다.

| 파일 | 변경 |
| --- | --- |
| `collections/GeneratedImages.ts` | `sourceImage` 필드 추가 |
| `migrations/` | ADD COLUMN 마이그레이션 + drizzle 스냅샷 |
| `repositories/generated-image.payload.repository.ts` | `loadGeneratedImage` 반환을 `ResolvedReference`로, `storeGeneratedImages`가 `sourceImage` 기록 |
| `services/generate-image.service.ts` | `generateImages`가 선택적 `reference`를 받음, 프롬프트 상속 규칙, `adjustImageCamera` 삭제 |
| `app/api/generate-image/route.ts` | 스키마에 `reference` 추가, `prompt` 선택화 + refine |
| `app/api/generate-image/camera-adjustment/` | 삭제 |
| `camera-control.ts` | `cameraAdjustmentRequestSchema`·`MAX_CAMERA_ADJUSTMENT_REQUEST_BYTES` 삭제, 각도·프롬프트 합성은 유지 |
| `services/generate-image.client.ts` | `requestCameraAdjustment` 삭제, `requestImageGeneration`이 `reference`를 받음 |
| `hooks/use-image-generation.ts` | `result` → `session` 소유, §3의 두 전이 |
| `providers/image-studio-provider.tsx` | 참조 파생을 `session.reference ?? selected`로 |
| `contexts/image-studio-context.ts` | `results` 계약을 세션 모델로 교체 |
| `components/studio/image/image-canvas.tsx`, `image-generation-results.tsx` | `[reference, ...images]` 렌더, 참조 테두리 |
| `components/studio/image/image-generator.tsx` | 저장 대상 파생 |

별도 도메인 파일은 만들지 않는다. 세션 전이가 두 줄이라 훅 안에 두는 편이 읽기 쉽다.

## 8. 검증

- 카메라 조정 후 그리드에 참조 원본과 조정본이 함께 남는다.
- 카메라 조정을 두 번 해도 두 번째 요청의 참조가 최초 원본과 같다.
- 프롬프트 없이 참조만 보내면 참조의 `effectivePrompt`를 상속한다.
- 프롬프트와 참조를 함께 보내면 사용자 프롬프트를 정규화해 쓴다.
- 프롬프트도 참조도 없으면 400이다.
- 남의 생성 이미지 id를 참조로 보내면 거부된다(기존 4중 `where` 게이트 유지).
- 프로파일에서 카메라 기능을 끄면 각도 검증이 400으로 거부한다(기존 동작 유지).
- 참조 생성 결과 문서의 `sourceImage`가 참조 문서를 가리키고, 참조 없는 생성은 비어 있다.
- `pnpm typecheck`, `pnpm vitest run`, `pnpm lint`를 Node 22에서 실행한다.
- 마이그레이션은 push로 갱신한 로컬 DB가 아니라 `PAYLOAD_DB_PUSH=false`인 새 DB에서 검증한다.
