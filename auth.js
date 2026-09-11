/* =============================================================
   MCQ Prompt Builder Platform · Google sign-in (Supabase Auth)
   พัฒนาโดย นายแพทย์ชานนท์ นันทวงค์ — สพพ.
   ใช้ร่วมกันทั้ง index / builder1 / builder2

   วิธีใช้ในหน้า HTML — วางก่อนปิด </body> หรือท้ายไฟล์
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="./auth.js" data-gate="1"></script>

   data-gate="1"  = หน้านี้ต้องล็อกอินก่อนถึงจะใช้ได้ (ใช้กับ builder)
   ไม่ใส่         = หน้านี้เปิดดูได้เลย แค่แสดงสถานะผู้ใช้ (ใช้กับหน้าแรก)

   จุดที่จะแสดงแถบผู้ใช้ ให้ใส่ element ที่มี id="ep-user" ไว้ในหน้า
   ถ้าไม่มี สคริปต์จะเติมให้เองในแถบบนสุด
   ============================================================= */
(function () {
  'use strict';

  // ---------- ตั้งค่า ----------
  var SUPABASE_URL = 'https://pgsuvtaigujlyhagonje.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_VJp7VnDSacGEyPaOkhfPpw_JuuCtMhJ';

  var NEEDS_AUTH = (document.currentScript &&
                    document.currentScript.dataset.gate === '1');

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[ep-auth] ไม่พบไลบรารี supabase-js — ตรวจว่าโหลด CDN ก่อน auth.js แล้วหรือยัง');
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
  });

  // ---------- เบราว์เซอร์ในแอป (LINE / Facebook / IG) เปิด Google OAuth ไม่ได้ ----------
  var UA = navigator.userAgent || '';
  var IN_APP = /\bLine\//i.test(UA) || /FBAN|FBAV|FB_IAB/i.test(UA) ||
               /Instagram/i.test(UA) || /MicroMessenger/i.test(UA);

  // ---------- CSS ----------
  var css = document.createElement('style');
  css.textContent = [
    '#ep-gate{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:24px;',
    '  background:var(--ground,#eaf0ee);font-family:var(--font,"IBM Plex Sans Thai",system-ui,sans-serif)}',
    '#ep-gate[hidden]{display:none}',
    '.ep-card{max-width:430px;width:100%;background:var(--surface,#fff);border:1px solid var(--border,#dae3e0);',
    '  border-radius:16px;padding:30px 28px;box-shadow:0 10px 40px rgba(18,33,31,.12);text-align:center}',
    '.ep-card h2{margin:0 0 8px;font-size:19px;font-weight:600;color:var(--ink,#12211f)}',
    '.ep-card p{margin:0 0 20px;font-size:13.5px;line-height:1.6;color:var(--ink-soft,#41524f)}',
    '.ep-gbtn{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;cursor:pointer;',
    '  border:1px solid var(--border-strong,#c1cecb);background:var(--surface,#fff);color:var(--ink,#12211f);',
    '  font-family:inherit;font-size:14.5px;font-weight:500;padding:12px 18px;border-radius:999px}',
    '.ep-gbtn:hover{border-color:var(--accent,#0e7c6b)}',
    '.ep-gbtn svg{width:18px;height:18px;flex:0 0 auto}',
    '.ep-note{margin:16px 0 0;font-size:11.5px;color:var(--muted,#6c7d79);line-height:1.6}',
    '.ep-err{margin:14px 0 0;font-size:12.5px;color:#bd4230;line-height:1.55;display:none}',
    '.ep-copy{margin-top:12px;font-family:var(--mono,monospace);font-size:11.5px;word-break:break-all;',
    '  background:var(--surface-2,#f4f8f6);border:1px solid var(--border,#dae3e0);border-radius:8px;padding:9px 11px;color:var(--ink-soft,#41524f)}',
    '.ep-back{display:inline-block;margin-top:16px;font-size:12.5px;color:var(--muted,#6c7d79);text-decoration:none}',
    '.ep-back:hover{color:var(--accent,#0e7c6b)}',
    'html.ep-locked,html.ep-locked body{overflow:hidden}',
    // user chip
    '#ep-user{display:flex;align-items:center;gap:8px;font-family:var(--font,system-ui,sans-serif)}',
    '.ep-chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border,#dae3e0);',
    '  background:var(--surface,#fff);border-radius:999px;padding:3px 4px 3px 11px;font-size:12.5px;color:var(--ink-soft,#41524f)}',
    '.ep-chip img{width:23px;height:23px;border-radius:50%;display:block}',
    '.ep-chip .ep-nm{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.ep-mini{cursor:pointer;font-family:inherit;font-size:12.5px;padding:6px 14px;border-radius:999px;',
    '  border:1px solid var(--border-strong,#c1cecb);background:transparent;color:var(--ink-soft,#41524f)}',
    '.ep-mini:hover{border-color:var(--accent,#0e7c6b);color:var(--accent,#0e7c6b)}'
  ].join('');
  document.head.appendChild(css);

  var GOOGLE_SVG =
    '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.9 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.9c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.3-10.2 7.3-17.5z"/>' +
    '<path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z"/>' +
    '<path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>' +
    '</svg>';

  // ---------- ประตูล็อกอิน ----------
  function buildGate() {
    var g = document.createElement('div');
    g.id = 'ep-gate';
    g.hidden = true;
    g.innerHTML =
      '<div class="ep-card">' +
        '<h2>ต้องลงชื่อเข้าใช้ก่อน</h2>' +
        '<p>เครื่องมือออกข้อสอบเปิดให้อาจารย์ที่ลงชื่อเข้าใช้ด้วยบัญชี Google ' +
           'หน้าเลือกเครื่องมือยังเปิดดูได้ตามปกติโดยไม่ต้องเข้าสู่ระบบ</p>' +
        '<button class="ep-gbtn" id="ep-signin">' + GOOGLE_SVG + 'ลงชื่อเข้าใช้ด้วย Google</button>' +
        '<p class="ep-err" id="ep-err"></p>' +
        '<p class="ep-note">ระบบขอเพียงชื่อ อีเมล และรูปโปรไฟล์ เพื่อใช้บันทึกผังข้อสอบของท่าน ' +
           'ไม่มีการเข้าถึงอีเมลหรือไฟล์ใด ๆ ใน Google ของท่าน</p>' +
        '<a class="ep-back" href="#" id="ep-switch">ใช้บัญชี Google อื่น</a><br>' +
        '<a class="ep-back" href="./">← กลับไปหน้าเลือกเครื่องมือ</a>' +
      '</div>';
    document.body.appendChild(g);
    g.querySelector('#ep-signin').addEventListener('click', function () { signIn(false); });
    g.querySelector('#ep-switch').addEventListener('click', function (e) { e.preventDefault(); signIn(true); });
    return g;
  }

  function showInAppWarning(gate) {
    gate.querySelector('.ep-card').innerHTML =
      '<h2>เปิดในเบราว์เซอร์ปกติก่อนนะครับ</h2>' +
      '<p>ตอนนี้กำลังเปิดผ่านเบราว์เซอร์ในแอป (เช่น LINE หรือ Facebook) ซึ่ง Google ไม่อนุญาตให้ลงชื่อเข้าใช้ ' +
         'กรุณากดเมนูมุมขวาบนแล้วเลือก “เปิดในเบราว์เซอร์” หรือคัดลอกลิงก์ด้านล่างไปวางใน Chrome หรือ Safari</p>' +
      '<div class="ep-copy">' + location.href + '</div>' +
      '<button class="ep-mini" id="ep-cp" style="margin-top:14px">คัดลอกลิงก์</button>';
    var b = gate.querySelector('#ep-cp');
    b.addEventListener('click', function () {
      navigator.clipboard.writeText(location.href)
        .then(function () { b.textContent = 'คัดลอกแล้ว'; })
        .catch(function () { b.textContent = 'คัดลอกไม่สำเร็จ'; });
    });
  }

  function signIn(pickAccount) {
    var err = document.getElementById('ep-err');
    sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: location.origin + location.pathname,
        queryParams: (pickAccount === true ? { prompt: 'select_account' } : {})
      }
    }).then(function (r) {
      if (r.error && err) { err.style.display = 'block'; err.textContent = 'เข้าสู่ระบบไม่สำเร็จ: ' + r.error.message; }
    });
  }

  function signOut() {
    sb.auth.signOut().then(function () { location.reload(); });
  }

  // ---------- แถบสถานะผู้ใช้ ----------
  function userSlot() {
    var el = document.getElementById('ep-user');
    if (el) return el;
    var host = document.querySelector('.xnav-in') || document.querySelector('.top-inner');
    if (!host) return null;
    el = document.createElement('div');
    el.id = 'ep-user';
    el.style.marginLeft = '10px';
    host.appendChild(el);
    return el;
  }

  function renderUser(user) {
    var el = userSlot();
    if (!el) return;
    if (!user) {
      el.innerHTML = '<button class="ep-mini" id="ep-in2">ลงชื่อเข้าใช้</button>';
      el.querySelector('#ep-in2').addEventListener('click', function () { signIn(false); });
      return;
    }
    var m = user.user_metadata || {};
    var name = m.full_name || m.name || (user.email || '').split('@')[0];
    var pic = m.avatar_url || m.picture || '';
    el.innerHTML =
      '<span class="ep-chip" title="' + (user.email || '') + '">' +
        '<span class="ep-nm">' + name.replace(/[<>&]/g, '') + '</span>' +
        (pic ? '<img src="' + pic + '" alt="" referrerpolicy="no-referrer">' : '') +
      '</span>' +
      '<button class="ep-mini" id="ep-out">ออก</button>';
    el.querySelector('#ep-out').addEventListener('click', signOut);
  }

  // ---------- เริ่มทำงาน ----------
  var gate = NEEDS_AUTH ? buildGate() : null;
  if (NEEDS_AUTH) {
    gate.hidden = false;                                   // ปิดหน้าไว้ก่อนจนกว่าจะรู้ผล
    document.documentElement.classList.add('ep-locked');
    if (IN_APP) showInAppWarning(gate);
  }

  function apply(session) {
    var user = session && session.user;
    currentUser = user || null;
    renderUser(user);
    if (NEEDS_AUTH) {
      var ok = !!user;
      gate.hidden = ok;
      document.documentElement.classList.toggle('ep-locked', !ok);
      if (!ok && IN_APP) { gate.hidden = false; document.documentElement.classList.add('ep-locked'); }
    }
  }

  // ---------- โปรไฟล์ + คิวรอ ----------
  var profile = null, ready = false, queue = [];
  function fire() {
    ready = true;
    var q = queue; queue = [];
    q.forEach(function (cb) { try { cb(currentUser, profile); } catch (e) { console.error(e); } });
  }
  var currentUser = null;

  function loadProfile(user) {
    return sb.from('ep_profiles').select('*').eq('id', user.id).maybeSingle()
      .then(function (r) {
        profile = r.data || null;
        applyProfileUI();
        return profile;
      });
  }

  // แสดงเมนูผู้ดูแลระบบ และกันบัญชีที่ถูกระงับ
  function applyProfileUI() {
    var isAdmin = !!(profile && profile.role === 'admin');
    [].forEach.call(document.querySelectorAll('[data-admin-only]'), function (el) {
      el.hidden = !isAdmin;
    });
    if (profile && profile.active === false) blockSuspended();
  }

  function blockSuspended() {
    var g = document.getElementById('ep-gate') || buildGate();
    g.hidden = false;
    document.documentElement.classList.add('ep-locked');
    g.querySelector('.ep-card').innerHTML =
      '<h2>บัญชีนี้ถูกระงับการใช้งาน</h2>' +
      '<p>ผู้ดูแลระบบได้ระงับการเข้าใช้งานของบัญชีนี้ไว้ หากคิดว่าเป็นความผิดพลาด ' +
         'กรุณาติดต่อผู้ดูแลระบบของแพลตฟอร์ม</p>' +
      '<button class="ep-mini" id="ep-out2">ออกจากระบบ</button>';
    g.querySelector('#ep-out2').addEventListener('click', signOut);
  }

  var touched = false;
  function touch(user) {
    if (touched) return;
    touched = true;
    var m = user.user_metadata || {};
    // ห้ามเขียนทับ full_name ที่ผู้ใช้กรอกเองตอนลงทะเบียน
    sb.from('ep_profiles').update({
      last_seen_at: new Date().toISOString(),
      email: user.email,
      avatar_url: m.avatar_url || m.picture || null
    }).eq('id', user.id).then(function () {}, function () {});
  }

  sb.auth.getSession().then(function (r) {
    apply(r.data.session);
    var u = r.data.session && r.data.session.user;
    if (u) { loadProfile(u).then(fire, fire); } else { fire(); }
    // เก็บกวาด query string ที่ Supabase แนบกลับมาหลังล็อกอิน
    if (/[?&](code|error)=/.test(location.search)) {
      history.replaceState({}, '', location.pathname);
    }
  });
  sb.auth.onAuthStateChange(function (evt, session) {
    apply(session);
    if (evt === 'SIGNED_IN' && session && session.user) touch(session.user);
  });

  // ---------- บันทึกการใช้งานลง ep_events ----------
  function log(payload) {
    if (!currentUser) return Promise.resolve();
    var row = {
      user_id: currentUser.id,
      builder: payload.builder,
      action: payload.action || 'generate',
      step: payload.step || null,
      model: payload.model || null,
      n_items: payload.n_items || null,
      disciplines: payload.disciplines || [],
      systems: payload.systems || [],
      tasks: payload.tasks || [],
      taxonomy: payload.taxonomy || null,
      difficulty: payload.difficulty || null,
      out_format: payload.out_format || null,
      topic: (payload.topic || '').slice(0, 300) || null,
      prompt_version: payload.prompt_version || null,
      cap_profile: payload.cap_profile || null
    };
    return sb.from('ep_events').insert(row).then(function () {}, function (e) {
      console.warn('[ep-auth] บันทึกการใช้งานไม่สำเร็จ', e && e.message);
    });
  }

  // เปิดให้หน้าอื่นเรียกใช้ได้
  window.EPAuth = {
    client: sb,
    signIn: signIn,
    signOut: signOut,
    log: log,
    get user()    { return currentUser; },
    get profile() { return profile; },
    setProfile: function (p) { profile = p; },
    reloadProfile: function () { return currentUser ? loadProfile(currentUser) : Promise.resolve(null); },
    ready: function (cb) { if (ready) cb(currentUser, profile); else queue.push(cb); },
    getUser: function () { return sb.auth.getUser().then(function (r) { return r.data.user; }); }
  };
})();
