// Run in the local Builder 2 page using agent-browser eval --stdin.
(()=>{
 const results=[];
 const assert=(ok,name)=>{if(!ok) throw Error(name);results.push(name);};
 const original=snapshot(), prompt=buildPrompt();
 const copy=()=>JSON.parse(JSON.stringify(original));
 const invalid=[null,{}, {...copy(),_v:99}, {...copy(),n:0}, {...copy(),n:51}, {...copy(),n:1.5}, {...copy(),n:true}, {...copy(),fmt:'invalid'}, {...copy(),sel:{}}, {...copy(),model:'missing'}];
 let noCap=copy();noCap.sel.cap=[];invalid.push(noCap);
 let outOfBounds=copy();outOfBounds.sel.discipline=[999];invalid.push(outOfBounds);
 invalid.push({...copy(),session:{evidence:"fake",reasoning:"auto",batch:0}});
 for(const [i,o] of invalid.entries()){
  let rejected=false;try{applyPreset(o);}catch{rejected=true;}
  assert(rejected,'reject malformed preset '+i);
  assert(JSON.stringify(snapshot())===JSON.stringify(original),'preserve form '+i);
  assert(buildPrompt()===prompt,'preserve prompt '+i);
 }
 const next=copy();next.n='12';next.topic='หัวข้อทดสอบ <script> & ไทย';next.sel.discipline=[0,1];
 applyPreset(next);assert(JSON.stringify(snapshot())===JSON.stringify(next),'preset round trip');
 assert(buildPrompt().includes(next.topic),'Thai topic appears as text');
 for(const value of ['', '0','51','2.5']){
  $('n').value=value;assert(update()===null && $('btnCopy').disabled && $('btnSave').disabled,'invalid count blocked '+value);
 }
 for(const value of ['1','50']){ $('n').value=value;assert(typeof update()==='string'&&!$('btnCopy').disabled,'valid boundary '+value); }
 const legacy=copy();delete legacy.session;
 EPCap.setSession({evidence:'web',reasoning:'native',batch:1});
 applyPreset(legacy);
 assert(EPCap.getSession().evidence==='unconfirmed','legacy preset resets session safely');
 const configured=copy();configured.session={evidence:'provided',reasoning:'prompted',batch:3};
 applyPreset(configured);
 assert(JSON.stringify(snapshot())===JSON.stringify(configured),'session settings survive preset round trip');
 applyPreset(original);
 assert(buildPrompt()===prompt,'restore original prompt');
 return {passed:results.length,results};
})()
