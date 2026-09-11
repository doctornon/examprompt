/* =============================================================
   MCQ Prompt Builder Platform · หน้าลงทะเบียนผู้ใช้หลังล็อกอิน
   พัฒนาโดย นายแพทย์ชานนท์ นันทวงค์ — สพพ.

   โหลดหลัง auth.js เสมอ
     <script defer src="./auth.js" data-gate="1"></script>
     <script defer src="./profile.js"></script>

   ถ้า ep_profiles.onboarded_at ยังว่าง จะบังคับกรอกก่อนใช้งาน
   ============================================================= */
(function () {
  'use strict';

  /* ---------- ชุดสาขาเฉพาะทาง (แพทยสภา ข้อบังคับ พ.ศ. 2552) ---------- */
  var SPECIALTIES = [
    ['กุมารเวชศาสตร์ (Pediatrics)', [
      'ตจวิทยา', 'ทารกแรกเกิดและปริกำเนิด', 'ประสาทวิทยา', 'พัฒนาการและพฤติกรรม',
      'โรคต่อมไร้ท่อและเมตาบอลิสม', 'โรคติดเชื้อ', 'โรคไต', 'โรคทางเดินอาหารและโรคตับ',
      'โรคภูมิแพ้และภูมิคุ้มกัน', 'โรคระบบการหายใจ', 'โรคหัวใจ']],
    ['กุมารศัลยศาสตร์ (Pediatric Surgery)', []],
    ['จักษุวิทยา (Ophthalmology)', []],
    ['จิตเวชศาสตร์ (Psychiatry)', []],
    ['จิตเวชศาสตร์เด็กและวัยรุ่น (Child and Adolescent Psychiatry)', []],
    ['ตจวิทยา (Dermatology)', []],
    ['นิติเวชศาสตร์ (Forensic Medicine)', []],
    ['ประสาทวิทยา (Neurology)', []],
    ['ประสาทศัลยศาสตร์ (Neurological Surgery)', []],
    ['พยาธิวิทยากายวิภาค (Anatomical Pathology)', []],
    ['พยาธิวิทยาคลินิก (Clinical Pathology)', []],
    ['พยาธิวิทยาทั่วไป (Anatomical and Clinical Pathology)', []],
    ['รังสีรักษาและมะเร็งวิทยา (Radiotherapy and Oncology)', []],
    ['รังสีวิทยาทั่วไป (General Radiology)', []],
    ['รังสีวิทยาวินิจฉัย (Diagnostic Radiology)', [
      'ภาพวินิจฉัยชั้นสูง', 'ภาพวินิจฉัยระบบประสาท', 'รังสีร่วมรักษาของลำตัว', 'รังสีร่วมรักษาระบบประสาท']],
    ['วิสัญญีวิทยา (Anesthesiology)', [
      'วิสัญญีสำหรับการผ่าตัดหัวใจ หลอดเลือดใหญ่ และทรวงอก', 'วิสัญญีสำหรับผู้ป่วยโรคทางระบบประสาท',
      'การระงับปวด', 'เวชบำบัดวิกฤต']],
    ['เวชศาสตร์ครอบครัว (Family Medicine)', []],
    ['เวชศาสตร์ฉุกเฉิน (Emergency Medicine)', []],
    ['เวชศาสตร์นิวเคลียร์ (Nuclear Medicine)', []],
    ['เวชศาสตร์ป้องกัน (Preventive Medicine)', [
      'ระบาดวิทยา', 'เวชศาสตร์การบิน', 'เวชศาสตร์ป้องกันคลินิก', 'สาธารณสุขศาสตร์',
      'สุขภาพจิตชุมชน', 'อาชีวเวชศาสตร์']],
    ['เวชศาสตร์ฟื้นฟู (Rehabilitation Medicine)', []],
    ['ศัลยศาสตร์ (Surgery)', [
      'ศัลยศาสตร์ตกแต่งและเสริมสร้างใบหน้า', 'ศัลยศาสตร์มะเร็งวิทยา',
      'ศัลยศาสตร์ลำไส้ใหญ่และทวารหนัก', 'ศัลยศาสตร์หลอดเลือด', 'ศัลยศาสตร์อุบัติเหตุ']],
    ['ศัลยศาสตร์ตกแต่ง (Plastic Surgery)', []],
    ['ศัลยศาสตร์ทรวงอก (Thoracic Surgery)', []],
    ['ศัลยศาสตร์ยูโรวิทยา (Urological Surgery)', []],
    ['สูติศาสตร์-นรีเวชวิทยา (Obstetrics and Gynaecology)', [
      'มะเร็งนรีเวชวิทยา', 'เวชศาสตร์การเจริญพันธุ์', 'เวชศาสตร์มารดาและทารกในครรภ์']],
    ['โสต ศอ นาสิกวิทยา (Otolaryngology)', []],
    ['ออร์โธปิดิกส์ (Orthopedics)', []],
    ['อายุรศาสตร์ (Internal Medicine)', [
      'โรคข้อและรูมาติสซั่ม', 'โรคต่อมไร้ท่อและเมตะบอลิสม', 'โรคติดเชื้อ', 'โรคไต',
      'โรคภูมิแพ้และภูมิคุ้มกันทางคลินิก', 'ระบบทางเดินอาหาร',
      'โรคระบบการหายใจและภาวะวิกฤตระบบหายใจ', 'โรคหัวใจ', 'เวชเภสัชวิทยาและพิษวิทยา']],
    ['อายุรศาสตร์มะเร็งวิทยา (Medical Oncology)', []],
    ['อายุรศาสตร์โรคเลือด (Hematology)', ['โลหิตวิทยาและมะเร็งในเด็ก']],
    ['ยังไม่มีวุฒิบัตรสาขาเฉพาะทาง', []]
  ];

  var MED_ED = ['ECME', 'Rookies', 'SHEE', 'ไม่เคย', 'อื่น ๆ'];

  var css = document.createElement('style');
  css.textContent = [
    '#ep-onb{position:fixed;inset:0;z-index:10000;overflow:auto;padding:22px 16px 40px;',
    '  background:var(--ground,#eaf0ee);font-family:var(--font,"IBM Plex Sans Thai",system-ui,sans-serif)}',
    '#ep-onb[hidden]{display:none}',
    '.onb{max-width:640px;margin:0 auto;background:var(--surface,#fff);border:1px solid var(--border,#dae3e0);',
    '  border-radius:16px;box-shadow:0 10px 40px rgba(18,33,31,.12);overflow:hidden}',
    '.onb-h{padding:22px 24px 16px;border-bottom:1px solid var(--border,#dae3e0);display:flex;gap:13px;align-items:flex-start}',
    '.onb-h img{width:42px;height:42px;border-radius:9px;background:#fff;object-fit:contain;flex:0 0 auto}',
    '.onb-h h2{margin:0;font-size:18px;font-weight:600;color:var(--ink,#12211f)}',
    '.onb-h p{margin:4px 0 0;font-size:12.5px;line-height:1.6;color:var(--muted,#6c7d79)}',
    '.onb-b{padding:18px 24px 22px}',
    '.onb-f{margin-bottom:17px}',
    '.onb-f > label{display:block;font-size:12.5px;font-weight:600;color:var(--ink,#12211f);margin-bottom:7px}',
    '.onb-f .req{color:#bd4230;margin-left:3px}',
    '.onb-f .hint{font-weight:400;color:var(--muted,#6c7d79);font-size:11.5px;margin-left:6px}',
    '.onb input[type=text],.onb select{width:100%;font-family:inherit;font-size:14px;color:var(--ink,#12211f);',
    '  background:var(--surface,#fff);border:1px solid var(--border,#dae3e0);border-radius:9px;padding:9px 11px}',
    '.onb input:focus,.onb select:focus{outline:none;border-color:var(--accent,#0e7c6b);box-shadow:0 0 0 3px rgba(14,124,107,.12)}',
    '.onb-row{display:flex;gap:11px;flex-wrap:wrap}',
    '.onb-row > *{flex:1 1 170px;min-width:0}',
    '.pills{display:flex;gap:7px;flex-wrap:wrap}',
    '.pill{cursor:pointer;border:1px solid var(--border,#dae3e0);background:var(--surface,#fff);border-radius:999px;',
    '  padding:7px 15px;font-family:inherit;font-size:13.5px;color:var(--ink-soft,#41524f)}',
    '.pill[aria-pressed="true"]{background:var(--accent,#0e7c6b);border-color:var(--accent,#0e7c6b);color:#fff;font-weight:500}',
    '.spec-box{border:1px solid var(--border,#dae3e0);border-radius:10px;max-height:230px;overflow:auto;padding:6px 4px;background:var(--surface-2,#f4f8f6)}',
    '.spec-g{font-size:11px;font-family:var(--mono,monospace);color:var(--muted,#6c7d79);padding:7px 10px 3px}',
    '.spec-i{display:flex;gap:9px;align-items:flex-start;padding:5px 10px;cursor:pointer;font-size:13px;',
    '  line-height:1.45;color:var(--ink-soft,#41524f);border-radius:7px}',
    '.spec-i:hover{background:var(--surface,#fff)}',
    '.spec-i.sub{padding-left:26px;font-size:12.5px}',
    '.spec-i input{margin:3px 0 0;accent-color:var(--accent,#0e7c6b);flex:0 0 auto}',
    '.spec-sel{margin-top:8px;font-size:12px;color:var(--muted,#6c7d79);line-height:1.6}',
    '.spec-sel b{color:var(--accent-ink,#0a5347);font-weight:500}',
    '.onb-act{display:flex;gap:10px;align-items:center;margin-top:22px;padding-top:18px;border-top:1px solid var(--border,#dae3e0)}',
    '.onb-save{flex:1;cursor:pointer;border:none;background:var(--accent,#0e7c6b);color:#fff;font-family:inherit;',
    '  font-size:14.5px;font-weight:600;padding:12px;border-radius:999px}',
    '.onb-save:hover{filter:brightness(1.08)}',
    '.onb-save:disabled{opacity:.55;cursor:not-allowed}',
    '.onb-out{cursor:pointer;border:1px solid var(--border,#dae3e0);background:transparent;color:var(--muted,#6c7d79);',
    '  font-family:inherit;font-size:13px;padding:11px 17px;border-radius:999px}',
    '.onb-msg{margin-top:12px;font-size:12.5px;color:#bd4230;display:none;line-height:1.55}'
  ].join('');
  document.head.appendChild(css);

  var sel = { spec: [], mededu: [] };

  function esc(t) { return String(t).replace(/[<>&"]/g, function (c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

  function specHTML() {
    var h = '';
    SPECIALTIES.forEach(function (g, gi) {
      h += '<label class="spec-i"><input type="checkbox" data-sp="' + esc(g[0]) + '"><span>' + esc(g[0]) + '</span></label>';
      if (g[1].length) {
        h += '<div class="spec-g">อนุสาขาของ ' + esc(g[0].split(' (')[0]) + '</div>';
        g[1].forEach(function (sub) {
          var full = 'อนุสาขา' + sub + ' — ' + g[0].split(' (')[0];
          h += '<label class="spec-i sub"><input type="checkbox" data-sp="' + esc(full) + '"><span>' + esc(sub) + '</span></label>';
        });
      }
      if (gi < SPECIALTIES.length - 1) h += '';
    });
    return h;
  }

  function build(user, profile, centers) {
    var m = user.user_metadata || {};
    var guess = (profile && profile.full_name) || m.full_name || m.name || '';
    var parts = guess.trim().split(/\s+/);

    var box = document.createElement('div');
    box.id = 'ep-onb';
    box.innerHTML =
      '<div class="onb">' +
        '<div class="onb-h">' +
          '<img src="./mhpd-logo.png" alt="">' +
          '<div><h2>ลงทะเบียนผู้ใช้งาน</h2>' +
          '<p>กรอกครั้งเดียว เพื่อใช้แสดงผลใน dashboard และสรุปการใช้งานรายศูนย์แพทย์ฯ แก้ไขภายหลังได้</p>' +
          '<p style="margin-top:6px">บัญชี ' + esc(user.email || '') + '</p></div>' +
        '</div>' +
        '<div class="onb-b">' +
          '<div class="onb-f"><label>คำนำหน้า<span class="req">*</span></label>' +
            '<div class="pills" id="onb-prefix">' +
              '<button type="button" class="pill" data-v="นพ." aria-pressed="false">นพ.</button>' +
              '<button type="button" class="pill" data-v="พญ." aria-pressed="false">พญ.</button>' +
            '</div></div>' +

          '<div class="onb-row">' +
            '<div class="onb-f"><label for="onb-fn">ชื่อ<span class="req">*</span></label>' +
              '<input type="text" id="onb-fn" value="' + esc(parts[0] || '') + '" autocomplete="given-name"></div>' +
            '<div class="onb-f"><label for="onb-ln">นามสกุล<span class="req">*</span></label>' +
              '<input type="text" id="onb-ln" value="' + esc(parts.slice(1).join(' ')) + '" autocomplete="family-name"></div>' +
          '</div>' +

          '<div class="onb-f"><label for="onb-center">ศูนย์แพทยศาสตรศึกษาชั้นคลินิก<span class="req">*</span></label>' +
            '<select id="onb-center"><option value="">— เลือกศูนย์แพทย์ฯ —</option>' +
            centers.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') +
            '</select></div>' +

          '<div class="onb-f"><label>สาขาเฉพาะทาง<span class="hint">เลือกได้มากกว่าหนึ่ง</span></label>' +
            '<div class="spec-box" id="onb-spec">' + specHTML() + '</div>' +
            '<div class="spec-sel" id="onb-specsel">ยังไม่ได้เลือก</div></div>' +

          '<div class="onb-f"><label>เคยผ่านอบรมหลักสูตรแพทยศาสตรศึกษา<span class="req">*</span></label>' +
            '<div class="pills" id="onb-mededu">' +
              MED_ED.map(function (v) {
                return '<button type="button" class="pill" data-v="' + esc(v) + '" aria-pressed="false">' + esc(v) + '</button>';
              }).join('') +
            '</div>' +
            '<div style="margin-top:9px;display:none" id="onb-otherwrap">' +
              '<input type="text" id="onb-other" placeholder="ระบุชื่อหลักสูตรที่เคยอบรม"></div></div>' +

          '<div class="onb-act">' +
            '<button class="onb-save" id="onb-save">บันทึกและเริ่มใช้งาน</button>' +
            '<button class="onb-out" id="onb-out">ออกจากระบบ</button>' +
          '</div>' +
          '<p class="onb-msg" id="onb-msg"></p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);
    document.documentElement.style.overflow = 'hidden';

    /* คำนำหน้า — เลือกได้ตัวเดียว */
    box.querySelector('#onb-prefix').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      [].forEach.call(this.querySelectorAll('.pill'), function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
    });

    /* หลักสูตร — เลือกได้หลายตัว แต่ "ไม่เคย" ตัดตัวอื่นทิ้ง */
    box.querySelector('#onb-mededu').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      var v = b.dataset.v, on = b.getAttribute('aria-pressed') === 'true';
      if (v === 'ไม่เคย' && !on) {
        [].forEach.call(this.querySelectorAll('.pill'), function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
      } else {
        b.setAttribute('aria-pressed', on ? 'false' : 'true');
        var none = this.querySelector('.pill[data-v="ไม่เคย"]');
        if (none) none.setAttribute('aria-pressed', 'false');
      }
      var other = this.querySelector('.pill[data-v="อื่น ๆ"]');
      box.querySelector('#onb-otherwrap').style.display =
        (other && other.getAttribute('aria-pressed') === 'true') ? 'block' : 'none';
    });

    /* สาขา */
    var sb2 = box.querySelector('#onb-spec');
    sb2.addEventListener('change', function () {
      sel.spec = [].map.call(sb2.querySelectorAll('input:checked'), function (i) { return i.dataset.sp; });
      box.querySelector('#onb-specsel').innerHTML = sel.spec.length
        ? 'เลือกไว้ ' + sel.spec.length + ' รายการ — <b>' + esc(sel.spec.join(' · ')) + '</b>'
        : 'ยังไม่ได้เลือก';
    });

    box.querySelector('#onb-out').addEventListener('click', function () { window.EPAuth.signOut(); });
    box.querySelector('#onb-save').addEventListener('click', function () { save(box, user); });
    return box;
  }

  function save(box, user) {
    var msg = box.querySelector('#onb-msg');
    var btn = box.querySelector('#onb-save');
    function bad(t) { msg.style.display = 'block'; msg.textContent = t; btn.disabled = false; btn.textContent = 'บันทึกและเริ่มใช้งาน'; }

    var prefEl = box.querySelector('#onb-prefix .pill[aria-pressed="true"]');
    var prefix = prefEl && prefEl.dataset.v;
    var fn = box.querySelector('#onb-fn').value.trim();
    var ln = box.querySelector('#onb-ln').value.trim();
    var center = box.querySelector('#onb-center').value;
    var mededu = [].map.call(box.querySelectorAll('#onb-mededu .pill[aria-pressed="true"]'),
                             function (b) { return b.dataset.v; });
    var other = box.querySelector('#onb-other').value.trim();

    if (!prefix) return bad('กรุณาเลือกคำนำหน้า');
    if (!fn)     return bad('กรุณากรอกชื่อ');
    if (!ln)     return bad('กรุณากรอกนามสกุล');
    if (!center) return bad('กรุณาเลือกศูนย์แพทยศาสตรศึกษาชั้นคลินิก');
    if (!mededu.length) return bad('กรุณาเลือกหลักสูตรแพทยศาสตรศึกษา หรือเลือก "ไม่เคย"');
    if (mededu.indexOf('อื่น ๆ') > -1 && !other) return bad('กรุณาระบุชื่อหลักสูตรในช่อง "อื่น ๆ"');

    msg.style.display = 'none';
    btn.disabled = true; btn.textContent = 'กำลังบันทึก…';

    window.EPAuth.client.from('ep_profiles').update({
      prefix: prefix, first_name: fn, last_name: ln,
      full_name: prefix + fn + ' ' + ln,
      center_id: parseInt(center, 10),
      specialty: sel.spec,
      med_ed: mededu,
      med_ed_other: other || null,
      onboarded_at: new Date().toISOString()
    }).eq('id', user.id).select().maybeSingle().then(function (r) {
      if (r.error) return bad('บันทึกไม่สำเร็จ: ' + r.error.message);
      window.EPAuth.setProfile(r.data);
      box.remove();
      document.documentElement.style.overflow = '';
      var chip = document.querySelector('#ep-user .ep-nm');
      if (chip) chip.textContent = prefix + fn;
    }, function (e) { bad('บันทึกไม่สำเร็จ: ' + (e && e.message)); });
  }

  /* ---------- เริ่ม ---------- */
  function start() {
    window.EPAuth.ready(function (user, profile) {
      if (!user) return;
      if (profile && profile.onboarded_at) return;
      window.EPAuth.client.from('centers').select('id,name').order('sort_order')
        .then(function (r) { build(user, profile, r.data || []); },
              function ()  { build(user, profile, []); });
    });
  }
  if (window.EPAuth) start();
  else { var t = setInterval(function () { if (window.EPAuth) { clearInterval(t); start(); } }, 60); }
})();
