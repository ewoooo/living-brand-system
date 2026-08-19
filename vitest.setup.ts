// Any setup scripts you might need go here

import '@testing-library/jest-dom/vitest'

// 서버에서 도는 코드는 `// @vitest-environment node`로 덮어야 잡힌다 — 거기엔 DOM이 없으므로
// jsdom 전용 준비를 건너뛴다. 전역 jsdom만 쓰면 브라우저 API 오용이 테스트를 통과한다.
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView = () => {}

// Load .env files
import 'dotenv/config'
