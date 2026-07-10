/**
 * [throwaway] template 9(방사형)에 "정원 규칙" 코드를 데이터로 삽입 (dogfood).
 * 이 js는 우리 소스가 아니라 template.jsonTemplate.code.js(데이터)에 들어간다 — 플랫폼은 내용을 모른다.
 * 실행: source ~/.nvm/nvm.sh && nvm use 22 && pnpm exec payload run scripts/_set-radial-code.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'
import type { JsonTemplate } from '@/types/json-template'

const TEMPLATE_ID = 9

// 정원 규칙: 8텍스트를 center 기준 radius·등간격 배치. worker가 center 드래그 + radius 조절. (manager 저작 코드)
const RADIAL_JS = `
(function () {
  var stage = document.getElementById('__stage');
  var controls = document.getElementById('__controls');
  var texts = (window.__SLOTS__ || [])
    .filter(function (s) { return s.type === 'text'; })
    .map(function (s) { return document.getElementById(s.id); })
    .filter(Boolean);
  var p = window.__PARAMS__ || {};
  var cx = p.cx != null ? p.cx : stage.offsetWidth / 2;
  var cy = p.cy != null ? p.cy : stage.offsetHeight / 2;
  var radius = p.radius != null ? p.radius : Math.min(stage.offsetWidth, stage.offsetHeight) * 0.30;

  // Center 원 (드래그 가능)
  var SIZE = 220;
  var dot = document.createElement('div');
  dot.style.cssText = 'position:absolute;width:' + SIZE + 'px;height:' + SIZE + 'px;border-radius:50%;background:rgba(255,255,255,0.9);transform:translate(-50%,-50%);cursor:grab;touch-action:none;pointer-events:auto;box-shadow:0 0 0 2px rgba(0,0,0,0.12)';
  controls.appendChild(dot);

  // radius 슬라이더
  var panel = document.createElement('div');
  panel.style.cssText = 'position:absolute;left:24px;bottom:24px;display:flex;gap:12px;align-items:center;background:rgba(0,0,0,0.55);color:#fff;padding:12px 16px;border-radius:12px;font:18px sans-serif;pointer-events:auto';
  var label = document.createElement('span');
  label.textContent = '반지름';
  var slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '60';
  slider.max = String(Math.round(Math.min(stage.offsetWidth, stage.offsetHeight) / 2));
  slider.value = String(Math.round(radius));
  slider.style.width = '260px';
  panel.appendChild(label);
  panel.appendChild(slider);
  controls.appendChild(panel);

  function layout() {
    dot.style.left = cx + 'px';
    dot.style.top = cy + 'px';
    var n = texts.length || 1;
    texts.forEach(function (el, i) {
      var a = (i / n) * Math.PI * 2 - Math.PI / 2; // 12시부터 시계방향, 등간격
      var x = cx + radius * Math.cos(a);
      var y = cy + radius * Math.sin(a);
      el.style.left = (x - el.offsetWidth / 2) + 'px';
      el.style.top = (y - el.offsetHeight / 2) + 'px';
    });
  }
  window.__relayout = layout;

  slider.addEventListener('input', function () { radius = Number(slider.value); layout(); });

  dot.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    dot.setPointerCapture(e.pointerId);
    dot.style.cursor = 'grabbing';
    function move(ev) {
      var r = stage.getBoundingClientRect();
      cx = ev.clientX - r.left;
      cy = ev.clientY - r.top;
      layout();
    }
    function up() {
      dot.style.cursor = 'grab';
      dot.removeEventListener('pointermove', move);
      dot.removeEventListener('pointerup', up);
    }
    dot.addEventListener('pointermove', move);
    dot.addEventListener('pointerup', up);
  });

  layout();
})();
`

const payload = await getPayload({ config })

const doc = await payload.findByID({ collection: 'templates', id: TEMPLATE_ID, overrideAccess: true })
// 옛 위치(jsonTemplate.code)에 남은 code는 떼어내고 디자인 구조만 남긴다.
const { code: _legacy, ...designOnly } = doc.jsonTemplate as JsonTemplate & { code?: unknown }

await payload.update({
	collection: 'templates',
	id: TEMPLATE_ID,
	data: {
		jsonTemplate: designOnly,
		// 기능 코드는 이제 별도 top-level 필드(진짜 code 에디터).
		code: { css: '', js: RADIAL_JS },
		_status: 'published',
	},
	overrideAccess: true,
})

console.log(`template ${TEMPLATE_ID}: 별도 code 필드로 이동 완료 (${RADIAL_JS.length} chars)`)
