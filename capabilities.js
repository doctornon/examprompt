/* =============================================================
   MCQ Prompt Builder Platform · ชั้นปรับคำสั่งตามความสามารถของโมเดล
   พัฒนาโดย นายแพทย์ชานนท์ นันทวงค์ — สพพ.

   หลักคิด
   --------
   ชั้น "เนื้อหา" (ผังข้อสอบ ข้อกำหนด 4 ข้อ กฎ NBME เพดานแพทยสภา)
   ต้องเหมือนกันทุกโมเดลโดยไม่มีข้อยกเว้น เพราะถ้าต่างกัน ข้อสอบที่ได้
   จะไม่เทียบเท่ากันและใช้รวมคลังเดียวกันไม่ได้

   ชั้น "ห่อ" (แบ่งกี่รอบ ขอโครงสร้างเข้มแค่ไหน ให้ตรวจตัวเองแบบไหน
   ต้องย้ำข้อห้ามท้ายคำสั่งหรือไม่ ใช้ XML หรือ Markdown) ปรับได้
   เพราะไม่กระทบตัวข้อสอบ

   จึงไม่ผูกกับยี่ห้อ แต่แปลงยี่ห้อ+แพ็กเกจ+รุ่น เป็นค่าความสามารถ 6 ตัว
   เวลามีรุ่นใหม่ออก ให้เพิ่มบรรทัดใน MODEL_CAPS พอ ไม่ต้องเขียน adapter ใหม่

   ค่าความสามารถ 6 ตัว
     items   งบ context — แนะนำจำนวนข้อต่อหนึ่งคำสั่ง
     syntax  โครงคำสั่งที่โมเดลตอบสนองดีที่สุด  xml | md
     schema  ความแม่นในการทำตามสคีมา          strict | good | loose
     web     มีเครื่องมือค้นเว็บให้ใช้หรือไม่      true | false
     think   โหมดคิดก่อนตอบ                    native | prompted | none
     drift   แนวโน้มหลุดขอบเขตเมื่อคำสั่งยาว     low | med | high
   ============================================================= */
(function () {
  'use strict';

  var VERSION = 'cap-2026.09-1';

  /* ---------- ยี่ห้อ แพ็กเกจ และรุ่น ---------- */
  var PROVIDERS = {
    'Claude': {
      plans: ['Free', 'Pro', 'Max', 'Team', 'Enterprise'],
      models: {
        Free: ['Claude Sonnet 5', 'Claude Haiku 4.5'],
        Pro: ['Claude Sonnet 5', 'Claude Opus 5', 'Claude Haiku 4.5'],
        Max: ['Claude Opus 5', 'Claude Sonnet 5', 'Claude Haiku 4.5', 'Claude Fable 5'],
        Team: ['Claude Sonnet 5', 'Claude Opus 5', 'Claude Haiku 4.5'],
        Enterprise: ['Claude Opus 5', 'Claude Sonnet 5', 'Claude Haiku 4.5', 'Claude Fable 5']
      }
    },
    'ChatGPT': {
      plans: ['Free', 'Go', 'Plus', 'Pro', 'Business', 'Enterprise'],
      models: {
        Free: ['GPT-5.5 Instant', 'GPT-5.5 mini'],
        Go: ['GPT-5.5 Instant', 'GPT-5.5 Thinking', 'GPT-5.5 mini'],
        Plus: ['GPT-5.5 Thinking', 'GPT-5.5 Instant', 'GPT-5.3', 'GPT-5.5 mini'],
        Pro: ['GPT-5.5 Pro', 'GPT-5.5 Thinking', 'GPT-5.5 Instant', 'GPT-5.3'],
        Business: ['GPT-5.5 Thinking', 'GPT-5.5 Instant', 'GPT-5.3'],
        Enterprise: ['GPT-5.5 Pro', 'GPT-5.5 Thinking', 'GPT-5.5 Instant', 'GPT-5.3']
      }
    },
    'Gemini': {
      plans: ['Free', 'Google AI Plus', 'Google AI Pro', 'Google AI Ultra'],
      models: {
        'Free': ['Gemini 3 Flash', 'Gemini 3.1 Flash-Lite'],
        'Google AI Plus': ['Gemini 3.1 Pro', 'Gemini 3 Flash'],
        'Google AI Pro': ['Gemini 3.1 Pro', 'Gemini 3 Flash', 'Gemini 3.1 Flash-Lite'],
        'Google AI Ultra': ['Gemini 3.1 Pro', 'Deep Think (Ultra)', 'Gemini 3 Flash']
      }
    },
    'Perplexity': {
      plans: ['Free', 'Pro', 'Max'],
      models: {
        'Free': ['Sonar'],
        'Pro': ['Sonar Reasoning', 'Sonar', 'Research'],
        'Max': ['Research', 'Sonar Reasoning', 'Sonar']
      }
    },
    'Copilot': {
      plans: ['Free', 'Copilot Pro', 'Microsoft 365 Copilot'],
      models: {
        'Free': ['Smart (auto)', 'Quick response'],
        'Copilot Pro': ['Think Deeper (GPT-5)', 'Smart (auto)'],
        'Microsoft 365 Copilot': ['Think Deeper (GPT-5)', 'Smart (auto)']
      }
    },
    'DeepSeek': {
      plans: ['Free (เว็บ)', 'API'],
      models: {
        'Free (เว็บ)': ['DeepSeek-V3.2', 'DeepSeek-R1 (reasoning)'],
        'API': ['DeepSeek-V3.2', 'DeepSeek-R1 (reasoning)']
      }
    },
    'อื่น ๆ / รุ่นที่ยังไม่อยู่ในรายการ': {
      plans: ['Free', 'แบบเสียเงิน'],
      models: { 'Free': ['ไม่ระบุรุ่น'], 'แบบเสียเงิน': ['ไม่ระบุรุ่น'] }
    }
  };

  /* ---------- ค่าความสามารถรายรุ่น ----------
     แก้ตรงนี้เมื่อมีรุ่นใหม่ ไม่ต้องแตะโค้ดส่วนอื่น
     ค่าเหล่านี้เป็นค่าตั้งต้นเชิงปฏิบัติ ไม่ใช่สเปกทางการของผู้ผลิต
     ควรปรับตามที่ใช้จริงแล้วได้ผลดี                                   */
  var MODEL_CAPS = {
    'Claude Opus 5':        { items: 25, schema: 'strict', think: 'native',   drift: 'low' },
    'Claude Fable 5':       { items: 25, schema: 'strict', think: 'native',   drift: 'low' },
    'Claude Sonnet 5':      { items: 20, schema: 'strict', think: 'native',   drift: 'low' },
    'Claude Haiku 4.5':     { items: 8,  schema: 'good',   think: 'prompted', drift: 'med' },

    'GPT-5.5 Pro':          { items: 25, schema: 'strict', think: 'native',   drift: 'low' },
    'GPT-5.5 Thinking':     { items: 20, schema: 'strict', think: 'native',   drift: 'low' },
    'GPT-5.5 Instant':      { items: 12, schema: 'good',   think: 'prompted', drift: 'med' },
    'GPT-5.3':              { items: 15, schema: 'good',   think: 'prompted', drift: 'med' },
    'GPT-5.5 mini':         { items: 6,  schema: 'loose',  think: 'none',     drift: 'high' },

    'Gemini 3.1 Pro':       { items: 20, schema: 'good',   think: 'native',   drift: 'med' },
    'Deep Think (Ultra)':   { items: 25, schema: 'good',   think: 'native',   drift: 'low' },
    'Gemini 3 Flash':       { items: 10, schema: 'good',   think: 'prompted', drift: 'high' },
    'Gemini 3.1 Flash-Lite':{ items: 5,  schema: 'loose',  think: 'none',     drift: 'high' },

    'Research':             { items: 8,  schema: 'loose',  think: 'native',   drift: 'med' },
    'Sonar Reasoning':      { items: 6,  schema: 'loose',  think: 'native',   drift: 'med' },
    'Sonar':                { items: 4,  schema: 'loose',  think: 'none',     drift: 'high' },

    'Think Deeper (GPT-5)': { items: 15, schema: 'good',   think: 'native',   drift: 'med' },
    'Smart (auto)':         { items: 8,  schema: 'loose',  think: 'prompted', drift: 'high' },
    'Quick response':       { items: 4,  schema: 'loose',  think: 'none',     drift: 'high' },

    'DeepSeek-R1 (reasoning)': { items: 15, schema: 'good', think: 'native',   drift: 'med' },
    'DeepSeek-V3.2':        { items: 10, schema: 'good',   think: 'prompted', drift: 'med' },

    'ไม่ระบุรุ่น':            { items: 5,  schema: 'loose',  think: 'prompted', drift: 'high' }
  };

  var XML_PROVIDERS = { 'Claude': 1 };
  /* แพ็กเกจฟรีมักถูกจำกัดความยาวต่อรอบและโควตาต่อวัน จึงลดจำนวนข้อต่อรอบลง */
  var FREE_PLANS = { 'Free': 1, 'Free (เว็บ)': 1 };
  /* ค้นเว็บได้หรือไม่ — ประเมินจากตัวผลิตภัณฑ์แชท ไม่ใช่ตัวโมเดล */
  function hasWeb(provider, plan) {
    if (provider === 'Perplexity') return true;
    if (provider === 'DeepSeek') return plan !== 'API';
    if (provider.indexOf('อื่น') === 0) return false;
    return true;                       // Claude / ChatGPT / Gemini / Copilot มีค้นเว็บให้ใช้
  }

  function profile(provider, plan, model) {
    var base = MODEL_CAPS[model] || MODEL_CAPS['ไม่ระบุรุ่น'];
    var items = base.items;
    if (FREE_PLANS[plan]) items = Math.max(3, Math.round(items * 0.6));
    return {
      provider: provider, plan: plan, model: model,
      items: items,
      syntax: XML_PROVIDERS[provider] ? 'xml' : 'md',
      schema: base.schema,
      think: base.think,
      drift: base.drift,
      web: hasWeb(provider, plan),
      version: VERSION
    };
  }

  /* ---------- แผนการแบ่งรอบ ---------- */
  function rounds(nWanted, prof) {
    var n = Math.max(1, parseInt(nWanted, 10) || 1);
    var per = prof.items;
    if (n <= per) return { rounds: 1, per: n, total: n, split: false };
    var r = Math.ceil(n / per);
    return { rounds: r, per: Math.ceil(n / r), total: n, split: true };
  }

  /* ---------- ข้อความของชั้นห่อ ---------- */
  function thinkBlock(prof) {
    if (prof.think === 'native')
      return 'วิธีทำงาน: ตรวจข้อสอบทุกข้อด้วยรายการตรวจสอบในใจให้ครบก่อน แก้ข้อที่ไม่ผ่านให้เรียบร้อย ' +
             'แล้วแสดงเฉพาะผลลัพธ์สุดท้าย ห้ามแสดงกระบวนการตรวจสอบ';
    if (prof.think === 'prompted')
      return 'วิธีทำงาน ทำตามลำดับนี้\n' +
             'ขั้นที่ 1 เลือกโรคหรือภาวะให้ครบจำนวนตามผัง กระจายไม่ให้ซ้ำกัน\n' +
             'ขั้นที่ 2 ร่างข้อสอบทีละข้อจนครบ\n' +
             'ขั้นที่ 3 ตรวจทุกข้อด้วยรายการตรวจสอบ แล้วแก้ข้อที่ไม่ผ่าน\n' +
             'ขั้นที่ 4 แสดงเฉพาะผลลัพธ์สุดท้าย ห้ามแสดงขั้นที่ 1 ถึง 3';
    return 'วิธีทำงาน: รุ่นนี้ไม่มีโหมดคิดก่อนตอบ ให้ทำทีละข้อจนครบจำนวน ' +
           'เมื่อแสดงผลครบแล้วให้ขึ้นหัวข้อ "ผลการตรวจสอบ" แล้วไล่ตรวจข้อสอบที่เพิ่งเขียนทีละข้อตามรายการตรวจสอบ ' +
           'ข้อใดไม่ผ่านให้เขียนข้อนั้นใหม่ทันทีในย่อหน้าถัดไป';
  }

  function schemaBlock(prof, wantsMachineFormat) {
    if (!wantsMachineFormat) return null;
    if (prof.schema === 'strict') return null;
    if (prof.schema === 'good')
      return 'ข้อกำหนดเรื่องโครงสร้างผลลัพธ์: ห้ามมีข้อความอธิบายใด ๆ นอกโครงสร้างที่กำหนด ' +
             'ห้ามครอบด้วย code fence ห้ามใส่คำนำหรือคำลงท้าย และต้องมีทุกฟิลด์ครบทุกข้อแม้ค่าจะว่าง';
    return 'ข้อกำหนดเรื่องโครงสร้างผลลัพธ์: รุ่นนี้มักทำโครงสร้างข้อมูลหลุดเมื่อออกหลายข้อพร้อมกัน ' +
           'ให้ออกครั้งละไม่เกิน 3 ข้อ ตรวจว่าวงเล็บและเครื่องหมายคำพูดปิดครบก่อนส่ง ' +
           'และถ้าไม่มั่นใจว่าจะถูกต้อง ให้แจ้งกลับว่าขอส่งเป็นตารางแทน ดีกว่าส่งโครงสร้างที่เสีย';
  }

  function webBlock(prof) {
    if (prof.web)
      return 'การอ้างอิง: ก่อนตัดสินว่าตัวเลือกใดถูกที่สุด ให้ค้นแนวเวชปฏิบัติปัจจุบันของหัวข้อนั้น ' +
             'โดยให้น้ำหนักกับแนวทางของราชวิทยาลัยหรือสมาคมวิชาชีพในประเทศไทยก่อน แล้วจึงใช้แนวทางสากลเสริม ' +
             'แนบชื่อแนวทางและปีที่ใช้กำกับทุกข้อ';
    return 'การอ้างอิง: เครื่องมือนี้ค้นเว็บไม่ได้ ห้ามสร้างชื่อแนวทาง ปีที่พิมพ์ เลขหน้า หรือลิงก์ขึ้นเอง ' +
           'ถ้าคำตอบอิงความรู้ทั่วไปให้เขียนกำกับว่า "อิงความรู้เวชปฏิบัติทั่วไป ต้องให้ผู้เชี่ยวชาญตรวจสอบก่อนใช้" ' +
           'และถ้าหัวข้อใดมีแนวทางที่เปลี่ยนบ่อย ให้ระบุเตือนไว้ว่าต้องตรวจกับฉบับล่าสุด';
  }

  function roundBlock(plan) {
    if (!plan.split) return null;
    return 'การแบ่งรอบ: ต้องการทั้งหมด ' + plan.total + ' ข้อ แต่รุ่นที่ใช้เหมาะกับรอบละ ' + plan.per + ' ข้อ ' +
           'ให้ออกเฉพาะรอบที่ 1 จำนวน ' + plan.per + ' ข้อก่อน แล้วหยุดรอคำสั่ง ' +
           'เมื่อผู้ใช้พิมพ์ว่า "รอบต่อไป" จึงออกชุดถัดไปโดยใช้ผังเดิมทุกประการ ' +
           'ห้ามออกโรคหรือภาวะซ้ำกับรอบก่อนหน้า และให้ไล่หมายเลขข้อต่อเนื่องจนครบ ' + plan.total + ' ข้อ';
  }

  function tailBlock(prof, hardRules, capLine) {
    if (prof.drift === 'low') return null;
    var t = 'ย้ำก่อนตอบ ห้ามละเมิดข้อใดข้อหนึ่งต่อไปนี้\n' + hardRules;
    if (prof.drift === 'high' && capLine) t += '\n' + capLine;
    return t;
  }

  /* ---------- ประกอบคำสั่ง ----------
     s = { core, rules, blueprint, fmt, check, hardRules, capLine, nWanted, machineFormat, task } */
  function compose(s, prof) {
    var plan = rounds(s.nWanted, prof);
    var wrap = [];
    var rb = roundBlock(plan);          if (rb) wrap.push(rb);
    wrap.push(thinkBlock(prof));
    var sb = schemaBlock(prof, s.machineFormat); if (sb) wrap.push(sb);
    wrap.push(webBlock(prof));
    var tail = tailBlock(prof, s.hardRules, s.capLine);

    var out;
    if (prof.syntax === 'xml') {
      out = '<role>\n' + s.core + '\n</role>\n\n' +
            '<item_writing_rules>\n' + s.rules + '\n</item_writing_rules>\n\n' +
            '<blueprint>\n' + s.blueprint + '\n</blueprint>\n\n' +
            '<output_format>\n' + s.fmt + '\n</output_format>\n\n' +
            '<self_check>\n' + s.check + '\n</self_check>\n\n' +
            '<how_to_work>\n' + wrap.join('\n\n') + '\n</how_to_work>\n\n' +
            '<task>\n' + (s.task || 'ร่างข้อสอบตาม blueprint ข้างต้น') + '\n</task>';
      if (tail) out += '\n\n<final_reminder>\n' + tail + '\n</final_reminder>';
    } else {
      out = '# บทบาทและข้อกำหนดบังคับ\n' + s.core + '\n\n' +
            '# กฎการเขียนข้อสอบ\n' + s.rules + '\n\n' +
            '# ผังข้อสอบที่สั่ง\n' + s.blueprint + '\n\n' +
            '# รูปแบบผลลัพธ์\n' + s.fmt + '\n\n' +
            '# รายการตรวจสอบก่อนตอบ\n' + s.check + '\n\n' +
            '# วิธีทำงาน\n' + wrap.join('\n\n');
      if (tail) out += '\n\n# ย้ำอีกครั้ง\n' + tail;
    }
    return { text: out, plan: plan, profile: prof };
  }

  /* ---------- คำอธิบายให้ผู้ใช้เห็นว่าปรับอะไรไปบ้าง ---------- */
  function describe(prof, plan) {
    var d = [];
    d.push(['จำนวนข้อต่อรอบ', plan && plan.split
      ? 'แบ่ง ' + plan.rounds + ' รอบ รอบละ ' + plan.per + ' ข้อ'
      : 'ออกครบในรอบเดียว (เหมาะสุดที่ ' + prof.items + ' ข้อ)']);
    d.push(['โครงคำสั่ง', prof.syntax === 'xml' ? 'ห่อด้วยแท็ก XML' : 'หัวข้อ Markdown']);
    d.push(['การตรวจตัวเอง', prof.think === 'native' ? 'ตรวจในใจแล้วแสดงเฉพาะผลลัพธ์'
      : prof.think === 'prompted' ? 'สั่งทำเป็นขั้น 1–4 แล้วซ่อนขั้นตอน'
      : 'ให้ตรวจซ้ำเป็นรอบสองหลังแสดงผล']);
    d.push(['โครงสร้างผลลัพธ์', prof.schema === 'strict' ? 'ขอ JSON/CSV ดิบได้เต็มที่'
      : prof.schema === 'good' ? 'ขอได้ แต่เพิ่มข้อห้ามใส่ข้อความนอกโครงสร้าง'
      : 'ไม่น่าไว้ใจ — จำกัดครั้งละ 3 ข้อ และเปิดทางให้ส่งเป็นตารางแทน']);
    d.push(['การอ้างอิง', prof.web ? 'บังคับค้นแนวเวชปฏิบัติแล้วแนบชื่อและปี'
      : 'ห้ามสร้างการอ้างอิงขึ้นเอง ให้กำกับว่าอิงความรู้ทั่วไป']);
    d.push(['ย้ำข้อห้ามท้ายคำสั่ง', prof.drift === 'low' ? 'ไม่ต้อง'
      : prof.drift === 'med' ? 'ย้ำข้อกำหนด 4 ข้อ' : 'ย้ำข้อกำหนด 4 ข้อ และเพดานเกณฑ์แพทยสภา']);
    return d;
  }

  window.EPCap = {
    VERSION: VERSION,
    PROVIDERS: PROVIDERS,
    MODEL_CAPS: MODEL_CAPS,
    profile: profile,
    rounds: rounds,
    compose: compose,
    describe: describe
  };
})();
