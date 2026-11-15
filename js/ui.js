'use strict';
/* =================== FEEDBACK & TENSION =================== */
function toast(html,kind='info',ms=3800){ms=Math.min(ms,5000);const box=$('#toasts');const el=document.createElement('div');el.className='toast '+kind;el.innerHTML=html;box.appendChild(el);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),420);},ms);}
function bigEvent(html,cls='',ms=2600){const b=$('#bigev');b.className='bigev '+cls;void b.offsetWidth;b.innerHTML=html;b.classList.add('show');clearTimeout(b._t);b._t=setTimeout(()=>{b.className='bigev';},ms);}
function vignette(color='#ff2a2a'){const v=$('#vignette');v.style.setProperty('--vc',color);v.classList.remove('on');void v.offsetWidth;v.classList.add('on');}
function flashCard(p,cls){p.flash={cls:'flash-'+cls,until:Date.now()+900};renderPlayers();setTimeout(()=>{if(G&&!G.over)renderPlayers();},950);}
function tokenPos(p){return tokens[p.id]?tokens[p.id].grp.position.clone():slotPos(p.pos,p.id);}
function floatText(pos,text,color){
  const cv=document.createElement('canvas');cv.width=320;cv.height=110;const g=cv.getContext('2d');
  g.font='bold 64px "Black Han Sans","Jua","Gothic A1",sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=12;g.strokeStyle='rgba(0,0,0,.7)';g.strokeText(text,160,55);g.fillStyle=color;g.fillText(text,160,55);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sp.scale.set(1.9,.65,1);sp.renderOrder=25;sp.position.copy(pos).add(new THREE.Vector3(0,1.2,0));scene.add(sp);
  effects.push({t0:performance.now(),ms:1700,type:'fn',fn:u=>{sp.position.y=pos.y+1.2+u*1.2;const s=1+Math.sin(Math.min(1,u*4)*Math.PI)*.35;sp.scale.set(1.9*s,.65*s,1);sp.material.opacity=u<.65?1:1-(u-.65)/.35;},done:()=>{scene.remove(sp);tex.dispose();sp.material.dispose();}});
}
let _coinTex=null;
function coinTex(){if(_coinTex)return _coinTex;const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d');g.fillStyle='#f5b400';g.beginPath();g.arc(32,32,28,0,Math.PI*2);g.fill();g.fillStyle='#ffe27a';g.beginPath();g.arc(32,32,20,0,Math.PI*2);g.fill();g.fillStyle='#8a5a00';g.font='bold 30px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('₩',32,34);_coinTex=new THREE.CanvasTexture(cv);_coinTex.colorSpace=THREE.SRGBColorSpace;return _coinTex;}
function coinFly(from,to,n=7){
  const tex=coinTex();
  for(let k=0;k<n;k++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sp.scale.set(.28,.28,1);sp.renderOrder=26;sp.visible=false;scene.add(sp);
    const jx=(Math.random()-.5)*.4,jz=(Math.random()-.5)*.4;
    effects.push({t0:performance.now()+k*80,ms:850,type:'fn',fn:u=>{sp.visible=true;sp.position.lerpVectors(from,to,u);sp.position.x+=jx*Math.sin(u*Math.PI);sp.position.z+=jz*Math.sin(u*Math.PI);sp.position.y+=.55+Math.sin(u*Math.PI)*1.6;},done:()=>{scene.remove(sp);sp.material.dispose();}});}
}
function moneyFx(p,to,amt,before,opt){
  const pp=tokenPos(p);floatText(pp,'-'+fmt(amt),'#ff6b6b');flashCard(p,'loss');
  if(!opt.quiet)emote(p,amt>=before*0.5?'cry':'sad',undefined,{silent:true});
  if(to){const tp=tokenPos(to);coinFly(pp,tp);setTimeout(()=>floatText(tp,'+'+fmt(amt),'#7cf29a'),550);flashCard(to,'gain');if(!opt.quiet)emote(to,amt>=120?'laugh':'happy',undefined,{silent:true});
    toast(`${nm(p)} → ${nm(to)} <b>${fmt(amt)}</b>${opt.why?' · '+opt.why:''}`,'money');}
  else toast(`${nm(p)} <b>-${fmt(amt)}</b>${opt.why?' · '+opt.why:''}`,'money');
}
function bankruptFx(p){
  bigEvent(`${esc(p.name)} 파산<small>남은 플레이어 ${alive().length}명</small>`,'doom',3200);vignette('#111');shake(.3,700);
  emote(p,'cry','망했다…',{priority:9,ms:4000});toast(`${nm(p)} 파산. 모든 땅이 매물로 돌아갑니다.`,'danger',5000);
}
/* landing outlook for the human's dice meter */
let hintTiles=null;const threatTiles=new Map();
const GNAMES=['연두','청록','하늘','남보라','보라','분홍','주황','빨강'];
function landingInfo(p,i){
  const t=T(i),s=S(i);
  if(t.type==='city'||t.type==='tour'){
    if(s.owner==null)return{cls:'free',txt:'구매 '+fmt(t.price)};
    if(s.owner===p.id){const rng=t.type==='city'?range(s.level):0;const v=rng?alive().filter(q=>q!==p&&q.island===0&&q.pos!==i&&Math.min((q.pos-i+N)%N,(i-q.pos+N)%N)<=rng):[];return{cls:'own',txt:v.length?`🧲${v.length}명`:'내 땅',pull:v};}
    let amt=toll(i);if(has(p,'negotiator'))amt=Math.round(amt*.7);if(has(p,'captain')&&t.type==='tour')return{cls:'own',txt:'면제'};if(p.shield>0)return{cls:'own',txt:'면제권'};
    return{cls:amt>=p.cash*.4||amt>=400?'deadly':'pay',txt:'-'+fmt(amt)};
  }
  if(t.type==='start')return G.nukesOn!==false&&(p.nukes==null||p.nukes>0)&&owned(p).some(j=>T(j).type==='city'&&S(j).level>=1)?{cls:'good',txt:'☢️ 핵폭탄'}:{cls:'good',txt:'출발'};
  return{island:{cls:'bad',txt:'무인도'},festival:{cls:'good',txt:'축제'},travel:{cls:'good',txt:'세계여행'},chance:{cls:'card',txt:'카드'},casino:{cls:'card',txt:'🎰카지노'}}[t.type];
}
const HINT_COL={pay:0xff5a5a,deadly:0xff1a1a,free:0x4ad66d,own:0x3b9dff,card:0xffd166,bad:0xb070ff,good:0xffe08a};
function showHints(p){
  const box=$('#mhint');box.innerHTML='';hintTiles=new Map();const notes=[];
  for(let s=2;s<=12;s++){const i=(p.pos+s)%N,info=landingInfo(p,i);const el=document.createElement('span');el.className=info.cls;el.textContent=info.txt;el.title=T(i).name;box.appendChild(el);hintTiles.set(i,HINT_COL[info.cls]);
    if(info.pull&&info.pull.length)notes.push(`🧲 ${s}이면 ${T(i).name}에서 ${info.pull.map(q=>esc(q.name)).join('·')} 끌어오기`);
    if(info.cls==='deadly')notes.push(`☠️ ${s}은 ${T(i).name} ${info.txt}`);}
  if(notes.length)setTimeout(()=>{if(hintTiles)setMsg(notes.join(' · '));},10);
}
function clearHints(){$('#mhint').innerHTML='';hintTiles=null;tiles.forEach(t=>t.key=null);sync();}
/* monopoly threats: who is one tile away from a win */
function computeThreats(){
  const out=[];
  for(const p of alive()){
    let full=0;for(let g=0;g<8;g++)if(ownsGroup(p.id,g))full++;
    if(full>=2)for(let g=0;g<8;g++){const idx=groupIdx(g),mine=idx.filter(i=>S(i).owner===p.id);if(mine.length===idx.length-1){const miss=idx.find(i=>S(i).owner!==p.id);out.push({p,tile:miss,key:`g${g}-${p.id}`,label:`트리플 독점까지 ${GNAMES[g]} 그룹 1곳 (${T(miss).name})`});}}
    const tm=tourIdx.filter(i=>S(i).owner===p.id);if(tm.length===3){const miss=tourIdx.find(i=>S(i).owner!==p.id);out.push({p,tile:miss,key:`t-${p.id}`,label:`관광지 독점까지 1곳 (${T(miss).name})`});}
    for(let s=0;s<4;s++){const sc=sideCities(s),mine=sc.filter(i=>S(i).owner===p.id);if(mine.length===sc.length-1){const miss=sc.find(i=>S(i).owner!==p.id);out.push({p,tile:miss,key:`s${s}-${p.id}`,label:`라인 독점까지 1곳 (${T(miss).name})`});}}
  }
  return out;
}
function updateThreats(){
  const th=computeThreats();threatTiles.clear();G.seen=G.seen||{};
  th.forEach(t=>{threatTiles.set(t.tile,t.p.color);if(!G.seen[t.key]){G.seen[t.key]=1;toast(`${nm(t.p)} ${t.label}`,'danger',5200);SFX.play('alarm');}});
  if(!th.length)return;
}
function monopolyFx(p,i){
  const t=T(i);if(t.type!=='city')return;
  if(ownsGroup(p.id,t.g)&&groupIdx(t.g).length>1){groupIdx(t.g).forEach(j=>{const rr=rect(j);landDust(new THREE.Vector3(rr.x,.25,rr.z),8,1.2);});toast(`${nm(p)} ${GNAMES[t.g]} 그룹 독점. 통행료 2배`,'good',4500);SFX.play('monopoly');emote(p,'cool','독점이다!',{priority:5});}
}
function rankOf(p){const al=alive().sort((a,b)=>assets(b)-assets(a));const k=al.indexOf(p);return k<0?4:k+1;}

/* ---- turn timer ---- */
const timer={until:0,cb:null,lastSec:-1};
function timerStart(sec,cb){if(!sec||!G||G.over)return;timer.until=performance.now()+sec*1000;timer.cb=cb;timer.lastSec=-1;$('#timer').hidden=false;$('#m-timer').hidden=$('#modal').hidden;}
function timerStop(){timer.until=0;timer.cb=null;$('#timer').hidden=true;$('#m-timer').hidden=true;$('#timer').classList.remove('urgent');$('#m-timer').classList.remove('urgent');}
function timerTick(now){
  if(!timer.until)return;const left=Math.max(0,(timer.until-now)/1000),sec=Math.ceil(left);
  if(sec!==timer.lastSec){timer.lastSec=sec;const t=sec+'초';$('#timer').textContent=t;$('#m-timer').textContent=t;const urg=sec<=5;$('#timer').classList.toggle('urgent',urg);$('#m-timer').classList.toggle('urgent',urg);if(urg&&sec>0)SFX.play('tick');}
  if(left<=0){const cb=timer.cb;timerStop();if(cb){toast('⏱ 시간 초과. 자동으로 진행합니다.','danger',3000);cb();}}
}
/* ---- orientation: keep phones in landscape ---- */
const isTouchNow=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;const isTouch=isTouchNow();
function applyOrientation(){
  const rot=$('#rot');const portrait=isTouchNow()&&innerHeight>innerWidth&&Math.min(innerWidth,innerHeight)<900;
  const was=rot.classList.contains('rotated');rot.classList.toggle('rotated',portrait);
  if(was!==portrait)setTimeout(fitCamera,50);
}
addEventListener('resize',applyOrientation);addEventListener('orientationchange',()=>setTimeout(applyOrientation,100));applyOrientation();
let lockTried=false;
async function tryLandscapeLock(){
  if(lockTried||!isTouch)return;lockTried=true;
  try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:'hide'});}catch(e){}
  try{if(screen.orientation&&screen.orientation.lock)await screen.orientation.lock('landscape');}catch(e){}
  setTimeout(applyOrientation,300);
}
document.addEventListener('pointerup',()=>{tryLandscapeLock();},{passive:true});
/* ---- log panel / rules ---- */
$('#btn-log').addEventListener('click',()=>{const lp=$('#logpanel');lp.hidden=!lp.hidden;$('#btn-log').setAttribute('aria-pressed',String(!lp.hidden));});
$('#btn-log-close').addEventListener('click',()=>{$('#logpanel').hidden=true;$('#btn-log').setAttribute('aria-pressed','false');});
$('#btn-home').addEventListener('click',()=>{freeUntil=0;focusOverride=null;if(!cinema){camera.position.copy(homePos);controls.target.copy(TARGET);}toast('시점을 원래대로','info',1500);});
$('#btn-fs').addEventListener('click',()=>{const el=document.documentElement;if(document.fullscreenElement){document.exitFullscreen?.();}else{el.requestFullscreen?.({navigationUI:'hide'}).catch(()=>{});}});
document.addEventListener('fullscreenchange',()=>{$('#btn-fs').innerHTML=`<svg class="ic"><use href="#i-${document.fullscreenElement?'fsx':'fs'}"/></svg>`;setTimeout(fitCamera,60);});
$('#btn-rules').addEventListener('click',()=>{if(!$('#modal').hidden)return;modal({title:'규칙',html:$('#rules-tpl').innerHTML,options:[{label:'닫기',value:0,primary:true}],noTimer:true});});

/* =================== ROGUELIKE LAYER: relics, special tiles, mileage =================== */
const RELICS={
  magnet:{name:'강력 자석',ico:'🧲',desc:'끌어오기 범위 +1칸'},
  leech:{name:'흡혈 계약',ico:'🩸',desc:'통행료를 받을 때마다 10% 추가로 받음'},
  autobuild:{name:'속성 공사',ico:'🏗️',desc:'도시를 살 때 별장이 무료로 지어짐'},
  dice:{name:'납 주사위',ico:'🎲',desc:'주사위 포인터 명중률 +15%'},
  insurance:{name:'파산 보험',ico:'🛡️',desc:'처음 파산할 때 한 번, 빚을 탕감받고 500만을 받아 살아남음'},
  warhead:{name:'핵 탄두',ico:'☢️',desc:'핵폭탄 +1발, 사정거리 +1칸',needNuke:true},
  jackhunter:{name:'잭팟 사냥꾼',ico:'🎟️',desc:'출발을 지나기만 해도 잭팟 절반을 가져감'},
  crown:{name:'독점 왕관',ico:'👑',desc:'내 독점 그룹 통행료 2배 → 2.5배'},
  salary:{name:'연봉 협상',ico:'💼',desc:'월급 +100만'},
  coupon:{name:'할인 쿠폰',ico:'🏷️',desc:'내는 통행료 15% 할인'},
};
const MAX_RELICS=6;
const hasR=(p,id)=>!!(p&&p.relics&&p.relics.includes(id));
const nukeRange=(p,i)=>range(S(i).level)+(hasR(p,'warhead')?1:0);
function relicChoices(p,n=3){const pool=Object.keys(RELICS).filter(id=>!hasR(p,id)&&!(RELICS[id].needNuke&&G.nukesOn===false));for(let k=pool.length-1;k>0;k--){const j=Math.random()*(k+1)|0;[pool[k],pool[j]]=[pool[j],pool[k]];}return pool.slice(0,n);}
function aiRelicScore(p,id){
  const own=owned(p),blds=own.filter(i=>T(i).type==='city'&&S(i).level>0).length;let groups=0;for(let g=0;g<8;g++)if(ownsGroup(p.id,g))groups++;
  return({magnet:blds*12,leech:blds*14+own.length*4,autobuild:p.cash>700?40:15,dice:30,insurance:p.cash<500?70:20,warhead:blds?35:5,jackhunter:(G.jackpot||0)/6+15,crown:groups?80:(own.length>4?25:5),salary:45,coupon:35})[id]+Math.random()*15;
}
function grantRelic(p,id,why){
  p.relics=p.relics||[];if(hasR(p,id))return;p.relics.push(id);const R=RELICS[id];
  if(id==='warhead'){p.nukes=(p.nukes==null?NUKES:p.nukes)+1;}
  if(p.ai){log(`${nm(p)} 유물 1개 획득`,p);emote(p,'happy',undefined,{silent:true});} // which relic stays secret
  else{toast(`${R.ico} ${nm(p)} 유물 획득 — <b>${R.name}</b>: ${R.desc}`,'good',4500);log(`${nm(p)} 유물 ${R.ico} ${R.name} 획득${why?' ('+why+')':''}`,p);emote(p,'happy',R.name+'!',{silent:true});}SFX.play('relic');renderPlayers();
}
async function relicDraft(p,why='한 바퀴 보상'){
  if(G.over||p.bankrupt)return;p.relics=p.relics||[];if(p.relics.length>=MAX_RELICS)return;
  const ch=relicChoices(p);if(!ch.length)return;
  const pick=await decide(p,{title:`유물 고르기 · ${why}`,html:`<p>하나를 골라 이번 판 내내 가지고 갑니다. (보유 ${p.relics.length}/${MAX_RELICS})</p>`,
    options:ch.map(id=>({label:`${RELICS[id].ico} <b>${RELICS[id].name}</b> — ${RELICS[id].desc}`,value:id})).concat([{label:'건너뛰기',value:-1}])},
    ()=>ch.reduce((a,b)=>aiRelicScore(p,b)>aiRelicScore(p,a)?b:a));
  if(pick===-1||pick==null)return;grantRelic(p,pick,why);
}
/* ---- special tiles: a few chance tiles become something else each game ---- */
const SPECIALS={
  casino:{type:'casino',name:'카지노',ico:'🎰'},
};
const ORIG_TILES=TILES.map(t=>t);
function rollSpecials(){
  const chanceIdx=ORIG_TILES.map((t,i)=>t.type==='chance'?i:-1).filter(i=>i>=0);
  const types=Object.keys(SPECIALS).sort(()=>Math.random()-.5);const spots=chanceIdx.sort(()=>Math.random()-.5).slice(0,1);
  const out={};spots.forEach((i,k)=>out[i]=types[k%types.length]);return out;
}
function applySpecials(map){
  ORIG_TILES.forEach((t,i)=>{TILES[i]=map&&map[i]?{...SPECIALS[map[i]]}:t;});
  if(typeof tiles!=='undefined'&&tiles.length)TILES.forEach((t,i)=>refreshTileLook(i));
}
function refreshTileLook(i){
  const tl=tiles[i];if(!tl||!tl.base)return;const t=T(i);const mats=tl.base.material;
  if(Array.isArray(mats)){mats[2].color.set(BASE[t.type]||0xeeeeee);[0,1,3,4,5].forEach(k=>mats[k].color.set(new THREE.Color(BASE[t.type]||0xeeeeee).multiplyScalar(.62)));}
  if(tl.prop){tl.grp.remove(tl.prop);disposeObj(tl.prop);tl.prop=null;}const pr=tileProp(t,i);if(pr){tl.grp.add(pr);tl.prop=pr;}tl.key=null;
}
async function landCasino(p){
  const half=Math.floor(p.cash/2/10)*10;const opts=[100,300].filter(v=>v<=p.cash).map(v=>({label:`🎲 ${fmt(v)} 걸기`,value:v}));if(half>300)opts.push({label:`🔥 절반 ${fmt(half)} 걸기`,value:half,danger:true});opts.push({label:'구경만 한다',value:0,primary:true});
  const bet=await decide(p,{title:'카지노',html:'<p>홀짝 한 판. 이기면 건 돈만큼 더 받고, 지면 건 돈은 잭팟에 쌓입니다.</p>',options:opts},()=>p.cash>900&&Math.random()<.7?(p.cash>2000&&Math.random()<.3?half:300):p.cash>500?100:0);
  if(!bet){log(`${nm(p)} 카지노 구경만 했습니다.`,p);return;}
  bigEvent(`${fmt(bet)} 베팅<small>${esc(p.name)}</small>`,'gold',1400);SFX.play('slot');await sleep(D(1400));
  if(Math.random()<.5){gain(p,bet,'카지노 승리');bigEvent(`카지노 승리<small>+${fmt(bet)}</small>`,'gold',1800);SFX.play('casinoWin');emote(p,'laugh','대박!',{priority:5});}
  else{pay(p,null,bet,{why:'카지노 → 잭팟',pool:true});bigEvent(`카지노 패배<small>-${fmt(bet)}</small>`,'doom',1800);SFX.play('casinoLose');emote(p,'cry','털렸다…',{priority:5,silent:true});}
  renderAll();
}
/* ---- mileage (persists in this browser) ---- */
const PERKS={
  cash:{name:'+500만 시작 자금',ico:'💵',cost:200},
  relic:{name:'시작 유물 고르기',ico:'🎁',cost:300},
  nuke:{name:'핵폭탄 +1발',ico:'☢️',cost:150},
  shield:{name:'통행료 면제권 2장',ico:'🎫',cost:120},
};
function localMeta(){try{return Object.assign({miles:0,games:0},JSON.parse(localStorage.getItem('ttm-meta')||'{}'));}catch(e){return{miles:0,games:0};}}
// logged in: the mileage balance is the account's (js/online.mjs); this browser's own balance is kept untouched
function loadMeta(){const m=localMeta();if(window.Online&&Online.miles!=null)m.miles=Online.miles;return m;}
function saveMeta(m){const on=window.Online&&Online.miles!=null;try{localStorage.setItem('ttm-meta',JSON.stringify(on?{...m,miles:localMeta().miles}:m));}catch(e){}if(on)Online.setMiles(m.miles);}
let perkSel=new Set();
function renderShop(){
  const m=loadMeta();const spent=[...perkSel].reduce((a,k)=>a+PERKS[k].cost,0);const humans=setupCfg.some(c=>!c.ai);
  $('#shop').innerHTML=`<div class="shop-head">마일리지 <b>${m.miles.toLocaleString('ko-KR')}</b>${spent?` <span>(사용 예정 -${spent})</span>`:''}<small>${humans?'사람 플레이어 모두에게 적용 · 시작할 때 차감':'관전 모드에서는 사용할 수 없어요'}</small></div>`+
    Object.entries(PERKS).map(([k,v])=>{const on=perkSel.has(k);const can=humans&&(on||m.miles-spent>=v.cost);return `<button type="button" class="perk ${on?'on':''}" data-perk="${k}" ${can?'':'disabled'}>${v.ico} ${v.name}<b>${v.cost}</b></button>`;}).join('');
}
function awardMiles(){
  const humans=G.players.filter(p=>!p.ai);if(!humans.length)return 0;
  const rank=[...G.players].sort((a,b)=>(a.bankrupt-b.bankrupt)||assets(b)-assets(a));
  let gained=0;humans.forEach(p=>{const r=rank.indexOf(p);gained+=[300,150,80,40][r]||40;gained+=owned(p).filter(i=>S(i).level===4).length*30;gained+=(p.relics||[]).length*10;});
  const m=loadMeta();m.miles+=gained;m.games++;saveMeta(m);return gained;
}

/* =================== HUD / UI =================== */
function renderPlayers(){
  const cards=G.players.map((p,k)=>{
    const st=[],c=CH(p.ch);
    if(p.bankrupt)st.push('파산');
    if(p.island>0)st.push(`무인도 ${p.island}턴`);
    if(p.travel)st.push('세계여행 대기');
    const mine=!p.ai; // opponents' hands stay hidden: only the board (money, land) is public
    if(mine&&p.shield>0)st.push(`🎫면제권 ${p.shield}`);if(mine&&p.guard>0)st.push(`🛡️방어권 ${p.guard}`);
    if(p.boost)st.push('바가지 중');
    if(mine&&p.fixDice)st.push(`다음 주사위 ${p.fixDice[0]+p.fixDice[1]}`);
    const nk=p.nukes==null?NUKES:p.nukes;
    const rk=p.bankrupt?0:rankOf(p),fl=p.flash&&Date.now()<p.flash.until?p.flash.cls:'';
    return `<div class="pcard ${p.boss?'boss':''} ${k===G.cur&&!G.over?'cur':''} ${p.bankrupt?'out':''} ${!p.bankrupt&&p.cash<250?'low':''} ${fl}" style="--pc:${p.color}">
      <span class="av">${c.emoji}</span><span class="pn">${rk?`<span class="rank r${rk}">${rk}위</span>`:''}${esc(p.name)} <small>${p.ai?'AI':'사람'}</small><span class="ch">${c.name}</span><span class="sk ${mine&&p.skillUsed?'used':''}" title="${c.sdesc}">${mine&&p.skillUsed?c.skill+' 사용':c.skill}</span></span><span class="cash">${fmt(p.cash)}</span>
      <span class="meta"><span>총자산 ${fmt(assets(p))}</span><span>보유 ${owned(p).length}곳</span>${mine?`<span title="남은 핵폭탄">☢️${nk}</span>`:''}${mine&&(p.relics||[]).length?`<span class="relics" title="${p.relics.map(id=>RELICS[id].name+': '+RELICS[id].desc).join('\n')}">${p.relics.map(id=>RELICS[id].ico).join('')}</span>`:''}${st.length?`<span class="st">${st.join(' · ')}</span>`:''}</span></div>`;
  });
  cards.forEach((h,k)=>{$('#pc'+k).innerHTML=h;});
}
function renderAll(){
  sync();renderPlayers();updateMusic();
  const p=G.players[G.cur];
  const left=G.limit?G.limit-G.round+1:0;$('#round').textContent=(G.run?`${RUN_STAGES[G.run.stage].ico} ${G.run.stage+1}/${RUN_STAGES.length} · `:'')+`${G.round} 라운드`+(G.limit?` / ${G.limit}`:'')+(inFinal()?` · 🔥 파이널 ×${FINAL_MULT}`:G.round>1?` · 물가 ×${inflation().toFixed(2)}`:'')+(left&&left<=3?` · ⏰${left}턴 남음`:'');$('#round').classList.toggle('late',!!left&&left<=3);
  {const jc=$('#jackchip');const jt='잭팟 '+fmt(G.jackpot||0);if(jc.textContent!==jt){jc.textContent=jt;jc.classList.remove('bump');void jc.offsetWidth;jc.classList.add('bump');}const ec=$('#evchip');if(G.event){ec.hidden=false;ec.textContent=WEVENTS[G.event.id].short(G.event)+' · '+(G.event.until-G.round+1)+'R';}else ec.hidden=true;}
  $('#turn').innerHTML=`<i style="--pc:${p.color}">${CH(p.ch).emoji}</i>${esc(p.name)}의 차례`;$('#turn').style.setProperty('--pc',p.color);stage.style.setProperty('--pc',p.color);
}
function setMsg(t){$('#msg').innerHTML=t;}
function log(t,p){
  const li=document.createElement('li');li.innerHTML=t;if(p)li.style.setProperty('--pc',p.color);
  const l=$('#log');l.prepend(li);while(l.children.length>120)l.lastChild.remove();
  G.logs.unshift([t,p?p.id:null]);if(G.logs.length>120)G.logs.length=120;
}
function say(t,p){setMsg(t);log(t,p);}
const nm=p=>`<b style="color:${p.color};--pc:${p.color}">${CH(p.ch).emoji} ${esc(p.name)}</b>`;
function confetti(){
  const c=$('#confetti');c.hidden=false;c.innerHTML='';
  const cols=['#ff5252','#ffd740','#40c4ff','#69f0ae','#e040fb','#fff'];
  for(let k=0;k<120;k++){const i=document.createElement('i');i.style.left=Math.random()*100+'%';i.style.setProperty('--c',cols[k%cols.length]);i.style.animationDuration=2+Math.random()*2.5+'s';i.style.animationDelay=Math.random()*1.5+'s';c.appendChild(i);}
  setTimeout(()=>{c.hidden=true;c.innerHTML='';},5500);
}

/* ---------- dice meter ---------- */
const meter={active:false,x:0.45,dir:1,val:7};
const meterEl=$('#meter'),ptrEl=$('#ptr'),nums=[...meterEl.querySelectorAll('span')];
function meterShow(){const v=2+Math.min(10,Math.floor(meter.x*11));if(meter.active&&v!==meter.val)SFX.play('meter',v);meter.val=v;ptrEl.style.left=(meter.x*100)+'%';nums.forEach((n,k)=>n.classList.toggle('on',k+2===meter.val));}
function meterTick(dt){
  if(!meter.active)return;
  meter.x+=meter.dir*dt*1.3;if(meter.x>=1){meter.x=1;meter.dir=-1;}if(meter.x<=0){meter.x=0;meter.dir=1;}
  meterShow();
}
function meterSet(v){meter.active=false;meter.x=(v-2+0.5)/11;meterShow();}
const FACES={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function face(el,n,dbl){el.innerHTML=Array.from({length:9},(_,k)=>`<span class="${FACES[n].includes(k)?'on':''}"></span>`).join('');el.classList.toggle('dbl',!!dbl);}
function aimedDice(target,rate=AIM_RATE){
  if(target!=null&&Math.random()<rate){const lo=Math.max(1,target-6),hi=Math.min(6,target-1);const a=lo+Math.floor(Math.random()*(hi-lo+1));return[a,target-a];}
  return[1+Math.random()*6|0,1+Math.random()*6|0];
}
/* returns [a,b] or null when the turn ended inside a skill */
async function roll(p,opt={}){
  let target=null;
  if(!p.ai){
    while(true){
      const btn=$('#roll');btn.disabled=false;
      meter.active=true;meterEl.classList.remove('idle');showHints(p);timerStart(G.turnSec,()=>{if(rollResolver)rollResolver('roll');});
      setMsg('');
      await new Promise(r=>rollResolver=r);rollResolver=null;btn.disabled=true;
      timerStop();meter.active=false;clearHints();SFX.play('stop');
      target=meter.val;break;
    }
  }else{
    await sleep(D(450));
    target=bestDiceSum(p)??(2+Math.floor(Math.random()*11));
    meter.active=true;meterEl.classList.remove('idle');await sleep(D(500));meterSet(target);
  }
  const d1=$('#d1'),d2=$('#d2');d1.classList.add('rolling');d2.classList.add('rolling');SFX.play('dice');
  if(!p.ai)SFX.play('drum');
  for(let k=0;k<(p.ai?8:14);k++){face(d1,1+Math.random()*6|0);face(d2,1+Math.random()*6|0);await sleep(p.ai?55:45+k*6);}
  let[a,b]=aimedDice(target,Math.min(.95,(has(p,'lucky')?0.8:AIM_RATE)+(hasR(p,'dice')?.15:0)));
  if(p.fixDice){[a,b]=p.fixDice;p.fixDice=null;p.fixDiceUsed=true;}
  const fixed=!!p.fixDiceUsed;p.fixDiceUsed=false;
  d1.classList.remove('rolling');d2.classList.remove('rolling');face(d1,a,a===b);face(d2,b,a===b);if(a===b)SFX.play('dbl');
  if(target!=null&&!fixed){if(a+b===target){SFX.play('aimHit');if(!p.ai)toast(`포인터 명중. ${target}`,'good',1800);}else if(!p.ai)SFX.play('aimMiss');}
  meterEl.classList.add('idle');
  log(`${nm(p)} 🎯${target} → 주사위 ${a} + ${b} = ${a+b}${a===b?' (더블)':''}${a+b===target?' ✔':''}`,p);
  await sleep(D(250));return[a,b];
}

/* ---------- decisions ---------- */
function modal({title,html,options,grid,timeout,noTimer,clear}){
  $('#modal').classList.toggle('clear',!!clear);
  $('#m-title').textContent=title;$('#m-body').innerHTML=html||'';
  const acts=$('#m-acts');acts.innerHTML='';acts.classList.toggle('grid',!!grid);
  return new Promise(res=>{
    modalResolver=res;const btns=[];
    options.forEach(o=>{
      const b=document.createElement('button');b.type='button';
      b.className='btn'+(o.primary?' primary':'')+(o.danger?' danger':'');b.disabled=!!o.disabled;
      b.innerHTML=`<span>${o.label}</span>${o.cost!=null?`<b>${fmt(o.cost)}</b>`:''}`;
      b.addEventListener('click',()=>{timerStop();$('#modal').hidden=true;modalResolver=modalDismiss=null;res(o.value);});
      acts.appendChild(b);btns.push({o,b});
    });
    $('#modal').hidden=false;
    modalDismiss=()=>{const d=btns.find(x=>!x.b.disabled&&(x.o.value===-1||x.o.value===0||/^(확인|닫기|취소|넘어가기|짓지 않기|쏘지 않기|열지 않기)/.test(x.o.label)))||btns.find(x=>x.o.primary&&!x.b.disabled)||btns.find(x=>!x.b.disabled);if(d)d.b.click();};
    if(!noTimer&&G&&!G.over){const sec=timeout??G.turnSec;if(sec)timerStart(sec,modalDismiss);}
    const f=acts.querySelector('.btn.primary:not(:disabled)')||acts.querySelector('.btn:not(:disabled)');if(f)f.focus();
  });
}
async function decide(p,spec,aiPick){
  if(p.ai){await sleep(D(500));return aiPick();}
  return modal(spec);
}
async function notice(p,title,html){
  if(p.ai){await sleep(D(700));return;}
  await modal({title,html,options:[{label:'확인',value:1,primary:true}],timeout:Math.min(5,G.turnSec||5)});
}
function onTileClick(i){
  if(pickResolver){if(pickable&&pickable.has(i)){const r=pickResolver;pickResolver=null;r(i);}return;}
  if(rollResolver||!G||!$('#modal').hidden||!$('#setup').hidden)return;
  showInfo(i);
}
function showInfo(i){
  const t=T(i),s=S(i);let html=`<div class="big-ico">${t.ico||''}</div>`;
  if(t.type==='city'){
    html+=`<p class="muted">땅값 ${fmt(t.price)}${s.owner!=null?` · 소유: ${nm(G.players[s.owner])} (${LV[s.level]})`:''}</p><table class="toll-table">`+
      LV.map((n,l)=>`<tr><td>${BICON[l]||'📍'} ${n} 건설비 ${fmt(cost(i,l))}</td><td>통행료 ${fmt(Math.round(t.price*MULT[l]))}</td></tr>`).join('')+
      `</table><p class="muted">같은 색 ${groupIdx(t.g).length}곳 독점 시 통행료 2배 · 건물 크기만큼 양옆 플레이어 끌어오기</p>`;
  }else if(t.type==='tour'){
    html+=`<p>가격 ${fmt(t.price)}. 건물은 지을 수 없고, 관광지를 많이 가질수록 통행료가 올라요 (1곳 110만 · 2곳 220만 · 3곳 440만 · 4곳 독점 승리).</p>${s.owner!=null?`<p class="muted">소유: ${nm(G.players[s.owner])}</p>`:''}`;
  }else html+=`<p>${({start:`출발지를 지나면 월급 ${SALARY}만. 정확히 도착하면 내 도시 하나에서 핵폭탄을 쏠 수 있어요.`,island:'3턴 동안 갇혀요. 더블이 나오거나 100만을 내면 탈출.',festival:'내 땅 하나를 골라 축제를 열면 통행료가 2배가 돼요.',travel:'다음 턴에 주사위 대신 원하는 칸까지 시계방향으로 이동해요. 출발을 지나면 월급도 받아요.',chance:'행운카드 한 장을 뽑아요. 좋은 일도 나쁜 일도 있어요.',casino:'홀짝 한 판. 이기면 건 돈만큼 더 받고, 지면 건 돈은 잭팟에 쌓여요.'})[t.type]}</p>`;
  modal({title:t.name,html,options:[{label:'닫기',value:0,primary:true}]});
}
