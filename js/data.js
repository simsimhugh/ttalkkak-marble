'use strict';
const $=s=>document.querySelector(s);
const PCOLORS=['#e5484d','#2f7fe0','#e8a20c','#22a06b'];
const GCOLORS=['#8bc34a','#1fa896','#29a9e0','#5c6bc0','#a355c9','#e2457a','#ef7d12','#cf2e2e'];
const LV=['땅','별장','빌딩','호텔','랜드마크'];
const BICON=['','🏠','🏢','🏨','🏰'];
const MULT=[0.2,0.7,1.4,2.2,3.2], BUILD=[1,0.5,0.7,0.9,1.2];
const SALARY=150, START_CASH=1500, ISLAND_FEE=100, AIM_RATE=0.65, NUKES=1;

/* ---------- characters ---------- */
const CHARS=[
  {id:'explorer',name:'모험가',emoji:'🧭',passive:'세계여행 칸에 서면 기다리지 않고 바로 이동. 출발 월급 +80만.',skill:'순간이동',sdesc:'남의 땅에서 통행료를 내야 할 때, 절반만 내고 원하는 칸으로 도망갑니다.'},
  {id:'architect',name:'건축가',emoji:'👷',passive:'모든 건설비 35% 할인.',skill:'긴급 공사',sdesc:'내 도시에 도착해 건설할 때 무료로 두 단계를 올립니다 (호텔까지). 땅을 살 때는 별장+빌딩이 무료.'},
  {id:'merchant',name:'상인',emoji:'💰',passive:'받는 통행료 +50%.',skill:'바가지',sdesc:'상대가 내 땅에 도착한 순간, 그 통행료를 2배로 받습니다.'},
  {id:'lucky',name:'행운아',emoji:'🍀',passive:'주사위 포인터 명중률 80% (기본 65%). 카드칸에서는 나쁜 카드를 다시 뽑고 카드 수입 2배.',skill:'운명의 주사위',sdesc:'주사위가 나쁜 칸(통행료·무인도·세금)에 떨어지면 숫자를 골라 다시 던집니다.'},
  {id:'negotiator',name:'협상가',emoji:'🤝',passive:'내는 통행료 30% 할인.',skill:'외교 면책',sdesc:'통행료를 내야 할 때 이번 한 번을 면제받습니다.'},
  {id:'captain',name:'선장',emoji:'⚓',passive:'무인도 1턴만. 관광지를 25% 싸게 사고 관광지 통행료는 내지 않습니다.',skill:'폭풍 소환',sdesc:'무인도에 갇히는 순간 상대를 대신 보내거나, 통행료(120만 이상)를 낼 때 땅 주인을 무인도로 날리고 통행료를 내지 않습니다.'},
];
const CH=id=>CHARS.find(c=>c.id===id);
const has=(p,id)=>p.ch===id;

const C=(name,g,price,ico)=>({type:'city',name,g,price,ico});
const CHANCE={type:'chance',name:'행운카드',ico:'🎴'};
const TR=(name,ico)=>({type:'tour',name,price:280,ico});
const TILES=[
  {type:'start',name:'출발',ico:'🚀'},
  C('타이베이',0,25,'🏮'),CHANCE,C('마닐라',0,25,'🌴'),C('하노이',0,30,'🛵'),TR('제주도','🍊'),C('방콕',1,40,'🛕'),C('싱가포르',1,45,'🦁'),
  {type:'island',name:'무인도',ico:'🦜'},
  C('카이로',2,50,'🐫'),CHANCE,C('이스탄불',2,50,'🕌'),C('아테네',2,55,'🏛️'),TR('알프스','🏔️'),C('코펜하겐',3,65,'🧜'),C('스톡홀름',3,70,'⛵'),
  {type:'festival',name:'축제',ico:'🎆'},
  C('베를린',4,75,'🐻'),CHANCE,C('오타와',4,75,'🍁'),C('취리히',4,80,'⌚'),TR('몰디브','🏝️'),C('시드니',5,90,'🎭'),C('상파울루',5,95,'⚽'),
  {type:'travel',name:'세계여행',ico:'✈️'},
  C('런던',6,110,'🎡'),TR('하와이','🌺'),C('파리',6,115,'🗼'),CHANCE,C('뉴욕',7,130,'🗽'),CHANCE,C('서울',7,150,'🏯')
];
const N=TILES.length;
const SUBS={start:`지날 때 +${SALARY}만`,island:'3턴 휴식',festival:'통행료 2배',travel:'원하는 곳으로',chance:'카드 1장',casino:'홀짝 한 판'};

let G=null, RUN=0, rollResolver=null, modalResolver=null, pickResolver=null, modalDismiss=null;
const spd=()=>G?G.speed:1;
const sleep=ms=>{const r=RUN;return new Promise(res=>setTimeout(()=>{if(r===RUN)res();},ms));};
const D=ms=>ms*spd();
const fmt=n=>n.toLocaleString('ko-KR')+'만';
const T=i=>TILES[i], S=i=>G.ts[i];
const alive=()=>G.players.filter(p=>!p.bankrupt);
const cost=(i,l)=>Math.round(T(i).price*BUILD[l]);
const cum=(i,from,to)=>{let s=0;for(let l=from;l<=to;l++)s+=cost(i,l);return s;};
const disc=(p,c)=>Math.round(c*(has(p,'architect')?0.65:1)*(G&&G.event&&G.event.id==='boom'?0.6:1));
function invested(i){const s=S(i);if(s.owner==null)return 0;return T(i).type==='tour'?T(i).price:cum(i,0,s.level);}
const groupIdx=g=>TILES.map((t,i)=>t.type==='city'&&t.g===g?i:-1).filter(i=>i>=0);
const ownsGroup=(pid,g)=>groupIdx(g).every(i=>S(i).owner===pid);
const tourIdx=TILES.map((t,i)=>t.type==='tour'?i:-1).filter(i=>i>=0);
const sideCities=s=>{const a=[];for(let i=s*8+1;i<s*8+8;i++)if(T(i).type==='city')a.push(i);return a;};
const range=l=>Math.min(3,l);
// 물가 상승: tolls climb 4% a round, so the late game bites
const inflation=()=>1+0.04*Math.max(0,((G&&G.round)||1)-1);
function toll(i){
  const t=T(i),s=S(i);if(s.owner==null)return 0;let v;const o=G.players[s.owner];
  if(t.type==='tour'){const c=tourIdx.filter(j=>S(j).owner===s.owner).length;v=110*2**(c-1);}
  else{v=Math.round(t.price*MULT[s.level]);if(ownsGroup(s.owner,t.g))v=Math.round(v*(hasR(o,'crown')?2.5:2));}
  if(G.festival===i)v*=2;
  if(G.event){if(G.event.id==='olympic'&&t.type==='city'&&t.g===G.event.g)v*=2;if(G.event.id==='boom2')v=Math.round(v*1.5);if(G.event.id==='vip'&&s.level===4)v*=2;if(G.event.id==='tourism'&&t.type==='tour')v*=3;}
  v=Math.round(v*inflation());
  if(has(o,'merchant'))v=Math.round(v*1.5);
  if(o.boost)v*=2;
  return v;
}
const owned=p=>G.ts.map((s,i)=>s.owner===p.id?i:-1).filter(i=>i>=0);
const assets=p=>p.cash+owned(p).reduce((a,i)=>a+invested(i),0);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
