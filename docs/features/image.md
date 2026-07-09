# Image

## 1. 목적

프롬프트를 받아 이미지 후보를 여러 장 생성합니다. 브랜드 규정 부합 여부 판단(검수)은 하지 않습니다. 규정 준수는 검수 대신 **프롬프트 프리셋**과 **여러 후보 중 택1하는 UX**로 유도합니다.

Create가 산출물에 이미지가 필요할 때 이 기능을 호출하는 것이 대표 사용처입니다.

## 2. 핵심 계약

표면과 무관한 재사용 단위입니다. 코어 로직은 `src/features/image-generation/`이 소유하고, 표면은 이를 호출만 합니다.

- 입력: 제품 프롬프트 텍스트, 씬(scene) 선택(`sceneId`, 생략 시 자동), 후보 장수(현재 1~6)
- 출력: 이미지 후보 목록(각 항목은 바로 표시 가능한 data URI)
- 검수 미포함: 생성 결과를 그대로 돌려주며 규정 판정을 하지 않습니다.

### 프롬프트 합성 (essenherb R&D 검증 방식)

브랜드 레퍼런스를 사전에 **Context Rules JSON**으로 고정해 두고 생성 시 조합합니다.

- **base**: 브랜드 고정 스타일(조명·배경·톤·기술) — 모든 씬에 항상 적용.
- **scene**: 환경·구성(원료·카메라·색 harmony 등) — 사용자가 고르거나 입력에서 자동 선택.
- **Text Decorator**: 짧고 추상적인 입력을 `base ⊕ scene ⊕ 입력`으로 합쳐 이미지 모델용 프롬프트로 확장(한국어→영어 번역 포함). Anthropic 키가 없으면 결정론적 합성으로 폴백합니다.

씬은 사전 QA된 규격 데이터만 사용하므로 1~2회 안에 브랜드 일관 결과가 나오고, 레퍼런스 이미지 없이 텍스트 프롬프트만으로 동작합니다. 데이터는 essenherb 샘플을 하드코딩하고 있으며 이후 Brand Resource로 이관합니다.

## 3. 표면

| Surface | 상태 | 진입점 |
| --- | --- | --- |
| [Page](../surfaces/page.md) | 구현 | `/image` — 프롬프트 입력 → 후보 그리드 → 택1 |
| [AI Chat](../surfaces/ai-chat.md) | 구현 | agent tool `generateImage`로 대화 중 생성, 후보를 챗에 렌더 |
| REST | 구현 | `POST /api/image`(same-origin, 유료 경로는 인증 게이트) |
| Slack | 계획 | — |

## 4. 의존

- 이미지 프로바이더: OpenAI `gpt-image-2`(사내 채택). 모델은 `OPENAI_IMAGE_MODEL`로 교체 가능하며, 프로바이더 교체도 코어 한 곳(service)에서 이뤄집니다.
- Vercel AI SDK `generateImage`.
- Text Decorator: Anthropic(`ANTHROPIC_API_KEY`, 모델 `ANTHROPIC_MODEL`). 프롬프트 합성 I/O는 `prompt-decorator.service.ts`가 소유합니다.
- Review 미사용(의도적) — 이미지 검수 성능이 아직 일부 항목에 한정되어 있어 생성 품질을 검수에 묶지 않습니다.
- API 키(`OPENAI_API_KEY`)가 없으면 placeholder 후보로 폴백해 UI 흐름은 그대로 동작합니다.

## 5. 크로스커팅

- 유료 호출 인증·게이트: [07. 보안](../07-security.md)
- 사용자 노출 문구·접근성: [08. 접근성과 다국어](../08-accessibility-i18n.md)
- 도메인 위치(제작 관리 / AssetGeneration): [04. 도메인 모델](../04-domain-model.md)
