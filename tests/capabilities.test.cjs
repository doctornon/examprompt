const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync('capabilities.js','utf8'),context);
const cap=context.window.EPCap;
const settings=(evidence='unconfirmed',reasoning='auto',batch=0)=>cap.setSession({evidence,reasoning,batch});
const spec={core:'CORE_FIXED',rules:'RULES_FIXED',blueprint:'BLUEPRINT_FIXED',fmt:'FORMAT_FIXED',check:'CHECK_FIXED',hardRules:'HARD_FIXED',capLine:'CAP_FIXED',nWanted:10,machineFormat:true,task:'TASK_FIXED'};
test('every registered combination preserves content and bounds the round plan',()=>{
 settings();
 for(const [provider,cfg] of Object.entries(cap.PROVIDERS)) for(const plan of cfg.plans) for(const model of cfg.models[plan]) {
  const profile=cap.profile(provider,plan,model),out=cap.compose(spec,profile);
  for(const text of ['CORE_FIXED','RULES_FIXED','BLUEPRINT_FIXED','FORMAT_FIXED','CHECK_FIXED','TASK_FIXED']) assert.ok(out.text.includes(text),model+' '+text);
  assert.equal(profile.web,false);
  assert.ok(out.plan.per<=profile.items);
  if(profile.schema==='loose') assert.ok(out.plan.per<=3);
  if(out.plan.split) assert.equal(out.plan.per*(out.plan.rounds-1)+out.plan.last,10);
  assert.ok(!out.text.includes('ขอส่งเป็นตารางแทน'));
  assert.ok(!out.text.includes('เมื่อแสดงผลครบแล้ว'));
 }
});
test('session overrides affect actual instructions',()=>{
 settings('provided','native',1);
 let p=cap.profile('Claude','Pro','Claude Opus 5'),o=cap.compose(spec,p);
 assert.equal(o.plan.per,1);assert.ok(o.instructions.includes('เอกสาร'));assert.equal(p.think,'native');
 settings('web','prompted',3);p=cap.profile('Claude','Pro','Claude Opus 5');o=cap.compose(spec,p);
 assert.equal(p.web,true);assert.equal(p.think,'prompted');assert.equal(o.plan.per,3);
 assert.ok(o.instructions.includes('ถ้าหาไม่ได้หรือเครื่องมือไม่พร้อม'));
});
test('invalid settings cannot mutate the previous session',()=>{
 settings();const before=JSON.stringify(cap.getSession());
 for(const bad of [null,[],{}, {evidence:'web',reasoning:'auto',batch:-1},{evidence:'web',reasoning:'fake',batch:0},{evidence:'invent',reasoning:'auto',batch:0}]){
  assert.throws(()=>cap.setSession(bad));assert.equal(JSON.stringify(cap.getSession()),before);
 }
 const external=cap.getSession();external.evidence='web';assert.equal(cap.getSession().evidence,'unconfirmed');
});
test('unknown models have conservative defaults and format-consistent plans',()=>{
 settings();const p=cap.profile('Unknown','Unknown','Unknown');
 assert.equal(p.schema,'loose');assert.equal(p.web,false);
 const o=cap.compose({...spec,nWanted:7},p);
 assert.equal(o.plan.per,3);assert.equal(o.plan.last,1);
});
test('continuation keeps total, last round, context checks and original format',()=>{
 settings();const o=cap.compose(spec,cap.profile('Copilot','Free','Quick response'));
 const next=cap.followUp('next',o.plan);
 assert.ok(next.includes('ทั้งหมด 10'));assert.ok(next.includes('ไม่เกิน 3'));assert.ok(next.includes('บริบทรอบก่อนหาย'));
 assert.ok(cap.followUp('review',o.plan).includes('ข้อมูลไม่พอ'));
});
