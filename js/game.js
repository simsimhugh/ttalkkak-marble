'use strict';
/* ---------- money ---------- */
function liquidate(p,need){
  const list=owned(p).sort((a,b)=>invested(a)-invested(b));
  while(p.cash<need&&list.length){
    const i=list.shift(),v=Math.round(invested(i)*0.5);
    p.cash+=v;S(i).owner=null;S(i).level=0;if(G.festival===i)G.festival=null;
    log(`${nm(p)} 자금이 부족해 ${T(i).name}을(를) ${fmt(v)}에 매각`,p);
  }
}
function pay(p,to,amt,opt={}){
  if(amt<=0)return true;
  if(!p.ai&&to&&amt>=150)SFX.sting('down');
  const before=p.cash;
  if(p.cash<amt)liquidate(p,amt);
  if(p.cash>=amt){p.cash-=amt;if(to)to.cash+=amt;else if(opt.pool)G.jackpot=(G.jackpot||0)+amt;moneyFx(p,to,amt,before,opt);return true;}
  if(hasR(p,'insurance')&&!p.insUsed){p.insUsed=true;const rest0=p.cash;p.cash=500;if(to)to.cash+=amt;moneyFx(p,to,amt,before,{...opt,quiet:true});bigEvent(`파산 보험 발동<small>${esc(p.name)} 빚 ${fmt(amt-rest0)} 탕감</small>`,'gold',2400);log(`${nm(p)} 파산 보험으로 살아남았습니다 (빚 ${fmt(amt-rest0)} 탕감).`,p);emote(p,'shock','살았다…',{priority:7});renderAll();return true;}
  const rest=p.cash;p.cash=0;if(to){to.cash+=amt;if(amt>rest)log(`${nm(to)} 파산한 ${nm(p)} 대신 은행이 부족분 ${fmt(amt-rest)}을 채워 ${fmt(amt)} 전액을 받습니다.`,to);}moneyFx(p,to,amt,before,{...opt,quiet:true});
  p.bankrupt=true;SFX.play('bankrupt');owned(p).forEach(i=>{S(i).owner=null;S(i).level=0;if(G.festival===i)G.festival=null;});
  say(`${nm(p)} 파산했습니다.`,p);bankruptFx(p);renderAll();
  const al=alive();if(al.length===1)endGame(al[0],'다른 모든 플레이어가 파산했습니다.');
  return false;
}
function gain(p,n,why){p.cash+=n;floatText(tokenPos(p),'+'+fmt(n),'#7cf29a');flashCard(p,'gain');if(why)toast(`${nm(p)} <b>+${fmt(n)}</b> · ${why}`,'good',2600);}
function checkWin(p){
  if(G.over)return;
  let groups=0;for(let g=0;g<8;g++)if(ownsGroup(p.id,g))groups++;
  if(groups>=3)return endGame(p,'색 그룹 3개를 독점했습니다 (트리플 독점).');
  for(let s=0;s<4;s++)if(sideCities(s).every(i=>S(i).owner===p.id))return endGame(p,'보드 한 변의 도시를 모두 독점했습니다 (라인 독점).');
  if(tourIdx.every(i=>S(i).owner===p.id))return endGame(p,'관광지 4곳을 모두 차지했습니다 (관광지 독점).');
}

/* ---------- movement ---------- */
async function walk(p,n){
  if(!p.ai){chase=p;freeUntil=0;}try{
  const dir=n>0?1:-1;
  for(let k=0;k<Math.abs(n);k++){
    p.pos=(p.pos+dir+N)%N;
    if(dir>0&&p.pos===0){const al=alive();const poorest=al.length>1&&al.every(q=>q===p||assets(q)>assets(p));const s=SALARY+(has(p,'explorer')?80:0)+(poorest?SALARY:0)+(hasR(p,'salary')?100:0);gain(p,s,poorest?'월급+꼴찌 구호금':'월급');if(poorest)toast(`🆘 ${nm(p)} 꼴찌 구호금. 월급 2배`,'good',3000);SFX.play('coin');log(`${nm(p)} 출발지 통과, 월급 ${fmt(s)}`,p);renderPlayers();
      if(hasR(p,'jackhunter')&&k<Math.abs(n)-1&&(G.jackpot||0)>1){const half=Math.floor(G.jackpot/2);G.jackpot-=half;gain(p,half,'잭팟 사냥꾼');}
      await hop(p,0,Math.max(110,D(230)),0.4);await sleep(D(150));await relicDraft(p);await bonusCard(p,'출발 통과');continue;}
    await hop(p,p.pos,Math.max(110,D(230)),0.4);
  }
  }finally{if(chase===p)setTimeout(()=>{if(chase===p)chase=null;},D(900));} // linger so the street view registers before swinging back up
}
async function teleport(p,i){p.pos=i;await hop(p,i,D(650),1.6);}
function jail(p){p.island=has(p,'captain')?1:3;}

/* ---------- landing ---------- */
async function land(p){
  if(G.over||p.bankrupt)return;
  const i=p.pos,t=T(i);renderAll();SFX.play('land');
  switch(t.type){
    case 'start':say(`${nm(p)} 출발지에 도착했습니다.`,p);
      if((G.jackpot||0)>0){const jp=G.jackpot;G.jackpot=0;bigEvent(`잭팟<small>${esc(p.name)} +${fmt(jp)}</small>`,'gold',2600);SFX.play('win');confetti();gain(p,jp,'잭팟');emote(p,'laugh','잭팟이다!',{priority:6});log(`${nm(p)} 출발 칸에 정확히 도착해 잭팟 ${fmt(jp)} 획득`,p);renderAll();await sleep(D(1200));}
      await offerNuke(p);break;
    case 'island':if(await captainStorm(p))break;jail(p);SFX.play('island');emote(p,'shock','갇혔다!');say(`${nm(p)} 무인도에 갇혔습니다. ${p.island}턴 동안 쉬어요.${has(p,'captain')?' (선장은 금방 빠져나와요)':''}`,p);await sailToIsland(p);break;
    case 'travel':
      if(has(p,'explorer')){say(`${nm(p)} 모험가의 세계여행. 바로 이동합니다.`,p);const tg=await pickTravel(p);await walk(p,(tg-p.pos+N)%N);await land(p);}
      else{p.travel=true;SFX.play('chime');say(`${nm(p)} 세계여행. 다음 턴에 원하는 칸으로 이동합니다.`,p);}
      break;
    case 'festival':await hostFestival(p);break;
    case 'chance':await drawChance(p);break;
    case 'casino':await landCasino(p);break;
    default:await landProperty(p,i);
  }
  renderAll();
}
async function landProperty(p,i){
  const s=S(i),t=T(i);
  if(s.owner==null)return offerBuy(p,i);
  if(s.owner===p.id){
    if(t.type==='city'){await offerBuild(p,i);if(!G.over)await pullNeighbors(p,i);}
    else say(`${nm(p)} 내 관광지 ${t.name}에 도착했습니다.`,p);
    return;
  }
  const o=G.players[s.owner];
  if(await chargeToll(p,o,i)!==true)return;
  if(t.type==='city'&&s.level<4&&!G.over)await offerTakeover(p,i);
}
async function chargeToll(p,o,i){
  const t=T(i);let amt=toll(i);
  if(has(p,'negotiator'))amt=Math.round(amt*0.7);if(hasR(p,'coupon'))amt=Math.round(amt*0.85);
  if(has(p,'captain')&&t.type==='tour'){say(`${nm(p)} 선장은 관광지 ${t.name} 통행료를 내지 않습니다.`,p);emote(p,'cool');return true;}
  // 💰 owner's reactive skill: double this toll
  if(has(o,'merchant')&&!o.skillUsed&&amt>0&&await skillYes(o,{title:'💰 바가지',html:`<p>${nm(p)}이(가) 내 땅 <b>${t.name}</b>에 도착. 이번 통행료를 2배(${fmt(amt*2)})로 받을까요?</p>`,yes:'바가지 씌우기',no:'그냥 받기'},()=>amt>=50)){amt*=2;skillBurn(o,'바가지',`${t.name} 통행료 2배 → ${fmt(amt)}`);emote(o,'laugh','바가지!',{priority:5});}
  if(p.shield>0&&amt>0&&await decide(p,{title:'🎫 통행료 면제권',html:`<p><b>${t.name}</b> 통행료 ${fmt(amt)}. 면제권(${p.shield}장)을 지금 쓸까요?</p><p class="muted">아껴 두면 더 비싼 통행료에 쓸 수 있어요.</p>`,options:[{label:'면제권 쓰기',value:1,primary:true},{label:'그냥 낸다',value:0}]},()=>amt>=Math.max(90,p.cash*.1)?1:0)===1){
    p.shield--;say(`${nm(p)} 통행료 면제권을 사용해 ${t.name} 통행료 ${fmt(amt)}을 내지 않았습니다.`,p);emote(p,'cool','면제권!');toast(`${nm(p)} 면제권으로 ${fmt(amt)} 통행료 회피`,'good');renderPlayers();return true;}
  say(`${nm(p)} ${nm(o)}의 ${t.name}에서 통행료 ${fmt(amt)}을 냅니다.`,p);
  // 🤝 payer's reactive skill: waive this toll
  if(has(p,'negotiator')&&!p.skillUsed&&await skillYes(p,{title:'🤝 외교 면책',html:`<p><b>${t.name}</b> 통행료 ${fmt(amt)}을 내야 해요. 이번 통행료를 면제받을까요?</p>`,yes:'면제받기',no:'그냥 낸다'},()=>amt>=Math.max(100,p.cash*0.35))){skillBurn(p,'외교 면책',`${t.name} 통행료 ${fmt(amt)} 면제`);emote(p,'cool','면책!',{priority:5});return true;}
  // ⚓ payer's reactive skill: blow the owner to the island, skip the toll
  if(has(p,'captain')&&!p.skillUsed&&amt>=120&&o.island===0&&await skillYes(p,{title:'⚓ 폭풍 소환',html:`<p><b>${t.name}</b> 통행료 ${fmt(amt)}. 땅 주인 ${nm(o)}을(를) 무인도로 날려버리고 통행료를 내지 않을까요?</p>`,yes:'폭풍 소환',no:'그냥 낸다'},()=>amt>=Math.max(160,p.cash*0.35))){skillBurn(p,'폭풍 소환',`🌪️ ${o.name}을(를) 무인도로. ${t.name} 통행료 ${fmt(amt)} 면제`);if(!await useGuard(o,`${p.name}의 폭풍 소환`)){emote(p,'laugh','날아가라!',{priority:5});await teleport(o,8);jail(o);o.travel=false;emote(o,'angry','이런!!',{priority:5,silent:true});await sailToIsland(o);renderAll();return true;}}
  // 🧭 payer's reactive skill: teleport away instead of paying
  if(has(p,'explorer')&&!p.skillUsed&&await skillYes(p,{title:'🧭 순간이동',html:`<p><b>${t.name}</b> 통행료 ${fmt(amt)}. 절반(${fmt(Math.round(amt/2))})만 내고 원하는 칸으로 도망갈까요?</p>`,yes:'절반 내고 도망',no:'그냥 낸다'},()=>amt>=150||amt>=p.cash*0.4)){skillBurn(p,'순간이동',`${t.name} 통행료 절반(${fmt(Math.round(amt/2))})만 내고 도망`);emote(p,'cool','슝~',{priority:5});if(!pay(p,o,Math.round(amt/2),{why:'통행료 절반'}))return false;const tg=await pickTravel(p);await teleport(p,tg);await land(p);return 'moved';}
  const danger=amt>=400||amt>=p.cash*0.45;
  if(danger){vignette('#ff2a2a');SFX.play('heart');toast(`${nm(p)} 위기. ${t.name} 통행료 <b>${fmt(amt)}</b>${amt>=p.cash?' — 파산 위험':''}`,'danger',4500);focusOn(i,1600,1.0);emote(p,'shock',undefined,{silent:true});await sleep(D(1300));}
  SFX.play('pay');
  const ok=pay(p,o,amt,{why:'통행료'});if(ok&&hasR(o,'leech')){const x=Math.round(amt*.1);if(x>0)gain(o,x,'흡혈 계약');}renderPlayers();
  if(ok&&amt>=150)await bonusCard(p,'큰 통행료 위로');
  return ok;
}
/* pull visuals */
function magnetMesh(){
  const g=new THREE.Group();const red=new THREE.MeshStandardMaterial({color:0xe23b3b,roughness:.35,metalness:.3,emissive:0x5a0808,emissiveIntensity:.6}),steel=new THREE.MeshStandardMaterial({color:0xe8edf2,roughness:.25,metalness:.85});
  const arc=new THREE.Mesh(new THREE.TorusGeometry(.2,.075,12,28,Math.PI),red);g.add(arc); // arch on top
  [-.2,.2].forEach(x=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.14,14),red);leg.position.set(x,-.07,0);g.add(leg);
    const tip=new THREE.Mesh(new THREE.CylinderGeometry(.077,.077,.1,14),steel);tip.position.set(x,-.19,0);g.add(tip);});
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;
}
const pullFx={marks:[],mag:null,tk:null,t0:0};
function pullZoneShow(p,i,rng,victims){
  pullZoneClear();const col=new THREE.Color(p.color);pullFx.t0=performance.now();
  const add=m=>{scene.add(m);pullFx.marks.push(m);return m;};
  for(let o=-rng;o<=rng;o++){const j=(i+o+N)%N,r=rect(j);
    const plate=add(new THREE.Mesh(new THREE.PlaneGeometry(r.w-.08,r.d-.08),new THREE.MeshBasicMaterial({color:o?col:0xffd166,transparent:true,opacity:o?.35:.55,depthWrite:false})));
    plate.rotation.x=-Math.PI/2;plate.position.set(r.x,.262,r.z);plate.userData.pz={k:'plate',ph:Math.abs(o)};
    if(o){ // chevron pointing one step toward the building
      const nb=rect((j+(o>0?-1:1)+N)%N),dx=nb.x-r.x,dz=nb.z-r.z;
      const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');c.strokeStyle='#fff';c.lineWidth=18;c.lineCap='round';c.lineJoin='round';
      [[28],[72]].forEach(([y])=>{c.beginPath();c.moveTo(24,y+30);c.lineTo(64,y-6);c.lineTo(104,y+30);c.stroke();});
      const tx=new THREE.CanvasTexture(cv);const holder=new THREE.Group();holder.position.set(r.x,.27,r.z);holder.rotation.y=Math.atan2(-dx,-dz);
      const ch=new THREE.Mesh(new THREE.PlaneGeometry(.62,.62),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,color:col.clone().lerp(new THREE.Color(0xffffff),.55)}));ch.rotation.x=-Math.PI/2;holder.add(ch);
      holder.userData.pz={k:'chev',ph:Math.abs(o),base:holder.position.clone(),dir:new THREE.Vector3(dx,0,dz).normalize()};add(holder);}
  }
  // range label over the building
  const r0=rect(i),cv=document.createElement('canvas');cv.width=320;cv.height=96;const c=cv.getContext('2d');c.fillStyle=p.color;c.beginPath();c.roundRect(6,6,308,84,24);c.fill();c.lineWidth=6;c.strokeStyle='#fff';c.stroke();
  c.fillStyle='#fff';c.font='600 44px "Noto Sans KR","Malgun Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(`🧲 양옆 ${rng}칸`,160,50);
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const lab=add(new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false})));lab.scale.set(1.3,.39,1);lab.renderOrder=21;lab.position.set(r0.x,3.05,r0.z);lab.userData.pz={k:'lab'};
  // red target ring under every player about to be pulled
  victims.forEach(q=>{const rr=rect(q.pos);const ring=add(new THREE.Mesh(new THREE.RingGeometry(.3,.4,32),new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide})));ring.rotation.x=-Math.PI/2;ring.position.set(rr.x,.275,rr.z);ring.userData.pz={k:'ring',q};});
  // the magnet above the puller's head
  const tk=tokens[p.id],mag=magnetMesh();mag.position.set(0,2.0,0);mag.scale.setScalar(.01);tk.grp.add(mag);pullFx.mag=mag;pullFx.tk=tk;return pullFx.id=(pullFx.id||0)+1;
}
function pullZoneClear(){
  pullFx.marks.forEach(m=>{scene.remove(m);m.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}});});pullFx.marks.length=0;
  if(pullFx.mag){pullFx.tk.grp.remove(pullFx.mag);disposeObj(pullFx.mag);pullFx.mag=null;}
}
function pullTick(now){
  if(!pullFx.mag&&!pullFx.marks.length)return;const t=(now-pullFx.t0)/1000;
  if(pullFx.mag){const m=pullFx.mag;m.scale.setScalar(1.5*Math.min(1,t*4)*(1+.08*Math.sin(t*14)));m.rotation.z=Math.sin(t*9)*.18;m.position.y=2.0+Math.sin(t*5)*.05;}
  pullFx.marks.forEach(o=>{const d=o.userData.pz;if(!d)return;
    if(d.k==='plate')o.material.opacity=(d.ph?.22:.4)+.18*Math.max(0,Math.sin(t*6-d.ph*1.1));
    else if(d.k==='chev'){const u=((t*1.4-d.ph*.25)%1+1)%1;o.position.copy(d.base).addScaledVector(d.dir,(u-.5)*.35);o.children[0].material.opacity=Math.sin(u*Math.PI);}
    else if(d.k==='ring'){const rr=rect(d.q.pos);o.position.set(rr.x,.275,rr.z);const k=1+.2*Math.sin(t*8);o.scale.set(k,k,1);}
    else if(d.k==='lab')o.position.y=3.05+Math.sin(t*2.5)*.06;});
}
/* feature 2: pull neighbors */
async function pullNeighbors(p,i){
  const rng=range(S(i).level)+(S(i).level>0&&hasR(p,'magnet')?1:0);if(rng<=0)return;
  const victims=alive().filter(q=>q!==p&&q.island===0&&q.pos!==i&&(Math.min((q.pos-i+N)%N,(i-q.pos+N)%N)<=rng));
  if(!victims.length)return;
  say(`${nm(p)} ${T(i).name}의 ${LV[S(i).level]}이 양옆 ${rng}칸을 빨아들입니다.`,p);SFX.play('pull');const pzId=pullZoneShow(p,i,rng,victims);
  toast(`${nm(p)} ${T(i).name}(${LV[S(i).level]})로 ${victims.map(q=>esc(q.name)).join('·')} 끌어오기`,'danger');
  await sleep(D(1100));
  try{for(const q of victims){
    if(G.over)return;
    if(await useGuard(q,`${p.name}의 ${T(i).name} 끌어오기`,()=>toll(i)>=Math.max(100,q.cash*.25)))continue;
    log(`${nm(q)} ${T(q.pos).name}에서 ${T(i).name}(으)로 끌려왔습니다.`,q);
    q.pos=i;q.travel=false;emote(q,'angry','끌려간다!',{silent:true,cam:false});await hop(q,i,D(600),1.2);SFX.play('magnetHit');
    await chargeToll(q,p,i);renderAll();
  }}finally{setTimeout(()=>{if(pullFx.id===pzId)pullZoneClear();},D(500));}
}
/* feature 3: nuke */
/* every owned tile in range, the epicenter included — the bomb does not spare its owner */
function blastTargets(p,i){
  const rng=nukeRange(p,i),out=[i];
  for(let o=1;o<=rng;o++)for(const j of[(i+o)%N,(i-o+N)%N]){const s=S(j);if(s.owner!=null&&!out.includes(j))out.push(j);}
  return out;
}
const enemyTargets=(p,i)=>blastTargets(p,i).filter(j=>S(j).owner!==p.id);
const ownTargets=(p,i)=>blastTargets(p,i).filter(j=>S(j).owner===p.id);
const tileLoss=j=>T(j).type==='city'&&S(j).level>0?cum(j,1,S(j).level):invested(j);
function blastValue(p,i){return enemyTargets(p,i).reduce((a,j)=>a+tileLoss(j),0)-ownTargets(p,i).reduce((a,j)=>a+(T(j).type==='city'&&S(j).level>0?cum(j,1,S(j).level):0),0)*0.8;}
let nukeMarks=[];
function nukePreviewClear(){nukeMarks.forEach(m=>{scene.remove(m);m.geometry.dispose();m.material.dispose();});nukeMarks=[];}
function nukePreview(p,i){
  nukePreviewClear();if(i==null||i<0)return;const rng=nukeRange(p,i);
  const zone=[i];for(let o=1;o<=rng;o++)zone.push((i+o)%N,(i-o+N)%N);
  zone.forEach(j=>{const rr=rect(j),st=S(j);const hasB=tiles[j].bgrp.children.length>0&&st.owner!=null;const mine=st.owner===p.id;
    const col=j===i?0xffd166:!hasB?0xff9a5a:mine?0xb070ff:0xff2a2a;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(rr.w-.06,rr.d-.06),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:hasB||j===i?.6:.3,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(rr.x,.238,rr.z);m.userData.pulse=hasB||j===i;scene.add(m);nukeMarks.push(m);
    if(hasB&&j!==i){const sp=makeSprite(mine?'😢':'💥',.5);sp.position.set(rr.x,1.5,rr.z);sp.userData.pulse=true;scene.add(sp);nukeMarks.push(sp);}});
  const ic=makeSprite('☢️',.7);const r0=rect(i);ic.position.set(r0.x,1.9,r0.z);scene.add(ic);nukeMarks.push(ic);
}
let nukePick=null;
function pickNukeTarget(p,cands){
  setMsg(`${nm(p)}, 핵폭탄을 쏠 <b>내 건물</b>을 보드에서 고르세요. 붉은 칸이 무너집니다.`);toast('내 건물 칸을 누르면 붕괴 예상 범위가 보여요','danger',4500);
  setPickable(new Set(cands),p,true);nukePick={p};
  return new Promise(res=>{pickResolver=i=>{nukePick=null;setPickable(null);nukePreview(p,i);res(i);};
    timerStart(G.turnSec,()=>{if(pickResolver){const r=pickResolver;pickResolver=null;nukePick=null;setPickable(null);res(-1);}});
  }).then(v=>{timerStop();return v;});
}
async function offerNuke(p){
  if(G.nukesOn===false)return;
  if(p.nukes==null)p.nukes=NUKES;
  if(p.nukes<=0){log(`${nm(p)} 핵폭탄을 모두 썼습니다.`,p);toast(`${nm(p)} 핵폭탄 소진 — 1인당 ${NUKES}발까지만 쏠 수 있어요`,'danger',5000);SFX.play('alarm');return;}
  const cands=owned(p).filter(i=>T(i).type==='city'&&S(i).level>=1);
  if(!cands.length){log(`${nm(p)} 핵폭탄을 쏠 건물이 없습니다.`,p);toast(`${nm(p)} 핵폭탄 불가 — 건물(별장 이상)이 있는 내 도시가 없어요`,'danger',5000);SFX.play('alarm');return;}
  if(cands.every(i=>enemyTargets(p,i).length===0)){log(`${nm(p)} 핵폭탄 사정거리 안에 남의 땅이 없습니다.`,p);toast(`${nm(p)} 핵폭탄 불가 — 사정거리 안에 남의 땅이 없어요 (건물을 키우면 사정거리 증가)`,'danger',5000);SFX.play('alarm');return;}
  const aiBest=()=>{const best=cands.reduce((a,b)=>blastValue(p,b)>blastValue(p,a)?b:a);return blastValue(p,best)>40?best:-1;};
  let i;
  if(p.ai){await sleep(D(500));i=aiBest();if(i>=0){nukePreview(p,i);await sleep(D(1400));nukePreviewClear();}}
  else{
    const go=await modal({title:'핵폭탄을 쓸까요?',html:`<p>출발 칸에 도착했어요. 핵폭탄은 게임에 <b>단 한 번</b>만 쓸 수 있어요.</p><p class="muted">쓰면 보드에서 내 건물을 고르고, 무너질 범위를 미리 본 뒤 발사합니다. 범위 안의 <b>내 건물도 함께 무너져요</b>.</p>`,
      options:[{label:'☢️ 쓴다 — 위치 고르기',value:1,danger:true},{label:'이번엔 아껴 둔다',value:0,primary:true}]});
    i=-1;
    while(go){
      const pick=await pickNukeTarget(p,cands);if(pick<0)break;
      const en=enemyTargets(p,pick),own=ownTargets(p,pick).filter(j=>S(j).level>0);
      const loss=v=>v.reduce((a,j)=>a+tileLoss(j),0);
      const ok=await modal({title:`${T(pick).name}에서 발사?`,html:`<p>반경 <b>${nukeRange(p,pick)}칸</b> · 붉게 표시된 칸이 무너집니다.</p><p>상대 피해 <b>${en.length}곳</b> (${fmt(loss(en))})${en.length?': '+[...new Set(en.map(j=>G.players[S(j).owner].name))].map(esc).join(', '):''}</p><p class="muted">내 건물 희생 ${own.length}곳 (${fmt(own.reduce((a,j)=>a+cum(j,1,S(j).level),0))})</p>`,
        options:[{label:'☢️ 발사',value:1,danger:true},{label:'다른 곳 고르기',value:2},{label:'취소',value:0,primary:true}],clear:true});
      if(ok===1){i=pick;nukePreviewClear();break;}
      nukePreviewClear();if(ok===0)break;
    }
  }
  if(i<0){log(`${nm(p)} 핵폭탄을 쏘지 않았습니다.`,p);return;}
  const rng=nukeRange(p,i),hits=blastTargets(p,i);p.nukes--;
  say(`${nm(p)} ${T(i).name}에서 핵폭탄 발사. (남은 핵폭탄 ${p.nukes}발)`,p);bigEvent(`핵폭탄 발사<small>${esc(p.name)} → ${T(i).name} 반경 ${rng}칸</small>`,'doom',2400);SFX.sting('drama');emote(p,'cool','받아라!',{priority:5});
  for(const v of [...new Set(hits.map(j=>S(j).owner).filter(id=>id!==p.id))].map(id=>G.players[id]))
    if(await useGuard(v,`${p.name}의 핵폭탄`))for(let k=hits.length-1;k>=0;k--)if(S(hits[k]).owner===v.id)hits.splice(k,1);
  await nukeCinematic(i,rng,hits);
  const enemies=hits.filter(j=>S(j).owner!==p.id);
  const victims=[...new Set(enemies.map(j=>S(j).owner))].map(id=>G.players[id]);victims.forEach(v=>emote(v,'angry','내 건물!!',{priority:6,silent:true}));if(victims.length)SFX.play('angry');
  const ownLost=hits.filter(j=>S(j).owner===p.id&&S(j).level>0).length;
  toast(`${victims.length?victims.map(v=>nm(v)).join(', ')+' 건물 '+enemies.length+'곳 피해':'상대 피해 없음'}${ownLost?` · ${nm(p)} 내 건물 ${ownLost}곳 희생`:''}`,'danger',5000);
  for(const j of hits){
    const o=G.players[S(j).owner];
    if(o===p){if(S(j).level>0){log(`${nm(p)}의 ${T(j).name} ${LV[S(j).level]}이(가) 폭발에 휩쓸려 무너졌습니다 (땅은 유지).`,p);S(j).level=0;S(j).rubble=true;}continue;}
    if(T(j).type==='city'&&S(j).level>0){log(`${nm(o)}의 ${T(j).name} ${LV[S(j).level]}이(가) 무너졌습니다.`,p);S(j).level=0;S(j).rubble=true;}
    else{log(`${nm(o)}의 ${T(j).name}이(가) 폐허가 되어 주인을 잃었습니다.`,p);S(j).owner=null;S(j).level=0;S(j).rubble=true;if(G.festival===j)G.festival=null;}
  }
  if(!enemies.length)log('폭발했지만 상대가 입은 피해는 없습니다.',p);
  renderAll();await sleep(D(500));
}
function wouldComplete(p,i){
  const t=T(i);if(t.type!=='city')return tourIdx.filter(j=>S(j).owner===p.id).length>=2;
  return groupIdx(t.g).every(j=>j===i||S(j).owner===p.id);
}
async function offerBuy(p,i){
  const t=T(i);
  if(t.type==='tour'){
    const tp=has(p,'captain')?Math.round(t.price*0.75):t.price;
    const c=await decide(p,{title:`${t.ico} ${t.name} 구매`,html:`<p>관광지는 건물 없이 보유만 해요.${has(p,'captain')?' 선장 25% 할인 적용.':''} 현재 자금 ${fmt(p.cash)}</p>`,
      options:[{label:'구매하기',value:1,cost:tp,primary:true,disabled:p.cash<tp},{label:'넘어가기',value:0}]},
      ()=>p.cash-tp>=(wouldComplete(p,i)?60:300)?1:0);
    if(c){pay(p,null,tp,{quiet:true,why:t.name+' 구매'});emote(p,'happy');S(i).owner=p.id;S(i).level=0;SFX.play('buy');say(`${nm(p)} 관광지 ${t.name}을(를) ${fmt(t.price)}에 샀습니다.`,p);renderAll();checkWin(p);}
    else say(`${nm(p)} ${t.name}을(를) 사지 않았습니다.`,p);
    return;
  }
  const opts=[0,1,2,3].map(l=>({label:l===0?'📍 땅만 구매':`${BICON[l]} 땅 + ${LV.slice(1,l+1).join(' + ')}`,value:l,cost:disc(p,cum(i,0,l)),disabled:p.cash<disc(p,cum(i,0,l))}));
  const best=opts.filter(o=>!o.disabled).pop();if(best)best.primary=true;
  const freeOK=has(p,'architect')&&!p.skillUsed,landC=disc(p,cum(i,0,0));
  if(freeOK)opts.push({label:'땅 구매 + 긴급 공사 (별장+빌딩 무료)',value:'free1',cost:landC,disabled:p.cash<landC});
  opts.push({label:'넘어가기',value:-1});
  const res=wouldComplete(p,i)?40:100;
  let l=await decide(p,{title:`${t.ico} ${t.name} 구매`,html:`<p>현재 자금 ${fmt(p.cash)}.${has(p,'architect')?' 건축가 할인 35% 적용.':''} 지은 단계에 따라 통행료가 올라갑니다.</p><p class="muted">통행료: ${LV.slice(0,4).map((n,k)=>`${n} ${fmt(Math.round(t.price*MULT[k]))}`).join(' · ')}</p>`,options:opts},
    ()=>{for(let k=3;k>=0;k--)if(p.cash-disc(p,cum(i,0,k))>=res){if(k===0&&freeOK&&p.cash-landC>=30)return 'free1';return k;}return p.cash-landC>=30?(freeOK?'free1':0):-1;});
  let freeUp=false;if(l==='free1'){l=0;freeUp=true;}
  if(l<0){say(`${nm(p)} ${t.name}을(를) 사지 않았습니다.`,p);return;}
  const c=disc(p,cum(i,0,l));pay(p,null,c,{quiet:true,why:T(i).name+' 구매'});S(i).owner=p.id;S(i).level=l;if(l===0&&hasR(p,'autobuild')){S(i).level=1;toast(`${nm(p)} 속성 공사 — 별장 무료`,'good',2500);}SFX.play(l>0?'build':'buy');emote(p,'happy',l>=3?'호텔이다!':'내 거야~');monopolyFx(p,i);
  say(`${nm(p)} ${t.name}에 ${LV[l]}까지 ${fmt(c)} 투자했습니다.`,p);
  if(freeUp){S(i).level=2;skillBurn(p,'긴급 공사',`${t.name}에 무료로 빌딩까지 지었습니다`);SFX.play('build');}
  renderAll();checkWin(p);
}
async function offerBuild(p,i){
  const t=T(i),s=S(i);
  if(s.level>=4){say(`${nm(p)} 내 랜드마크 ${t.name}에 도착했습니다.`,p);return;}
  let opts;
  if(s.level===3){const c=disc(p,cost(i,4));opts=[{label:'🏰 랜드마크 건설',value:4,cost:c,primary:p.cash>=c,disabled:p.cash<c}];}
  else{opts=[];for(let l=s.level+1;l<=4;l++){const c=disc(p,cum(i,s.level+1,l));opts.push({label:l===4?`🏰 랜드마크까지 (${LV.slice(s.level+1,5).join(' + ')})`:`${BICON[l]} ${LV.slice(s.level+1,l+1).join(' + ')} 건설`,value:l,cost:c,disabled:p.cash<c});}
    const best=opts.filter(o=>!o.disabled).pop();if(best)best.primary=true;}
  const freeOK=has(p,'architect')&&!p.skillUsed&&s.level<3;
  if(freeOK)opts.push({label:`긴급 공사 — ${LV[Math.min(3,s.level+2)]}까지 무료`,value:'free',cost:0});
  if(opts.every(o=>o.disabled)){say(`${nm(p)} ${t.name}에 지을 돈이 부족합니다.`,p);return;}
  opts.push({label:'짓지 않기',value:-1});
  const l=await decide(p,{title:`${t.ico} ${t.name} 건설`,html:`<p>지금: ${LV[s.level]} · 통행료 ${fmt(toll(i))}. 현재 자금 ${fmt(p.cash)}</p>${s.level===3?'<p class="muted">랜드마크는 다른 사람이 인수할 수 없어요.</p>':''}${freeOK?'<p class="muted">긴급 공사는 게임에 한 번만 쓸 수 있어요.</p>':''}`,options:opts},
    ()=>{for(let k=opts.length-2;k>=0;k--){const o=opts[k];if(o.value==='free')continue;if(!o.disabled&&p.cash-o.cost>=(o.value===4?80:110))return o.value;}return freeOK&&(G.round>=4||p.cash<150)?'free':-1;});
  if(l==='free'){s.level=Math.min(3,s.level+2);skillBurn(p,'긴급 공사',`${t.name}이(가) 무료로 ${LV[s.level]}이 되었습니다`);SFX.play('build');emote(p,'happy','공짜!');renderAll();return;}
  if(l<0){say(`${nm(p)} ${t.name}에 건물을 짓지 않았습니다.`,p);return;}
  const c=disc(p,cum(i,s.level+1,l));pay(p,null,c,{quiet:true,why:LV[l]+' 건설'});s.level=l;SFX.play(l===4?'landmark':'build');if(l===4)SFX.sting('up');emote(p,l===4?'cool':'happy',l===4?'랜드마크!':undefined);if(l===4)bigEvent(`랜드마크<small>${esc(p.name)} · ${t.name}</small>`,'gold',2200);
  say(`${nm(p)} ${t.name}에 ${LV[l]}${l===4?'를 세웠습니다.':'까지 지었습니다.'} (${fmt(c)})`,p);renderAll();
}
async function offerTakeover(p,i){
  const t=T(i),s=S(i),o=G.players[s.owner],rate=1.5,price=Math.round(invested(i)*rate);
  if(p.cash<price){return;}
  const c=await decide(p,{title:`${t.ico} ${t.name} 인수`,html:`<p>${nm(o)}의 ${t.name}(${LV[s.level]})을 투자금의 ${rate}배에 인수할 수 있어요. 현재 자금 ${fmt(p.cash)}</p>`,
    options:[{label:'인수하기',value:1,cost:price,primary:true},{label:'넘어가기',value:0}]},
    ()=>(p.cash-price>=160||(wouldComplete(p,i)&&p.cash-price>=60))?1:0);
  if(!c||await useGuard(o,`${p.name}의 ${t.name} 인수`))return;
  pay(p,o,price,{quiet:true,why:'인수'});s.owner=p.id;SFX.play('buy');emote(p,'laugh','내 거다!',{priority:4});emote(o,'angry','빼앗겼어!',{priority:4,silent:true});bigEvent(`인수<small>${esc(p.name)}이(가) ${esc(o.name)}의 ${t.name} 인수</small>`,'gold',2200);monopolyFx(p,i);
  say(`${nm(p)} ${nm(o)}에게서 ${t.name}을(를) ${fmt(price)}에 인수했습니다.`,p);renderAll();checkWin(p);
  if(!G.over)await offerBuild(p,i);
}
async function hostFestival(p){
  const c=owned(p);
  if(!c.length){say(`${nm(p)} 축제를 열 땅이 없습니다.`,p);return;}
  const withF=i=>{const f=G.festival;G.festival=i;const v=toll(i);G.festival=f;return v;};
  const i=await decide(p,{title:'축제 개최',html:'<p>축제를 열 곳을 고르세요. 그곳의 통행료가 2배가 됩니다. 축제는 보드에 한 곳만 열려요.</p>',
    options:c.map(i=>({label:`${T(i).ico} ${T(i).name}`,value:i,cost:withF(i)})).concat([{label:'열지 않기',value:-1}])},
    ()=>c.reduce((a,b)=>withF(b)>withF(a)?b:a));
  if(i<0)return;
  G.festival=i;SFX.play('festival');say(`${nm(p)} ${T(i).name}에서 축제를 엽니다. 통행료 2배.`,p);renderAll();bigEvent(`축제 개막<small>${T(i).name} 통행료 2배</small>`,'gold',2400);focusOn(i,2200,1.1);for(let k=0;k<4;k++)setTimeout(()=>{const rr=rect(i);firework(new THREE.Vector3(rr.x,.3,rr.z),true);},k*350);emote(p,'happy','축제다!',{silent:true});
}
function aiTravelTarget(p){
  const free=TILES.map((t,i)=>i).filter(i=>T(i).type==='city'&&S(i).owner==null&&disc(p,T(i).price)<=p.cash-60).sort((a,b)=>T(b).price-T(a).price);
  if(free.length)return free[0];
  const mine=owned(p).filter(i=>T(i).type==='city'&&S(i).level<4).sort((a,b)=>T(b).price-T(a).price);
  if(mine.length&&p.cash>150)return mine[0];
  return 0;
}
async function pickTravel(p){
  if(p.ai){await sleep(D(600));return aiTravelTarget(p);}
  toast(`보드에서 갈 칸을 누르세요 · 빛기둥 = 내 땅 ${owned(p).length}곳`,'good',4500);
  return pickTile(p,TILES.map((t,i)=>i).filter(i=>i!==24),`${nm(p)}, 보드에서 이동할 칸을 누르세요. 빛기둥이 서 있는 곳이 <b>내 땅</b>이에요.`,()=>aiTravelTarget(p));
}

/* pick one tile on the board (human) or let the AI choose; the timer falls back to the AI choice */
async function pickTile(p,cands,msg,aiPick){
  if(p.ai){await sleep(D(600));return aiPick();}
  const own=cands.some(i=>S(i).owner===p.id); // light beams mark my tiles — only when they are among the choices
  setMsg(msg);setPickable(new Set(cands),own?p:null,cands.length<N-1);
  timerStart(G.turnSec,()=>{if(pickResolver){const r=pickResolver;pickResolver=null;r(aiPick());}});
  const i=await new Promise(r=>pickResolver=r);timerStop();setPickable(null);return i;
}
/* 🛡️ 방어권: blocks one attack (nuke, typhoon, takeover, pull, storm, city swap). Defaults to blocking. */
async function useGuard(q,what,aiYes=()=>true){
  if(!(q.guard>0)||q.bankrupt)return false;
  const ok=await decide(q,{title:'🛡️ 방어권',html:`<p><b>${esc(what)}</b> 공격을 받았어요. 방어권(${q.guard}장)으로 막을까요?</p>`,options:[{label:'막는다',value:1,primary:true},{label:'그냥 맞는다',value:0}]},()=>aiYes()?1:0);
  if(ok!==1)return false;
  q.guard--;SFX.play('skill');emote(q,'cool','방어!',{priority:5});toast(`🛡️ ${nm(q)} 방어권으로 ${esc(what)} 방어`,'good',4000);log(`${nm(q)} 방어권으로 ${esc(what)}을(를) 막았습니다.`,q);renderPlayers();return true;
}

/* ---------- skills ---------- */
function bestDiceSum(p){
  let best=null,bs=-1e9;
  for(let s=2;s<=12;s++){
    const i=(p.pos+s)%N,t=T(i),st=S(i);let v=0;
    if(t.type==='city'&&st.owner==null&&disc(p,t.price)<=p.cash-60)v=t.price+(wouldComplete(p,i)?200:0);
    else if(t.type==='city'&&st.owner===p.id&&st.level<4&&p.cash>150)v=t.price*0.6+range(st.level)*20;
    else if(t.type==='tour'&&st.owner==null&&p.cash>=120)v=70+(wouldComplete(p,i)?300:0);
    else if(st.owner!=null&&st.owner!==p.id)v=-toll(i);
    else if(t.type==='island')v=-80;
    else if(t.type==='start')v=30+owned(p).reduce((a,j)=>Math.max(a,blastValue(p,j)),0)*0.5;
    else if(t.type==='chance')v=30;
    else if(t.type==='festival'&&owned(p).length)v=60;
    if(v>bs){bs=v;best=s;}
  }
  return bs>40?best:null;
}
const split=s=>{const a=Math.min(6,s-1);return[a,s-a];};
/* ---------- reactive skills: offered at the moment they matter ---------- */
async function skillYes(p,{title,html,yes,no},aiYes){
  if(p.ai)await sleep(D(300));
  const v=await decide(p,{title:`${title}`,html:html+'<p class="muted">스킬은 게임에 한 번만 쓸 수 있어요.</p>',options:[{label:yes,value:1,primary:true},{label:no,value:0}]},()=>aiYes()?1:0);
  return v===1;
}
function skillBurn(p,name,desc){p.skillUsed=true;SFX.play('skill');say(`${nm(p)} 스킬 <b>${name}</b>. ${desc}`,p);toast(`${nm(p)} ${name} — ${desc}`,'good',4500);bigEvent(`${name}<small>${esc(p.name)}</small>`,'gold',1600);renderPlayers();}
/* 🍀 lucky: bad landing → pick the sum and throw again */
async function luckyReroll(p,d){
  if(!has(p,'lucky')||p.skillUsed)return d;
  const sum=d[0]+d[1],i=(p.pos+sum)%N,info=landingInfo(p,i),t=T(i);
  const bad=info.cls==='pay'||info.cls==='deadly'||info.cls==='bad';
  if(!bad)return d;
  const sel=await decide(p,{title:'🍀 운명의 주사위',html:`<p>주사위 ${sum} → <b>${t.name}</b> (${info.txt}). 숫자를 골라 다시 던질까요?</p><p class="muted">스킬은 게임에 한 번만 쓸 수 있어요.</p>`,grid:true,
    options:Array.from({length:11},(_,k)=>({label:String(k+2),value:k+2})).concat([{label:'그냥 간다',value:-1}])},
    ()=>{const b=bestDiceSum(p);return(info.cls==='deadly'||t.type==='island'||(info.cls==='pay'&&toll(i)>=80))&&b!=null?b:-1;});
  if(sel<0)return d;
  skillBurn(p,'운명의 주사위',`${sum} 대신 ${sel}로 다시 던집니다`);emote(p,'cool','운명 변경!');
  const nd=split(sel);face($('#d1'),nd[0],nd[0]===nd[1]);face($('#d2'),nd[1],nd[0]===nd[1]);await sleep(D(400));return nd;
}
/* ⚓ captain: about to be jailed → send someone else instead */
async function captainStorm(p){
  if(!has(p,'captain')||p.skillUsed)return false;
  const o=alive().filter(q=>q!==p&&q.island===0);if(!o.length)return false;
  const tid=await decide(p,{title:'⚓ 폭풍 소환',html:'<p>무인도에 갇히기 직전. 대신 보낼 플레이어를 고르면 나는 자유롭게 빠져나갑니다.</p><p class="muted">스킬은 게임에 한 번만 쓸 수 있어요.</p>',
    options:o.map(q=>({label:`${CH(q.ch).emoji} ${q.name} (총자산 ${fmt(assets(q))})`,value:q.id,primary:false})).concat([{label:'그냥 갇힌다',value:-1}])},
    ()=>o.reduce((a,b)=>assets(b)>assets(a)?b:a).id);
  if(tid<0)return false;
  const q=G.players[tid];skillBurn(p,'폭풍 소환',`${q.name}을(를) 대신 무인도로`);if(await useGuard(q,`${p.name}의 폭풍 소환`))return false;emote(p,'laugh','대신 가라!',{priority:5});
  await teleport(q,8);jail(q);q.travel=false;emote(q,'angry','왜 나야!!',{priority:5,silent:true});await sailToIsland(q);renderAll();return true;
}

/* ---------- chance ---------- */
const CARDS=[
  {t:'복권 당첨',d:'250만을 받습니다.',art:{big:'🎟️',s1:'💰',s2:'✨',bg:'linear-gradient(160deg,#ffe98a,#ff9f43)',pat:'rays'},f:async p=>gain(p,luckyX(p)?500:250)},
  {t:'장학금',d:'120만을 받습니다.',art:{big:'🎓',s1:'📚',s2:'💵',bg:'linear-gradient(160deg,#c7f0ff,#6fb6ff)',pat:'grid'},f:async p=>gain(p,luckyX(p)?240:120)},
  {t:'과속 벌금',d:'80만을 냅니다.',bad:1,art:{big:'🚓',s1:'🚦',s2:'💸',bg:'linear-gradient(160deg,#ffd1d1,#ff6b6b)',pat:'stripes'},f:async p=>{pay(p,null,80,{why:'벌금 → 잭팟',pool:true});}},
  {t:'생일 축하',d:'다른 플레이어들에게 50만씩 받습니다.',art:{big:'🎂',s1:'🎈',s2:'🎁',bg:'linear-gradient(160deg,#ffd6f0,#ff8ad4)',pat:'dots'},f:async p=>{alive().filter(q=>q!==p).forEach(q=>{if(!q.bankrupt)pay(q,p,luckyX(p)?100:50);});}},
  {t:'통행료 면제권',d:'다음 통행료 한 번을 내지 않습니다.',art:{big:'🛡️',s1:'🚧',s2:'🆓',bg:'linear-gradient(160deg,#d8f5e0,#6fd39a)',pat:'grid'},f:async p=>{p.shield++;}},
  {t:'통행료 면제권',d:'다음 통행료 한 번을 내지 않습니다.',art:{big:'🎫',s1:'🛡️',s2:'✅',bg:'linear-gradient(160deg,#dff3ff,#7fc8ff)',pat:'stripes'},f:async p=>{p.shield++;}},
  {t:'앞으로 3칸',mv:1,d:'3칸 앞으로 이동합니다.',art:{big:'🏃',s1:'➡️',s2:'💨',bg:'linear-gradient(160deg,#fff3c4,#ffd166)',pat:'stripes'},f:async p=>{await walk(p,3);await land(p);}},
  {t:'뒤로 2칸',mv:1,d:'2칸 뒤로 이동합니다.',bad:1,art:{big:'🔙',s1:'🐌',s2:'😵',bg:'linear-gradient(160deg,#e6e0f8,#b39ddb)',pat:'waves'},f:async p=>{await walk(p,-2);await land(p);}},
  {t:'무인도 표류',mv:1,d:'무인도로 바로 이동합니다.',bad:1,art:{big:'🏝️',s1:'🌊',s2:'🦜',bg:'linear-gradient(160deg,#bfe9f5,#2a9fd6)',pat:'waves'},f:async p=>{await teleport(p,8);jail(p);await sailToIsland(p);}},
  {t:'귀향',mv:1,d:'출발지로 이동하고 월급을 받습니다.',art:{big:'🏠',s1:'🚀',s2:'💰',bg:'linear-gradient(160deg,#dff7e3,#8fd99a)',pat:'rays'},f:async p=>{await walk(p,(N-p.pos)%N);}},
  {t:'세계여행 티켓',mv:1,d:'세계여행 칸으로 이동합니다. 다음 턴에 원하는 곳으로 가요.',art:{big:'✈️',s1:'🌍',s2:'🧳',bg:'linear-gradient(160deg,#d6ecff,#5aa9ff)',pat:'dots'},f:async p=>{await teleport(p,24);p.travel=true;}},
  {t:'축제 초대장',d:'내 땅 하나에서 축제를 엽니다.',art:{big:'🎆',s1:'🎪',s2:'🎉',bg:'linear-gradient(160deg,#ffd9ec,#c86dd7)',pat:'rays'},f:async p=>{await hostFestival(p);}},
  {t:'태풍',d:'다른 플레이어의 건물 하나가 한 단계 무너집니다.',art:{big:'🌪️',s1:'🏚️',s2:'⚡',bg:'linear-gradient(160deg,#cfd8e3,#5a6f8a)',pat:'waves'},f:async p=>{
    const c=G.ts.map((s,i)=>i).filter(i=>S(i).owner!=null&&S(i).owner!==p.id&&T(i).type==='city'&&S(i).level>=1&&S(i).level<=3);
    if(!c.length){log('태풍이 지나갔지만 피해가 없습니다.',p);return;}
    const i=c[Math.random()*c.length|0];if(await useGuard(G.players[S(i).owner],`태풍 (${T(i).name})`))return;focusOn(i,2600,1.1);collapseFx(i,0);await sleep(D(2600));S(i).level--;S(i).rubble=S(i).level===0;log(`태풍. ${nm(G.players[S(i).owner])}의 ${T(i).name}이(가) ${LV[S(i).level]}로 내려앉았습니다.`,p);emote(G.players[S(i).owner],'angry','내 건물!',{silent:true});}},
  {t:'방어권',d:'핵폭탄·태풍·인수·끌어오기 등 공격 하나를 막는 카드를 보관합니다.',art:{big:'🛡️',s1:'☢️',s2:'🚫',bg:'linear-gradient(160deg,#e3e9ff,#7b8cff)',pat:'grid'},f:async p=>{p.guard=(p.guard||0)+1;}},
  {t:'방어권',d:'핵폭탄·태풍·인수·끌어오기 등 공격 하나를 막는 카드를 보관합니다.',art:{big:'🏰',s1:'🛡️',s2:'✨',bg:'linear-gradient(160deg,#eef0ff,#9aa6ff)',pat:'rays'},f:async p=>{p.guard=(p.guard||0)+1;}},
  {t:'도시 바꾸기',d:'내 도시 하나와 상대 도시 하나(랜드마크 제외)를 건물째 맞바꿉니다.',art:{big:'🔄',s1:'🏙️',s2:'🤝',bg:'linear-gradient(160deg,#d9fbe9,#3fc59a)',pat:'dots'},f:cardSwap},
  {t:'도시 기부',d:'내 땅 하나를 가장 가난한 플레이어에게 건물째 넘겨줍니다.',bad:1,art:{big:'🎁',s1:'🏠',s2:'😇',bg:'linear-gradient(160deg,#ffe8d6,#ff9a6b)',pat:'stripes'},f:cardDonate},
  {t:'강제 매각',d:'내 땅 하나를 투자금의 절반 값에 은행에 팝니다.',bad:1,art:{big:'🏚️',s1:'📉',s2:'💸',bg:'linear-gradient(160deg,#e4e4e4,#8a8f99)',pat:'waves'},f:cardForceSell},
  {t:'자선 기부',d:'현금의 10%를 가장 가난한 플레이어에게 줍니다.',bad:1,art:{big:'🤲',s1:'💝',s2:'🪙',bg:'linear-gradient(160deg,#ffe4c4,#f0a070)',pat:'dots'},f:async p=>{
    const others=alive().filter(q=>q!==p);if(!others.length)return;
    const poor=others.reduce((a,b)=>assets(b)<assets(a)?b:a),amt=Math.round(p.cash*0.1);
    pay(p,poor,amt);log(`${nm(p)} → ${nm(poor)} ${fmt(amt)} 기부`,p);}},
];
const cheapest=v=>v.reduce((a,b)=>invested(b)<invested(a)?b:a);
const priciest=v=>v.reduce((a,b)=>invested(b)>invested(a)?b:a);
async function cardSwap(p){
  const mine=owned(p).filter(i=>T(i).type==='city'),theirs=G.ts.map((s,i)=>i).filter(i=>T(i).type==='city'&&S(i).owner!=null&&S(i).owner!==p.id&&S(i).level<4);
  if(!mine.length||!theirs.length){log(`${nm(p)} 바꿀 도시가 없습니다.`,p);return;}
  const a=await pickTile(p,mine,`${nm(p)}, 내줄 <b>내 도시</b>를 고르세요. (빛기둥이 내 도시)`,()=>cheapest(mine));
  const b=await pickTile(p,theirs,`${nm(p)}, ${T(a).name}과(와) 바꿀 <b>상대 도시</b>를 고르세요. (금색 테두리)`,()=>priciest(theirs));
  if(p.ai&&invested(b)<=invested(a)){log(`${nm(p)} 도시 바꾸기를 쓰지 않았습니다.`,p);return;}
  const o=G.players[S(b).owner];if(await useGuard(o,`${p.name}의 도시 바꾸기`))return;
  S(a).owner=o.id;S(b).owner=p.id;focusOn(b,2000,1.1);SFX.play('buy');emote(p,'laugh','바꿔치기!',{priority:5});emote(o,'angry','내 도시!',{silent:true});
  say(`${nm(p)} 도시 바꾸기: ${T(a).name} ↔ ${nm(o)}의 ${T(b).name}`,p);monopolyFx(p,b);renderAll();checkWin(p);if(!G.over)checkWin(o);
}
async function cardDonate(p){
  const mine=owned(p),to=alive().filter(q=>q!==p);
  if(!mine.length||!to.length){log(`${nm(p)} 기부할 땅이 없습니다.`,p);return;}
  const q=to.reduce((a,b)=>assets(b)<assets(a)?b:a);
  const i=await pickTile(p,mine,`${nm(p)}, ${nm(q)}에게 <b>기부할 내 땅</b>을 고르세요.`,()=>cheapest(mine));
  S(i).owner=q.id;focusOn(i,2000,1.1);SFX.play('cardBad');emote(p,'sad','아까워…',{silent:true});emote(q,'happy','고마워!');
  say(`${nm(p)} ${T(i).name}을(를) ${nm(q)}에게 기부했습니다.`,p);renderAll();checkWin(q);
}
async function cardForceSell(p){
  const mine=owned(p);if(!mine.length){log(`${nm(p)} 팔 땅이 없습니다.`,p);return;}
  const i=await pickTile(p,mine,`${nm(p)}, <b>팔아야 할 내 땅</b>을 고르세요. 투자금의 절반을 받아요.`,()=>cheapest(mine));
  const v=Math.round(invested(i)/2);S(i).owner=null;S(i).level=0;if(G.festival===i)G.festival=null;
  focusOn(i,2000,1.1);SFX.play('stamp');emote(p,'sad','헐값에…',{silent:true});gain(p,v,`${T(i).name} 강제 매각`);
  say(`${nm(p)} ${T(i).name}을(를) ${fmt(v)}에 강제 매각했습니다.`,p);renderAll();
}
/* extra card draws outside the card tiles: big toll paid, island escape, passing start */
let bonusDraw=false;
const luckyX=p=>has(p,'lucky')&&!bonusDraw; // 🍀 double card money only from card tiles, or bonus cards snowball the lucky
async function bonusCard(p,why){
  if(G.over||p.bankrupt)return;
  if(!p.ai)toast(`🎴 ${nm(p)} ${why} — 행운카드 1장`,'good',2500);bonusDraw=true;try{await drawChance(p,true);}finally{bonusDraw=false;}
}
/* the drawn card flips open in the middle of the stage; a tap (or the timer) closes it */
function showCard(c,p){
  const host=$('#cardfx');const a=c.art||{big:'🎴',s1:'',s2:'',bg:'linear-gradient(160deg,#ffe29a,#ffb347)',pat:'dots'};
  host.innerHTML=`<div class="ccard"><div class="cface cback"></div><div class="cface cfront ${c.bad?'bad':''}" style="--cbg:${a.bg}"><div class="cpat ${a.pat}"></div><span class="ctag">${c.bad?'불운':'행운'}</span><div class="ctitle">${c.t}</div><div class="cart"><span class="s1">${a.s1}</span><span class="big">${a.big}</span><span class="s2">${a.s2}</span></div><div class="cdesc">${c.d}</div></div></div><div class="chint">${p.ai?esc(p.name)+'이(가) 뽑은 카드':'탭하면 닫혀요'}</div>`;
  host.hidden=false;host.classList.remove('show','out');void host.offsetWidth;host.classList.add('show');SFX.play('card');
  return new Promise(res=>{
    let done=false;const close=()=>{if(done)return;done=true;timerStop();host.classList.add('out');setTimeout(()=>{host.hidden=true;host.classList.remove('show','out');host.innerHTML='';res();},450);};
    host.onclick=()=>{if(!p.ai)close();};
    if(p.ai)setTimeout(close,Math.max(1200,D(2200)));else{setTimeout(close,5000);}
  });
}
// still: bonus cards drawn mid-move or mid-toll come from the cards that don't move the piece
async function drawChance(p,still=false){
  const pool=still?CARDS.filter(c=>!c.mv):CARDS,draw=()=>pool[Math.random()*pool.length|0];
  let c=draw();
  if(c.bad&&luckyX(p)){log(`${nm(p)} 행운아: 나쁜 카드(${c.t})를 다시 뽑습니다.`,p);c=draw();}
  say(p.ai?`${nm(p)} 행운카드를 1장 뽑았습니다.`:`${nm(p)} 행운카드: <b>${c.t}</b> · ${c.d}`,p);
  if(!p.ai){await showCard(c,p);SFX.play(c.bad?'cardBad':'cardGood');toast(`${nm(p)} ${c.t} · ${c.d}`,c.bad?'danger':'good');} // AI draws stay quiet: no card reveal
  emote(p,c.bad?'sad':'happy',undefined,{silent:true});
  await c.f(p);renderAll();
}

/* ---------- turn loop ---------- */
const GN=['연두','청록','하늘','남보라','보라','분홍','주황','빨강'];
const WEVENTS={
  olympic:{name:'🏅 올림픽 개최',dur:2,setup:ev=>{const gs=[...new Set(TILES.filter(t=>t.type==='city').map(t=>t.g))];ev.g=gs[Math.random()*gs.length|0];},desc:ev=>`${GN[ev.g]} 그룹 도시 통행료 2배`,short:ev=>`🏅 ${GN[ev.g]} ×2`},
  boom2:{name:'🔥 부동산 과열',dur:2,desc:()=>'모든 통행료 1.5배',short:()=>'🔥 통행료 ×1.5'},
  vip:{name:'💎 VIP 시즌',dur:2,desc:()=>'랜드마크 통행료 2배',short:()=>'💎 랜드마크 ×2'},
  boom:{name:'🏗️ 건설 붐',dur:2,desc:()=>'모든 건설비 40% 할인',short:()=>'🏗️ 건설 -40%'},
  tourism:{name:'✈️ 관광 시즌',dur:2,desc:()=>'관광지 통행료 3배',short:()=>'✈️ 관광지 ×3'},
  quake:{name:'🌋 대지진',dur:0,desc:()=>'건물 2곳이 한 단계 무너집니다',short:()=>'🌋'},
  dividend:{name:'💸 랜드마크 배당',dur:0,desc:()=>'랜드마크 1곳당 150만씩 받습니다',short:()=>'💸'},
};
async function worldEvent(){
  const ids=Object.keys(WEVENTS);const id=ids[Math.random()*ids.length|0];const W=WEVENTS[id];const ev={id,until:G.round+W.dur-1};if(W.setup)W.setup(ev);
  bigEvent(`${W.name}<small>${W.desc(ev)}${W.dur?` · ${W.dur}라운드`:''}</small>`,'gold',3200);SFX.play('news');toast(`세계 이벤트 — ${W.name}: ${W.desc(ev)}`,'good',5000);log(`세계 이벤트: ${W.name} — ${W.desc(ev)}`);
  if(id==='quake'){const c=G.ts.map((s,i)=>i).filter(i=>T(i).type==='city'&&S(i).owner!=null&&S(i).level>=1&&S(i).level<=3);const hit=[];for(let k=0;k<2&&c.length;k++)hit.push(c.splice(Math.random()*c.length|0,1)[0]);
    hit.forEach((i,k)=>collapseFx(i,k*400));shake(.4,1600);await sleep(D(2800));
    hit.forEach(i=>{S(i).level--;S(i).rubble=S(i).level===0;log(`${nm(G.players[S(i).owner])}의 ${T(i).name}이(가) ${LV[S(i).level]}로 내려앉았습니다.`);});if(!hit.length)log('지진이 왔지만 무너질 건물이 없었습니다.');renderAll();}
  else if(id==='dividend'){alive().forEach(q=>{const n=owned(q).filter(i=>S(i).level===4).length;if(n)gain(q,n*150,'랜드마크 배당');});renderAll();}
  else G.event=ev;
  await sleep(D(1800));renderAll();
}
async function playTurn(p){
  if(p.boss&&!p.bankrupt&&!G.over){await bossAction(p);if(G.over)return;}
  if(G.event&&G.round>G.event.until){toast(`${WEVENTS[G.event.id].name} 종료`,'info',2500);G.event=null;renderAll();}
  if(G.pendingEvent){G.pendingEvent=false;await worldEvent();if(G.over)return;}
  if(p.startDraft){p.startDraft=false;await relicDraft(p,'시작 유물');}
  p.boost=false;renderAll();banner(p);SFX.play(p.ai?'click':'skill');updateThreats();
  if(G.limit&&G.limit-G.round===2&&!G.lateWarned){G.lateWarned=1;const lead=alive().reduce((a,b)=>assets(b)>assets(a)?b:a);toast(`⏰ 3라운드 남음. 현재 1위 ${nm(lead)} (${fmt(assets(lead))})`,'danger',6000);SFX.play('alarm');}
  await sleep(D(700));
  if(p.travel){
    p.travel=false;
    const target=await pickTravel(p);
    say(`${nm(p)} 세계여행으로 ${T(target).name}(으)로 이동합니다.`,p);
    await walk(p,(target-p.pos+N)%N);await land(p);return; // clockwise, so passing start pays salary like a normal move
  }
  if(p.island>0){
    const ch=await decide(p,{title:'무인도',html:`<p>남은 ${p.island}턴. 더블이 나오면 바로 탈출해요.</p>`,
      options:[{label:'주사위로 탈출 시도',value:'roll',primary:true},{label:'탈출 비용 내기',value:'pay',cost:ISLAND_FEE,disabled:p.cash<ISLAND_FEE}]},
      ()=>p.cash>700&&p.island>1?'pay':'roll');
    if(ch==='pay'){pay(p,null,ISLAND_FEE,{quiet:true,why:'탈출 비용 → 잭팟',pool:true});p.island=0;say(`${nm(p)} ${fmt(ISLAND_FEE)}을 내고 무인도를 탈출했습니다.`,p);await sailBack(p,'taxi');await bonusCard(p,'무인도 탈출');renderAll();}
    else{
      const d=await roll(p,{noSkill:true});if(!d)return;const[a,b]=d;
      if(a===b){p.island=0;say(`${nm(p)} 더블. 무인도를 탈출합니다.`,p);await sailBack(p,'speed');await bonusCard(p,'무인도 탈출');await walk(p,a+b);await land(p);return;}
      p.island--;say(`${nm(p)} 탈출 실패.${p.island?` 남은 ${p.island}턴.`:' 형기가 끝나 구조선이 옵니다.'}`,p);if(p.island===0){await sailBack(p,'rescue');await bonusCard(p,'무인도 탈출');}return;
    }
  }
  let dbl=0;
  while(true){
    let d=await roll(p);if(!d)return;d=await luckyReroll(p,d);const[a,b]=d;
    if(a===b&&++dbl===3){say(`${nm(p)} 더블 세 번. 무인도로 직행합니다.`,p);await teleport(p,8);if(!await captainStorm(p)){jail(p);await sailToIsland(p);}return;}
    await walk(p,a+b);await land(p);
    if(G.over||p.bankrupt)return;
    if(a===b&&p.island===0&&!p.travel){say(`${nm(p)} 더블. 한 번 더 굴립니다.`,p);continue;}
    return;
  }
}
function nextPlayer(){
  let n=G.cur;
  do{n=(n+1)%4;}while(G.players[n].bankrupt);
  if(n<=G.cur){G.round++;if(G.limit&&G.round>G.limit){G.round=G.limit;endByLimit();return;}if(G.round>1&&G.round%2===0)G.pendingEvent=true;}
  G.cur=n;
}
function endByLimit(){
  const w=alive().reduce((a,b)=>assets(b)>assets(a)?b:a);
  endGame(w,`${G.limit}라운드가 끝나 총자산이 가장 많은 플레이어가 이겼습니다.`);
}
/* ---- world-tour run ---- */
const RUN_STAGES=[
  {name:'아시아',ico:'🏯',theme:'day',limit:20,aiCash:0,aiRelics:0},
  {name:'유럽',ico:'🏰',theme:'sunset',limit:20,aiCash:400,aiRelics:1},
  {name:'아메리카',ico:'🗽',theme:'night',limit:22,aiCash:800,aiRelics:2,boss:true},
];
function stageBanner(){const st=RUN_STAGES[G.run.stage];bigEvent(`${st.ico} 스테이지 ${G.run.stage+1} · ${st.name}${st.boss?'<small>보스: 재벌 회장 등장</small>':`<small>${G.run.stage?'AI가 더 강해졌어요':'세 지역을 정복하세요'}</small>`}`,'gold',3200);}
function nextStage(){
  const prev=G;const run={...prev.run,stage:prev.run.stage+1};const st=RUN_STAGES[run.stage];
  const players=prev.players.map(p=>{const q=newPlayer(p.id,{name:p.name,ai:p.ai,ch:p.ch});q.name=p.name.replace(/^👑 /,'');
    if(!p.ai){q.relics=[...(p.relics||[])];q.startDraft=true;if(q.relics.includes('warhead'))q.nukes=NUKES+1;}
    else{q.cash+=st.aiCash;q.relics=[];for(let k=0;k<st.aiRelics;k++){const ch=Object.keys(RELICS).filter(id=>!q.relics.includes(id)&&!(RELICS[id].needNuke&&prev.nukesOn===false));q.relics.push(ch[Math.random()*ch.length|0]);}}
    return q;});
  if(st.boss){const b=players.find(p=>p.ai);if(b){b.boss=true;b.name='👑 재벌 회장';b.cash=3200;b.relics=['crown','leech'];}}
  const g={players,ts:TILES.map(()=>({owner:null,level:0})),festival:null,round:1,cur:0,over:false,logs:[[`${st.ico} 스테이지 ${run.stage+1}: ${st.name} — 사람 플레이어는 유물을 가지고 갑니다`,null]],
    limit:st.limit,speed:prev.speed,turnSec:prev.turnSec,theme:st.theme,nukesOn:prev.nukesOn,stable:null,specials:rollSpecials(),jackpot:0,run};
  RUN++;startGame(g);setTimeout(stageBanner,600);
}
/* the boss buys up the board: every 3rd boss turn it takes over the most valuable non-landmark city (or buys an empty one) */
async function bossAction(p){
  p.bossTurns=(p.bossTurns||0)+1;if(p.bossTurns%3!==0)return;
  const targets=G.ts.map((s,i)=>i).filter(i=>T(i).type==='city'&&S(i).owner!=null&&S(i).owner!==p.id&&S(i).level<4);
  let i,price,from=null;
  if(targets.length){i=targets.reduce((a,b)=>invested(b)>invested(a)?b:a);price=Math.round(invested(i)*1.2);from=G.players[S(i).owner];}
  else{const free=G.ts.map((s,k)=>k).filter(k=>T(k).type==='city'&&S(k).owner==null);if(!free.length)return;i=free.reduce((a,b)=>T(b).price>T(a).price?b:a);price=T(i).price;}
  if(p.cash<price+200||(from&&await useGuard(from,`재벌의 ${T(i).name} 기업 인수`)))return;
  bigEvent(`재벌의 기업 인수<small>${T(i).name} · ${fmt(price)}${from?' → '+esc(from.name):''}</small>`,'doom',2600);SFX.play('stamp');focusOn(i,2400,1.1);await sleep(D(1400));
  pay(p,from,price,{quiet:true,why:'기업 인수'});S(i).owner=p.id;emote(p,'cool','이것도 내 거.',{priority:6});if(from)emote(from,'angry','강제 인수라니!',{priority:6,silent:true});
  log(`${nm(p)} 기업 인수: ${T(i).name} (${fmt(price)})${from?' ← '+nm(from):''}`,p);renderAll();checkWin(p);
}
function endGame(w,reason){
  if(G.over)return;G.over=true;G.stable=null;timerStop();SFX.setMood(null);setTimeout(updateEmoteBar,6500);
  $('#roll').disabled=true;$('#skill').hidden=true;meter.active=false;
  say(`${nm(w)} 승리. ${reason}`,w);renderAll();confetti();SFX.play('win');bigEvent(`${esc(w.name)} 승리<small>${reason}</small>`,'gold',4000);
  emote(w,'laugh','내가 1등!',{priority:9,ms:6000});alive().filter(q=>q!==w).forEach(q=>emote(q,'cry','졌다…',{priority:8,ms:6000,silent:true}));
  const rank=[...G.players].sort((a,b)=>(a.bankrupt-b.bankrupt)||assets(b)-assets(a));
  const hp=G.players.find(q=>!q.ai); // the logged-in account plays the first human seat
  if(hp&&window.Online)queueMicrotask(()=>Online.record({win:w===hp,assets:assets(hp),landmarks:owned(hp).filter(j=>S(j).level===4).length,run:G.run?(w===hp?G.run.stage+1:G.run.cleared):null})); // after this function's mileage awards
  if(G.run){
    const st=RUN_STAGES[G.run.stage];const humanWon=!w.ai;const last=G.run.stage===RUN_STAGES.length-1;
    if(humanWon){G.run.cleared=G.run.stage+1;}
    if(humanWon&&!last){const bonus=150*(G.run.stage+1);const m=loadMeta();m.miles+=bonus;saveMeta(m);
      setTimeout(()=>modal({title:`${st.ico} 스테이지 ${G.run.stage+1} 클리어`,html:`<div class="big-ico">🎉</div><p><b>${esc(w.name)}</b>이(가) ${st.name} 지역을 정복했어요. ${reason}</p><p>클리어 보너스 <b>+${bonus}</b> 마일리지</p><p class="muted">다음: ${RUN_STAGES[G.run.stage+1].ico} ${RUN_STAGES[G.run.stage+1].name} — 사람 플레이어는 유물을 가지고 가고 새 유물을 하나 더 고릅니다. AI는 자금과 유물을 더 들고 시작해요.${RUN_STAGES[G.run.stage+1].boss?' <b>보스 재벌 회장이 등장합니다.</b>':''}</p>`,
        options:[{label:`${RUN_STAGES[G.run.stage+1].ico} 다음 스테이지로`,value:1,primary:true},{label:'런 포기',value:0}],noTimer:true}).then(v=>{if(v)nextStage();else showSetup();}),900);
      return;}
    const miles=awardMiles()+(humanWon?600:G.run.cleared*100);if(humanWon||G.run.cleared){const m=loadMeta();m.miles+=humanWon?600:G.run.cleared*100;saveMeta(m);}const mtot=loadMeta().miles;
    setTimeout(()=>modal({title:humanWon?'세계 일주 완주':`런 종료 — ${st.name}에서 패배`,html:`<div class="big-ico">${humanWon?'🏆':'🧳'}</div><p>${humanWon?'세 지역을 모두 정복했어요.':`${esc(w.name)}이(가) 이겼어요. ${reason}`}</p><p>클리어한 스테이지 <b>${G.run.cleared}/${RUN_STAGES.length}</b></p><p><b>마일리지 +${miles}</b> (보유 ${mtot.toLocaleString('ko-KR')})</p>`,
      options:[{label:'새 게임',value:1,primary:true},{label:'보드 보기',value:0}],noTimer:true}).then(v=>{if(v)showSetup();}),900);
    return;
  }
  const miles=awardMiles();const mtot=loadMeta().miles;
  setTimeout(()=>modal({title:`${w.name} 승리`,html:`<div class="big-ico">${CH(w.ch).emoji}</div><p>${reason}</p>${miles?`<p><b>마일리지 +${miles}</b> (보유 ${mtot.toLocaleString('ko-KR')}) — 다음 판 시작 화면에서 보너스를 사세요.</p>`:''}<ol class="rank">${rank.map((p,k)=>`<li style="--pc:${p.color}"><span><span class="stamp">${k+1}위</span> ${CH(p.ch).emoji} ${esc(p.name)}${p.bankrupt?' (파산)':''}</span><b>${fmt(assets(p))}</b></li>`).join('')}</ol>`,
    options:[{label:'새 게임',value:1,primary:true},{label:'보드 보기',value:0}]}).then(v=>{if(v)showSetup();}),400);
}
const snap=()=>{const c={...G,players:G.players.map(p=>({...p,anim:false}))};delete c.stable;return JSON.stringify(c);};
async function loop(){
  const r=RUN;
  while(!G.over&&r===RUN){
    G.stable=snap();
    try{await playTurn(G.players[G.cur]);}catch(e){console.error(e);if(r!==RUN)break;G.players[G.cur].anim=false;toast('문제가 생겨 이 턴을 넘깁니다.','danger',3000);} // one bad turn must not freeze the whole game
    if(G.over||r!==RUN)break;
    renderAll();await sleep(D(400));
    if(G.over||r!==RUN)break;
    nextPlayer();
  }
}

/* ---------- setup ---------- */
const DEF_NAMES=['플레이어 1','플레이어 2','플레이어 3','플레이어 4'];
const AI_NAMES=['AI 바람','AI 파도','AI 구름','AI 노을'];
let setupCfg=[0,1,2,3].map(k=>({name:'',ai:k>=2,ch:CHARS[k].id}));
/* remember the setup screen choices in this browser */
const OPT_IDS=['opt-limit','opt-timer','opt-nuke','opt-theme','opt-speed','opt-mode'];
function saveSetup(){try{const o={};OPT_IDS.forEach(id=>{const el=$('#'+id);if(el)o[id]=el.value;});localStorage.setItem('ttm-setup',JSON.stringify({players:setupCfg,opts:o}));}catch(e){}}
function loadSetup(){try{const d=JSON.parse(localStorage.getItem('ttm-setup')||'null');if(!d)return;
  if(Array.isArray(d.players)&&d.players.length===4)setupCfg=d.players.map((c,k)=>({name:String(c.name||'').slice(0,10),ai:!!c.ai,ch:CHARS.some(x=>x.id===c.ch)?c.ch:CHARS[k].id}));
  Object.entries(d.opts||{}).forEach(([id,v])=>{const el=$('#'+id);if(el&&[...el.options].some(o=>o.value===v))el.value=v;});}catch(e){}}
function renderSetup(){
  $('#srows').innerHTML=setupCfg.map((c,k)=>{const ch=CH(c.ch);return `<div class="seat${c.ai?' ai':''}" style="--pc:${PCOLORS[k]}">
    <span class="seatno" title="${k+1}번째 차례">${k+1}</span>
    <button type="button" class="av" data-cyc="${k}" aria-label="${k+1}번 캐릭터 바꾸기, 지금 ${ch.name}">${ch.emoji}</button>
    <input id="name-${k}" value="${esc(c.name)}" placeholder="${c.ai?AI_NAMES[k]:DEF_NAMES[k]}" maxlength="10" aria-label="${k+1}번 이름">
    <div class="seg" role="group" aria-label="${k+1}번 조종"><button type="button" data-k="${k}" data-ai="0" class="${c.ai?'':'on'}" aria-pressed="${!c.ai}">사람</button><button type="button" data-k="${k}" data-ai="1" class="${c.ai?'on':''}" aria-pressed="${c.ai}">AI</button></div>
    <select id="ch-${k}" data-ch="${k}" aria-label="${k+1}번 캐릭터">${CHARS.map(x=>`<option value="${x.id}" ${x.id===c.ch?'selected':''}>${x.emoji} ${x.name}</option>`).join('')}</select>
    <p class="chdesc" title="특성: ${esc(ch.passive)}"><b>${ch.skill}</b> ${ch.sdesc}</p></div>`;}).join('');
}
function readNames(){setupCfg.forEach((c,k)=>{const el=$('#name-'+k);if(el)c.name=el.value.trim();});}
$('#srows').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;readNames();
  if(b.dataset.k!=null){setupCfg[+b.dataset.k].ai=b.dataset.ai==='1';renderSetup();renderShop();}
  else if(b.dataset.cyc!=null){const k=+b.dataset.cyc,idx=CHARS.findIndex(x=>x.id===setupCfg[k].ch);setupCfg[k].ch=CHARS[(idx+1)%CHARS.length].id;renderSetup();}
});
$('#srows').addEventListener('change',e=>{const s=e.target.closest('select[data-ch]');if(!s)return;readNames();setupCfg[+s.dataset.ch].ch=s.value;renderSetup();});
function showSetup(){SFX.setMood(null);RUN++;timerStop();rollResolver=modalResolver=pickResolver=modalDismiss=null;setPickable(null);meter.active=false;$('#modal').hidden=true;$('#skill').hidden=true;renderSetup();renderShop();$('#setup').hidden=false;}
$('#shop').addEventListener('click',e=>{const b=e.target.closest('button[data-perk]');if(!b||b.disabled)return;const k=b.dataset.perk;if(perkSel.has(k))perkSel.delete(k);else perkSel.add(k);renderShop();});
$('#btn-new').addEventListener('click',showSetup);
const newPlayer=(k,c)=>({id:k,name:c.name||(c.ai?AI_NAMES[k]:DEF_NAMES[k]),color:PCOLORS[k],ai:c.ai,ch:c.ch,cash:START_CASH,pos:0,island:0,travel:false,shield:0,guard:0,bankrupt:false,skillUsed:false,boost:false,fixDice:null,anim:false,nukes:NUKES});
function startGame(g){
  G=g;applySpecials(G.specials);if(env.theme!==(G.theme||'day')){buildEnv(G.theme||'day');tiles.forEach(t=>t.key=null);}tiles.forEach(t=>{t.level=null;t.key=null;});$('#log').innerHTML='';[...G.logs].reverse().forEach(([t,pid])=>{const li=document.createElement('li');li.innerHTML=t;if(pid!=null)li.style.setProperty('--pc',G.players[pid].color);$('#log').prepend(li);});
  tiles.forEach(t=>t.key=null);buildTokens();face($('#d1'),1);face($('#d2'),1);meterSet(7);meterEl.classList.add('idle');updateEmoteBar();$('#toasts').innerHTML='';threatTiles.clear();
  renderAll();loop();if(G.run&&G.run.stage===0&&G.round===1)setTimeout(stageBanner,600);
}
$('#btn-start').addEventListener('click',()=>{
  readNames();saveSetup();RUN++;
  const g={players:setupCfg.map((c,k)=>newPlayer(k,c)),
    ts:TILES.map(()=>({owner:null,level:0})),festival:null,round:1,cur:0,over:false,logs:[['새 게임을 시작합니다. 모두 1,500만으로 출발',null]],
    limit:+$('#opt-limit').value,speed:+$('#opt-speed').value,turnSec:+$('#opt-timer').value,theme:$('#opt-theme').value,nukesOn:$('#opt-nuke').value==='1',stable:null};
  g.specials=rollSpecials();g.jackpot=0;
  if($('#opt-mode').value==='run'){g.run={stage:0,cleared:0};const st=RUN_STAGES[0];g.theme=st.theme;g.limit=st.limit;g.logs.unshift([`세계 일주 런 시작 — 스테이지 1: ${st.name}`,null]);}
  const m=loadMeta();const humansP=g.players.filter(p=>!p.ai);let spent=0;
  if(humansP.length)perkSel.forEach(k=>{if(m.miles-spent>=PERKS[k].cost){spent+=PERKS[k].cost;humansP.forEach(p=>{if(k==='cash')p.cash+=500;if(k==='relic')p.startDraft=true;if(k==='nuke')p.nukes=(p.nukes??NUKES)+1;if(k==='shield')p.shield+=2;});g.logs.unshift([`마일리지 보너스: ${PERKS[k].ico} ${PERKS[k].name}`,null]);}});
  if(spent){m.miles-=spent;saveMeta(m);}perkSel.clear();
  $('#setup').hidden=true;startGame(g);
});
$('#roll').addEventListener('click',()=>{if(rollResolver)rollResolver('roll');});
{const bar=$('#emotes');bar.innerHTML=Object.entries(EMO_ICON).map(([k,v])=>`<button type="button" data-emo="${k}" title="${k}">${v}</button>`).join('');
 bar.addEventListener('click',e=>{const b=e.target.closest('button[data-emo]');if(!b||!G||G.over)return;const cur=G.players[G.cur];const me=(!cur.ai&&!cur.bankrupt)?cur:G.players.find(q=>!q.ai&&!q.bankrupt);if(!me)return;emote(me,b.dataset.emo,undefined,{priority:3});});}
function updateEmoteBar(){$('#emotes').hidden=!G||G.over||!G.players.some(q=>!q.ai&&!q.bankrupt);}
/* Esc / Android back: close the topmost popup (card → modal → log) */
function closeTop(){
  if(!$('#cardfx').hidden){$('#cardfx').click();return true;}
  if(!$('#modal').hidden&&modalDismiss){modalDismiss();return true;}
  if(!$('#logpanel').hidden){$('#btn-log-close').click();return true;}
  return false;
}
try{history.pushState({el:1},'');}catch(e){}
addEventListener('popstate',()=>{if(closeTop())try{history.pushState({el:1},'');}catch(e){}}); // ponytail: nothing open → this back is swallowed once, the next one leaves
/* tap anywhere (not a control, not a drag) stops the pointer */
{let td=null;
 document.addEventListener('pointerdown',e=>{td=[e.clientX,e.clientY];},{passive:true});
 document.addEventListener('pointerup',e=>{if(!td)return;const dx=e.clientX-td[0],dy=e.clientY-td[1];td=null;
   if(dx*dx+dy*dy>36||!rollResolver||!$('#modal').hidden||!$('#setup').hidden||e.target.closest('button,a,input,select,summary,details,.logpanel,.corner'))return;
   rollResolver('roll');});}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&closeTop()){e.preventDefault();return;}
  if(e.code==='Space'&&rollResolver&&$('#modal').hidden&&$('#setup').hidden&&!/INPUT|SELECT|BUTTON/.test(document.activeElement.tagName)){e.preventDefault();rollResolver('roll');}
});

/* ---------- boot ---------- */
{const sel=$('#opt-theme');sel.innerHTML=Object.entries(THEMES).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('');try{const t=localStorage.getItem('el-theme');if(t&&THEMES[t])sel.value=t;}catch(e){}sel.addEventListener('change',()=>{try{localStorage.setItem('el-theme',sel.value);}catch(e){}buildEnv(sel.value);});}
loadSetup();buildEnv($('#opt-theme').value||'day');buildTiles();fitCamera();requestAnimationFrame(frame);
$('#loading').hidden=true;
document.fonts?.ready.then(()=>{tiles.forEach(t=>t.key=null);sync();});
function start(data){
  if(data&&data.stable){
    try{const g=JSON.parse(data.stable);g.stable=null;RUN++;startGame(g);return;}catch(e){G=null;}
  }
  G={players:[0,1,2,3].map(k=>newPlayer(k,{name:'',ai:k>=2,ch:CHARS[k].id})),
    ts:TILES.map(()=>({owner:null,level:0})),festival:null,round:1,cur:0,over:true,logs:[],limit:30,speed:1,turnSec:30};
  buildTokens();renderAll();showSetup();
}
if(location.hostname==='localhost'||location.hostname==='127.0.0.1')window.__dbg={get G(){return G;},sailToIsland,sailBack,jail,emote,buildEnv,firework,env,focusAt,sync,collapseFx,landmarkThumb,LANDMARKS,nukeCinematic,blastTargets,showCard,CARDS,offerNuke,nukePreview,relicDraft,grantRelic,RELICS,applySpecials,landCasino,endGame,nextStage,bossAction,setPickable,pickTravel,pullNeighbors,SFX,walk,lots,collapseFx,renderer,camera,scene,env,tiles,THREE,textPlane,tree,streetLamp,buildEnv};
window.claude?.hot?.snapshot?.(()=>({stable:G&&!G.over?G.stable:null}));
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});
