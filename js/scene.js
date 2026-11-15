'use strict';
/* =================== THREE.JS BOARD =================== */
const stage=$('#stage');
const renderer=new THREE.WebGLRenderer({antialias:true});
const COARSE=matchMedia('(pointer:coarse)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio,COARSE?1.5:2)); // phones: DPR 3 canvases + shadows blow the GPU memory budget and the context gets dropped (black screen)
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
stage.appendChild(renderer.domElement);
{let lostTimer=0;const cv=renderer.domElement;
 cv.addEventListener('webglcontextlost',()=>{toast('화면을 다시 불러오는 중…','info',4000);lostTimer=setTimeout(()=>toast('화면이 복구되지 않으면 새로고침해 주세요.','danger',5000),5000);});
 cv.addEventListener('webglcontextrestored',()=>{clearTimeout(lostTimer);fitCamera();});}
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x1a4f73,26,60);
const camera=new THREE.PerspectiveCamera(42,4/3,0.1,200);
const CAM_HOME=new THREE.Vector3(0,14.6,2.6), TARGET=new THREE.Vector3(0,1.1,0.3);
camera.position.copy(CAM_HOME);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.copy(TARGET);controls.enableDamping=true;controls.dampingFactor=0.08;controls.enablePan=false;
controls.minDistance=4.5;controls.maxDistance=26;controls.minPolarAngle=0.12;controls.maxPolarAngle=1.5;
const hemi=new THREE.HemisphereLight(0xcfe8ff,0x2a3a48,0.75);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d0,1.7);sun.position.set(7,13,6);sun.castShadow=true;
sun.shadow.mapSize.setScalar(COARSE?1024:2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:45});sun.shadow.bias=-0.0006;sun.shadow.radius=3;
scene.add(sun);
const fill=new THREE.DirectionalLight(0x8fc7ff,0.35);fill.position.set(-6,6,-4);scene.add(fill);
/* post-processing (bloom on wider screens) */
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(800,600),0.28,0.5,0.88);composer.addPass(bloom);composer.addPass(new OutputPass());
let useBloom=true;

/* =================== THEMED ENVIRONMENT: a city plaza around the board =================== */
/* Each theme is a palette + lighting; add an entry here to add a theme. */
const THEMES={
  day:{name:'🏙️ 낮의 도시',sky:[0x1f5f9f,0x6fb0e8,0xdcedf8],fog:0xaac6dc,fogNear:34,fogFar:120,hemi:[0xdfefff,0x55606a,.8],sun:[0xfff2dc,1.8,[9,14,6]],sunSprite:{color:'#fff4c0',pos:[-40,34,-50],size:16},bloom:.22,night:false,windows:.3,lamps:.15,neon:.4,clouds:10},
  night:{name:'🌃 네온 밤',sky:[0x02030c,0x0a1430,0x1a2850],fog:0x0b1226,fogNear:26,fogFar:95,hemi:[0x6f86b8,0x0d1220,.42],sun:[0x9fb8ff,.6,[-6,12,-4]],sunSprite:{color:'#eef3ff',pos:[30,34,-50],size:9,moon:true},bloom:.75,night:true,windows:1.7,lamps:2.4,neon:2.6,clouds:4},
  sunset:{name:'🌇 노을 도시',sky:[0x2b1a4a,0xd96a3f,0xffd59a],fog:0x9a6060,fogNear:30,fogFar:110,hemi:[0xffc8a0,0x3a2030,.6],sun:[0xffb070,1.5,[-12,6,-14]],sunSprite:{color:'#ffb060',pos:[-44,10,-56],size:24},bloom:.4,night:false,windows:.8,lamps:.9,neon:1.2,clouds:7},
};
const env={root:null,theme:'day',clouds:[],seaTex:null,plane:null,trail:[],balloon:null,ferris:null,blades:[],fire:null,fireLight:null,stars:null,fireflies:null,nextFirework:0,
  prison:{pos:new THREE.Vector3(-10.1,0,8.6)},shore:new THREE.Vector3(-7.1,-0.35,6.1),islandEdge:new THREE.Vector3(-8.66,-0.35,7.37),festivalPos:new THREE.Vector3(-10.2,0,-8.6),
  cars:[],lamps:[],neon:[],birds:[],fountain:null,train:null,beacons:[],helipad:null,lake:null};
const M=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
function gradientSprite(color,size,moon){
  const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
  const gr=g.createRadialGradient(128,128,10,128,128,128);gr.addColorStop(0,color);gr.addColorStop(moon?.42:.25,color);gr.addColorStop(moon?.5:.45,'rgba(255,255,255,.3)');gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(0,0,256,256);
  if(moon){g.fillStyle='rgba(120,130,160,.35)';[[100,110,16],[150,140,10],[120,160,8],[160,100,7]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();});}
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false}));sp.scale.set(size,size,1);return sp;
}
function stripeTex(c1,c2,n=8){const cv=document.createElement('canvas');cv.width=256;cv.height=64;const g=cv.getContext('2d');for(let k=0;k<n;k++){g.fillStyle=k%2?c1:c2;g.fillRect(k*256/n,0,256/n+1,64);}const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;}
function textPlane(text,w,h,color='#fff',bg=null,font='bold 120px sans-serif'){const cv=document.createElement('canvas');cv.width=512;cv.height=Math.round(512*h/w);const g=cv.getContext('2d');if(bg){g.fillStyle=bg;g.fillRect(0,0,cv.width,cv.height);}g.fillStyle=color;g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,cv.height/2);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));return m;}
/* shared facade textures (window grids in a few styles) */
const facadeCache={};
function facadeTex(style,cols,rows){
  const key=style+cols+'x'+rows;if(facadeCache[key])return facadeCache[key];
  const cv=document.createElement('canvas');cv.width=128;cv.height=Math.round(128*rows/cols);const g=cv.getContext('2d');
  const base={glass:'#2a3f55',brick:'#8a4a32',concrete:'#9a9a94',tower:'#1f2f45',cream:'#d8cdb4'}[style]||'#777';
  g.fillStyle=base;g.fillRect(0,0,cv.width,cv.height);
  if(style==='brick'){g.fillStyle='rgba(0,0,0,.18)';for(let y=0;y<cv.height;y+=6)for(let x=(y/6%2)*8;x<cv.width;x+=16)g.fillRect(x,y,15,5);}
  const cw=cv.width/cols,ch=cv.height/rows;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const lit=Math.random()<.6;g.fillStyle=style==='glass'||style==='tower'?(lit?'#bfe3ff':'#6fa0c8'):(lit?'#ffe9a8':'#2a3440');g.fillRect(x*cw+cw*.2,y*ch+ch*.18,cw*.6,ch*.58);
    if(style==='concrete'){g.fillStyle='rgba(255,255,255,.25)';g.fillRect(0,y*ch,cv.width,2);}}
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;facadeCache[key]=t;return t;
}
function pavingTex(){const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');g.fillStyle='#b9b4a6';g.fillRect(0,0,256,256);g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=2;for(let k=0;k<=8;k++){g.beginPath();g.moveTo(k*32,0);g.lineTo(k*32,256);g.stroke();g.beginPath();g.moveTo(0,k*32);g.lineTo(256,k*32);g.stroke();}for(let k=0;k<40;k++){g.fillStyle=`rgba(255,255,255,${Math.random()*.12})`;g.fillRect((Math.random()*8|0)*32+2,(Math.random()*8|0)*32+2,28,28);}const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;}
function asphaltTex(){const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');g.fillStyle='#3a3f46';g.fillRect(0,0,128,128);for(let k=0;k<400;k++){g.fillStyle=`rgba(255,255,255,${Math.random()*.06})`;g.fillRect(Math.random()*128,Math.random()*128,2,2);}const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;}
/* ---- a procedurally detailed city building ---- */
function cityBuilding(w,h,d,T,far){
  const g=new THREE.Group();const style=['glass','brick','concrete','tower','cream'][Math.random()*5|0];
  const cols=Math.max(2,Math.round(w*1.6)),rows=Math.max(2,Math.round(h*1.4));
  const tex=facadeTex(style,cols,rows);const side=new THREE.MeshStandardMaterial({color:0xffffff,roughness:style==='glass'||style==='tower'?.3:.8,metalness:style==='glass'?.3:0,map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:T.windows*(style==='glass'||style==='tower'?.9:.6)});
  const roofM=M(style==='brick'?0x6a3a28:0x59606a);
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[side,side,roofM,roofM,side,side]);body.position.y=h/2;body.castShadow=!far;body.receiveShadow=true;g.add(body);env.neon.push(side);
  if(style==='tower'){const top=new THREE.Mesh(new THREE.BoxGeometry(w*.6,h*.18,d*.6),[side,side,roofM,roofM,side,side]);top.position.y=h+h*.09;g.add(top);const sp=new THREE.Mesh(new THREE.CylinderGeometry(.03,.08,h*.25,6),M(0x9aa3ad));sp.position.y=h*1.18+h*.125;g.add(sp);const bc=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),M(0xff4040,{emissive:0xff2020,emissiveIntensity:3}));bc.position.y=h*1.18+h*.25+.05;g.add(bc);env.beacons.push(bc);}
  else{const r=Math.random();
    if(r<.3){const wt=new THREE.Group();wt.position.set(w*.25,h,d*.2);const tank=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.5,12),M(0x8b6a44));tank.position.y=.65;wt.add(tank);const cap=new THREE.Mesh(new THREE.ConeGeometry(.3,.18,12),M(0x5a4030));cap.position.y=.99;wt.add(cap);for(let k=0;k<4;k++){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.4,4),M(0x444));leg.position.set(Math.cos(k*1.57)*.2,.2,Math.sin(k*1.57)*.2);wt.add(leg);}g.add(wt);}
    else if(r<.55){for(let k=0;k<3;k++){const ac=new THREE.Mesh(new THREE.BoxGeometry(.4,.3,.4),M(0xb0b8c0));ac.position.set(-w*.3+k*w*.3,h+.15,(k%2?.3:-.3)*d*.4);g.add(ac);}}
    else if(r<.75){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,1.2,4),M(0x666));pole.position.set(0,h+.6,0);g.add(pole);const bc=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),M(0xff4040,{emissive:0xff2020,emissiveIntensity:3}));bc.position.set(0,h+1.25,0);g.add(bc);env.beacons.push(bc);}
    else if(r<.9&&!far){const txt=['WORLD TOUR','🎲 딸깍 마블','HOTEL','✈ TRAVEL','🎲 PLAY','NEON','☕ CAFE','🏨 STAY'][Math.random()*8|0];const bb=textPlane(txt,Math.min(w*.9,3),Math.min(w*.9,3)*.4,'#fff',['#d8333c','#1c7fb3','#7a1fa2','#f39c12','#16a085'][Math.random()*5|0],'bold 90px "Black Han Sans","Gothic A1",sans-serif');bb.position.set(0,h+Math.min(w*.9,3)*.25+.15,d/2+.05);g.add(bb);const back=new THREE.Mesh(new THREE.BoxGeometry(Math.min(w*.9,3)+.1,Math.min(w*.9,3)*.4+.1,.08),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:T.neon}));back.position.set(0,bb.position.y,d/2);g.add(back);env.neon.push(back.material);}
    else{const pad=new THREE.Mesh(new THREE.CircleGeometry(Math.min(w,d)*.35,24),new THREE.MeshStandardMaterial({color:0x555c66}));pad.rotation.x=-Math.PI/2;pad.position.y=h+.005;g.add(pad);const H=textPlane('H',Math.min(w,d)*.4,Math.min(w,d)*.4,'#fff',null,'bold 300px sans-serif');H.rotation.x=-Math.PI/2;H.position.y=h+.01;g.add(H);}
    const ledge=new THREE.Mesh(new THREE.BoxGeometry(w+.12,.08,d+.12),roofM);ledge.position.y=h;g.add(ledge);
  }
  // ground floor: awning + door
  if(!far){const aw=new THREE.Mesh(new THREE.BoxGeometry(w*.5,.05,.5),new THREE.MeshStandardMaterial({map:stripeTex(['#d8333c','#1c7fb3','#16a085'][Math.random()*3|0],'#ffffff',8),roughness:.9}));aw.position.set(0,.9,d/2+.25);g.add(aw);const door=new THREE.Mesh(new THREE.BoxGeometry(.5,.8,.04),M(0x3a2a1a));door.position.set(0,.4,d/2+.02);g.add(door);}
  return g;
}
function streetLamp(x,z,T){const g=new THREE.Group();g.position.set(x,-0.42,z);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.03,.05,1.9,6),M(0x3a3f46));pole.position.y=.95;g.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(.4,.04,.04),M(0x3a3f46));arm.position.set(.18,1.9,0);g.add(arm);const head=new THREE.Mesh(new THREE.BoxGeometry(.22,.08,.14),new THREE.MeshStandardMaterial({color:0xfff2c0,emissive:0xffe0a0,emissiveIntensity:T.lamps}));head.position.set(.36,1.86,0);g.add(head);env.lamps.push(head.material);env.root.add(g);return g;}
function tree(x,z,s=1){const g=new THREE.Group();g.position.set(x,-0.42,z);const t=new THREE.Mesh(new THREE.CylinderGeometry(.06*s,.09*s,.7*s,6),M(0x6b4a2b));t.position.y=.35*s;t.castShadow=true;g.add(t);[[0,.95,.42],[.18,.8,.3],[-.2,.82,.28],[0,1.2,.3]].forEach(([dx,y,r])=>{const c=new THREE.Mesh(new THREE.SphereGeometry(r*s,10,8),M([0x3f8f3a,0x4f9f44,0x5fae4a][Math.random()*3|0]));c.position.set(dx*s,y*s,0);c.castShadow=true;g.add(c);});env.root.add(g);return g;}
function car(T){const g=new THREE.Group();const col=[0xd8333c,0xf4f4f4,0x1c7fb3,0xf5b400,0x222,0x6fb6a0][Math.random()*6|0];const body=new THREE.Mesh(new THREE.BoxGeometry(.9,.3,.45),M(col,{roughness:.4,metalness:.3}));body.position.y=.3;body.castShadow=true;g.add(body);const cab=new THREE.Mesh(new THREE.BoxGeometry(.5,.25,.4),new THREE.MeshStandardMaterial({color:0x8fd3ff,roughness:.2,metalness:.2}));cab.position.set(-.05,.57,0);g.add(cab);[[-.3,.2],[.3,.2],[-.3,-.2],[.3,-.2]].forEach(([x,z])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.1,10),M(0x111));w.rotation.x=Math.PI/2;w.position.set(x,.14,z);g.add(w);});const hl=new THREE.Mesh(new THREE.BoxGeometry(.04,.08,.4),new THREE.MeshStandardMaterial({color:0xfff6d0,emissive:0xfff0b0,emissiveIntensity:T.night?3:.6}));hl.position.set(.46,.3,0);g.add(hl);const tl=new THREE.Mesh(new THREE.BoxGeometry(.04,.06,.4),new THREE.MeshStandardMaterial({color:0xff3030,emissive:0xff2020,emissiveIntensity:T.night?2:.5}));tl.position.set(-.46,.3,0);g.add(tl);env.root.add(g);return g;}
/* a point on the rectangular ring road, by perimeter fraction */
function ringPoint(u,R,lane){const L=8*R,d=((u%1)+1)%1*L;let x,z,ang;if(d<2*R){x=-R+d;z=R;ang=0;}else if(d<4*R){x=R;z=R-(d-2*R);ang=-Math.PI/2;}else if(d<6*R){x=R-(d-4*R);z=-R;ang=Math.PI;}else{x=-R;z=-R+(d-6*R);ang=Math.PI/2;}const nx=Math.cos(ang-Math.PI/2),nz=Math.sin(ang-Math.PI/2);return{x:x+nx*lane,z:z+nz*lane,ang};}
/* ---- development lots behind the board: one per property tile, in board order (left side → top → right side, bottom row split to the ends) ---- */
const lots=[];
const LOT_SCALE=5.0,LOT_LM=3.8,ARC0=215,ARC1=325,R_FRONT=17.5,R_BACK=21.5,BACK_Y=.6;
/* the lots stand on a lit arc behind the board — a strip of landmarks that grows into the skyline as the game goes on */
const PROP_IDX=TILES.map((t,i)=>i).filter(i=>TILES[i].type==='city'||TILES[i].type==='tour');
const FRONT_N=Math.ceil(PROP_IDX.length/2),BACK_N=PROP_IDX.length-FRONT_N;
/* the lots line a boulevard round the plaza: a rounded square, two staggered rows, fronts square to the street.
   Slots keep the tiles' order by direction; the row opposite each lot gets a park feature, lamps sit between. */
const STRIP_N=6,STRIP_ROWS=[17.6,21.0],STRIP_MID=19.3;
function stripPt(a,h){const c=Math.cos(a),s=Math.sin(a),k=Math.pow(Math.pow(Math.abs(c),STRIP_N)+Math.pow(Math.abs(s),STRIP_N),-1/STRIP_N);
  const nx=Math.sign(c)*Math.pow(Math.abs(c),STRIP_N-1),nz=Math.sign(s)*Math.pow(Math.abs(s),STRIP_N-1);return{x:c*h*k,z:s*h*k,rot:Math.atan2(-nx,-nz)};}
let STRIP=null;
function stripSlots(){if(STRIP)return STRIP;const ord=PROP_IDX.map(i=>{const r=rect(i);return{i,a:Math.atan2(r.z,r.x)};}).sort((p,q)=>p.a-q.a);
  const n=ord.length,step=Math.PI*2/n;let sx=0,sy=0;ord.forEach((o,k)=>{sx+=Math.cos(o.a-k*step);sy+=Math.sin(o.a-k*step);});const a0=Math.atan2(sy,sx);
  return STRIP={step,a0,slots:ord.map((o,k)=>({i:o.i,k,a:a0+k*step,row:k%2}))};}
function lotPos(i){const sl=stripSlots().slots.find(q=>q.i===i);const pt=stripPt(sl.a,STRIP_ROWS[sl.row]);return{x:pt.x,z:pt.z,y:0,rot:pt.rot};}
function arcBoxes(r,w,h,y,mat,n,a0=ARC0-6,a1=ARC1+6){for(let k=0;k<n;k++){const a=(a0+(a1-a0)*(k+.5)/n)*Math.PI/180;const seg=(a1-a0)/n*Math.PI/180*r+.06;const m=new THREE.Mesh(new THREE.BoxGeometry(seg,h,w),mat);m.position.set(Math.cos(a)*r,y,Math.sin(a)*r);m.rotation.y=-a;m.receiveShadow=true;env.root.add(m);}}
function palm(x,z,s=1){const g=new THREE.Group();g.position.set(x,-0.42,z);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.07*s,.12*s,2.6*s,7),M(0x8b6a44));trunk.position.y=1.3*s;trunk.rotation.z=(Math.random()-.5)*.12;trunk.castShadow=true;g.add(trunk);
  for(let q=0;q<7;q++){const l=new THREE.Mesh(new THREE.ConeGeometry(.16*s,1.5*s,4),M([0x2e8b3d,0x3a9a48,0x277a33][q%3]));l.position.set(0,2.55*s,0);l.rotation.set(1.25,q*(Math.PI*2/7)+Math.random()*.3,0);l.castShadow=true;g.add(l);}
  const coco=new THREE.Mesh(new THREE.SphereGeometry(.09*s,6,6),M(0x6a4a2a));coco.position.set(.1*s,2.4*s,.1*s);g.add(coco);env.root.add(g);return g;}
const VEGAS_NAMES=['GOLDEN DICE','LUCKY 7','ROYAL FLUSH','MIRAGE','PALACE','DICE CLUB','STARDUST','FLAMINGO','JACKPOT INN','NEON OASIS','SILVER SLIPPER','DESERT ROSE','RIVIERA','SAHARA','TROPICANA','EL CORTEZ'];
const NEON_COLS=['#ff2bd6','#ffd166','#4fc3f7','#7cf29a','#ff5a5a','#b07cff'];
function neonSign(text,w,h,col,T){const g=new THREE.Group();const sign=textPlane(text,w,h,'#fff',col,'bold 100px "Black Han Sans","Gothic A1",sans-serif');sign.position.z=.07;g.add(sign);
  const back=new THREE.Mesh(new THREE.BoxGeometry(w+.2,h+.2,.12),new THREE.MeshStandardMaterial({color:new THREE.Color(col),emissive:new THREE.Color(col),emissiveIntensity:T.neon*.7}));g.add(back);env.neon.push(back.material);
  for(let k=0;k<Math.floor(w/.5);k++){const b=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),M(0xffd166,{emissive:0xffd166,emissiveIntensity:T.night?2.2:.8}));b.position.set(-w/2+.25+k*.5,h/2+.18,.05);g.add(b);hubFx.beacons.push(b);}return g;}
/* one themed block: casino / motel / palm park / tower, chosen by position so the city is stable between games */
function vegasBlock(cx,cz,T,size,ring,bx,bz){
  const g=new THREE.Group();g.position.set(cx,-0.4,cz);env.root.add(g);
  const face=Math.atan2(-cx,-cz),h=((bx*73+bz*31)%97+97)%97;
  const kind='park'; // the city is the players' landmarks; everything else is green
  const col=NEON_COLS[h%NEON_COLS.length],name=VEGAS_NAMES[(h+ring)%VEGAS_NAMES.length];
  const lot=new THREE.Mesh(new THREE.PlaneGeometry(size,size),M(kind==='park'?0x6fa65a:0x4a4f57,{roughness:.95}));lot.rotation.x=-Math.PI/2;lot.position.y=.06;lot.receiveShadow=true;g.add(lot);
  const inner=new THREE.Group();inner.rotation.y=face;g.add(inner);
  const colHex=new THREE.Color(col).getHex();
  if(kind==='casino'){const w=3.2+(h%3)*.6,d=2.6,hh=1.6+(h%2)*.6;const tex=facadeTex(['cream','glass','concrete'][h%3],Math.round(w*1.6),Math.round(hh*1.4));
    const side=new THREE.MeshStandardMaterial({color:[0xfff1d6,0xffd9e8,0xd6f3ff,0xe8ffd9][h%4],map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:T.windows*.6,roughness:.7});
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),[side,side,M(0x59606a),M(0x59606a),side,side]);body.position.set(0,hh/2,-.6);body.castShadow=true;inner.add(body);
    const aw=new THREE.Mesh(new THREE.BoxGeometry(w*.6,.1,1.2),M(colHex,{emissive:colHex,emissiveIntensity:T.neon*.3}));aw.position.set(0,1.0,d/2);inner.add(aw);
    [-1,1].forEach(q=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1,6),M(0xd9a441,{metalness:.6}));p.position.set(q*w*.25,.5,d/2+.5);inner.add(p);});
    const sg=neonSign(name,Math.min(w,4.2),.7,col,T);sg.position.set(0,hh+.6,-.6);inner.add(sg);
    palm(cx+(h%2?1:-1)*size*.38,cz+(h%4<2?1:-1)*size*.3,.8);
  }else if(kind==='motel'){const w=4.2,d=1.5,hh=1.1;const tex=facadeTex('brick',8,2);const side=new THREE.MeshStandardMaterial({color:0xffffff,map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:T.windows*.5,roughness:.85});
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),[side,side,M(0x8a4a3a),M(0x8a4a3a),side,side]);body.position.set(0,hh/2,-1.2);body.castShadow=true;inner.add(body);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,3.4,8),M(0x3a3f46));pole.position.set(-w/2+.4,1.7,1.2);inner.add(pole);
    const sg=neonSign('MOTEL',1.6,.6,col,T);sg.position.set(-w/2+.4,3.3,1.2);inner.add(sg);const vac=neonSign('VACANCY',1.4,.4,'#ff5a5a',T);vac.position.set(-w/2+.4,2.6,1.2);inner.add(vac);
    for(let k=0;k<3;k++){const c=car(T);c.position.set(-1.2+k*1.2,0,1.0);c.rotation.y=Math.PI/2;inner.add(c);}
    const pool=new THREE.Mesh(new THREE.CircleGeometry(.8,20),new THREE.MeshStandardMaterial({color:0x4fc3f7,roughness:.1,metalness:.3}));pool.rotation.x=-Math.PI/2;pool.position.set(w/2-.9,.07,1.6);inner.add(pool);
  }else if(kind==='park'){for(let k=0;k<4;k++)palm(cx+(k%2?1:-1)*size*.3,cz+(k<2?1:-1)*size*.3,.9+Math.random()*.3);
    const pool=new THREE.Mesh(new THREE.CircleGeometry(1.6,28),new THREE.MeshStandardMaterial({color:T.night?0x24436b:0x4aa3d8,roughness:.15,metalness:.4}));pool.rotation.x=-Math.PI/2;pool.position.y=.08;g.add(pool);
    const rim=new THREE.Mesh(new THREE.RingGeometry(1.6,1.9,28),M(0xd9d2c0));rim.rotation.x=-Math.PI/2;rim.position.y=.085;g.add(rim);
    const jet=new THREE.Mesh(new THREE.ConeGeometry(.15,1.4,8),new THREE.MeshBasicMaterial({color:0xbfe8ff,transparent:true,opacity:.7}));jet.position.y=.8;g.add(jet);
  }else{const w=2.2+(h%2)*.6,hh=6+(h%5)*1.6;const tex=facadeTex(['glass','tower','cream'][h%3],Math.round(w*2),Math.round(hh*1.2));
    const side=new THREE.MeshStandardMaterial({color:[0xffffff,0xd6f3ff,0xffe3f0,0xfff1c9][h%4],map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:T.windows*.8,roughness:.4,metalness:.2});
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,hh,w),[side,side,M(0x59606a),M(0x59606a),side,side]);body.position.y=hh/2;body.castShadow=true;inner.add(body);
    const crown=new THREE.Mesh(new THREE.BoxGeometry(w+.3,.3,w+.3),new THREE.MeshStandardMaterial({color:colHex,emissive:colHex,emissiveIntensity:T.neon*.8}));crown.position.y=hh+.15;inner.add(crown);env.neon.push(crown.material);
    const sg=neonSign(name,Math.min(w+1.4,3.6),.6,col,T);sg.position.set(0,hh+.9,0);inner.add(sg);
    const base=new THREE.Mesh(new THREE.BoxGeometry(w+1.6,1.2,w+1.6),M(0xe8e2d2));base.position.y=.6;inner.add(base);}
}
/* signature silhouettes far behind the strip */
function vegasLandmarks(T){
  {const pyr=new THREE.Mesh(new THREE.ConeGeometry(6,8,4),new THREE.MeshStandardMaterial({color:0x1a1f2a,roughness:.15,metalness:.6}));pyr.position.set(-31,-0.4+4,-30);pyr.rotation.y=Math.PI/4;pyr.castShadow=true;env.root.add(pyr);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.25,.9,26,12,1,true),new THREE.MeshBasicMaterial({color:0xfff6d0,transparent:true,opacity:T.night?.25:.08,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));beam.position.set(-31,-0.4+8+13,-30);env.root.add(beam);}
  {const g=new THREE.Group();g.position.set(32,-0.4,-29);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.5,1.4,16,12),M(0xe8e2d2));shaft.position.y=8;g.add(shaft);
    const pod=new THREE.Mesh(new THREE.CylinderGeometry(2.6,1.8,2.2,16),new THREE.MeshStandardMaterial({color:0xd6f3ff,roughness:.3,metalness:.3,emissive:0x4fc3f7,emissiveIntensity:T.neon*.3}));pod.position.y=17;g.add(pod);
    const needle=new THREE.Mesh(new THREE.CylinderGeometry(.05,.2,5,8),M(0x9aa3ad));needle.position.y=20.5;g.add(needle);const bc=new THREE.Mesh(new THREE.SphereGeometry(.2,8,8),M(0xff4040,{emissive:0xff2020,emissiveIntensity:3}));bc.position.y=23;g.add(bc);hubFx.beacons.push(bc);env.root.add(g);}
  {const sph=new THREE.Mesh(new THREE.SphereGeometry(5.5,32,24),new THREE.MeshStandardMaterial({color:0x6a3aff,emissive:0xb07cff,emissiveIntensity:T.night?1.2:.35,roughness:.4}));sph.position.set(2,-0.4+6,-36);env.root.add(sph);hubFx.spinners.push({obj:sph,speed:.15,y:-0.4+6,phase:0});}
}
function buildStrip(T){ // (the generic Vegas icons are gone: only the players' landmarks and the entrance sign remain)
  const asph=M(0x2b2f36,{roughness:.95}),walk=M(0xc9c4b6,{roughness:.95}),stone=M(0xd9d2c0,{roughness:.9}),gold=M(0xd9a441,{metalness:.7,roughness:.3});
  // the big welcome sign behind everything
  {const a=270*Math.PI/180,r=25.5,x=Math.cos(a)*r,z=Math.sin(a)*r;const g=new THREE.Group();g.position.set(x,-0.4,z);g.rotation.y=Math.atan2(-x,-z);
    [-3.6,3.6].forEach(px=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.14,.2,4.6,10),M(0x3a3f46));p.position.set(px,2.3,0);g.add(p);});
    const sign=textPlane('WELCOME TO 딸깍 마블',7.4,1.5,'#fff','#d8333c','bold 100px "Black Han Sans","Gothic A1",sans-serif');sign.position.set(0,4.7,.08);g.add(sign);
    const back=new THREE.Mesh(new THREE.BoxGeometry(7.7,1.75,.14),new THREE.MeshStandardMaterial({color:0xd8333c,emissive:0xff6a6a,emissiveIntensity:T.neon*.6}));back.position.set(0,4.7,0);g.add(back);env.neon.push(back.material);
    const sub=textPlane('★ LANDMARK STRIP ★',5.2,.8,'#fff7d6','#7a1fa2','bold 100px "Black Han Sans","Gothic A1",sans-serif');sub.position.set(0,3.5,.08);g.add(sub);const sb=new THREE.Mesh(new THREE.BoxGeometry(5.4,.95,.12),new THREE.MeshStandardMaterial({color:0x7a1fa2,emissive:0xff2bd6,emissiveIntensity:T.neon*.6}));sb.position.set(0,3.5,0);g.add(sb);env.neon.push(sb.material);
    for(let k=0;k<13;k++){const b=new THREE.Mesh(new THREE.SphereGeometry(.11,8,8),M([0xff5a5a,0xffd166,0x7cf29a,0x4fc3f7][k%4],{emissive:[0xff5a5a,0xffd166,0x7cf29a,0x4fc3f7][k%4],emissiveIntensity:T.night?2.5:.9}));b.position.set(-3.6+k*.6,5.75,.05);g.add(b);hubFx.beacons.push(b);}
    const star=new THREE.Mesh(new THREE.OctahedronGeometry(.45,0),M(0xffd166,{emissive:0xffaa33,emissiveIntensity:T.night?2:.6}));star.position.set(0,6.4,0);g.add(star);hubFx.spinners.push({obj:star,speed:1.2,y:6.4,phase:0});
    env.root.add(g);}
  // night: three searchlights sweep the sky behind the strip
  hubFx.lights=[];if(T.night){[[-16,-26],[0,-29],[16,-26]].forEach(([x,z],k)=>{const geo=new THREE.ConeGeometry(2.4,34,18,1,true);geo.translate(0,17,0);const beam=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xcfe8ff,transparent:true,opacity:.11,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));beam.position.set(x,-0.4,z);beam.userData.k=k;env.root.add(beam);hubFx.lights.push(beam);});}
}
/* rooftop neon marquee with the city name, sized to the building */
function marquee(name,col,T,topY){const g=new THREE.Group();const w=Math.max(2.2,name.length*.55+1.2);
  const sign=textPlane(name,w,.7,'#fff',col,'700 100px "Gothic A1","Malgun Gothic",sans-serif');sign.position.set(0,topY+.75,.09);g.add(sign);
  const back=new THREE.Mesh(new THREE.BoxGeometry(w+.2,.85,.14),new THREE.MeshStandardMaterial({color:new THREE.Color(col),emissive:new THREE.Color(col),emissiveIntensity:T.neon*.7}));back.position.set(0,topY+.75,0);g.add(back);env.neon.push(back.material);
  [-1,1].forEach(sd=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.7,6),M(0x3a3f46));p.position.set(sd*(w/2-.2),topY+.3,0);g.add(p);});
  for(let k=0;k<Math.floor(w/.45);k++){const b=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),M(0xffd166,{emissive:0xffd166,emissiveIntensity:T.night?2.2:.8}));b.position.set(-w/2+.3+k*.45,topY+1.27,.05);g.add(b);hubFx.beacons.push(b);}
  return g;}
function vacantBlock(cx,cz,T,size,bare){
  const g=new THREE.Group();g.position.set(cx,-0.4,cz);
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(size,size),M(T.night?0x2f4a2a:0x6fa65a,{roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.y=.06;grass.receiveShadow=true;g.add(grass);
  const dirt=new THREE.Mesh(new THREE.CircleGeometry(size*.22,16),M(0xa08a66,{roughness:1}));dirt.rotation.x=-Math.PI/2;dirt.position.set((Math.random()-.5)*size*.4,.065,(Math.random()-.5)*size*.4);g.add(dirt);
  for(let k=0;k<14;k++){const w=new THREE.Mesh(new THREE.ConeGeometry(.06,.25+Math.random()*.2,4),M(0x4f8f3a));w.position.set((Math.random()-.5)*size*.9,.18,(Math.random()-.5)*size*.9);g.add(w);}
  if(bare){env.root.add(g);return;}
  if(Math.random()<.5){const sign=textPlane('공사 예정',1.2,.4,'#222','#f5c518','bold 100px "Gothic A1",sans-serif');sign.position.set((Math.random()-.5)*size*.5,.9,(Math.random()-.5)*size*.5);g.add(sign);const post=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.9,6),M(0x8b6a44));post.position.set(sign.position.x,.45,sign.position.z-.02);g.add(post);}
  env.root.add(g);
  tree(cx+(Math.random()-.5)*size*.6,cz+(Math.random()-.5)*size*.6,.8+Math.random()*.5);
}
function roundRectShape(h,r,hole){const sh=hole?new THREE.Path():new THREE.Shape();sh.moveTo(-h+r,-h);sh.lineTo(h-r,-h);sh.absarc(h-r,-h+r,r,-Math.PI/2,0);sh.lineTo(h,h-r);sh.absarc(h-r,h-r,r,0,Math.PI/2);sh.lineTo(-h+r,h);sh.absarc(-h+r,h-r,r,Math.PI/2,Math.PI);sh.lineTo(-h,-h+r);sh.absarc(-h+r,-h+r,r,Math.PI,Math.PI*1.5);return sh;}
const PARK_COLS=['#d8333c','#1c7fb3','#f5b400','#22a06b'];
/* one park feature on the boulevard: carousel, fountain, palm bed or a striped kiosk with balloons */
function parkFeature(k,x,z,rot,T){const g=new THREE.Group();g.position.set(x,-0.4,z);g.rotation.y=rot;env.root.add(g);const col=PARK_COLS[k%4],colHex=new THREE.Color(col).getHex();
  const bed=new THREE.Mesh(new THREE.CircleGeometry(1.7,28),M(T.night?0x2f4a2a:0x6fa65a,{roughness:1}));bed.rotation.x=-Math.PI/2;bed.position.y=.05;bed.receiveShadow=true;g.add(bed);
  const kind=(k>>1)%4;
  if(kind===0){const base=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.35,.2,24),M(0xe8e2d2));base.position.y=.1;g.add(base);const spin=new THREE.Group();g.add(spin);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1.7,8),M(0xd9a441,{metalness:.6,roughness:.3}));pole.position.y=1.05;spin.add(pole);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(1.4,.8,16),new THREE.MeshStandardMaterial({map:stripeTex(col,'#ffffff',16),roughness:.7}));roof.position.y=2.25;roof.castShadow=true;spin.add(roof);
    for(let q=0;q<6;q++){const a=q*Math.PI/3;const rod=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.6,6),M(0xd9a441,{metalness:.6}));rod.position.set(Math.cos(a)*.95,1.05,Math.sin(a)*.95);spin.add(rod);
      const horse=new THREE.Mesh(new THREE.BoxGeometry(.14,.24,.4),M([0xffffff,0xffd166,0x8fd3ff][q%3],{roughness:.5}));horse.position.set(Math.cos(a)*.95,.55+(q%2)*.25,Math.sin(a)*.95);horse.rotation.y=-a;spin.add(horse);}
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),M(0xffd166,{emissive:0xffd166,emissiveIntensity:T.night?2.2:.8}));bulb.position.y=2.75;spin.add(bulb);hubFx.beacons.push(bulb);
    hubFx.spinners.push({obj:spin,speed:.45,y:0,phase:k});}
  else if(kind===1){const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.2,.3,24),M(0xd9d2c0));basin.position.y=.15;g.add(basin);
    const water=new THREE.Mesh(new THREE.CircleGeometry(.95,24),new THREE.MeshStandardMaterial({color:T.night?0x24436b:0x4aa3d8,roughness:.15,metalness:.4}));water.rotation.x=-Math.PI/2;water.position.y=.31;g.add(water);
    const jet=new THREE.Mesh(new THREE.ConeGeometry(.12,1.2,8),new THREE.MeshBasicMaterial({color:0xbfe8ff,transparent:true,opacity:.7}));jet.position.y=.9;g.add(jet);}
  else if(kind===2){const c=Math.cos(rot),s=Math.sin(rot);[[-.7,.2,1],[.6,-.3,.85]].forEach(([u,v,sc])=>palm(x+u*c+v*s,z-u*s+v*c,sc));
    for(let q=0;q<12;q++){const a=q*Math.PI/6;const f=new THREE.Mesh(new THREE.SphereGeometry(.1,6,6),M([0xff5a8a,0xffd166,0xffffff,0xff8a3a][q%4]));f.position.set(Math.cos(a)*1.35,.15,Math.sin(a)*1.35);g.add(f);}}
  else{const hut=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.7,12),M(0xfdf6e8));hut.position.y=.35;hut.castShadow=true;g.add(hut);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(.85,.6,12),new THREE.MeshStandardMaterial({map:stripeTex(col,'#ffffff',12),roughness:.7}));roof.position.y=1.0;roof.castShadow=true;g.add(roof);
    [[.7,0],[.85,.3],[.6,.35]].forEach(([u,v],q)=>{const b=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),M([0xff5a5a,0xffd166,0x4fc3f7][q],{roughness:.3}));b.position.set(u,1.9+q*.15,v);g.add(b);
      const str=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,1.3,4),M(0xffffff));str.position.set(u*.85,1.2+q*.08,v*.85);g.add(str);});}
}
/* paved band between the ring road and the outer park blocks, lit by lamps between the lots */
function buildBoulevard(T){const tex=pavingTex();tex.repeat.set(.5,.5);
  const sh=roundRectShape(23.2,6);sh.holes.push(roundRectShape(15.4,2,true));const band=new THREE.Mesh(new THREE.ShapeGeometry(sh,24),new THREE.MeshStandardMaterial({map:tex,color:0xf2ece0,roughness:.95}));
  band.rotation.x=-Math.PI/2;band.position.y=-0.415;band.receiveShadow=true;env.root.add(band);
  const {slots,step}=stripSlots();
  slots.forEach(sl=>{const op=stripPt(sl.a,STRIP_ROWS[1-sl.row]);parkFeature(sl.k,op.x,op.z,op.rot,T);const lp=stripPt(sl.a+step/2,STRIP_MID);streetLamp(lp.x,lp.z,T);});
}
function buildLots(T){
  lots.length=0;buildStrip(T);buildBoulevard(T);
  TILES.forEach((t,i)=>{if(t.type!=='city'&&t.type!=='tour')return;const {x,z,y,rot}=lotPos(i);
    const g=new THREE.Group();g.position.set(x,-0.4+y,z);g.rotation.y=rot;env.root.add(g);const fence=new THREE.Group();g.add(fence);
    const col=t.type==='tour'?'#2a8fa0':GCOLORS[t.g];
    // empty site: a soft garden — grass mound, flower ring, a palm and a lamp. No fences, no signs.
    const lawn=new THREE.Mesh(new THREE.CircleGeometry(2.3,32),M(0x6fa65a,{roughness:1}));lawn.rotation.x=-Math.PI/2;lawn.position.y=.06;lawn.receiveShadow=true;g.add(lawn);
    const grass=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.4,.16,32),M(0x7bb565,{roughness:1}));grass.position.y=.08;grass.receiveShadow=true;fence.add(grass);
    for(let q=0;q<14;q++){const a=q*Math.PI/7+i;const f=new THREE.Mesh(new THREE.SphereGeometry(.11,6,6),M([0xff5a8a,0xffd166,0xff8a3a,0xffffff,0xb07cff][(q+i)%5]));f.position.set(Math.cos(a)*1.7,.24,Math.sin(a)*1.7);fence.add(f);}
    const bush=new THREE.Mesh(new THREE.SphereGeometry(.55,10,8),M(0x3f8f3a));bush.position.set(-.9,.55,-.6);bush.castShadow=true;fence.add(bush);const bush2=new THREE.Mesh(new THREE.SphereGeometry(.4,10,8),M(0x4f9f44));bush2.position.set(1.0,.45,.5);fence.add(bush2);
    const lp=new THREE.Mesh(new THREE.CylinderGeometry(.03,.04,1.3,6),M(0x3a3f46));lp.position.set(.9,.75,-.8);fence.add(lp);const lh=new THREE.Mesh(new THREE.SphereGeometry(.11,8,8),new THREE.MeshStandardMaterial({color:0xfff2c0,emissive:0xffe0a0,emissiveIntensity:T.lamps}));lh.position.set(.9,1.45,-.8);fence.add(lh);env.lamps.push(lh.material);
    lots[i]={grp:g,fence,bld:null,level:-1,owner:null,rubble:false,col};});
}
function plazaBase(col,T){const g=new THREE.Group();const c=new THREE.Color(col);
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(1.75,1.9,.26,36),M(0xe8e2d2,{roughness:.8}));plinth.position.y=.13;plinth.castShadow=true;plinth.receiveShadow=true;g.add(plinth);
  const inlay=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,.03,36),new THREE.MeshStandardMaterial({color:c,roughness:.6}));inlay.position.y=.27;g.add(inlay);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.78,.05,10,48),M(0xd9a441,{metalness:.7,roughness:.3}));ring.rotation.x=Math.PI/2;ring.position.y=.27;g.add(ring);
  for(let q=0;q<4;q++){const a=q*Math.PI/2+Math.PI/4;const up=new THREE.Mesh(new THREE.ConeGeometry(.12,.22,8),new THREE.MeshStandardMaterial({color:0xfff6d0,emissive:0xfff0b0,emissiveIntensity:T.night?2.5:.8}));up.position.set(Math.cos(a)*1.55,.37,Math.sin(a)*1.55);g.add(up);
    const bed=new THREE.Mesh(new THREE.CylinderGeometry(.42,.46,.14,12),M(0x6fa65a));bed.position.set(Math.cos(a+Math.PI/4)*2.25,.07,Math.sin(a+Math.PI/4)*2.25);g.add(bed);for(let f=0;f<5;f++){const fl=new THREE.Mesh(new THREE.SphereGeometry(.07,6,6),M([0xff5a8a,0xffd166,0xffffff,0xb07cff][(f+q)%4]));fl.position.set(bed.position.x+Math.cos(f*1.26)*.25,.2,bed.position.z+Math.sin(f*1.26)*.25);g.add(fl);}}
  return g;}
function tourKiosk(color){const g=new THREE.Group();const c=new THREE.Color(color);[[-.14,-.14],[.14,-.14],[-.14,.14],[.14,.14]].forEach(([x,z])=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.3,6),M(0xf4f4f4));p.position.set(x,.15,z);g.add(p);});
  const roof=new THREE.Mesh(new THREE.ConeGeometry(.26,.14,4),new THREE.MeshStandardMaterial({color:c,roughness:.7}));roof.rotation.y=Math.PI/4;roof.position.y=.37;g.add(roof);const counter=new THREE.Mesh(new THREE.BoxGeometry(.3,.12,.1),M(0xd9d2c0));counter.position.set(0,.06,.1);g.add(counter);const tk=makeSprite('🎫',.22);tk.position.set(0,.55,0);g.add(tk);return g;}
function disposeObj(o){o.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material){const ms=Array.isArray(c.material)?c.material:[c.material];ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});}
/* mirror a tile's state onto its lot: a real building rises when the tile is built, rubble after a nuke */
function lotSync(i,s,t){
  const L=lots[i];if(!L)return;
  const lvl=s.owner==null?0:(t.type==='tour'?1:s.level),owner=s.owner,rub=!!(s.rubble&&s.level===0&&t.type==='city');
  if(L.level===lvl&&L.owner===owner&&L.rubble===rub)return;
  if(L.bld){L.grp.remove(L.bld);disposeObj(L.bld);L.bld=null;}if(L.mq){L.grp.remove(L.mq);disposeObj(L.mq);L.mq=null;}if(L.base){L.grp.remove(L.base);disposeObj(L.base);L.base=null;}L.fence.visible=true;
  const rising=owner!=null&&lvl>L.level&&L.level>=0&&!G.over;
  if(owner!=null&&lvl>0){const o=G.players[owner];const b=t.type==='tour'?tourKiosk(o.color):buildingMesh(lvl,o.color,t.name);
    const sc=lvl===4?LOT_LM:LOT_SCALE,TH=THEMES[env.theme]||THEMES.day;const base=plazaBase(L.col,TH);L.grp.add(base);L.base=base;
    b.scale.setScalar(sc);b.position.y=.28;L.grp.add(b);L.bld=b;L.fence.visible=false;
    if(t.type==='city'){const bb=new THREE.Box3().setFromObject(b);const h=bb.max.y-bb.min.y;const mq=marquee(t.name,L.col,TH,.28+h);L.grp.add(mq);L.mq=mq;}
    if(rising){const wp=new THREE.Vector3();L.grp.getWorldPosition(wp);wp.y=L.grp.position.y+.1;b.scale.y=.05;landDust(wp,14,3.6);
      effects.push({t0:performance.now()+200,ms:lvl===4?1300:900,type:'fn',fn:u=>{b.scale.y=sc*Math.max(.02,Math.min(1,u*1.2))*(1+Math.sin(u*Math.PI)*.1);},done:()=>{b.scale.y=sc;}});}}
  else if(rub){const r=rubbleMesh();r.scale.setScalar(5);r.position.y=.1;L.fence.visible=false;L.grp.add(r);L.bld=r;}
  L.level=lvl;L.owner=owner;L.rubble=rub;
}
function lotCollapse(j,delay=0){const L=lots[j];if(!L||!L.bld||L.rubble||L.level<=0)return;collapseMesh(L.bld,delay,L.bld.scale.x||LOT_SCALE);}
function buildEnv(id){
  const T=THEMES[id]||THEMES.day;env.theme=id;
  if(env.root){disposeObj(env.root);scene.remove(env.root);}
  env.root=new THREE.Group();scene.add(env.root);['clouds','trail','blades','cars','lamps','neon','birds','beacons'].forEach(k=>env[k]=[]);env.ferris=env.plane=env.balloon=env.fire=env.stars=env.fireflies=env.fountain=env.train=env.lake=null;
  scene.fog.color.set(T.fog);scene.fog.near=T.fogNear;scene.fog.far=T.fogFar;hemi.color.set(T.hemi[0]);hemi.groundColor.set(T.hemi[1]);hemi.intensity=T.hemi[2];sun.color.set(T.sun[0]);sun.intensity=T.sun[1];sun.position.set(...T.sun[2]);bloom.strength=T.bloom;
  // sky dome, sun/moon, stars
  const sky=new THREE.Mesh(new THREE.SphereGeometry(120,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{top:{value:new THREE.Color(T.sky[0])},mid:{value:new THREE.Color(T.sky[1])},bot:{value:new THREE.Color(T.sky[2])}},
    vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 top,mid,bot;varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=h>0.0?mix(mid,top,pow(h,0.6)):mix(mid,bot,pow(-h,0.5));gl_FragColor=vec4(c,1.0);}'}));
  env.root.add(sky);
  const ss=T.sunSprite;const sunSp=gradientSprite(ss.color,ss.size,ss.moon);sunSp.position.set(...ss.pos);env.root.add(sunSp);
  if(T.night){const n=800,pos=new Float32Array(n*3);for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,e=Math.random()*1.2+.12,r=110;pos[k*3]=Math.cos(a)*Math.cos(e)*r;pos[k*3+1]=Math.sin(e)*r;pos[k*3+2]=Math.sin(a)*Math.cos(e)*r;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));env.stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,size:.55,transparent:true,opacity:.9,fog:false}));env.root.add(env.stars);}
  // distant mountains
  for(let k=0;k<26;k++){const a=k/26*Math.PI*2+Math.random()*.15,r=78+Math.random()*14,h=9+Math.random()*16;const m=new THREE.Mesh(new THREE.ConeGeometry(9+Math.random()*7,h,7),M(new THREE.Color(T.fog).lerp(new THREE.Color(T.night?0x101828:0x5a6f7a),.45)));m.position.set(Math.cos(a)*r,h/2-2,Math.sin(a)*r);env.root.add(m);}
  // ground: paved plaza, asphalt beyond
  const pav=pavingTex();pav.repeat.set(16,16);const plaza=new THREE.Mesh(new THREE.PlaneGeometry(29,29),new THREE.MeshStandardMaterial({map:pav,roughness:.95}));plaza.rotation.x=-Math.PI/2;plaza.position.y=-0.42;plaza.receiveShadow=true;env.root.add(plaza);
  const asph=asphaltTex();asph.repeat.set(60,60);const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({map:asph,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-0.43;ground.receiveShadow=true;env.root.add(ground);
  // sidewalks + road markings on the block grid
  const P=9.4,RW=2.4;const walkM=M(0xc9c4b6,{roughness:.95}),dashM=new THREE.MeshBasicMaterial({color:0xffe08a}),zebraM=new THREE.MeshBasicMaterial({color:0xffffff});
  for(let bx=-4;bx<=4;bx++)for(let bz=-4;bz<=4;bz++){if(Math.abs(bx)<=1&&Math.abs(bz)<=1)continue;const cx=bx*P,cz=bz*P;const far=Math.max(Math.abs(bx),Math.abs(bz))>=4;
    if(Math.max(Math.abs(bx),Math.abs(bz))===2)continue; // the boulevard (buildLots) replaces the first ring of blocks
    const sw=new THREE.Mesh(new THREE.BoxGeometry(P-RW+.6,.1,P-RW+.6),walkM);sw.position.set(cx,-0.4,cz);sw.receiveShadow=true;env.root.add(sw);
    vegasBlock(cx,cz,T,P-RW-.4,Math.max(Math.abs(bx),Math.abs(bz)),bx,bz);
  }
  // ring road around the plaza: dashes, crosswalks, lamps
  const R=P*1.5;for(let k=0;k<4;k++){const horiz=k<2,s=k%2?1:-1;for(let u=-R+1;u<R;u+=1.6){const dsh=new THREE.Mesh(new THREE.PlaneGeometry(horiz?.8:.12,horiz?.12:.8),dashM);dsh.rotation.x=-Math.PI/2;dsh.position.set(horiz?u:s*R,-0.418,horiz?s*R:u);env.root.add(dsh);}
    for(let z=-.9;z<=.9;z+=.3){const zb=new THREE.Mesh(new THREE.PlaneGeometry(horiz?.25:RW-.2,horiz?RW-.2:.25),zebraM);zb.rotation.x=-Math.PI/2;zb.position.set(horiz?z*3:s*R,-0.417,horiz?s*R:z*3);env.root.add(zb);}
    for(let u=-R+2;u<R;u+=4.2){streetLamp(horiz?u:s*(R-RW/2-.4),horiz?s*(R-RW/2-.4):u,T);}}
  // plaza furniture: fountain, benches, flags, trees
  {const f=new THREE.Group();f.position.set(0,-0.42,11.5);const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.7,.4,24),M(0xd9d2c0));basin.position.y=.2;f.add(basin);const water=new THREE.Mesh(new THREE.CircleGeometry(1.45,24),new THREE.MeshStandardMaterial({color:0x6fc3e8,roughness:.2,metalness:.3}));water.rotation.x=-Math.PI/2;water.position.y=.41;f.add(water);const ped=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,.9,12),M(0xd9d2c0));ped.position.y=.85;f.add(ped);const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.6,.2,.2,16),M(0xd9d2c0));bowl.position.y=1.35;f.add(bowl);
    const jets=[];for(let k=0;k<8;k++){const j=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),new THREE.MeshBasicMaterial({color:0xbfe8ff,transparent:true,opacity:.8}));j.userData.a=k*Math.PI/4;f.add(j);jets.push(j);}env.fountain={grp:f,jets};env.root.add(f);}
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;if(k%2){if(Math.sin(a)<0)continue;tree(Math.cos(a)*13.2,Math.sin(a)*13.2,1.1);}else{const pole=new THREE.Mesh(new THREE.CylinderGeometry(.03,.04,2.6,6),M(0xdddddd));pole.position.set(Math.cos(a)*13.2,-0.42+1.3,Math.sin(a)*13.2);env.root.add(pole);const fl=new THREE.Mesh(new THREE.PlaneGeometry(.7,.42),new THREE.MeshStandardMaterial({map:stripeTex(['#22a06b','#1c7fb3','#d8333c','#f5b400'][k/2|0],'#ffffff',4),side:THREE.DoubleSide}));fl.position.set(Math.cos(a)*13.2+.36,-0.42+2.4,Math.sin(a)*13.2);env.root.add(fl);env.blades.push(fl);}}
  // (benches removed: the landmark strip took their spot)
  // clouds
  const cm=new THREE.MeshLambertMaterial({color:T.night?0x6f7f9a:0xffffff,emissive:0x334455,emissiveIntensity:.25,transparent:true,opacity:.8,depthWrite:false});
  for(let k=0;k<T.clouds;k++){const c=new THREE.Group();const n=3+Math.random()*3|0;for(let j=0;j<n;j++){const s=new THREE.Mesh(new THREE.SphereGeometry(.9+Math.random()*1,10,8),cm);s.position.set(j*1.2-n*.6+Math.random()*.4,Math.random()*.4,(Math.random()-.5)*.8);s.scale.y=.6;c.add(s);}
    c.position.set(-40+Math.random()*80,18+Math.random()*8,-(20+Math.random()*30));c.userData.v=.3+Math.random()*.4;env.root.add(c);env.clouds.push(c);}
  /* ---- the four corner worlds ---- */
  // 출발 corner: railway station with a waiting train and a taxi
  {const st=new THREE.Group();st.position.set(8.6,-0.42,6.6);
    const plat=new THREE.Mesh(new THREE.BoxGeometry(4.2,.3,1.2),M(0xd9d2c0));plat.position.set(0,.15,.9);plat.receiveShadow=true;st.add(plat);
    for(let k=-1;k<=1;k++){const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.6,8),M(0x3a3f46));p.position.set(k*1.6,1.1,.9);st.add(p);}
    const roof=new THREE.Mesh(new THREE.BoxGeometry(4.4,.08,1.5),M(0x1c7fb3,{metalness:.3}));roof.position.set(0,1.95,.9);roof.castShadow=true;st.add(roof);
    [-.25,.25].forEach(z=>{const rail=new THREE.Mesh(new THREE.BoxGeometry(5,.04,.06),M(0x888));rail.position.set(0,.02,z);st.add(rail);});for(let k=-10;k<=10;k++){const tie=new THREE.Mesh(new THREE.BoxGeometry(.14,.03,.7),M(0x5a4030));tie.position.set(k*.24,.0,0);st.add(tie);}
    const train=new THREE.Group();[-1.5,0,1.5].forEach((x,k)=>{const c=new THREE.Mesh(new THREE.BoxGeometry(1.4,.55,.5),M(k===1?0xf4f4f4:0x22a06b,{roughness:.4}));c.position.set(x,.5,0);c.castShadow=true;train.add(c);const win=new THREE.Mesh(new THREE.BoxGeometry(1.42,.16,.52),new THREE.MeshStandardMaterial({color:0x8fd3ff,emissive:0x3a8ad0,emissiveIntensity:T.night?1.5:.3}));win.position.set(x,.6,0);train.add(win);});const nose=new THREE.Mesh(new THREE.ConeGeometry(.28,.5,4),M(0x22a06b));nose.rotation.z=-Math.PI/2;nose.rotation.y=Math.PI/4;nose.position.set(2.45,.45,0);train.add(nose);st.add(train);env.train=train;
    const sign=textPlane('🚉 출발역',1.6,.42,'#fff','#0b3d63','bold 110px "Gothic A1",sans-serif');sign.position.set(0,2.3,.9);st.add(sign);
    const taxi=car(T);taxi.position.set(6.2,-0.42,9.4);taxi.rotation.y=.4;taxi.children[0].material.color.set(0xffd400);const tsign=new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.14),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.6}));tsign.position.set(-.05,.75,0);taxi.add(tsign);
    env.root.add(st);}
  // 무인도 corner: a park lake with the exile island
  {const lake=new THREE.Mesh(new THREE.CircleGeometry(3.0,48),new THREE.MeshStandardMaterial({color:T.night?0x24436b:0x4aa3d8,roughness:.15,metalness:.4}));lake.rotation.x=-Math.PI/2;lake.position.set(-9.9,-0.415,8.5);env.root.add(lake);env.lake=lake;
    const rim=new THREE.Mesh(new THREE.RingGeometry(3.0,3.4,48),M(0x9a8f7a));rim.rotation.x=-Math.PI/2;rim.position.set(-9.9,-0.414,8.5);env.root.add(rim);
    const pz=env.prison.pos;const gp=new THREE.Group();gp.position.set(pz.x,-0.42,pz.z);const sandM=M(0xe6cf98);
    const b=new THREE.Mesh(new THREE.CylinderGeometry(1.7,2.0,.5,20),sandM);b.position.y=.2;b.receiveShadow=true;b.castShadow=true;gp.add(b);
    const palmT=new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,1.1,6),M(0x8b5a2b));palmT.position.set(-.9,1,-.3);palmT.rotation.z=.3;gp.add(palmT);for(let q=0;q<5;q++){const l=new THREE.Mesh(new THREE.ConeGeometry(.08,.7,4),M(0x2e8b3d));l.position.set(-1.05,1.6,-.3);l.rotation.set(1.1,q*1.26,0);gp.add(l);}
    const hut=new THREE.Group();hut.position.set(.55,.45,-.55);const wall=new THREE.Mesh(new THREE.BoxGeometry(.6,.42,.5),M(0xb08a5a));wall.position.y=.21;wall.castShadow=true;hut.add(wall);const roof=new THREE.Mesh(new THREE.ConeGeometry(.52,.4,4),M(0x8a6a3a));roof.position.y=.6;roof.rotation.y=Math.PI/4;hut.add(roof);gp.add(hut);
    const fire=new THREE.Group();fire.position.set(-.5,.45,.5);for(let k=0;k<5;k++){const log=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.35,6),M(0x5a3a1a));log.rotation.z=Math.PI/2;log.rotation.y=k*1.26;fire.add(log);}
    const flame=new THREE.Mesh(new THREE.ConeGeometry(.12,.35,8),M(0xff8a2a,{emissive:0xff5a00,emissiveIntensity:2.5,transparent:true,opacity:.9}));flame.position.y=.2;fire.add(flame);const fl=new THREE.PointLight(0xff9040,T.night?3:1.2,5);fl.position.y=.4;fire.add(fl);gp.add(fire);env.fire=flame;env.fireLight=fl;
    const sos=textPlane('SOS',1.1,.42,'#5a3a1a',null,'bold 150px "Black Han Sans",sans-serif');sos.rotation.x=-Math.PI/2;sos.position.set(-.1,.456,-.1);gp.add(sos);
    const sign=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.9,6),M(0x8b5a2b));sign.position.set(1.0,.9,.7);gp.add(sign);const board=textPlane('무인도',.7,.3,'#fff','#5a3a1a','bold 110px "Gothic A1",sans-serif');board.position.set(1.0,1.25,.7);board.rotation.y=-.6;gp.add(board);
    const parrot=makeSprite('🦜',.5);parrot.position.set(-.9,1.9,-.4);gp.add(parrot);env.root.add(gp);
    const dock=new THREE.Mesh(new THREE.BoxGeometry(1.4,.12,.6),M(0x8b6a44));dock.position.set(-7.2,-0.36,6.2);dock.rotation.y=-.75;env.root.add(dock);
    tree(-13.3,5.0,1.2);tree(-13.2,11.6,1);tree(-6.6,12.2,.9);}
  // 축제 corner: ferris wheel, tents, lanterns, stage
  {const gp=new THREE.Group();gp.position.set(-10.2,-0.42,-8.6);const fw=landmark('ferris');fw.position.set(.5,.0,-.6);fw.scale.setScalar(1.3);gp.add(fw);
    [[-1.4,.4,'#ff5a5a','#ffffff'],[-.4,1.4,'#4fc3f7','#ffffff'],[1.6,1.2,'#ffd166','#ffffff']].forEach(([x,z,c1,c2])=>{const tent=new THREE.Mesh(new THREE.ConeGeometry(.6,.75,12),new THREE.MeshStandardMaterial({map:stripeTex(c1,c2,12),roughness:.9}));tent.position.set(x,.75,z);tent.castShadow=true;gp.add(tent);const base=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.4,12),M(0xf0e6d2));base.position.set(x,.2,z);gp.add(base);});
    const stage=new THREE.Mesh(new THREE.BoxGeometry(2.2,.3,1.2),M(0x5a2a6a));stage.position.set(0,.15,2.3);gp.add(stage);const back=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.4,.1),new THREE.MeshStandardMaterial({color:0x7a1fa2,emissive:0xff2bd6,emissiveIntensity:T.neon*.5}));back.position.set(0,1.0,2.85);gp.add(back);env.neon.push(back.material);
    for(let k=0;k<9;k++){const lan=new THREE.Mesh(new THREE.SphereGeometry(.08,8,8),M([0xff5a5a,0xffd166,0x7cf29a,0x4fc3f7][k%4],{emissive:[0xff5a5a,0xffd166,0x7cf29a,0x4fc3f7][k%4],emissiveIntensity:T.night?2.5:.8}));lan.position.set(-2+k*.5,1.9+Math.sin(k)*.1,1.6);gp.add(lan);}
    env.root.add(gp);}
  // 세계여행 corner: travel agency with globe sign and a heliport
  {const gp=new THREE.Group();gp.position.set(10.0,-0.42,-8.8);const bld=new THREE.Mesh(new THREE.BoxGeometry(3.2,2.2,2.2),[new THREE.MeshStandardMaterial({color:0xffffff,map:facadeTex('glass',6,4),emissiveMap:facadeTex('glass',6,4),emissive:0xffffff,emissiveIntensity:T.windows,roughness:.3,metalness:.3})]);bld.position.set(0,1.1,0);bld.castShadow=true;gp.add(bld);
    const pad=new THREE.Mesh(new THREE.CircleGeometry(1.0,24),M(0x555c66));pad.rotation.x=-Math.PI/2;pad.position.set(0,2.21,0);gp.add(pad);const H=textPlane('H',.9,.9,'#fff',null,'bold 300px sans-serif');H.rotation.x=-Math.PI/2;H.position.set(0,2.215,0);gp.add(H);
    const globe=new THREE.Mesh(new THREE.SphereGeometry(.45,20,14),new THREE.MeshStandardMaterial({map:globeTex(),roughness:.5}));globe.position.set(-1.9,2.6,0);gp.add(globe);env.helipad=globe;const post=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.8,8),M(0x9aa3ad));post.position.set(-1.9,1.8,0);gp.add(post);
    const sign=textPlane('✈ WORLD TRAVEL',2.8,.5,'#fff','#1c7fb3','bold 110px "Gothic A1",sans-serif');sign.position.set(0,1.6,1.12);gp.add(sign);const back=new THREE.Mesh(new THREE.BoxGeometry(2.9,.6,.06),new THREE.MeshStandardMaterial({color:0x1c7fb3,emissive:0x3cb7d8,emissiveIntensity:T.neon*.6}));back.position.set(0,1.6,1.08);gp.add(back);env.neon.push(back.material);
    env.root.add(gp);}
  // plane circling, hot-air balloon, birds (day) / fireflies (night)
  {const pl=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.18,1.2,6,12),M(0xf4f4f4,{roughness:.4}));body.rotation.z=Math.PI/2;pl.add(body);const wing=new THREE.Mesh(new THREE.BoxGeometry(.4,.05,1.9),M(0xdddddd));wing.position.x=-.05;pl.add(wing);const tail=new THREE.Mesh(new THREE.BoxGeometry(.25,.45,.05),M(0xd8333c));tail.position.set(-.65,.22,0);pl.add(tail);const tw=new THREE.Mesh(new THREE.BoxGeometry(.2,.04,.8),M(0xd8333c));tw.position.set(-.65,.05,0);pl.add(tw);const lt=new THREE.Mesh(new THREE.SphereGeometry(.05,6,6),M(0xff4040,{emissive:0xff2020,emissiveIntensity:3}));lt.position.set(0,.14,0);pl.add(lt);env.root.add(pl);env.plane=pl;}
  {const bl=new THREE.Group();const ball=new THREE.Mesh(new THREE.SphereGeometry(1.1,18,14),new THREE.MeshStandardMaterial({map:stripeTex('#ff5a5a','#ffd166',10),roughness:.7}));ball.position.y=1.8;bl.add(ball);const bottom=new THREE.Mesh(new THREE.ConeGeometry(.6,.7,12),M(0xff5a5a));bottom.rotation.x=Math.PI;bottom.position.y=.65;bl.add(bottom);const basket=new THREE.Mesh(new THREE.BoxGeometry(.45,.35,.45),M(0x8b5a2b));bl.add(basket);env.root.add(bl);env.balloon=bl;}
  if(!T.night){for(let k=0;k<6;k++){const gl=new THREE.Group();const m=new THREE.MeshBasicMaterial({color:0x333});const w1=new THREE.Mesh(new THREE.PlaneGeometry(.3,.07),m),w2=w1.clone();w1.position.x=-.15;w2.position.x=.15;w1.rotation.z=.4;w2.rotation.z=-.4;gl.add(w1,w2);gl.rotation.x=-Math.PI/2.2;gl.userData={a:Math.random()*6.28,r:9+Math.random()*8,h:6+Math.random()*4,s:.25+Math.random()*.2};env.root.add(gl);env.birds.push(gl);}}
  else{const n=80,pos=new Float32Array(n*3);for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,r=6+Math.random()*7;pos[k*3]=Math.cos(a)*r;pos[k*3+1]=.2+Math.random()*2;pos[k*3+2]=Math.sin(a)*r;}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));env.fireflies=new THREE.Points(geo,new THREE.PointsMaterial({color:0xcfff70,size:.12,transparent:true,opacity:.9}));env.root.add(env.fireflies);}
  // cars on the ring road
  for(let k=0;k<10;k++){const c=car(T);c.userData.u=k/10;c.userData.lane=k%2?.55:-.55;c.userData.dir=k%2?1:-1;c.userData.sp=.012+Math.random()*.006;env.cars.push(c);}
  // a few big-city landmarks on the skyline, from the city set
  // (the distant skyline landmarks are gone: the players build the skyline now)
  buildLots(T);
  env.nextFirework=performance.now()+4000;
}
/* fireworks over the festival corner (and over an active festival tile) */
function firework(pos,big=false){
  const cols=[0xff5a5a,0xffd166,0x7cf29a,0x4fc3f7,0xe040fb,0xffffff];const col=cols[Math.random()*cols.length|0];
  const rocket=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),new THREE.MeshBasicMaterial({color:0xfff0a0}));rocket.position.copy(pos);scene.add(rocket);
  const top=pos.clone().add(new THREE.Vector3((Math.random()-.5)*2,3.2+Math.random()*1.5,(Math.random()-.5)*2));
  effects.push({t0:performance.now(),ms:700,type:'fn',fn:u=>{rocket.position.lerpVectors(pos,top,u);},done:()=>{scene.remove(rocket);rocket.geometry.dispose();rocket.material.dispose();
    const n=big?60:34,parts=[];const grp=new THREE.Group();grp.position.copy(top);scene.add(grp);const mat=new THREE.MeshBasicMaterial({color:col,transparent:true});
    for(let k=0;k<n;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(.05,5,5),mat);const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),sp=1.6+Math.random()*1.2;m.userData.v=new THREE.Vector3(Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th)).multiplyScalar(sp*(big?1.5:1));grp.add(m);parts.push(m);}
    const light=new THREE.PointLight(col,0,14);grp.add(light);SFX.play('pop');
    effects.push({t0:performance.now(),ms:1500,type:'fn',fn:u=>{parts.forEach(m=>{m.position.addScaledVector(m.userData.v,.03);m.userData.v.y-=.05;m.userData.v.multiplyScalar(.985);});mat.opacity=1-u;light.intensity=12*(1-u);},done:()=>{scene.remove(grp);mat.dispose();grp.traverse(o=>{if(o.geometry)o.geometry.dispose();});}});}});
}
function envTick(now,dt){
  if(!env.root)return;const t=now/1000;const T=THEMES[env.theme];const R=9.4*1.5;
  env.clouds.forEach(c=>{c.position.x+=c.userData.v*dt;if(c.position.x>45)c.position.x=-45;});
  env.cars.forEach(c=>{c.userData.u+=c.userData.sp*c.userData.dir*dt*10;const p=ringPoint(c.userData.u,R,c.userData.lane);c.position.set(p.x,-0.42,p.z);c.rotation.y=p.ang+(c.userData.dir<0?Math.PI:0);});
  if(env.plane){const a=t*.18;const r=24;env.plane.position.set(Math.cos(a)*r,12+Math.sin(t*.7)*.5,Math.sin(a)*r);env.plane.rotation.y=-a;env.plane.rotation.z=.25;
    if(now-(env.lastPuff||0)>160){env.lastPuff=now;const p=new THREE.Mesh(new THREE.SphereGeometry(.14,6,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,fog:false}));p.position.copy(env.plane.position).add(new THREE.Vector3(Math.sin(a)*.7,-.05,-Math.cos(a)*.7));scene.add(p);env.trail.push({m:p,t0:now});}
    env.trail=env.trail.filter(tr=>{const u=(now-tr.t0)/3500;if(u>=1){scene.remove(tr.m);tr.m.geometry.dispose();tr.m.material.dispose();return false;}tr.m.scale.setScalar(1+u*4);tr.m.material.opacity=.5*(1-u);return true;});}
  if(env.balloon){const a=t*.045;env.balloon.position.set(Math.cos(a)*19,9+Math.sin(t*.8)*.5,-14+Math.sin(a*2)*4);}
  if(env.ferris)env.ferris.rotation.z=t*.35;
  env.blades.forEach((b,k)=>b.rotation.y=.3*Math.sin(t*3+k));
  if(env.fire){env.fire.scale.set(1+.2*Math.sin(t*17),1+.25*Math.sin(t*13+1),1+.2*Math.sin(t*19));env.fireLight.intensity=(T.night?3:1.2)*(.8+.3*Math.sin(t*21));}
  if(env.fountain){env.fountain.jets.forEach((j,k)=>{const ph=(t*1.3+k*.4)%1;j.position.set(Math.cos(j.userData.a)*ph*1.0,1.45+Math.sin(ph*Math.PI)*.9,Math.sin(j.userData.a)*ph*1.0);j.material.opacity=.8*(1-ph*.6);});}
  if(env.train)env.train.position.y=Math.sin(t*6)*.005;
  if(env.helipad)env.helipad.rotation.y=t*.4;
  env.beacons.forEach((b,k)=>b.material.emissiveIntensity=Math.sin(t*3+k)>0?3:.2);
  if(env.lake)env.lake.material.roughness=.12+.06*Math.sin(t*1.4);
  env.birds.forEach(g=>{const u=g.userData;u.a+=u.s*dt;g.position.set(Math.cos(u.a)*u.r,u.h+Math.sin(t*3+u.r)*.3,Math.sin(u.a)*u.r);g.rotation.y=-u.a;g.children[0].rotation.z=.4+Math.sin(t*9)*.5;g.children[1].rotation.z=-.4-Math.sin(t*9)*.5;});
  if(env.stars)env.stars.material.opacity=.75+.2*Math.sin(t*1.7);
  if(env.fireflies){const a=env.fireflies.geometry.attributes.position;for(let k=0;k<a.count;k++){a.setY(k,.4+Math.sin(t*1.3+k)*.5+.6);}a.needsUpdate=true;env.fireflies.material.opacity=.6+.4*Math.sin(t*5);}
  if(now>env.nextFirework){const fest=G&&!G.over&&G.festival!=null;const pos=fest&&Math.random()<.5?(()=>{const r=rect(G.festival);return new THREE.Vector3(r.x,.3,r.z);})():env.festivalPos.clone().setY(.4);firework(pos,fest);env.nextFirework=now+(fest?2500:6000)+Math.random()*3000;}
}
/* ferris wheel used by the festival corner */
function landmark(kind){
  const g=new THREE.Group();
  if(kind==='ferris'){const wheel=new THREE.Group();wheel.position.y=1.35;const rim=new THREE.Mesh(new THREE.TorusGeometry(1,.05,8,36),M(0xff6a3d,{metalness:.4}));wheel.add(rim);for(let k=0;k<8;k++){const a=k*Math.PI/4;const sp=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,2,6),M(0xffd166));sp.rotation.z=a;wheel.add(sp);const cab=new THREE.Mesh(new THREE.BoxGeometry(.22,.2,.2),M([0x4fc3f7,0xff5a5a,0xffd166,0x7cf29a][k%4]));cab.position.set(Math.cos(a+Math.PI/2)*1,Math.sin(a+Math.PI/2)*1,0);wheel.add(cab);}g.add(wheel);env.ferris=wheel;
    [[-.6,0],[.6,0]].forEach(([x])=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,1.5,8),M(0x6a5a50));leg.position.set(x,.7,.15);leg.rotation.z=x>0?-.35:.35;g.add(leg);});}
  return g;
}

/* ---- camera follow ---- */
let camMode='follow',freeUntil=0,homePos=CAM_HOME.clone(),focusOverride=null,chase=null,chaseAnchor=null;const chaseDir=new THREE.Vector3(1,0,0);
const REDUCED_MOTION=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOLLOW_OFF=new THREE.Vector3(0,5.2,5.4);
controls.addEventListener('start',()=>{freeUntil=performance.now()+7000;});
function camTick(dt){
  if(performance.now()<freeUntil&&!cinema)return;
  let tg,cp;
  let k=1-Math.pow(0.0015,dt);
  if(cinema||focusOverride){const tp=$('#tip');if(tp&&!tp.hidden)tp.hidden=true;}
  if(cinema){tg=cinema.pos.clone();cp=tg.clone().add(cinema.off);k=1-Math.pow(0.00005,dt);}
  else if(chase&&camMode==='follow'&&tokens[chase.id]&&!REDUCED_MOTION){ // my piece walking: right behind it, looking where it walks (third person)
    // anti-motion-sickness: follow a smoothed anchor (not each hop), heading looks 3 tiles ahead so corners turn gradually, slower easing
    const tp=tokens[chase.id].grp.position;
    const ah=slotPos((chase.pos+3)%N,chase.id).sub(slotPos(chase.pos,chase.id)).setY(0);if(ah.lengthSq()<1e-6)ah.set(1,0,0);ah.normalize();
    if(!chaseAnchor){chaseAnchor=tp.clone().setY(0);chaseDir.copy(ah);} // start already facing the walk, no swing-in
    chaseAnchor.lerp(new THREE.Vector3(tp.x,0,tp.z),1-Math.pow(0.08,dt));chaseDir.lerp(ah,1-Math.pow(0.15,dt)).normalize();
    cp=chaseAnchor.clone().addScaledVector(chaseDir,-1.9).setY(1.5);tg=chaseAnchor.clone().addScaledVector(chaseDir,5).setY(.6);k=1-Math.pow(0.05,dt);}
  else if(focusOverride&&performance.now()<focusOverride.until){tg=focusOverride.pt;cp=focusOverride.pt.clone().add(FOLLOW_OFF.clone().multiplyScalar(focusOverride.scale||1.3));}
  else if(false){}
  else{tg=TARGET;cp=homePos;chaseAnchor=null;k=1-Math.pow(0.05,dt);} // ease back up slowly too
  controls.target.lerp(tg,k);camera.position.lerp(cp,k);
}
let lastEmoteCam=0;
function focusAt(pos,ms=1500,scale=0.9){if(camMode!=='follow')return;focusOverride={pt:new THREE.Vector3(pos.x,0.35,pos.z),until:performance.now()+ms,scale};freeUntil=0;}
function focusOn(i,ms=1800,scale=1.3){if(camMode!=='follow')return;const r=rect(i);focusOverride={pt:new THREE.Vector3(r.x,0.2,r.z),until:performance.now()+ms,scale};freeUntil=0;}
/* ---- turn emphasis: arrow marker + spotlight + banner ---- */
const marker=new THREE.Group();
{const cone=new THREE.Mesh(new THREE.ConeGeometry(.16,.34,16),new THREE.MeshStandardMaterial({color:0xffcf3f,emissive:0xffaa00,emissiveIntensity:1.2}));cone.rotation.x=Math.PI;marker.add(cone);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,10,40),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9}));ring.rotation.x=Math.PI/2;ring.position.y=-1.0;marker.add(ring);
 marker.visible=false;scene.add(marker);}
const spot=new THREE.SpotLight(0xffffff,0,9,0.42,0.6,1);spot.position.set(0,6,0);spot.castShadow=false;scene.add(spot);scene.add(spot.target);
let panelAI=null;
function markerTick(now){
  {const ai=!!(G&&!G.over&&G.players[G.cur]&&G.players[G.cur].ai);if(ai!==panelAI){panelAI=ai;$('.hud .panel').hidden=ai;}} // dice box only on a human's turn
  if(!G||G.over||!tokens.length){marker.visible=false;spot.intensity=0;return;}
  const p=G.players[G.cur],tk=tokens[p.id];if(!tk||p.bankrupt){marker.visible=false;spot.intensity=0;return;}
  marker.visible=!(chase===p&&camMode==='follow'&&!REDUCED_MOTION);const t=now/1000;const pos=tk.grp.position; // hidden while riding behind: it would sit mid-view
  marker.position.set(pos.x,pos.y+1.25+Math.sin(t*4)*.12,pos.z);marker.rotation.y=t*2;
  marker.children[0].material.color.set(p.color);marker.children[0].material.emissive.set(p.color);
  marker.children[1].material.color.set(p.color);marker.children[1].scale.setScalar(1+.12*Math.sin(t*5));
  spot.color.set(p.color);spot.intensity=14;spot.position.set(pos.x+1.5,pos.y+5.5,pos.z+1.5);spot.target.position.copy(pos);
}
function banner(p){
  const b=$('#banner');b.style.setProperty('--pc',p.color);b.innerHTML=`<span class="bav">${CH(p.ch).emoji}</span><span>${esc(p.name)}의 차례${p.ai?'':' — 당신입니다'}</span>`;
  b.classList.remove('show');void b.offsetWidth;b.classList.add('show');
  stage.style.setProperty('--pc',p.color);
}

/* layout */
const W=[1.45,1,1,1,1,1,1,1,1.45], TOT=9.45, OFF=[];{let a=0;for(const w of W){OFF.push(a+w/2);a+=w;}}
function gridPos(i){
  if(i<=8)return{r:9,c:9-i,side:'b'};
  if(i<=16)return{r:9-(i-8),c:1,side:'l'};
  if(i<=24)return{r:1,c:1+(i-16),side:'t'};
  return{r:1+(i-24),c:9,side:'r'};
}
const rect=i=>{const g=gridPos(i);return{x:OFF[g.c-1]-TOT/2,z:OFF[g.r-1]-TOT/2,w:W[g.c-1],d:W[g.r-1],side:g.side};};
const SIDE_OF=i=>i%8===0?['b','l','t','r'][i/8]:gridPos(i).side;
const BASE={city:0xf6f1e4,tour:0xd6f0f1,chance:0xffe6a3,tax:0xd9dde3,start:0xcdeedd,island:0xf3e2b0,festival:0xf9d2e0,travel:0xcfe9f8,casino:0x3a2a4a,auction:0xe8d9b8,blackmarket:0x2a2f38};

const hubFx={globe:null,atmo:null,orbit:null,orbiter:null,spinners:[],beacons:[],windows:[]};
/* ground + board */
{
  const base=new THREE.Mesh(new THREE.BoxGeometry(TOT+0.6,0.3,TOT+0.6),new THREE.MeshStandardMaterial({color:0x14486b,roughness:.7,metalness:.1}));
  base.position.y=-0.15;base.receiveShadow=true;base.castShadow=true;scene.add(base);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(TOT+1.0,0.16,TOT+1.0),new THREE.MeshStandardMaterial({color:0xd9a441,roughness:.35,metalness:.7}));
  rim.position.y=-0.32;rim.castShadow=true;scene.add(rim);
  const plinth=new THREE.Mesh(new THREE.BoxGeometry(TOT+1.6,0.5,TOT+1.6),new THREE.MeshStandardMaterial({color:0x0f3550,roughness:.8}));
  plinth.position.y=-0.62;scene.add(plinth);
  // corner pillars
  const pm=new THREE.MeshStandardMaterial({color:0xe8e2d2,roughness:.5});
  [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([sx,sz])=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,.9,12),pm);c.position.set(sx*(TOT/2+.55),.05,sz*(TOT/2+.55));c.castShadow=true;scene.add(c);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),new THREE.MeshStandardMaterial({color:0xffd166,metalness:.8,roughness:.25,emissive:0xffb040,emissiveIntensity:.6}));ball.position.set(c.position.x,.62,c.position.z);scene.add(ball);hubFx.beacons.push(ball);});
  // hub disc with the title along the front edge
  const cv=document.createElement('canvas');cv.width=cv.height=512;const g=cv.getContext('2d');
  const grd=g.createRadialGradient(200,180,20,256,256,256);grd.addColorStop(0,'#2d8fc9');grd.addColorStop(.55,'#1c6f9f');grd.addColorStop(1,'#0b3d63');
  g.fillStyle=grd;g.beginPath();g.arc(256,256,250,0,Math.PI*2);g.fill();
  g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=1.5;for(let k=1;k<6;k++){g.beginPath();g.arc(256,256,k*42,0,Math.PI*2);g.stroke();}for(let k=0;k<12;k++){g.beginPath();g.moveTo(256,256);g.lineTo(256+Math.cos(k*Math.PI/6)*250,256+Math.sin(k*Math.PI/6)*250);g.stroke();}
  g.fillStyle='rgba(6,18,32,.85)';g.beginPath();g.roundRect(116,330,280,84,22);g.fill();g.strokeStyle='rgba(255,209,102,.9)';g.lineWidth=3;g.stroke();
  g.textAlign='center';g.textBaseline='middle';g.font='48px "Jua","Gothic A1",sans-serif';g.lineWidth=7;g.strokeStyle='rgba(0,0,0,.55)';g.strokeText('딸깍 마블',256,362);g.fillStyle='#fff7d6';g.fillText('딸깍 마블',256,362);
  g.font='600 15px "Gothic A1",sans-serif';g.fillStyle='rgba(255,255,255,.9)';g.fillText('TTALKKAK MARBLE',256,392);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const hub=new THREE.Mesh(new THREE.CircleGeometry(3.3,64),new THREE.MeshStandardMaterial({map:tex,roughness:.7}));
  hub.rotation.x=-Math.PI/2;hub.position.y=0.012;hub.receiveShadow=true;scene.add(hub);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.35,0.06,12,80),new THREE.MeshStandardMaterial({color:0xffd166,metalness:.6,roughness:.3,emissive:0x553300}));
  ring.rotation.x=Math.PI/2;ring.position.y=0.03;scene.add(ring);
  buildHub();
}

/* ---- the hub: a spinning globe on a pedestal, ringed by a lit miniature skyline ---- */
function globeTex(){
  const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const g=cv.getContext('2d');
  const sea=g.createLinearGradient(0,0,0,512);sea.addColorStop(0,'#9fd6f0');sea.addColorStop(.12,'#2a7fc2');sea.addColorStop(.5,'#1f6fb0');sea.addColorStop(.88,'#2a7fc2');sea.addColorStop(1,'#cfe9f7');g.fillStyle=sea;g.fillRect(0,0,1024,512);
  // stylised continents from clustered blobs
  const land=[[150,150,120,70],[230,210,80,60],[300,330,70,110],[520,150,110,80],[600,230,90,80],[560,330,60,70],[720,160,120,60],[820,250,80,70],[860,360,70,40],[950,210,50,40],[380,120,50,30],[680,400,50,25]];
  land.forEach(([x,y,w,h])=>{for(let k=0;k<14;k++){const rx=x+(Math.random()-.5)*w,ry=y+(Math.random()-.5)*h,r=14+Math.random()*26;const sh=['#5fae4a','#4e9a3c','#7cbf5a','#c9b36a'][k%4];g.fillStyle=sh;g.beginPath();g.ellipse(rx,ry,r*1.3,r,Math.random()*3,0,Math.PI*2);g.fill();}});
  g.fillStyle='rgba(255,255,255,.95)';g.fillRect(0,0,1024,26);g.fillRect(0,486,1024,26);
  g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=1;for(let k=1;k<12;k++){g.beginPath();g.moveTo(k*1024/12,0);g.lineTo(k*1024/12,512);g.stroke();}for(let k=1;k<6;k++){g.beginPath();g.moveTo(0,k*512/6);g.lineTo(1024,k*512/6);g.stroke();}
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function windowTex(cols,rows,night){
  const cv=document.createElement('canvas');cv.width=64*cols/ (cols/4);cv.width=128;cv.height=Math.round(128*rows/cols);const g=cv.getContext('2d');
  g.fillStyle='#000';g.fillRect(0,0,cv.width,cv.height);
  const cw=cv.width/cols,ch=cv.height/rows;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const lit=Math.random()<.65;g.fillStyle=lit?(Math.random()<.5?'#ffe9a8':'#fff7d6'):'#2a3440';g.fillRect(x*cw+cw*.22,y*ch+ch*.22,cw*.56,ch*.56);}
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function buildHub(){
  const hb=new THREE.Group();scene.add(hb);
  // pedestal
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,.35,24),new THREE.MeshStandardMaterial({color:0xffd166,metalness:.6,roughness:.35,emissive:0x553300,emissiveIntensity:.3}));ped.position.y=.19;ped.castShadow=true;hb.add(ped);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.9,12),new THREE.MeshStandardMaterial({color:0xd9a441,metalness:.7,roughness:.3}));stem.position.y=.8;hb.add(stem);
  const arc=new THREE.Mesh(new THREE.TorusGeometry(1.08,.035,10,48,Math.PI),new THREE.MeshStandardMaterial({color:0xd9a441,metalness:.7,roughness:.3}));arc.position.y=2.15;arc.rotation.z=Math.PI;arc.rotation.y=.4;hb.add(arc);
  const globe=new THREE.Mesh(new THREE.SphereGeometry(.8,40,28),new THREE.MeshStandardMaterial({map:globeTex(),roughness:.55}));globe.position.y=2.15;globe.rotation.z=.41;globe.castShadow=true;hb.add(globe);hubFx.globe=globe;
  const atmo=new THREE.Mesh(new THREE.SphereGeometry(.87,32,24),new THREE.MeshBasicMaterial({color:0x7fc4ff,transparent:true,opacity:.14,side:THREE.BackSide}));atmo.position.y=2.15;hb.add(atmo);hubFx.atmo=atmo;
  // tiny plane orbiting the globe
  const orbit=new THREE.Group();orbit.position.y=2.15;hb.add(orbit);const pl=new THREE.Group();pl.position.set(1.25,0,0);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.04,.22,4,8),new THREE.MeshStandardMaterial({color:0xffffff}));body.rotation.x=Math.PI/2;pl.add(body);const wing=new THREE.Mesh(new THREE.BoxGeometry(.3,.015,.08),new THREE.MeshStandardMaterial({color:0xd8333c}));pl.add(wing);orbit.add(pl);hubFx.orbit=orbit;hubFx.orbiter=pl;
  // miniature skyline around the hub (the front sector stays open so the title can be read)
  const n=16;for(let k=0;k<n;k++){const a=k/n*Math.PI*2;const toward=Math.abs(((a-Math.PI/2)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI);if(toward<1.25)continue;const front=Math.sin(a)>0;
    const r=2.62+Math.random()*.3,h=front?.25+Math.random()*.25:.35+Math.random()*.95,w=.22+Math.random()*.18;const cols=Math.max(2,Math.round(w*12)),rows=Math.max(2,Math.round(h*7));
    const tint=[0x9fb3c8,0xb8c7d8,0x8aa0b8,0xcad6e2,0x7f93a8][k%5];const wt=windowTex(cols,rows);
    const mat=new THREE.MeshStandardMaterial({color:tint,roughness:.5,metalness:.15,map:wt,emissiveMap:wt,emissive:0xffffff,emissiveIntensity:.45});
    const plain=new THREE.MeshStandardMaterial({color:tint,roughness:.6});
    const bld=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),[mat,mat,plain,plain,mat,mat]);bld.position.set(Math.cos(a)*r,h/2+.01,Math.sin(a)*r);bld.rotation.y=-a;bld.castShadow=true;bld.receiveShadow=true;hb.add(bld);hubFx.windows.push(mat);
    if(Math.random()<.5){const ant=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.25,4),new THREE.MeshStandardMaterial({color:0x666}));ant.position.set(bld.position.x,h+.13,bld.position.z);hb.add(ant);const bc=new THREE.Mesh(new THREE.SphereGeometry(.025,6,6),new THREE.MeshStandardMaterial({color:0xff4040,emissive:0xff2020,emissiveIntensity:3}));bc.position.set(bld.position.x,h+.27,bld.position.z);hb.add(bc);hubFx.beacons.push(bc);}
    else{const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.5,.06,w*.5),new THREE.MeshStandardMaterial({color:0x8a97a5}));roof.position.set(bld.position.x,h+.03,bld.position.z);hb.add(roof);}
    const tree=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,6),new THREE.MeshStandardMaterial({color:0x3f8f3a}));tree.position.set(Math.cos(a+.18)*Math.min(r+.2,3.15),.1,Math.sin(a+.18)*Math.min(r+.2,3.15));hb.add(tree);}
  // street ring
  const road=new THREE.Mesh(new THREE.RingGeometry(2.25,2.45,64),new THREE.MeshStandardMaterial({color:0x2f3a45,roughness:1}));road.rotation.x=-Math.PI/2;road.position.y=.02;hb.add(road);
  const dash=new THREE.Mesh(new THREE.RingGeometry(2.34,2.36,64,1),new THREE.MeshBasicMaterial({color:0xffe08a}));dash.rotation.x=-Math.PI/2;dash.position.y=.025;hb.add(dash);
}
function monoFx(i,color){
  const r=rect(i),g=new THREE.Group();g.userData.color=color;const col=new THREE.Color(color);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(r.w-.04,r.d-.04),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.35,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.y=.233;g.add(glow);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.0,.1,4),new THREE.MeshBasicMaterial({visible:false}));g.add(ring);
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.32,.42,2.4,20,1,true),new THREE.MeshBasicMaterial({color:col.clone().lerp(new THREE.Color(0xffd166),.4),transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));pillar.position.y=1.42;g.add(pillar);
  const crown=makeSprite('👑',.42);crown.position.y=1.9;g.add(crown);
  const sparks=[];for(let k=0;k<8;k++){const sp=new THREE.Mesh(new THREE.SphereGeometry(.03,6,6),new THREE.MeshBasicMaterial({color:k%2?0xffd166:0xffffff,transparent:true}));sp.userData.a=Math.random()*Math.PI*2;sp.userData.r=.25+Math.random()*.2;sp.userData.ph=Math.random();g.add(sp);sparks.push(sp);}
  g.userData={color,glow,pillar,crown,sparks};monoTiles.add(g);return g;
}
const monoTiles=new Set(),festTiles=new Set();
function festSign(){const cv=document.createElement('canvas');cv.width=320;cv.height=120;const g=cv.getContext('2d');g.fillStyle='#d8333c';g.beginPath();g.roundRect(6,6,308,108,28);g.fill();g.strokeStyle='#ffd166';g.lineWidth=8;g.stroke();g.fillStyle='#fff';g.font='54px "Jua","Gothic A1",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('🎉 축제 ×2',160,64);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,fog:false}));sp.scale.set(1.3,.49,1);sp.renderOrder=20;return sp;}
function festFx(i){
  const r=rect(i),g=new THREE.Group();
  // striped canopy on four poles

  const canopy=new THREE.Object3D();g.add(canopy);
  // bunting
  for(let k=0;k<10;k++){const a=k/10*Math.PI*2;const f=new THREE.Mesh(new THREE.ConeGeometry(.05,.12,3),new THREE.MeshBasicMaterial({color:[0xff3b6b,0xffd166,0x4fc3f7,0x7cf29a][k%4]}));f.rotation.x=Math.PI;f.scale.setScalar(.7);f.position.set(Math.cos(a)*r.w*.47,.3,Math.sin(a)*r.d*.47);g.add(f);}
  // spotlight beams
  const beams=[];[].forEach((c,k)=>{const b=new THREE.Mesh(new THREE.ConeGeometry(.35,2.6,16,1,true),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));b.geometry.translate(0,-1.3,0);b.position.y=2.9;b.userData.k=k;g.add(b);beams.push(b);});
  const sign=festSign();sign.scale.set(1.05,.4,1);const [ix,iz]=outerOffset(i,-.62);sign.position.set(ix,1.15,iz);g.add(sign);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(r.w-.04,r.d-.04),new THREE.MeshBasicMaterial({color:0xff3b6b,transparent:true,opacity:.18,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.y=.236;g.add(glow);
  const conf=[];for(let k=0;k<10;k++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.05,.08),new THREE.MeshBasicMaterial({color:[0xff3b6b,0xffd166,0x4fc3f7,0x7cf29a,0xffffff][k%5],side:THREE.DoubleSide}));m.userData={x:(Math.random()-.5)*r.w,z:(Math.random()-.5)*r.d,ph:Math.random(),sp:.25+Math.random()*.3};g.add(m);conf.push(m);}
  const light=new THREE.PointLight(0xff6aa0,1.2,3);light.position.y=.8;g.add(light);
  g.userData={beams,sign,glow,conf,light,canopy};festTiles.add(g);return g;
}
/* while a festival is on, the hub shows that city's building instead of the globe */
function hubFestival(i){
  if(hubFx.festTile===i)return;hubFx.festTile=i;
  if(hubFx.fest){hubFx.fest.parent.remove(hubFx.fest);disposeObj(hubFx.fest);hubFx.fest=null;}
  const on=i!=null;[hubFx.globe,hubFx.atmo,hubFx.orbit].forEach(o=>{if(o)o.visible=!on;});
  if(!on)return;
  const t=T(i),hb=hubFx.globe.parent,g=new THREE.Group();g.position.y=.95;
  const lm=t.type==='city'?landmarkMesh(t.name):makeSprite(t.ico||'🎉',1.2);const bb=new THREE.Box3().setFromObject(lm);const size=bb.getSize(new THREE.Vector3());
  const sc=Math.min(1.7/Math.max(size.x,size.z,.01),2.1/Math.max(size.y,.01));lm.scale.setScalar(sc);lm.position.y=.25;g.add(lm);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.1,.22,32),new THREE.MeshStandardMaterial({color:0xff3b6b,emissive:0xff2a5a,emissiveIntensity:.5,roughness:.5}));disc.position.y=.1;g.add(disc);
  for(let k=0;k<12;k++){const a=k*Math.PI/6;const b=new THREE.Mesh(new THREE.SphereGeometry(.06,8,8),M([0xff5a5a,0xffd166,0x7cf29a,0x4fc3f7][k%4],{emissive:[0xff5a5a,0xffd166,0x7cf29a,0x4fc3f7][k%4],emissiveIntensity:2}));b.position.set(Math.cos(a)*1.05,.22,Math.sin(a)*1.05);g.add(b);}
  const sign=festSign();sign.scale.set(.95,.36,1);sign.position.y=.3+size.y*sc+.55;g.add(sign);
  hb.add(g);hubFx.fest=g;hubFx.festLm=lm;
}
function hubTick(now,dt){
  const t=now/1000;
  if(hubFx.festLm)hubFx.festLm.rotation.y=t*.5;
  if(hubFx.lights)hubFx.lights.forEach(b=>{b.rotation.z=.55+Math.sin(t*.35+b.userData.k*2.1)*.35;b.rotation.y=t*.4+b.userData.k;});
  festTiles.forEach(g=>{if(!g.parent){festTiles.delete(g);return;}const u=g.userData;u.beams.forEach(b=>{const a=t*1.4+b.userData.k*2.1;b.rotation.z=Math.sin(a)*.5;b.rotation.x=Math.cos(a*1.3)*.4;});u.sign.position.y=1.15+Math.sin(t*3)*.06;const sc=1+.04*Math.sin(t*6);u.sign.scale.set(1.05*sc,.4*sc,1);u.glow.material.opacity=.12+.08*Math.sin(t*5);u.light.intensity=1+.5*Math.sin(t*7);u.canopy.rotation.y=Math.PI/4+Math.sin(t*1.5)*.05;
    u.conf.forEach(m=>{const q=(t*m.userData.sp+m.userData.ph)%1;m.position.set(m.userData.x*.9+Math.sin(t*3+m.userData.ph*9)*.05,.75-q*.5,m.userData.z*.9);m.rotation.set(t*4+m.userData.ph,t*3,0);});});
  monoTiles.forEach(g=>{if(!g.parent){monoTiles.delete(g);return;}const u=g.userData;u.glow.material.opacity=.25+.15*Math.sin(t*3);u.pillar.material.opacity=.12+.08*Math.sin(t*2.2);u.pillar.rotation.y=t*.6;u.crown.position.y=1.9+Math.sin(t*2)*.08;
    u.sparks.forEach(sp=>{const q=(t*.35+sp.userData.ph)%1;sp.position.set(Math.cos(sp.userData.a+t)*sp.userData.r,.3+q*2.2,Math.sin(sp.userData.a+t)*sp.userData.r);sp.material.opacity=Math.sin(q*Math.PI);});});
  if(hubFx.globe){hubFx.globe.rotation.y+=dt*.25;hubFx.atmo.scale.setScalar(1+.015*Math.sin(t*1.5));}
  if(hubFx.orbit){hubFx.orbit.rotation.y=t*.9;hubFx.orbit.rotation.z=.5;hubFx.orbiter.rotation.y=-Math.PI/2;}
  hubFx.beacons.forEach((b,k)=>b.material.emissiveIntensity=Math.sin(t*4+k)>0?3:.2);
  hubFx.spinners.forEach(sp=>{sp.obj.rotation.y=t*sp.speed;sp.obj.position.y=sp.y+Math.sin(t*2+sp.phase)*.04;});
}

/* tiles */
const tiles=[];
const labelCache=[];
