# Image

## 1. 목적

프롬프트를 받아 이미지 후보를 여러 장 생성합니다. 브랜드 규정 부합 여부 판단(검수)은 하지 않습니다. 브랜드 표현은 Payload에서 관리하는 **이미지 프로파일**과 **여러 후보 중 택1하는 UX**로 유도합니다.

Create가 산출물에 이미지가 필요할 때 이 기능을 호출하는 것이 대표 사용처입니다.

## 2. 핵심 계약

표면과 무관한 재사용 단위입니다. 코어 로직은 `src/features/generate-image/`이 소유하고, 표면은 이를 호출만 합니다.

- 입력: 프롬프트 텍스트, 선택적 이미지 프로파일(`profileId`), 후보 장수(현재 1~6)
- 출력: 프로파일 기반 생성은 `generated-images` 문서 참조와 저장 URL 목록을 반환합니다. 저장 전 Admin 테스트만 data URI를 반환합니다.
- 영속성: 프로파일 기반 생성과 카메라 조정 결과는 `generated-images`에 파일·프로파일·원본/최종 프롬프트·모델·출력 조건·생성 사용자를 저장합니다. `AssetGenerationSession`은 향후 제작 사용량 추적이 필요할 때만 도입합니다.
- 검수 미포함: 생성 결과를 그대로 돌려주며 규정 판정을 하지 않습니다.

### 프롬프트 합성

브랜드 프롬프트의 유일한 런타임 원천은 Payload의 published 이미지 프로파일입니다. 소스 코드에는 브랜드 base나 씬 목록을 두지 않습니다.

- **프로파일 생성**: `profileId`가 있으면 published 프로파일의 시스템 프롬프트와 선택적 유저 프롬프트 후보를 읽습니다. 후보가 있으면 Haiku가 각 주제에서 하나를 선택하고 유저 인풋 원문은 최종 프롬프트에서 제외합니다. 후보가 없으면 AI 정규화를 생략하고 원문을 `subject`로 보존합니다.
- **자유 생성**: `profileId`가 없으면 브랜드 규칙을 적용하지 않고 입력 프롬프트 원문을 그대로 사용합니다.
- **프로파일 상태**: 일반 생성은 published 프로파일만 사용합니다. Admin의 생성 테스트만 저장하지 않은 현재 폼 값을 직접 사용합니다.

### 이미지 프로파일 Admin

Manager는 Payload Admin의 `이미지 프로파일` 컬렉션에서 이미지 유형별 설정을 편집하고 테스트합니다.

- **시스템 프롬프트**: `주제(key)`, `프롬프트(value)` 행을 최종 프롬프트의 기본값으로 사용합니다.
- **유저 프롬프트**: 선택적으로 `주제(key)`, `프롬프트 후보[]`를 정의합니다. 행이 있으면 AI 구조화 출력은 각 주제마다 후보 중 하나만 선택하고, 비어 있으면 AI 정규화를 호출하지 않습니다.
- **이미지 모델**: 프로파일은 허용된 모델 프리셋을 소유합니다. 현재 계약은 `openai-gpt-image-2`와 `google-nano-banana-2-lite`입니다.
- **출력 계약**: 프로파일은 공급자와 무관한 `aspectRatio`와 `imageSize`를 별도로 소유합니다. 비율은 `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, 해상도는 `1K`, `2K`, `4K`입니다.
- **공급자 변환**: Google에는 `imageConfig.aspectRatio`와 `imageConfig.imageSize`를 그대로 전달합니다. OpenAI `gpt-image-2`에는 같은 계약을 16px 배수, 최대 3840px, 3:1 이하, 655,360~8,294,400 픽셀 범위의 실제 `size`로 변환합니다.
- **모델 제약**: Nano Banana 2 Lite는 위 비율 10종과 `1K`만 지원하므로 `2K`, `4K` 프로파일 저장과 관리자 생성 테스트를 거부합니다.
- **최종 프롬프트 JSON**: 시스템 프롬프트와 정규화 결과를 flat JSON으로 합칩니다. 정규화 후보가 없을 때만 유저 인풋 원문을 `subject`로 보존합니다. textarea 줄바꿈은 `, `로 정규화하며, 같은 주제는 정규화 결과가 우선합니다.
- **런타임 사용**: `profileId`가 지정되면 사용자에게 공개된 published 프로파일만 조회해 정규화하고 이미지 생성기로 전달합니다. Admin의 draft는 생성 테스트에서만 사용합니다.
- **생성 테스트**: 현재 Admin 폼 값으로 정규화와 이미지 생성을 실행합니다. 테스트 화면에서 유저 프롬프트 후보 정규화를 끄면 유저 인풋 원문을 `subject`로 합성합니다. 미저장 값도 테스트할 수 있고 결과는 저장하지 않습니다.
- **Admin 생성 API**: 프로파일 생성 테스트는 모델과 출력 계약을 모두 명시하고, 템플릿의 AI 배경 생성은 서버 기본 계약을 사용합니다. 두 요청 모두 Manager 전용 `POST /api/admin/generate-image`를 사용합니다.

프로파일 기반 응답의 `images`는 저장 URL이며 `generatedImages`에는 각 문서의 `id`, `url`, `createdAt`이 포함됩니다. 카메라 조정 요청은 원본 data URI를 재전송하지 않고 `generatedImageId`를 전달하며, 서버가 같은 published 프로파일의 `generated-images` 원본을 조회·검증해 사용합니다.

Creator는 published 프로파일을 선택해 생성하고, AI Chat은 `listImageProfiles`로 사용 가능한 프로파일을 확인한 뒤 `generateImage`에 `profileId`를 전달합니다. 자유 생성은 프로파일 없이 기존 원문 생성을 유지합니다.

## 3. 표면

| Surface | 상태 | 진입점 |
| --- | --- | --- |
| [Page](../surfaces/page.md) | 구현 | `/studio/generate/image` 또는 `/studio/generate/image/:profileSlug` — 프롬프트 입력 → 후보 그리드 → 택1 |
| [AI Chat](../surfaces/ai-chat.md) | 구현 | agent tool `generateImage`로 대화 중 생성, 후보를 챗에 렌더 |
| MCP | 구현 | `generateBrandImage`가 published 프로파일로 원본을 저장하고 MCP 이미지 미리보기와 원본 URL을 반환 |
| [REST](../surfaces/rest.md) | 구현 | `POST /api/generate-image`(same-origin, 인증 필수), `POST /api/admin/generate-image`(Manager 전용) |
| Slack | 계획 | — |

## 4. 의존

- 이미지 프로바이더: 자유 생성과 기존 프로파일은 OpenAI `gpt-image-2`, Technical Illustration은 Google `gemini-3.1-flash-lite-image`를 사용합니다. 프로파일이 모델 프리셋을 선택하고 코어 생성 서비스가 공급자를 결정합니다.
- Vercel AI SDK `generateImage`. Google은 provider options의 `imageConfig`, OpenAI는 Images API의 `size`를 사용합니다.
- Google 직접 호출은 `@ai-sdk/google`과 서버의 `GEMINI_API_KEY`를 사용하며 AI Gateway를 거치지 않습니다.
- 프로파일 저장소: Payload CMS의 published `image-profiles` 컬렉션. `slug`가 있는 프로파일은 `displayOrder` 순서로 Studio 내비게이션과 `/studio/generate/image/:profileSlug` 경로에 노출됩니다.
- 프로파일 정규화: 유저 프롬프트 후보가 있는 프로파일만 Anthropic Haiku 구조화 출력을 사용합니다. 정적 프로파일과 자유 생성은 정규화 모델을 호출하지 않습니다.
- Review 미사용(의도적) — 이미지 검수 성능이 아직 일부 항목에 한정되어 있어 생성 품질을 검수에 묶지 않습니다.
- dev 폴백: OpenAI 경로는 개발 환경에서 `IMAGE_DEV_FALLBACK=true`를 명시한 경우에만 Pollinations FLUX(무료·키 불필요)를 임시 사용합니다. Google 모델을 선택한 프로파일은 `GEMINI_API_KEY`가 없으면 대체 모델로 보내지 않고 실패합니다. ⚠️ Pollinations에는 민감 입력을 보내지 않습니다.

## 5. 크로스커팅

- 유료 호출 인증·게이트: [07. 보안](../07-security.md)
- 사용자 노출 문구·접근성: [08. 접근성과 다국어](../08-accessibility-i18n.md)
- 도메인 위치(제작 관리 / AssetGeneration): [04. 도메인 모델](../04-domain-model.md) — 현재는 요청 범위 생성이고, `AssetGenerationSession`은 사용량 추적용 계획 모델입니다.
