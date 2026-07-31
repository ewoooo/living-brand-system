# AI Chat

## 1. 목적

앱 안의 대화형 표면입니다. 사용자가 채팅으로 요청하면 agent가 적절한 Feature를 도구로 호출합니다.

## 2. 어댑터 계약

- agent는 `src/agents/agent-chat.agent.ts`(ToolLoopAgent)가 소유하고, 도구는 `src/agents/agent-chat-tools.agent.ts`에 등록합니다. 진입점은 `src/app/api/agent-chat/route.ts`입니다.
- triage는 기본적으로 꺼져 있습니다. `AGENT_CHAT_TRIAGE_ENABLED=true`일 때만 아래 분류·모델 전환·저장 정책을 적용합니다.
- triage가 꺼져 있으면 첫 `loadSkill`은 skill 이름만 선택하고, Sonnet 5와 선택된 skill의 기존 도구 허용 목록을 사용합니다. 세션의 `triage`는 저장하지 않습니다.
- 첫 `loadSkill` 호출은 Haiku 4.5가 `name`, `responseLevel`, `taskType`, `risk`, `confidence`를 제안합니다. 서버는 `fast`를 Haiku 4.5, `standard`를 Sonnet 5, `deep`을 Opus 5.0으로 결정하고, `answer/lookup/action`을 각각 `none/read/action` 도구 범위로 바꿉니다.
- confidence가 70 미만이면 Sonnet 5로 한 번만 재분류합니다. 두 번째 confidence도 70 미만이거나 Skill·작업 유형이 충돌하면 도구를 허용하지 않고 사용자에게 확인 질문 하나만 합니다.
- `risk: high`의 서버 결정은 `deep`·Opus 5.0과 사람 검토를 강제하고 `action` 범위를 `read`로 낮춥니다.
- 확정된 triage와 모든 분류 단계의 모델·token 사용량은 `agent-chat-sessions.triage`에 저장합니다. 분류 전에 실패한 세션에는 triage가 없을 수 있습니다.
- Skill별 도구 허용 목록은 서버가 소유하며, triage의 `none/read/action` 범위와 교집합으로 결정합니다. 등록되지 않은 Skill은 어떤 도구도 허용하지 않습니다.
- 첫 분류는 `claude-haiku-4-5`, 저신뢰 재분류는 `claude-sonnet-5`를 사용합니다. Haiku 단계에서는 지원하지 않는 adaptive thinking을 끕니다. 이후 단계는 서버 결정에 따라 Haiku 4.5, Sonnet 5, Opus 5.0으로 전환하며 허용된 도구만 AI SDK `activeTools`에 전달합니다.
- 한 턴에 여러 모델을 사용하면 실행 기록의 `model`에 사용 순서대로 중복 없이 남기고, `rawUsage.steps`에는 단계별 모델과 provider usage를 함께 저장합니다.
- 실제 triage API 경계는 `scripts/smoke-agent-chat.ts`로 확인합니다. `AGENT_CHAT_TRIAGE_ENABLED=true`인 실행 중 앱과 동일한 DB를 `PAYLOAD_DB_PUSH=false`로 연결하고 인증 쿠키를 `AGENT_CHAT_SMOKE_COOKIE`에 전달합니다. 특정 케이스만 확인하려면 `AGENT_CHAT_SMOKE_CASE`에 `fast-answer`, `standard-lookup`, `deep-lookup`, `standard-action`, `high-risk-action` 중 하나를 지정합니다.
- 새 Feature를 이 표면으로 노출하려면: 코어 service를 감싸는 tool을 정의(입력 스키마 + 코어 호출) → 도구 목록에 등록. agent가 언제 그 도구를 고를지는 도구 설명과 skill로 유도합니다.
- 도구는 코어 service를 호출만 하며 로직을 중복 구현하지 않습니다.

## 3. 공통 규칙

- Agent 실행 경계·컨텍스트 제한: [05. 시스템 아키텍처](../05-system-architecture.md), [07. 보안](../07-security.md)
- 도구가 호출하는 각 Feature의 계약: [Features](../features/README.md)

## 4. 크로스커팅

Agent 실행 모델과 보안 한계는 위 개념 문서가 규정합니다. 여기서는 링크만 유지합니다.
