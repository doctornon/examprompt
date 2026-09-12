const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('capabilities.js','utf8'),context);
context.EPCap=context.window.EPCap;
vm.runInNewContext(fs.readFileSync('compare.js','utf8'),context);
const cap=context.EPCap,cmp=context.window.EPCompare;
const spec=()=>({core:'CORE',rules:'RULES',blueprint:'ผังเดียวกัน <test> & ไทย',fmt:'FORMAT',check:'CHECK',hardRules:'HARD',capLine:'CAP',nWanted:7,machineFormat:true,task:'TASK'});
test('both variants use identical content but different model instructions',()=>{
 const s=spec(),a=cap.profile('Claude','Pro','Claude Opus 5'),b=cap.profile('Copilot','Free','Smart (auto)');
 const before=JSON.stringify({s,a,b,session:cap.getSession()});
 const bundle=cmp.makeBundle(s,a,b,{n:'7'},'2026-09-12T00:00:00Z');
 for(const value of [s.core,s.rules,s.blueprint,s.fmt,s.check,s.task]){
  assert.ok(bundle.variants.A.text.includes(value));assert.ok(bundle.variants.B.text.includes(value));
 }
 assert.notEqual(bundle.variants.A.text,bundle.variants.B.text);
 assert.equal(bundle.variants.A.plan.total,bundle.variants.B.plan.total);
 assert.equal(bundle.variants.B.plan.per,3);assert.equal(bundle.variants.B.plan.last,1);
 assert.equal(JSON.stringify({s,a,b,session:cap.getSession()}),before);
 assert.equal(bundle.review.results.length,0);
});
test('export freezes blueprint, profile, settings and preset together',()=>{
 const s=spec(),p=cap.profile('Claude','Free','Claude Sonnet 5'),preset={topic:'original'};
 const bundle=cmp.makeBundle(s,p,p,preset,'2026-09-12T00:00:00Z');
 assert.equal(bundle.variants.A.text,bundle.variants.B.text);
 s.blueprint='changed';p.model='changed';preset.topic='changed';
 assert.equal(bundle.shared_spec.blueprint,'ผังเดียวกัน <test> & ไทย');
 assert.equal(bundle.variants.A.profile.model,'Claude Sonnet 5');
 assert.equal(bundle.preset.topic,'original');
 const exported=JSON.parse(JSON.stringify(bundle));
 assert.equal(exported.variants.A.text,bundle.variants.A.text);
 assert.equal(exported.variants.B.profile.session.evidence,'unconfirmed');
});
