/* Controls for capabilities available in the teacher's actual AI conversation. */
(function () {
  'use strict';
  if (!window.EPCap || !window.EPBuilder) return;
  const panel = document.createElement('section');
  panel.className = 'ai-session';
  panel.setAttribute('aria-labelledby', 'session-title');
  panel.innerHTML = `
    <h2 id="session-title">ปรับคำสั่งให้ตรงกับแชทที่ใช้</h2>
    <p>เลือก AI และรุ่นในฟอร์ม แล้วระบุเครื่องมือที่เปิดใช้จริงในแชทของอาจารย์</p>
    <div class="session-grid">
      <label for="session-evidence">แหล่งอ้างอิงที่ AI ใช้ได้
        <select id="session-evidence">
          <option value="unconfirmed">ยังไม่ยืนยัน / ไม่ได้เปิดค้นเว็บ</option>
          <option value="web">เปิดค้นเว็บในแชทแล้ว</option>
          <option value="provided">ใช้เอกสารที่จะแนบในแชท</option>
        </select>
      </label>
      <label for="session-reasoning">โหมดที่เลือกใน AI
        <select id="session-reasoning">
          <option value="auto">ใช้ค่าตั้งต้นของรุ่น</option>
          <option value="native">เปิด Thinking / Reasoning แล้ว</option>
          <option value="prompted">โหมดตอบปกติ / ไม่แน่ใจ</option>
        </select>
      </label>
      <label for="session-batch">จำกัดจำนวนข้อต่อรอบ
        <select id="session-batch">
          <option value="0">ตามค่าตั้งต้นของรุ่น</option>
          <option value="1">ไม่เกิน 1 ข้อ</option><option value="3">ไม่เกิน 3 ข้อ</option>
          <option value="5">ไม่เกิน 5 ข้อ</option><option value="10">ไม่เกิน 10 ข้อ</option>
          <option value="20">ไม่เกิน 20 ข้อ</option>
        </select>
      </label>
    </div>
    <p id="session-summary" class="session-summary" role="status" aria-live="polite"></p>
    <p class="session-note">การตั้งค่านี้เปลี่ยนข้อความ prompt เท่านั้น ไม่ได้เปิดเครื่องมือใน AI ให้เอง รายชื่อรุ่นและค่าตั้งต้นเป็นแนวทางจากทะเบียนเดิม ไม่ใช่ผลทดสอบรับรองคุณภาพ หากไม่พบรุ่นให้เลือก “อื่น ๆ”</p>
    <details class="session-followups"><summary>หลัง AI ตอบแล้ว: สั่งต่อหรือทบทวน</summary>
      <p>คัดลอกคำสั่งไปใช้ในแชทเดิมที่มี prompt และข้อสอบอยู่ครบ เว็บนี้ยังไม่ทราบว่า AI ออกข้อสอบไปแล้วกี่ข้อ</p>
      <div class="session-buttons"><button type="button" id="session-next">คำสั่งรอบถัดไป</button><button type="button" id="session-review">คำสั่งทบทวนข้อสอบ</button></div>
      <label for="session-followup-text">คำสั่งพร้อมคัดลอก</label>
      <textarea id="session-followup-text" rows="5" readonly placeholder="เลือกคำสั่งที่ต้องการด้านบน"></textarea>
      <button type="button" id="session-copy" disabled>คัดลอกคำสั่งนี้</button>
      <p id="session-copy-status" role="status" aria-live="polite"></p>
    </details>`;
  const capbox = document.getElementById('capbox');
  const preview = document.getElementById('prompt-panel');
  if (capbox) capbox.before(panel); else preview.before(panel);
  const $ = id => panel.querySelector('#' + id);
  function sync() {
    const s = EPCap.getSession();
    $('session-evidence').value = s.evidence;
    $('session-reasoning').value = s.reasoning;
    $('session-batch').value = String(s.batch);
    refresh();
  }
  function refresh() {
    const ctx = EPBuilder.context();
    $('session-next').disabled = !ctx.valid || !ctx.plan || !ctx.plan.split;
    $('session-review').disabled = !ctx.valid;
    if (!ctx.valid) {
      $('session-summary').textContent = 'แก้จำนวนข้อในฟอร์มก่อนสร้างคำสั่ง';
    } else {
      const p = ctx.profile, plan = ctx.plan;
      $('session-summary').textContent = p.provider + ' · ' + p.model + ' — ' +
        (plan.split ? plan.rounds + ' รอบ ไม่เกินรอบละ ' + plan.per + ' ข้อ รอบสุดท้าย ' + plan.last + ' ข้อ' : 'รอบเดียว ' + plan.total + ' ข้อ') +
        ' · ' + (p.evidence === 'provided' ? 'อย่าลืมแนบเอกสารในแชท AI' : p.web ? 'อ้างเฉพาะแหล่งที่ค้นได้จริง' : 'ไม่อ้างว่าได้ตรวจแนวทางล่าสุด');
    }
  }
  function invalidateFollowup() {
    $('session-followup-text').value = '';
    $('session-copy').disabled = true;
    $('session-copy-status').textContent = '';
  }
  for (const name of ['evidence','reasoning','batch']) {
    $('session-' + name).addEventListener('change', () => {
      EPCap.setSession({evidence:$('session-evidence').value,reasoning:$('session-reasoning').value,batch:Number($('session-batch').value)});
      EPBuilder.refresh(); refresh(); invalidateFollowup();
    });
  }
  for (const kind of ['next','review']) {
    $('session-' + kind).addEventListener('click', () => {
      $('session-followup-text').value = EPCap.followUp(kind, EPBuilder.context().plan);
      $('session-copy').disabled = false;
      $('session-copy-status').textContent = '';
    });
  }
  $('session-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('session-followup-text').value); $('session-copy-status').textContent = 'คัดลอกแล้ว วางในแชทเดิมได้เลย'; }
    catch { $('session-followup-text').focus(); $('session-followup-text').select(); $('session-copy-status').textContent = 'คัดลอกอัตโนมัติไม่ได้ เลือกข้อความไว้ให้แล้ว กรุณาคัดลอกด้วยเมนูของอุปกรณ์'; }
  });
  // Existing builder listeners run before these bubbling listeners.
  for (const event of ['input','change','click']) document.addEventListener(event, e => {
    if (panel.contains(e.target)) return;
    refresh();
    if(e.target.matches('input,select,textarea') || e.target.closest('.pill,.chip,[data-bulk]')) invalidateFollowup();
  });
  window.addEventListener('ep-session-loaded', ()=>{sync();invalidateFollowup();});
  sync();
})();
