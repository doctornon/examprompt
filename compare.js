/* Capture both prompts from one immutable blueprint, without changing the builder. */
(function () {
  'use strict';
  if (!window.EPCap) return;
  function makeBundle(spec, a, b, preset, createdAt) {
    // Detach the result from future form/profile mutations.
    const shared = JSON.parse(JSON.stringify(spec));
    const resultA = EPCap.compose(shared, a), resultB = EPCap.compose(shared, b);
    return JSON.parse(JSON.stringify({
      format: 'examprompt-comparison', version: 1, prompt_version: EPCap.VERSION,
      created_at: createdAt || new Date().toISOString(), builder: 2,
      purpose: 'เปรียบเทียบคำสั่งด้วยผังเดียวกัน ยังไม่ใช่ผลประเมินคุณภาพข้อสอบ',
      shared_spec: shared, preset: preset,
      variants: { A: resultA, B: resultB },
      review: {
        criteria: ['ตรงผังและวัตถุประสงค์','คำตอบถูกต้องและมีหลักฐานรองรับ','โจทย์ชัดเจนและมีคำตอบถูกที่สุดหนึ่งข้อ','ตัวลวงเหมาะสมและไม่ชี้นำคำตอบ','ไม่เกินขอบเขตที่กำหนด','รูปแบบผลลัพธ์ใช้งานได้'],
        allowed_ratings: ['ผ่าน','ควรแก้','ข้อมูลไม่พอ'], results: [],
        instructions: 'ใช้เกณฑ์เดียวกันกับข้อสอบทั้งสองชุด ให้ผู้เชี่ยวชาญตรวจ และบันทึกเหตุผล ไม่สรุปผู้ชนะจากความต่างของ prompt เพียงอย่างเดียว'
      }
    }));
  }
  window.EPCompare = { makeBundle };
  if (!window.EPBuilder || !EPBuilder.spec || !document.getElementById('ai-comparison')) return;
  const $ = id => document.getElementById(id);
  const section = $('ai-comparison');
  let bundle = null;
  function fill(id, values) {
    const select = $(id); select.replaceChildren();
    values.forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; select.appendChild(option); });
  }
  function models() { fill('compare-model', EPCap.PROVIDERS[$('compare-provider').value].models[$('compare-plan').value]); }
  function plans() { fill('compare-plan', EPCap.PROVIDERS[$('compare-provider').value].plans); models(); }
  function label(p) { return p.provider + ' · ' + p.model + ' (' + p.plan + ')'; }
  function invalidate() {
    const existed = bundle !== null;
    bundle = null;
    $('compare-results').hidden = true;
    // Do not retain an exportable, outdated prompt after editing the form.
    for (const side of ['a','b']) $('compare-text-' + side).value = '';
    const ctx = EPBuilder.context();
    $('compare-build').disabled = !ctx.valid;
    $('compare-source').textContent = 'ฝั่ง A จากฟอร์มปัจจุบัน: ' + label(ctx.profile);
    if (!ctx.valid) $('compare-status').textContent = 'แก้จำนวนข้อในฟอร์มก่อนสร้างชุดเปรียบเทียบ';
    else if (existed) $('compare-status').textContent = 'ค่าถูกเปลี่ยนแล้ว กดสร้างชุดเปรียบเทียบใหม่เพื่อใช้ค่าล่าสุด';
    else $('compare-status').textContent = 'เลือก AI ฝั่ง B แล้วสร้างชุดเปรียบเทียบ';
  }
  fill('compare-provider', Object.keys(EPCap.PROVIDERS));
  $('compare-provider').value = EPBuilder.context().profile.provider === 'ChatGPT' ? 'Claude' : 'ChatGPT';
  plans();
  $('compare-provider').addEventListener('change',()=>{ plans(); invalidate(); });
  $('compare-plan').addEventListener('change',()=>{ models(); invalidate(); });
  $('compare-model').addEventListener('change',invalidate);
  $('compare-build').addEventListener('click',()=>{
    const ctx = EPBuilder.context();
    if(!ctx.valid) { invalidate(); return; }
    const other = EPCap.profile($('compare-provider').value,$('compare-plan').value,$('compare-model').value);
    bundle = makeBundle(EPBuilder.spec(),ctx.profile,other,EPBuilder.preset());
    const {A,B} = bundle.variants;
    const a = EPCap.describe(A.profile,A.plan), b = EPCap.describe(B.profile,B.plan);
    if(!bundle.shared_spec.machineFormat) { a[3][1] = b[3][1] = 'ใช้รูปแบบที่เลือกในผัง ไม่ใช้ข้อกำหนดสำหรับไฟล์ข้อมูล'; }
    $('compare-differences').replaceChildren();
    a.forEach((row,i)=>{
      const tr = document.createElement('tr');
      if(row[1]!==b[i][1]) tr.className = 'compare-changed';
      [row[0],row[1],b[i][1]].forEach((value,j)=>{const cell=document.createElement(j===0?'th':'td');if(j===0)cell.scope='row';cell.textContent=value;tr.appendChild(cell);});
      $('compare-differences').appendChild(tr);
    });
    $('compare-name-a').textContent = 'A · ' + label(A.profile);
    $('compare-name-b').textContent = 'B · ' + label(B.profile);
    $('compare-text-a').value = A.text; $('compare-text-b').value = B.text;
    $('compare-results').hidden = false;
    $('compare-status').textContent = A.text===B.text
      ? 'คำสั่งทั้งสองฝั่งเหมือนกัน เพราะค่าที่ใช้ประกอบคำสั่งเหมือนกัน ไม่ได้หมายความว่าผลจาก AI จะเหมือนกัน'
      : 'สร้างแล้ว: ผังเดียวกัน วิธีสั่งงานต่างกันตามค่าของแต่ละรุ่น ลองในแชทใหม่แยกกันและใช้เอกสารชุดเดียวกัน';
  });
  for(const side of ['a','b']) $('compare-copy-'+side).addEventListener('click',async()=>{
    if(!bundle) return;
    const current = bundle;
    try {
      await navigator.clipboard.writeText($('compare-text-'+side).value);
      if(bundle===current) $('compare-status').textContent='คัดลอกฝั่ง '+side.toUpperCase()+' แล้ว วางในแชทของรุ่นนั้นได้เลย';
    } catch {
      if(bundle!==current) return;
      $('compare-text-'+side).focus(); $('compare-text-'+side).select();
      $('compare-status').textContent='คัดลอกอัตโนมัติไม่ได้ เลือกข้อความให้แล้ว กรุณาคัดลอกด้วยเมนูของอุปกรณ์';
    }
  });
  $('compare-download').addEventListener('click',()=>{
    if(!bundle) return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='examprompt-comparison.json';document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('compare-status').textContent='ส่งไฟล์ชุดทดลองให้เบราว์เซอร์ดาวน์โหลดแล้ว';
  });
  for(const event of ['input','change','click']) document.addEventListener(event,e=>{
    if(section.contains(e.target)) return;
    if(e.target.closest('main') && (e.target.matches('input,select,textarea') || e.target.closest('[data-bulk]'))) invalidate();
  });
  window.addEventListener('ep-session-loaded',invalidate);
  invalidate();
})();
