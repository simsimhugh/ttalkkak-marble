'use strict';
/* tokens */
const tokens=[];
/* face textures: drawn on the +z side of the head sphere (u=0.25 → canvas x=64 of 256) */
const faceCache={};
function faceTex(emo){
  if(faceCache[emo])return faceCache[emo];
  const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
  g.fillStyle=emo==='angry'?'#ffc9b0':'#ffdcb8';g.fillRect(0,0,256,256);
  const cx=64,ey=108;g.lineCap='round';g.lineJoin='round';
  const eye=(x,open=1,w=13)=>{g.fillStyle='#fff';g.beginPath();g.ellipse(x,ey,w,13*open,0,0,Math.PI*2);g.fill();g.fillStyle='#222';g.beginPath();g.ellipse(x+(emo==='cool'?0:2),ey+1,7,8*open,0,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x+4,ey-3,2.5,0,Math.PI*2);g.fill();};
  const brow=(x,ang,len=16)=>{g.strokeStyle='#5a3a1a';g.lineWidth=5;g.beginPath();g.moveTo(x-len/2*Math.cos(ang),ey-22-len/2*Math.sin(ang));g.lineTo(x+len/2*Math.cos(ang),ey-22+len/2*Math.sin(ang));g.stroke();};
  const blush=()=>{g.fillStyle='rgba(255,120,120,.45)';[cx-28,cx+28].forEach(x=>{g.beginPath();g.ellipse(x,ey+22,10,6,0,0,Math.PI*2);g.fill();});};
  const mouthArc=(open,r,yo=0)=>{g.strokeStyle='#5a2a1a';g.lineWidth=5;g.beginPath();g.arc(cx,ey+28+yo,r,open?.15*Math.PI:1.15*Math.PI,open?.85*Math.PI:1.85*Math.PI);g.stroke();};
  switch(emo){
    case 'happy':eye(cx-20);eye(cx+20);brow(cx-20,-.25);brow(cx+20,.25);g.fillStyle='#7a1f1f';g.beginPath();g.arc(cx,ey+26,15,0,Math.PI);g.fill();g.fillStyle='#fff';g.fillRect(cx-11,ey+26,22,5);blush();break;
    case 'laugh':g.strokeStyle='#222';g.lineWidth=5;[cx-20,cx+20].forEach(x=>{g.beginPath();g.arc(x,ey+4,11,1.1*Math.PI,1.9*Math.PI);g.stroke();});g.fillStyle='#7a1f1f';g.beginPath();g.ellipse(cx,ey+32,19,15,0,0,Math.PI*2);g.fill();g.fillStyle='#ff7b8a';g.beginPath();g.ellipse(cx,ey+40,10,6,0,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.fillRect(cx-15,ey+18,30,6);blush();break;
    case 'sad':eye(cx-20,1,11);eye(cx+20,1,11);brow(cx-20,.45);brow(cx+20,-.45);mouthArc(false,13,6);g.fillStyle='#6cc3ff';g.beginPath();g.ellipse(cx+28,ey+22,4,8,0,0,Math.PI*2);g.fill();break;
    case 'cry':g.strokeStyle='#222';g.lineWidth=5;[cx-20,cx+20].forEach(x=>{g.beginPath();g.arc(x,ey+8,11,1.15*Math.PI,1.85*Math.PI);g.stroke();});brow(cx-20,.5);brow(cx+20,-.5);g.fillStyle='#7a1f1f';g.beginPath();g.ellipse(cx,ey+34,12,9,0,0,Math.PI*2);g.fill();g.fillStyle='#6cc3ff';[cx-24,cx+24].forEach(x=>{g.beginPath();g.ellipse(x,ey+30,5,16,0,0,Math.PI*2);g.fill();});break;
    case 'angry':eye(cx-20,.8);eye(cx+20,.8);brow(cx-20,.6,20);brow(cx+20,-.6,20);g.strokeStyle='#5a2a1a';g.lineWidth=6;g.beginPath();g.moveTo(cx-16,ey+34);g.lineTo(cx-6,ey+28);g.lineTo(cx+4,ey+34);g.lineTo(cx+14,ey+28);g.stroke();g.fillStyle='#ff4d4d';g.beginPath();g.arc(cx+34,ey-30,8,0,Math.PI*2);g.fill();break;
    case 'shock':eye(cx-20,1.25,15);eye(cx+20,1.25,15);brow(cx-20,-.1);brow(cx+20,.1);g.fillStyle='#7a1f1f';g.beginPath();g.ellipse(cx,ey+34,10,14,0,0,Math.PI*2);g.fill();break;
    case 'cool':g.fillStyle='#111';g.beginPath();g.roundRect(cx-38,ey-12,32,22,6);g.fill();g.beginPath();g.roundRect(cx+6,ey-12,32,22,6);g.fill();g.fillRect(cx-8,ey-5,16,4);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(cx-32,ey-8,10,5);g.fillRect(cx+12,ey-8,10,5);g.strokeStyle='#5a2a1a';g.lineWidth=5;g.beginPath();g.moveTo(cx-8,ey+30);g.quadraticCurveTo(cx+10,ey+36,cx+18,ey+24);g.stroke();break;
    default:eye(cx-20);eye(cx+20);brow(cx-20,-.1);brow(cx+20,.1);mouthArc(true,10,-4);
  }
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;faceCache[emo]=tex;return tex;
}
const HATS={explorer:{c:0x8b5a2b,t:'cap'},architect:{c:0xffc107,t:'helmet'},merchant:{c:0x1f1f1f,t:'top'},lucky:{c:0x2e8b57,t:'cap'},negotiator:{c:0x2f4f8f,t:'top'},captain:{c:0xffffff,t:'captain'}};
function hatMesh(ch){
  const h=HATS[ch]||HATS.explorer;const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:h.c,roughness:.6});
  const add=(mesh,y)=>{mesh.position.y=y;mesh.castShadow=true;g.add(mesh);return mesh;};
  if(h.t==='cap'){add(new THREE.Mesh(new THREE.SphereGeometry(.175,20,12,0,Math.PI*2,0,Math.PI/2),m),0);const brim=add(new THREE.Mesh(new THREE.BoxGeometry(.2,.03,.12),m),.01);brim.position.z=.2;}
  else if(h.t==='helmet'){add(new THREE.Mesh(new THREE.SphereGeometry(.19,20,12,0,Math.PI*2,0,Math.PI/2),m),-.02);add(new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.03,20),m),-.02);}
  else if(h.t==='top'){add(new THREE.Mesh(new THREE.CylinderGeometry(.13,.14,.22,20),m),.1);add(new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.03,20),m),0);add(new THREE.Mesh(new THREE.CylinderGeometry(.141,.141,.05,20),new THREE.MeshStandardMaterial({color:0xd8333c})),.03);}
  else{add(new THREE.Mesh(new THREE.CylinderGeometry(.15,.17,.12,20),m),.05);add(new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.03,20),new THREE.MeshStandardMaterial({color:0x111111})),-.01);add(new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.02,20),new THREE.MeshStandardMaterial({color:0x111111})),.03);add(new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),new THREE.MeshStandardMaterial({color:0xffd166,metalness:.8,roughness:.3})),.08).position.z=.14;}
  return g;
}
function buildTokens(){
  tokens.forEach(t=>{scene.remove(t.grp);disposeObj(t.grp);});tokens.length=0;
  G.players.forEach(p=>{
    const grp=new THREE.Group(),fig=new THREE.Group();grp.add(fig);
    const col=new THREE.Color(p.color);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.2,.23,.07,24),new THREE.MeshStandardMaterial({color:col,roughness:.4,metalness:.2}));base.position.y=.035;base.castShadow=true;grp.add(base);
    const bodyM=new THREE.MeshStandardMaterial({color:col,roughness:.5});
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.2,6,16),bodyM);body.position.y=.3;body.castShadow=true;fig.add(body);
    const belt=new THREE.Mesh(new THREE.CylinderGeometry(.135,.135,.04,16),new THREE.MeshStandardMaterial({color:0x222,roughness:.6}));belt.position.y=.27;fig.add(belt);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.17,28,20),new THREE.MeshStandardMaterial({map:faceTex('neutral'),roughness:.75}));head.position.y=.67;head.castShadow=true;fig.add(head);
    const hat=hatMesh(p.ch);hat.position.y=.8;head.add(hat);hat.position.set(0,.13,0);
    const armM=new THREE.MeshStandardMaterial({color:col.clone().lerp(new THREE.Color(0xffffff),.3),roughness:.5});
    const mkArm=(sx)=>{const piv=new THREE.Group();piv.position.set(sx*.15,.42,0);const a=new THREE.Mesh(new THREE.CapsuleGeometry(.04,.15,4,8),armM);a.position.y=-.1;a.castShadow=true;piv.add(a);const hand=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),new THREE.MeshStandardMaterial({color:0xffdcb8}));hand.position.y=-.2;piv.add(hand);piv.rotation.z=sx*.45;fig.add(piv);return piv;};
    const armL=mkArm(1),armR=mkArm(-1);
    const badge=makeSprite(CH(p.ch).emoji,.2);badge.position.set(0,.36,.15);fig.add(badge);
    const bubble=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false}));bubble.scale.set(1.5,.75,1);bubble.position.set(.3,1.35,0);bubble.visible=false;bubble.renderOrder=30;grp.add(bubble);
    const glow=new THREE.Mesh(new THREE.RingGeometry(.25,.33,32),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.9,side:THREE.DoubleSide}));glow.rotation.x=-Math.PI/2;glow.position.y=.075;glow.visible=false;grp.add(glow);
    scene.add(grp);tokens.push({grp,fig,head,armL,armR,bubble,glow,p,emo:null,fallen:false});
  });
}
const EMO_ICON={happy:'😄',laugh:'🤣',sad:'😢',cry:'😭',angry:'😡',shock:'😱',cool:'😎'};
const EMO_LINES={happy:['아싸!','좋아~','오예!','굿!'],laugh:['푸하하!','고마워요~','대박!','잘 먹을게~'],sad:['아…','흑','이런…','아까워'],cry:['으아앙','망했다…','살려줘','왜 나만…'],angry:['뭐야!!','두고 보자','아놔…','이건 복수다'],shock:['헉!','뭐?!','으악!','설마…'],cool:['후훗','이게 나야','여유~','예상대로']};
const EMO_SFX={happy:'happy',laugh:'laugh',sad:'sad',cry:'cry',angry:'angry',shock:'shock',cool:'cool'};
function bubbleTex(icon,text){
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const g=cv.getContext('2d');
  g.fillStyle='#e6e1d6';g.strokeStyle='#2a2f3a';g.lineWidth=10;g.beginPath();g.roundRect(14,14,484,180,46);g.fill();g.stroke();
  g.beginPath();g.moveTo(90,190);g.lineTo(60,246);g.lineTo(140,192);g.closePath();g.fill();g.lineWidth=8;g.beginPath();g.moveTo(90,194);g.lineTo(60,246);g.lineTo(140,192);g.stroke();
  g.fillStyle='#e6e1d6';g.fillRect(92,182,46,16);
  g.textBaseline='middle';g.font='96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';g.textAlign='left';g.fillText(icon,40,104);
  g.fillStyle='#15202b';g.font='bold 70px "Jua","Black Han Sans","Gothic A1",sans-serif';g.textAlign='center';g.fillText(text,310,108,330);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function emote(p,name,text,opt={}){
  const tk=tokens[p.id];if(!tk||!EMO_ICON[name]||(p.bankrupt&&name!=='cry'))return;
  if(tk.emo&&tk.emo.priority>(opt.priority||0)&&performance.now()<tk.emo.t0+tk.emo.ms)return;
  tk.emo={name,t0:performance.now(),ms:opt.ms||(name==='laugh'||name==='cry'?2800:2200),priority:opt.priority||0};
  tk.head.material.map=faceTex(name);tk.head.material.needsUpdate=true;
  const txt=text??EMO_LINES[name][Math.random()*EMO_LINES[name].length|0];
  if(tk.bubble.material.map)tk.bubble.material.map.dispose();tk.bubble.material.map=bubbleTex(EMO_ICON[name],txt);tk.bubble.material.needsUpdate=true;tk.bubble.visible=true;
  if(!opt.silent)SFX.play(EMO_SFX[name]);
  const big=(opt.priority||0)>=4||name==='cry'||name==='laugh'||name==='angry'||name==='shock';
  if(big&&opt.cam!==false&&!cinema&&performance.now()-lastEmoteCam>4000){lastEmoteCam=performance.now();focusAt(tk.grp.position,1500,0.75);}
}
function tokenTick(now){
  tokens.forEach(tk=>{
    const {fig,head,armL,armR}=tk;
    if(tk.p.bankrupt){if(!tk.fallen){tk.fallen=true;fig.rotation.set(0,0,0);tk.bubble.visible=false;tk.grp.traverse(o=>{if(o.material&&o.material.color&&!o.isSprite){o.material=o.material.clone();o.material.color.lerp(new THREE.Color(0x777777),.75);if(o.material.emissive)o.material.emissive.set(0);}});}
      fig.rotation.z=Math.PI/2.3;fig.position.set(.12,-.02,.12);head.rotation.set(0,0,0);return;}
    fig.position.set(0,0,0);fig.rotation.set(0,0,0);fig.scale.setScalar(1);head.rotation.set(0,0,0);armL.rotation.set(0,0,.45);armR.rotation.set(0,0,-.45);
    if(tk.squash){const q=(now-tk.squash)/260;if(q<1){const k=Math.sin(q*Math.PI);fig.scale.set(1+.18*k,1-.22*k,1+.18*k);}else tk.squash=0;}
    // head yaws toward the camera; it tilts its face up only while emoting (eased), otherwise looks straight ahead
    const hp=tk.grp.position,dx=camera.position.x-hp.x,dz=camera.position.z-hp.z,dy=camera.position.y-(hp.y+.67);
    const want=tk.emo?-Math.min(1.05,Math.atan2(dy,Math.hypot(dx,dz))):0;tk.tilt=(tk.tilt||0)+(want-(tk.tilt||0))*0.12;
    const ride=chase===tk.p&&camMode==='follow'&&!REDUCED_MOTION; // while the camera rides behind, the piece looks where it walks
    let yaw=ride?Math.atan2(chaseDir.x,chaseDir.z):Math.atan2(dx,dz);
    if(ride&&tk.look&&now<tk.look.until){const w=yaw,d=Math.atan2(tk.look.pt.x-hp.x,tk.look.pt.z-hp.z)-w;yaw=w+Math.max(-1.7,Math.min(1.7,Math.atan2(Math.sin(d),Math.cos(d))));} // glance at a landmark, no owl turns
    const dy2=Math.atan2(Math.sin(yaw-(tk.yaw??yaw)),Math.cos(yaw-(tk.yaw??yaw)));tk.yaw=(tk.yaw??yaw)+dy2*.2;
    head.rotation.order='YXZ';head.rotation.y=tk.yaw;head.rotation.x=tk.tilt;
    if(!tk.emo)return;
    const u=(now-tk.emo.t0)/tk.emo.ms;
    if(u>=1){tk.emo=null;head.material.map=faceTex('neutral');head.material.needsUpdate=true;tk.bubble.visible=false;return;}
    const t=(now-tk.emo.t0)/1000;
    switch(tk.emo.name){
      case 'happy':fig.position.y=Math.abs(Math.sin(t*9))*.22;armL.rotation.z=2.5+Math.sin(t*14)*.3;armR.rotation.z=-2.5-Math.sin(t*14)*.3;break;
      case 'laugh':fig.rotation.z=Math.sin(t*22)*.1;fig.position.y=Math.abs(Math.sin(t*11))*.08;armL.rotation.z=2.4;armR.rotation.z=-2.4;head.rotation.x+=-.25;break;
      case 'sad':head.rotation.x+=.5;armL.rotation.z=.15;armR.rotation.z=-.15;fig.scale.y=.94;break;
      case 'cry':head.rotation.x+=.5;fig.rotation.z=Math.sin(t*40)*.03;armL.rotation.z=.1;armR.rotation.z=-.1;fig.scale.y=.92;break;
      case 'angry':fig.rotation.y=Math.sin(t*38)*.22;armL.rotation.z=1.9+Math.sin(t*30)*.3;armR.rotation.z=-1.9-Math.sin(t*30)*.3;fig.scale.setScalar(1.08);head.rotation.x+=.15;break;
      case 'shock':fig.position.y=u<.25?(.25-u)*1.6:0;fig.scale.set(1.1,.95+.1*Math.sin(t*20),1.1);armL.rotation.z=2.8;armR.rotation.z=-2.8;head.rotation.x+=-.2;break;
      case 'cool':fig.rotation.y=.4;armL.rotation.z=2.2;armR.rotation.z=-.3;head.rotation.x+=-.12;break;
    }
  });
}
/* while my piece walks, it glances once at the board's most expensive landmark, at the step where it stands most
   in front (the riding camera looks ahead, so that is when the landmark is on screen) */
function glancePlan(p,n){
  const ls=G.ts.map((s,i)=>i).filter(i=>S(i).level===4&&lots[i]&&lots[i].beam);if(!ls.length)return null;
  const i=priciest(ls),pt=new THREE.Vector3();lots[i].grp.getWorldPosition(pt);let k=0,bd=1e9;
  for(let q=0;q<Math.abs(n);q++){const at=(p.pos+Math.sign(n)*(q+1)+N*4)%N,here=slotPos(at,p.id),fwd=slotPos((at+3)%N,p.id).sub(here).setY(0).normalize();
    const d=-fwd.dot(pt.clone().sub(here).setY(0).normalize());if(d<bd){bd=d;k=q;}} // smallest angle between heading and the landmark
  return {i,k,pt};}
function glance(p,g){const tk=tokens[p.id];if(!tk)return;tk.look={pt:g.pt,until:performance.now()+Math.max(800,D(1200))};lots[g.i].flash=performance.now();}
function slotPos(i,pid){
  const r=rect(i),[ox,oz]=nearFirst(i)?[0,-0.02]:outerOffset(i,-(Math.min(r.w,r.d)/2-0.3)),[tx,tz]=tangent(i);
  const k=(pid-1.5)*0.24;
  return new THREE.Vector3(r.x+ox+tx*k,0.225,r.z+oz+tz*k);
}
const nearFirst=i=>SIDE_OF(i)==='b'&&i%8!==0;
function buildingPos(i){const r=rect(i),d=Math.min(r.w,r.d)/2-0.36,[ox,oz]=outerOffset(i,nearFirst(i)?-(r.d/2-0.36):d);return[r.x+ox,r.z+oz];}

/* sync visual state with G */
function sync(){
  if(!G)return;
  TILES.forEach((t,i)=>{
    const s=S(i),tl=tiles[i];
    const key=`${s.owner}|${s.level}|${t.price?toll(i):0}|${G.festival===i}|${s.owner!=null?G.players[s.owner].boost:0}|${s.rubble?1:0}`;
    if(tl.key!==key){
      tl.key=key;
      if(tl.lab.material.map)tl.lab.material.map.dispose();tl.lab.material.map=makeLabel(i);tl.lab.material.needsUpdate=true;
      tl.bgrp.children.forEach(disposeObj);tl.bgrp.clear();
      if(s.owner!=null){
        const o=G.players[s.owner];tl.rim.visible=true;tl.rim.material.color.set(o.color);tl.rim.material.emissive.set(o.color).multiplyScalar(.35);
        tl.frame.visible=true;tl.frameCol=o.color;tl.frame.userData.mat.color.set(o.color);tl.frame.userData.mat.emissive.set(o.color).multiplyScalar(.3);
        if(t.type==='city'&&s.level>0){s.rubble=false;const b=buildingMesh(s.level,o.color,t.name);const[bx,bz]=buildingPos(i);b.position.set(bx-tl.grp.position.x,0.22,bz-tl.grp.position.z);tl.bgrp.add(b);
          if(tl.level!=null&&s.level>tl.level&&!G.over)riseFx(b,s.level===4,new THREE.Vector3(bx,0.22,bz));}
        if(t.type==='tour'){const f=makeSprite('🎫',.42);const[bx,bz]=buildingPos(i);f.position.set(bx-tl.grp.position.x,.5,bz-tl.grp.position.z);tl.bgrp.add(f);}
      }else{tl.rim.visible=false;tl.frame.visible=false;tl.frameCol=null;}
      if(s.rubble&&s.level===0&&t.type==='city'){const r=rubbleMesh();const[bx,bz]=buildingPos(i);r.position.set(bx-tl.grp.position.x,0.22,bz-tl.grp.position.z);tl.bgrp.add(r);}
      tl.fest.visible=false;tl.level=s.level;lotSync(i,s,t);
      if(G.festival===i&&!tl.festFx){tl.festFx=festFx(i);tl.grp.add(tl.festFx);}
      else if(G.festival!==i&&tl.festFx){tl.grp.remove(tl.festFx);disposeObj(tl.festFx);festTiles.delete(tl.festFx);tl.festFx=null;}
    }
    // monopoly aura (checked every sync: depends on the whole group, not just this tile)
    const mono=t.type==='city'&&s.owner!=null&&ownsGroup(s.owner,t.g);
    if(mono&&!tl.mono){tl.mono=monoFx(i,G.players[s.owner].color);tl.grp.add(tl.mono);}
    else if(!mono&&tl.mono){tl.grp.remove(tl.mono);disposeObj(tl.mono);tl.mono=null;}
    else if(mono&&tl.mono&&tl.mono.userData.color!==G.players[s.owner].color){tl.grp.remove(tl.mono);disposeObj(tl.mono);tl.mono=monoFx(i,G.players[s.owner].color);tl.grp.add(tl.mono);}
  });
  hubFestival(G.festival);
  tokens.forEach(tk=>{
    const p=tk.p;tk.grp.visible=true;
    if(!p.anim)tk.grp.position.copy(p.island>0&&p.pos===8?islandSlot(p.id):slotPos(p.pos,p.id));
    tk.glow.visible=G.players[G.cur]===p&&!G.over;
  });
}
/* animation system */
const tweens=[],effects=[];
function tween(obj,from,to,ms,arc=0.5){
  return new Promise(res=>tweens.push({obj,from:from.clone(),to:to.clone(),ms,arc,t0:performance.now(),res}));
}
async function hop(p,to,ms,arc=0.45){
  const tk=tokens[p.id];p.anim=true;SFX.play(arc>1?'travel':'hop');
  await tween(tk.grp.position,tk.grp.position,slotPos(to,p.id),ms,arc);
  p.anim=false;tk.squash=performance.now();landDust(tk.grp.position,arc>1?10:4,arc>1?1.3:.7);
}
/* a building grows out of the ground with dust; landmarks burst gold */
function riseFx(b,landmark,pos){
  b.scale.y=0.02;SFX.play(landmark?'landmark':'build');landDust(pos,10,1.1);
  effects.push({t0:performance.now(),ms:landmark?1100:750,type:'fn',fn:u=>{const o=1+Math.sin(u*Math.PI)*.18;b.scale.y=Math.max(.02,Math.min(1,u*1.25))*o;b.scale.x=b.scale.z=1+Math.sin(u*Math.PI)*.08;},done:()=>{b.scale.set(1,1,1);}});
  if(landmark){const ring=new THREE.Mesh(new THREE.RingGeometry(.2,.3,40),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.95,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.copy(pos).setY(.24);scene.add(ring);
    const spark=[];for(let k=0;k<30;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(.05,6,6),new THREE.MeshBasicMaterial({color:k%2?0xffd166:0xffffff,transparent:true}));m.position.copy(pos);m.userData.v=new THREE.Vector3((Math.random()-.5)*2.5,2+Math.random()*3,(Math.random()-.5)*2.5);scene.add(m);spark.push(m);}
    effects.push({t0:performance.now(),ms:1600,type:'fn',fn:u=>{ring.scale.setScalar(1+u*9);ring.material.opacity=.95*(1-u);spark.forEach(m=>{m.position.addScaledVector(m.userData.v,.016);m.userData.v.y-=.1;m.material.opacity=1-u;});},done:()=>{scene.remove(ring);ring.geometry.dispose();ring.material.dispose();spark.forEach(m=>{scene.remove(m);m.geometry.dispose();m.material.dispose();});}});}
}
/* 🛡️ a glowing dome bursts around a token when 방어권 blocks an attack */
function shieldFx(p,hex=0x8fd3ff){
  const pos=tokenPos(p),mat=new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.5,32,16,0,Math.PI*2,0,Math.PI/2),mat);dome.position.copy(pos);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.04,8,48),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false}));ring.rotation.x=Math.PI/2;ring.position.copy(pos);
  scene.add(dome,ring);
  effects.push({t0:performance.now(),ms:1800,type:'fn',fn:u=>{const k=.4+Math.min(1,u*3)*1.2;dome.scale.setScalar(k);ring.scale.setScalar(k);mat.opacity=(.55+.2*Math.sin(u*28))*(1-u);ring.material.opacity=.9*(1-u);},
    done:()=>{scene.remove(dome,ring);disposeObj(dome);disposeObj(ring);}});
}
function landDust(pos,n=5,scale=1){
  const ring=new THREE.Mesh(new THREE.RingGeometry(.12,.2,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.copy(pos).setY(pos.y+.01);scene.add(ring);
  const puffs=[];for(let k=0;k<n;k++){const d=new THREE.Mesh(new THREE.SphereGeometry(.07*scale,6,6),new THREE.MeshBasicMaterial({color:0xe8dcc8,transparent:true,opacity:.7}));d.position.copy(pos);d.userData.v=new THREE.Vector3((Math.random()-.5)*1.6,.3+Math.random()*.5,(Math.random()-.5)*1.6).multiplyScalar(scale);scene.add(d);puffs.push(d);}
  effects.push({t0:performance.now(),ms:600,type:'fn',fn:u=>{ring.scale.setScalar(1+u*3*scale);ring.material.opacity=.7*(1-u);puffs.forEach(d=>{d.position.addScaledVector(d.userData.v,.016);d.scale.setScalar(1+u*2);d.material.opacity=.7*(1-u);});},done:()=>{scene.remove(ring);ring.geometry.dispose();ring.material.dispose();puffs.forEach(d=>{scene.remove(d);d.geometry.dispose();d.material.dispose();});}});
}
function shake(amount=0.25,ms=500){effects.push({t0:performance.now(),ms,amount,type:'shake'});}
function explosion(i,rng){
  const r=rect(i);const grp=new THREE.Group();grp.position.set(r.x,0.3,r.z);scene.add(grp);
  const fire=new THREE.Mesh(new THREE.SphereGeometry(.4,20,20),new THREE.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:.95}));grp.add(fire);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.25,.45,1,16),new THREE.MeshBasicMaterial({color:0xff7b2a,transparent:true,opacity:.8}));stem.position.y=.5;grp.add(stem);
  const wave=new THREE.Mesh(new THREE.RingGeometry(.3,.5,48),new THREE.MeshBasicMaterial({color:0xfff2a8,transparent:true,opacity:.9,side:THREE.DoubleSide}));wave.rotation.x=-Math.PI/2;wave.position.y=-0.05;grp.add(wave);
  const parts=[];for(let k=0;k<70;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color:[0xff5533,0xffaa33,0xffe066,0x553322][k%4]}));m.position.set(0,.2,0);m.userData.v=new THREE.Vector3((Math.random()-.5)*6,Math.random()*6+2,(Math.random()-.5)*6);grp.add(m);parts.push(m);}
  const light=new THREE.PointLight(0xffaa55,0,12);light.position.y=1;grp.add(light);
  const span=rng+0.8;
  effects.push({t0:performance.now(),ms:1500,type:'fn',fn:(k)=>{
    fire.scale.setScalar(1+k*3);fire.position.y=k*2.2;fire.material.opacity=1-k;
    stem.scale.set(1+k*1.5,1+k*2.5,1+k*1.5);stem.material.opacity=.8*(1-k);
    wave.scale.setScalar(1+k*span*2.2);wave.material.opacity=.9*(1-k);
    light.intensity=30*(1-k);
    parts.forEach(m=>{m.position.addScaledVector(m.userData.v,0.016);m.userData.v.y-=0.25;m.rotation.x+=.2;m.rotation.z+=.15;if(m.position.y<-.3)m.position.y=-.3;});
  },done:()=>{scene.remove(grp);disposeObj(grp);}});
}
/* ---- SMASH-style nuke cinematic: chase-cam on the falling bomb, flash, mushroom cloud, collapsing buildings ---- */
let cinema=null;
/* the bomb's look follows its blast range: round fused bomb (1), striped missile (2), parachuted warhead (3) */
function bombMesh(rng){
  const g=new THREE.Group();const met=(c,m=.5,r=.35)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});
  if(rng<=1){
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.34,20,16),met(0x22272e)));
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.12,12),met(0x8a8f96,.7,.3));cap.position.y=.36;g.add(cap);
    const fuse=new THREE.Mesh(new THREE.TorusGeometry(.12,.02,8,16,Math.PI),M(0xb08a5a));fuse.position.set(.1,.46,0);g.add(fuse);
    const spark=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),new THREE.MeshStandardMaterial({color:0xfff0a0,emissive:0xffaa00,emissiveIntensity:4}));spark.position.set(.22,.5,0);g.add(spark);g.userData.spark=spark;
    const hl=new THREE.Mesh(new THREE.SphereGeometry(.08,8,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35}));hl.position.set(-.14,.16,.2);g.add(hl);
  }else if(rng===2){
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.14,.17,.9,16),met(0xe8e8e8,.4)));
    const nose=new THREE.Mesh(new THREE.ConeGeometry(.17,.45,16),met(0xd8333c,.3,.5));nose.position.y=-.67;nose.rotation.x=Math.PI;g.add(nose);
    [-.1,.15].forEach(y=>{const st=new THREE.Mesh(new THREE.CylinderGeometry(.175,.175,.08,16),M(0xd8333c));st.position.y=y;g.add(st);});
    for(let k=0;k<4;k++){const fin=new THREE.Mesh(new THREE.BoxGeometry(.03,.32,.24),M(0x3b4651));fin.position.set(Math.cos(k*Math.PI/2)*.19,.42,Math.sin(k*Math.PI/2)*.19);fin.rotation.y=-k*Math.PI/2;g.add(fin);}
    const jet=new THREE.Mesh(new THREE.ConeGeometry(.1,.45,10),new THREE.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:.85}));jet.position.y=.66;g.add(jet);g.userData.jet=jet;
  }else{
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.3,.34,1.0,20),met(0x6b7280,.6)));
    const nose=new THREE.Mesh(new THREE.SphereGeometry(.34,20,14,0,Math.PI*2,Math.PI/2,Math.PI/2),met(0x6b7280,.6));nose.position.y=-.5;g.add(nose);
    const hz=new THREE.Mesh(new THREE.CylinderGeometry(.345,.345,.22,20),new THREE.MeshStandardMaterial({map:stripeTex('#111111','#ffd400',12),roughness:.6}));hz.position.y=.2;g.add(hz);
    const rad=textPlane('☢',.5,.5,'#ffd400',null,'bold 300px sans-serif');rad.position.set(0,-.1,.35);g.add(rad);
    for(let k=0;k<4;k++){const fin=new THREE.Mesh(new THREE.BoxGeometry(.04,.36,.3),M(0x3b4651));fin.position.set(Math.cos(k*Math.PI/2)*.33,.42,Math.sin(k*Math.PI/2)*.33);fin.rotation.y=-k*Math.PI/2;g.add(fin);}
    const chute=new THREE.Mesh(new THREE.SphereGeometry(1.1,20,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({map:stripeTex('#d8333c','#ffffff',10),side:THREE.DoubleSide,roughness:.9}));chute.position.y=2.6;g.add(chute);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;const line=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,2.2,4),new THREE.MeshBasicMaterial({color:0xeeeeee}));line.position.set(Math.cos(a)*.5,1.5,Math.sin(a)*.5);line.rotation.z=Math.cos(a)*.4;line.rotation.x=-Math.sin(a)*.4;g.add(line);}
    g.userData.chute=chute;
  }
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;
}
function nukeCinematic(i,rng,hits){
  const r=rect(i);const target=new THREE.Vector3(r.x,0.25,r.z);
  const bomb=bombMesh(rng);
  const start=target.clone().add(new THREE.Vector3(-1.2,rng>=3?18:16,2.5));bomb.position.copy(start);scene.add(bomb);
  const puffs=[];const puffM=new THREE.MeshBasicMaterial({color:0xdde6ee,transparent:true,opacity:.5});
  cinema={pos:bomb.position,off:new THREE.Vector3(2.4+rng*.3,1.4,2.8+rng*.3)};freeUntil=0;focusOverride=null;
  SFX.play('siren');
  const FALL=rng>=3?3400:rng===2?2200:1800;
  // the tiles inside the blast radius (owned or not) get a red zone marker on landing
  const zone=[i];for(let o=1;o<=rng;o++){zone.push((i+o)%N,(i-o+N)%N);}
  return new Promise(res=>{
    effects.push({t0:performance.now(),ms:FALL,type:'fn',fn:u=>{
      const e=rng>=3?u:u*u;bomb.position.lerpVectors(start,target,e);
      if(rng>=3){bomb.rotation.z=Math.sin(u*5)*.12;bomb.rotation.x=Math.cos(u*4)*.1;if(u>.92)bomb.userData.chute.scale.setScalar(Math.max(.05,1-(u-.92)*12));}
      else if(rng===2){bomb.rotation.z=Math.sin(u*9)*.08;bomb.rotation.x=.25*(1-u);bomb.userData.jet.scale.set(1,.7+Math.random()*.6,1);}
      else{bomb.rotation.z=u*9;bomb.rotation.x=u*5;bomb.userData.spark.material.emissiveIntensity=2+3*Math.random();}
      if(rng===2&&Math.random()<.6){const p=new THREE.Mesh(new THREE.SphereGeometry(.08+Math.random()*.08,6,6),puffM);p.position.copy(bomb.position).add(new THREE.Vector3((Math.random()-.5)*.2,.6,(Math.random()-.5)*.2));scene.add(p);puffs.push(p);}
      puffs.forEach(p=>{p.scale.multiplyScalar(1.02);p.position.y+=.004;});
      cinema.off.set(2.4+rng*.3-u*.8,1.4+u*.6,2.8+rng*.3-u*.6);
    },done:()=>{
      scene.remove(bomb);disposeObj(bomb);puffs.forEach(p=>{scene.remove(p);p.geometry.dispose();});puffM.dispose();
      // impact
      SFX.play('nuke');flash();shake(0.5+rng*.1,1200+rng*200);
      mushroom(target,rng);
      // blast zone drawn tile by tile, hit tiles brighter
      const marks=zone.map(j=>{const rr=rect(j);const hit=hits.includes(j)&&tiles[j].bgrp.children.length>0;const m=new THREE.Mesh(new THREE.PlaneGeometry(rr.w-.06,rr.d-.06),new THREE.MeshBasicMaterial({color:hit?0xff3020:0xff7a3a,transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(rr.x,0.236,rr.z);scene.add(m);return{m,hit};});
      const edge=new THREE.Mesh(new THREE.RingGeometry(.3,.45,48),new THREE.MeshBasicMaterial({color:0xff3020,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));edge.rotation.x=-Math.PI/2;edge.position.copy(target).setY(.24);scene.add(edge);
      setTimeout(()=>{SFX.play('alarm');toast(`폭발 범위 ${rng}칸 — 건물 ${hits.filter(j=>tiles[j].bgrp.children.length).length}곳이 동시에 무너집니다`,'danger',4000);},300);
      // everything inside falls at the same moment
      const victims=hits.filter(j=>tiles[j].bgrp.children.length);const HOLD=1400,FALLALL=3600,OUT=2000;
      victims.forEach(j=>collapseFx(j,HOLD));
      // camera frames the whole zone
      const c=new THREE.Vector3();zone.forEach(j=>{const rr=rect(j);c.x+=rr.x;c.z+=rr.z;});c.multiplyScalar(1/zone.length);c.y=.3;
      const ext=zone.reduce((m,j)=>{const rr=rect(j);return Math.max(m,Math.hypot(rr.x-c.x,rr.z-c.z));},1);
      const camPos=target.clone();cinema={pos:camPos,off:new THREE.Vector3(3.2,2.4,4.2)};const zoneOff=new THREE.Vector3(1.2+ext*.75,1.4+ext*.6,1.8+ext*.85);
      const total=HOLD+FALLALL+OUT;
      effects.push({t0:performance.now(),ms:total,type:'fn',fn:u=>{const ms=u*total;
        const pulse=.35+.3*Math.sin(ms/90);
        if(ms<HOLD){marks.forEach(mk=>mk.m.material.opacity=Math.min(1,ms/300)*(mk.hit?pulse+.2:pulse*.7));edge.scale.setScalar(1+(ms/HOLD)*ext*2.4);edge.material.opacity=.9*(1-ms/HOLD);camPos.lerp(c,0.08);cinema.off.lerp(zoneOff,0.08);}
        else if(ms<HOLD+FALLALL){const q=(ms-HOLD)/FALLALL;marks.forEach(mk=>mk.m.material.opacity=(mk.hit?.5:.3)*(1-q));camPos.lerp(c,0.05);cinema.off.lerp(zoneOff,0.05);}
        else{const q=(ms-HOLD-FALLALL)/OUT;marks.forEach(mk=>mk.m.material.opacity=0);camPos.lerp(target,0.05);cinema.off.lerp(new THREE.Vector3(3.2+q*2.5,2.4+q*2.6,4.2+q*3.2),0.08);}
      },done:()=>{marks.forEach(mk=>{scene.remove(mk.m);mk.m.geometry.dispose();mk.m.material.dispose();});scene.remove(edge);edge.geometry.dispose();edge.material.dispose();cinema=null;res();}});
    }});
  });
}
function flash(){const f=$('#flash');f.classList.remove('on');void f.offsetWidth;f.classList.add('on');}
/* a building crumbles: it tilts and sinks while chunks in its colors fly out and dust billows */
function collapseFx(j,delay=0){const tl=tiles[j],b=tl.bgrp.children[0];lotCollapse(j,delay);if(b)collapseMesh(b,delay,1);}
function collapseMesh(b,delay=0,sc=1){
  const wp=new THREE.Vector3();b.getWorldPosition(wp);
  const cols=[];b.traverse(o=>{if(o.isMesh&&o.material&&o.material.color)cols.push(o.material.color.getHex());});
  const grp=new THREE.Group();grp.position.copy(wp);scene.add(grp);
  const H=b.children.reduce((m,o)=>Math.max(m,o.position.y),.4)*sc,y0=b.position.y,s0=b.scale.x||1;
  // chunks are released in waves as the floors give way
  const chunks=[];for(let k=0;k<30;k++){const sz=(.04+Math.random()*.09)*sc;const m=new THREE.Mesh(new THREE.BoxGeometry(sz,sz*(.6+Math.random()),sz),new THREE.MeshStandardMaterial({color:cols[k%cols.length]||0x888888,roughness:.9}));m.visible=false;m.userData.release=.18+Math.random()*.55;m.userData.v=new THREE.Vector3((Math.random()-.5)*2.4,.6+Math.random()*2.2,(Math.random()-.5)*2.4).multiplyScalar(1+(sc-1)*.6);m.userData.r=new THREE.Vector3(Math.random()*8,Math.random()*8,Math.random()*8);m.castShadow=true;grp.add(m);chunks.push(m);}
  const dust=[];for(let k=0;k<12;k++){const d=new THREE.Mesh(new THREE.SphereGeometry(.12*sc,10,8),new THREE.MeshBasicMaterial({color:0x9a8f84,transparent:true,opacity:0}));d.position.set((Math.random()-.5)*.4*sc,.06,(Math.random()-.5)*.4*sc);d.userData.v=new THREE.Vector3((Math.random()-.5)*.9,.25+Math.random()*.4,(Math.random()-.5)*.9);d.userData.start=.15+Math.random()*.5;grp.add(d);dust.push(d);}
  const crack=new THREE.Mesh(new THREE.RingGeometry(.1*sc,.3*sc,24),new THREE.MeshBasicMaterial({color:0x1a1512,transparent:true,opacity:0,side:THREE.DoubleSide}));crack.rotation.x=-Math.PI/2;crack.position.y=.005;grp.add(crack);
  const rz=(Math.random()-.5)*1.2,rx=(Math.random()-.5)*1.2;let played=0;
  effects.push({t0:performance.now()+delay,ms:3400,type:'fn',fn:u=>{
    // phase 1 (0–.18): tremor and cracking; phase 2 (.18–.78): floors drop in three jolts with a lean; phase 3: dust lingers
    if(u<.18){const k=u/.18;b.rotation.z=Math.sin(u*160)*.04*k;b.rotation.x=Math.sin(u*130)*.03*k;crack.material.opacity=k*.7;crack.scale.setScalar(1+k*1.5);if(!played){played=1;if(sc===1)SFX.play('rumble');}}
    else{const c=Math.min(1,(u-.18)/.6);const step=Math.floor(c*3)/3,frac=(c*3)%1;const drop=step+Math.min(1,frac*1.6)/3;
      b.scale.y=s0*Math.max(.03,1-drop*.97);b.rotation.z=rz*drop+Math.sin(u*90)*.02*(1-c);b.rotation.x=rx*drop;b.position.y=y0-drop*.14*sc;
      if(played<2&&c>.02){played=2;if(sc===1)SFX.play('crash');}if(played<3&&c>.36){played=3;if(sc===1)SFX.play('crash');}if(played<4&&c>.7){played=4;if(sc===1)SFX.play('crash');}}
    chunks.forEach(m=>{if(!m.visible){if(u>=m.userData.release){m.visible=true;m.position.set((Math.random()-.5)*.3*sc,H*(1-Math.min(1,(u-.18)/.6))*.9+.05,(Math.random()-.5)*.3*sc);}return;}m.position.addScaledVector(m.userData.v,.016);m.userData.v.y-=.16;m.rotation.x+=m.userData.r.x*.016;m.rotation.y+=m.userData.r.y*.016;if(m.position.y<.03){m.position.y=.03;m.userData.v.multiplyScalar(.25);m.userData.v.y=0;}});
    dust.forEach(d=>{if(u<d.userData.start)return;const q=(u-d.userData.start)/(1-d.userData.start);d.position.addScaledVector(d.userData.v,.012);d.scale.setScalar(1+q*5);d.material.opacity=.7*Math.sin(Math.min(1,q)*Math.PI);});
    if(u>.8)crack.material.opacity=.7*(1-(u-.8)/.2);
  },done:()=>{scene.remove(grp);disposeObj(grp);}});
}
/* rubble pile left on a bombed tile until something is built again */
function rubbleMesh(){
  const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x555049,roughness:1}),m2=new THREE.MeshStandardMaterial({color:0x3a3632,roughness:1});
  for(let k=0;k<9;k++){const sz=.06+Math.random()*.09;const c=new THREE.Mesh(new THREE.BoxGeometry(sz,sz*.6,sz),k%3?m:m2);c.position.set((Math.random()-.5)*.34,sz*.3,(Math.random()-.5)*.34);c.rotation.set(Math.random()*.6,Math.random()*3,Math.random()*.6);c.castShadow=true;g.add(c);}
  const scorch=new THREE.Mesh(new THREE.CircleGeometry(.26,20),new THREE.MeshBasicMaterial({color:0x1a1715,transparent:true,opacity:.55}));scorch.rotation.x=-Math.PI/2;scorch.position.y=.004;g.add(scorch);
  return g;
}
function mushroom(c,rng){
  const grp=new THREE.Group();grp.position.copy(c);scene.add(grp);
  const fireM=new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:1});
  const fire=new THREE.Mesh(new THREE.SphereGeometry(.5,24,20),fireM);grp.add(fire);
  const capM=new THREE.MeshStandardMaterial({color:0x5b5048,emissive:0xff6a1a,emissiveIntensity:1.6,roughness:1,transparent:true,opacity:.95});
  const cap=new THREE.Mesh(new THREE.SphereGeometry(1,28,22),capM);cap.scale.set(1,.75,1);cap.position.y=.2;grp.add(cap);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.45,.75,1,20,1,true),new THREE.MeshStandardMaterial({color:0x6a5d55,emissive:0xff4a00,emissiveIntensity:.9,roughness:1,transparent:true,opacity:.9,side:THREE.DoubleSide}));stem.position.y=.5;grp.add(stem);
  const torus=new THREE.Mesh(new THREE.TorusGeometry(1.2,.35,14,40),new THREE.MeshStandardMaterial({color:0x8a7a70,emissive:0xff8030,emissiveIntensity:.6,transparent:true,opacity:.85,roughness:1}));torus.rotation.x=Math.PI/2;grp.add(torus);
  const wave=new THREE.Mesh(new THREE.RingGeometry(.4,.75,64),new THREE.MeshBasicMaterial({color:0xfff6c8,transparent:true,opacity:.95,side:THREE.DoubleSide}));wave.rotation.x=-Math.PI/2;wave.position.y=.02;grp.add(wave);
  const wave2=wave.clone();wave2.material=wave.material.clone();grp.add(wave2);
  const light=new THREE.PointLight(0xffb060,0,22,1.2);light.position.y=1.5;grp.add(light);
  const parts=[];for(let k=0;k<160;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.07+Math.random()*.08,.07,.07),new THREE.MeshBasicMaterial({color:[0xff5533,0xffaa33,0xffe066,0x4a3a30,0x222][k%5]}));m.position.set(0,.3,0);
    const a=Math.random()*Math.PI*2,sp=2+Math.random()*6;m.userData.v=new THREE.Vector3(Math.cos(a)*sp,Math.random()*9+3,Math.sin(a)*sp);grp.add(m);parts.push(m);}
  const span=(rng+1)*1.35;
  effects.push({t0:performance.now(),ms:4200,type:'fn',fn:u=>{
    const f=Math.min(1,u*4);fire.scale.setScalar(.5+f*4);fireM.opacity=Math.max(0,1-u*2.2);
    const rise=Math.min(1,u*1.4);cap.position.y=.2+rise*4.2;cap.scale.setScalar(.6+rise*2.6);cap.scale.y=(.6+rise*2.6)*.75;capM.emissiveIntensity=1.6*(1-u);capM.opacity=.95*(1-Math.max(0,u-.7)/.3);
    stem.scale.set(1+rise*1.4,1+rise*4,1+rise*1.4);stem.material.emissiveIntensity=.9*(1-u);stem.material.opacity=.9*(1-Math.max(0,u-.7)/.3);
    torus.position.y=.2+rise*3.6;torus.scale.setScalar(.6+rise*2.1);torus.rotation.z=u*2;torus.material.opacity=.85*(1-Math.max(0,u-.6)/.4);
    const w=Math.min(1,u*2.2);wave.scale.setScalar(1+w*span*2.6);wave.material.opacity=.95*(1-w);
    const w2=Math.min(1,Math.max(0,u-.15)*1.6);wave2.scale.setScalar(1+w2*span*4.5);wave2.material.opacity=.6*(1-w2);
    light.intensity=60*Math.max(0,1-u*1.6);
    parts.forEach(m=>{m.position.addScaledVector(m.userData.v,0.016);m.userData.v.y-=0.32;m.rotation.x+=.25;m.rotation.z+=.2;if(m.position.y<-.2){m.position.y=-.2;m.userData.v.set(0,0,0);}});
  },done:()=>{scene.remove(grp);disposeObj(grp);}});
}

/* =================== EXILE BY BOAT =================== */
function islandSlot(pid){const c=env.prison.pos;const o=[[-.35,.25],[.3,.3],[-.1,-.25],[.45,-.2]][pid%4];return new THREE.Vector3(c.x+o[0],0.05,c.z+o[1]);}
function makeBoat(kind){
  const g=new THREE.Group();const add=(m,x,y,z)=>{m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
  if(kind==='row'){add(new THREE.Mesh(new THREE.BoxGeometry(1.1,.22,.55),M(0x8b5a2b)),0,.1,0);add(new THREE.Mesh(new THREE.BoxGeometry(.9,.06,.4),M(0xc9a26b)),0,.2,0);
    const oars=[];[-1,1].forEach(s=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.9,6),M(0xd9b77a));o.position.set(0,.25,s*.35);o.rotation.x=s*.9;g.add(o);oars.push(o);});g.userData.oars=oars;}
  else if(kind==='speed'){add(new THREE.Mesh(new THREE.BoxGeometry(1.3,.22,.5),M(0xf4f4f4,{roughness:.3,metalness:.2})),0,.1,0);add(new THREE.Mesh(new THREE.ConeGeometry(.25,.6,4),M(0xf4f4f4)),.9,.1,0).rotation.z=-Math.PI/2;add(new THREE.Mesh(new THREE.BoxGeometry(1.32,.06,.52),M(0x2f7fe0)),0,.05,0);
    const ws=add(new THREE.Mesh(new THREE.PlaneGeometry(.4,.22),new THREE.MeshStandardMaterial({color:0x8fd3ff,transparent:true,opacity:.6,side:THREE.DoubleSide})),.25,.33,0);ws.rotation.y=Math.PI/2;ws.rotation.x=-.3;add(new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.3),M(0x222)),-.5,.3,0);}
  else if(kind==='taxi'){add(new THREE.Mesh(new THREE.BoxGeometry(1.2,.24,.55),M(0xffd400,{roughness:.5})),0,.1,0);add(new THREE.Mesh(new THREE.BoxGeometry(.7,.3,.5),M(0xffd400)),-.1,.37,0);add(new THREE.Mesh(new THREE.BoxGeometry(.8,.05,.6),M(0x222)),-.1,.55,0);
    const cb=new THREE.Mesh(new THREE.BoxGeometry(.28,.1,.14),M(0xffffff,{emissive:0xffffff,emissiveIntensity:.4}));cb.position.set(-.1,.62,0);g.add(cb);const sign=textPlane('₩',.5,.3,'#3a2400','#ffd400','bold 160px sans-serif');sign.position.set(.0,.5,.33);g.add(sign);}
  else{add(new THREE.Mesh(new THREE.BoxGeometry(1.3,.26,.6),M(0xff6a1a,{roughness:.5})),0,.12,0);add(new THREE.Mesh(new THREE.BoxGeometry(.6,.34,.5),M(0xffffff)),-.15,.4,0);
    const cross=textPlane('✚',.3,.3,'#ff2020',null,'bold 200px sans-serif');cross.position.set(-.15,.42,.26);g.add(cross);const lt=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),M(0xff4040,{emissive:0xff2020,emissiveIntensity:3}));lt.position.set(-.15,.65,0);g.add(lt);g.userData.light=lt;}
  g.position.y=-0.35;return g;
}
function splash(pos,n=8,scale=1){
  for(let k=0;k<n;k++){const d=new THREE.Mesh(new THREE.SphereGeometry(.05*scale,6,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9}));d.position.copy(pos);d.userData.v=new THREE.Vector3((Math.random()-.5)*2.2,1.2+Math.random()*1.6,(Math.random()-.5)*2.2).multiplyScalar(scale);scene.add(d);
    effects.push({t0:performance.now(),ms:700,type:'fn',fn:u=>{d.position.addScaledVector(d.userData.v,.016);d.userData.v.y-=.12;d.material.opacity=.9*(1-u);},done:()=>{scene.remove(d);d.geometry.dispose();d.material.dispose();}});}
}
/* move a token by boat between two sea points; the token rides on deck, then hops onto the destination slot */
async function sail(p,from,to,kind,ms,dest){
  const tk=tokens[p.id];const boat=makeBoat(kind);boat.position.copy(from);scene.add(boat);
  const dir=to.clone().sub(from);boat.rotation.y=Math.atan2(dir.x,dir.z)-Math.PI/2+(dir.x<0?Math.PI:0);
  cinema={pos:boat.position,off:new THREE.Vector3(5.2,4.6,6.4)};freeUntil=0;
  p.anim=true;SFX.play('hop');
  await tween(tk.grp.position,tk.grp.position,from.clone().add(new THREE.Vector3(0,.26,0)),420,.7);
  splash(from,6,.8);if(kind==='speed')SFX.play('speed');else if(kind==='row')SFX.play('row');else SFX.play(kind==='taxi'?'taxi':'motor');
  await new Promise(res=>{const t0=performance.now();let last=0;effects.push({t0,ms,type:'fn',fn:u=>{
    const e=kind==='speed'?u*u:(u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2);boat.position.lerpVectors(from,to,e);boat.position.y=-0.35+Math.sin(u*Math.PI*4)*.03;boat.rotation.z=Math.sin(u*14)*.05;
    tk.grp.position.copy(boat.position).add(new THREE.Vector3(0,.26,0));
    if(boat.userData.oars)boat.userData.oars.forEach((o,k)=>o.rotation.y=Math.sin(u*Math.PI*8+k)*.6);
    if(boat.userData.light)boat.userData.light.material.emissiveIntensity=2+2*Math.sin(u*40);
    if(performance.now()-last>(kind==='speed'?45:140)){last=performance.now();splash(boat.position.clone().sub(dir.clone().normalize().multiplyScalar(.6)),kind==='speed'?4:2,kind==='speed'?1.1:.6);}
  },done:res});});
  await tween(tk.grp.position,tk.grp.position,dest,420,.7);p.anim=false;
  effects.push({t0:performance.now(),ms:900,type:'fn',fn:u=>{boat.position.add(dir.clone().normalize().multiplyScalar(.03));boat.traverse(o=>{if(o.material&&o.material.opacity!=null){o.material.transparent=true;o.material.opacity=1-u;}});},done:()=>{scene.remove(boat);disposeObj(boat);}});
  cinema=null;sync();
}
async function sailToIsland(p){
  if(p.island<=0)return;toast(`${nm(p)} 무인도로 호송됩니다 (${p.island}턴)`,'danger',4000);SFX.play('exile');
  await sail(p,env.shore.clone(),env.islandEdge.clone(),'row',D(2400),islandSlot(p.id));
  emote(p,'cry','여기서 어떻게 나가…',{silent:true});
}
async function sailBack(p,kind){
  const label=kind==='speed'?'더블. 쾌속정으로 탈출':kind==='taxi'?'요금 보트로 탈출':'구조선이 데리러 왔어요';
  toast(`${label} — ${nm(p)}`,'good',4000);
  if(kind==='taxi'){coinFly(islandSlot(p.id),env.islandEdge.clone().add(new THREE.Vector3(0,.3,0)),5);await sleep(D(500));}
  if(kind==='speed'){flash();SFX.play('dbl');}else if(kind==='rescue'){SFX.play('horn');await sleep(D(600));}
  await sail(p,env.islandEdge.clone(),env.shore.clone(),kind,kind==='speed'?D(1100):kind==='taxi'?D(1700):D(2000),slotPos(8,p.id));
  emote(p,kind==='speed'?'laugh':'happy',kind==='speed'?'자유다!':'휴~',{silent:true});
}

/* picking */
const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();let hover=-1,pickable=null,down=null;
function canvasPoint(ev){
  const rot=$('#rot'),cv=renderer.domElement;
  if(rot.classList.contains('rotated')){const m=new DOMMatrix(getComputedStyle(rot).transform).inverse();const p=m.transformPoint(new DOMPoint(ev.clientX,ev.clientY));return{x:p.x-stage.offsetLeft-cv.offsetLeft,y:p.y-stage.offsetTop-cv.offsetTop,w:cv.clientWidth,h:cv.clientHeight};}
  const b=cv.getBoundingClientRect();return{x:ev.clientX-b.left,y:ev.clientY-b.top,w:b.width,h:b.height};
}
function tileAt(ev){
  const b=canvasPoint(ev);ptr.x=(b.x/b.w)*2-1;ptr.y=-(b.y/b.h)*2+1;
  ray.setFromCamera(ptr,camera);const hit=ray.intersectObjects(tiles.flatMap(t=>[t.base,t.lab]),false)[0];
  return hit?hit.object.userData.tile:-1;
}
renderer.domElement.addEventListener('pointermove',ev=>{const h=tileAt(ev);if(nukePick&&h!==hover){if(pickable&&pickable.has(h))nukePreview(nukePick.p,h);else nukePreviewClear();}hover=h;renderer.domElement.style.cursor=hover>=0?'pointer':'';tipShow(hover,ev);});
renderer.domElement.addEventListener('pointerleave',()=>tipShow(-1));
function tipShow(i,ev){
  const tip=$('#tip');if(i<0||!G||ev.pointerType==='touch'){tip.hidden=true;return;}
  const t=T(i),st=S(i);let html=`<b>${t.ico||''} ${t.name}</b>`;
  if(t.type==='city'){const o=st.owner!=null?G.players[st.owner]:null;html+=o?`<div><span class="dot" style="background:${o.color}"></span>${esc(o.name)} · ${LV[st.level]}</div><div>통행료 <b>${fmt(toll(i))}</b>${ownsGroup(st.owner,t.g)?' <em>독점 2배</em>':''}${G.festival===i?' <em>축제 2배</em>':''}</div>`:`<div>땅값 ${fmt(t.price)} · 별장까지 ${fmt(cum(i,0,1))}</div><div>통행료 땅 ${fmt(Math.round(t.price*MULT[0]))} → 호텔 ${fmt(Math.round(t.price*MULT[3]))}</div>`;
    if(o&&st.level<4)html+=`<div>인수 ${fmt(Math.round(invested(i)*1.5))}</div>`;if(st.level>0)html+=`<div>🧲 끌어오기 ${range(st.level)}칸 · ☢️ 사정거리 ${range(st.level)}칸</div>`;}
  else if(t.type==='tour'){const o=st.owner!=null?G.players[st.owner]:null;html+=o?`<div><span class="dot" style="background:${o.color}"></span>${esc(o.name)} · 통행료 <b>${fmt(toll(i))}</b></div>`:`<div>관광지 ${fmt(t.price)} · 보유 수에 따라 110/220/440만</div>`;}
  else html+=`<div>${SUBS[t.type]||''}</div>`;
  tip.innerHTML=html;tip.hidden=false;
  const b=stage.getBoundingClientRect();let x=ev.clientX-b.left+14,y=ev.clientY-b.top+14;if(x+tip.offsetWidth>b.width-8)x=ev.clientX-b.left-tip.offsetWidth-14;if(y+tip.offsetHeight>b.height-8)y=ev.clientY-b.top-tip.offsetHeight-14;tip.style.left=x+'px';tip.style.top=y+'px';
}
renderer.domElement.addEventListener('pointerdown',ev=>{down=[ev.clientX,ev.clientY];});
renderer.domElement.addEventListener('pointerup',ev=>{if(!down)return;const dx=ev.clientX-down[0],dy=ev.clientY-down[1];down=null;if(dx*dx+dy*dy>36)return;const i=tileAt(ev);if(i>=0)onTileClick(i);});
function fitCamera(){
  const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  useBloom=w>=600&&!matchMedia('(pointer:coarse)').matches;composer.setSize(useBloom?w:1,useBloom?h:1); // unused bloom targets would still hold ~10 full-screen buffers
  const vf=THREE.MathUtils.degToRad(camera.fov),hf=2*Math.atan(Math.tan(vf/2)*camera.aspect);
  const need=Math.max(5.9/Math.tan(hf/2),6.1/Math.tan(vf/2));
  const dir=CAM_HOME.clone().sub(TARGET).normalize();homePos=TARGET.clone().addScaledVector(dir,THREE.MathUtils.clamp(need,controls.minDistance,controls.maxDistance));
  if(camMode!=='follow'){camera.position.copy(homePos);}
}
function homeCamera(){camMode=camMode==='follow'?'overview':'follow';freeUntil=0;focusOverride=null;$('#btn-cam').innerHTML=`<svg class="ic"><use href="#i-${camMode==='follow'?'cam':'map'}"/></svg>`;$('#btn-cam').title=camMode==='follow'?'카메라: 연출 켬 — 내 말이 움직일 때 뒤에서 따라가고, 감정·위기 때 다가갑니다 (끄려면 클릭)':'카메라: 고정 — 항상 위에서 맵 전체 (연출을 켜려면 클릭)';toast(camMode==='follow'?'연출 카메라 켬':'카메라 고정 (맵 전체)','info',2500);}
new ResizeObserver(()=>fitCamera()).observe(stage);
$('#btn-cam').addEventListener('click',homeCamera);
/* render loop */
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;
  for(let k=tweens.length-1;k>=0;k--){const tw=tweens[k];let u=(now-tw.t0)/tw.ms;if(u>=1){tw.obj.copy(tw.to);tweens.splice(k,1);tw.res();continue;}
    const e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;tw.obj.lerpVectors(tw.from,tw.to,e);tw.obj.y+=Math.sin(u*Math.PI)*tw.arc;}
  let sx=0,sy=0;
  for(let k=effects.length-1;k>=0;k--){const ef=effects[k];const u=(now-ef.t0)/ef.ms;
    if(ef.type==='shake'){const a=ef.amount*(1-u);sx+=(Math.random()-.5)*a;sy+=(Math.random()-.5)*a;}
    else if(u>=0)ef.fn(Math.min(1,u));
    if(u>=1){effects.splice(k,1);if(ef.done)ef.done();}}
  camTick(dt);controls.update();envTick(now,dt);markerTick(now);
  const tms=now/1000;
  tiles.forEach((tl,i)=>{
    const pk=pickable&&pickable.has(i),hc=hintTiles&&hintTiles.get(i),th=threatTiles.get(i);
    if(pk){const own=G&&S(i).owner!=null?G.players[S(i).owner].color:0xffcf3f; // keep who-owns-what readable while choosing
      tl.rim.visible=true;tl.rim.material.color.set(own);tl.rim.material.emissive.set(own).multiplyScalar(.5+.4*Math.sin(tms*6));}
    else if(hc){tl.rim.visible=true;tl.rim.material.color.set(hc);tl.rim.material.emissive.set(hc).multiplyScalar(.45+.35*Math.sin(tms*5));}
    else if(th){tl.rim.visible=true;const on=Math.sin(tms*7)>0;tl.rim.material.color.set(on?0xff2a2a:0xffffff);tl.rim.material.emissive.set(on?0xff2a2a:0xffffff).multiplyScalar(.7);}
    const fm=tl.frame.userData.mat;
    if(pk){tl.frame.visible=true;const c=tl.frameCol||0xffcf3f;fm.color.set(c);fm.emissive.set(c).multiplyScalar(.55+.45*Math.sin(tms*6));tl.frameHot=true;}
    else if(tl.frameHot){tl.frameHot=false;tl.frame.visible=!!tl.frameCol;if(tl.frameCol){fm.color.set(tl.frameCol);fm.emissive.set(tl.frameCol).multiplyScalar(.3);}}
    tl.lab.material.color.setScalar(pickable&&pickDim&&!pk?.38:1);
    if(i===hover)tl.base.position.y=0.16;else tl.base.position.y=0.11;
  });
  tokens.forEach(tk=>{if(tk.glow.visible)tk.glow.scale.setScalar(1+.15*Math.sin(tms*5));});
  tokenTick(now);timerTick(now);hubTick(now,dt);pickMarkTick(now);pullTick(now);
  if(nukeMarks.length){const k=.5+.35*Math.sin(now/120);nukeMarks.forEach(m=>{if(m.userData.pulse){if(m.isSprite)m.position.y+=Math.sin(now/200)*.002;else m.material.opacity=k;}});}
  meterTick(dt);
  if(sx||sy){camera.position.x+=sx;camera.position.y+=sy;}
  if(useBloom)composer.render();else renderer.render(scene,camera);
}
let pickDim=false;const pickMarks=[];
function clearPickMarks(){pickMarks.forEach(m=>{scene.remove(m);m.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}});});pickMarks.length=0;}
function mineBadge(p,i){
  const cv=document.createElement('canvas');cv.width=256;cv.height=112;const g=cv.getContext('2d');
  g.fillStyle=p.color;g.beginPath();g.roundRect(6,6,244,100,26);g.fill();g.lineWidth=6;g.strokeStyle='#fff';g.stroke();
  g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font='600 40px "Noto Sans KR","Malgun Gothic",sans-serif';
  const st=S(i),lv=T(i).type==='tour'?'관광지':st.level===4?'랜드마크':st.level?'건물 '+st.level:'땅';
  const tv=T(i).price?toll(i):0;g.fillText('내 땅 · '+lv,128,tv?40:56);if(tv){g.font='500 30px "Noto Sans KR","Malgun Gothic",sans-serif';g.fillText('통행료 '+fmt(tv),128,82);}
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false}));sp.scale.set(1.25,.55,1);sp.renderOrder=20;return sp;
}
/* set: pickable tiles; p: the human choosing — their own tiles get a light beam and a name badge; dim: grey out everything else */
function setPickable(set,p,dim){
  pickable=set;pickDim=!!(set&&dim);clearPickMarks();
  if(!set){sync_forceRims();return;}
  if(!p)return;
  owned(p).forEach(i=>{const r=rect(i),g=new THREE.Group();g.position.set(r.x,0,r.z);
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,2.6,24,1,true),new THREE.MeshBasicMaterial({color:p.color,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    beam.position.y=1.5;beam.userData.beam=true;g.add(beam);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.42,.55,32),new THREE.MeshBasicMaterial({color:p.color,transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.27;ring.userData.ring=true;g.add(ring);
    const b=mineBadge(p,i);b.position.y=2.35;b.userData.badge=true;g.add(b);
    g.userData.phase=i;scene.add(g);pickMarks.push(g);});
}
function pickMarkTick(now){if(!pickMarks.length)return;const t=now/1000;
  pickMarks.forEach(g=>{const ph=g.userData.phase;g.children.forEach(o=>{
    if(o.userData.beam)o.material.opacity=.16+.1*Math.sin(t*4+ph);
    else if(o.userData.ring){const k=1+.25*((t*1.2+ph*.1)%1);o.scale.set(k,k,1);o.material.opacity=.9*(1-((t*1.2+ph*.1)%1));}
    else if(o.userData.badge)o.position.y=2.35+Math.sin(t*2.2+ph)*.08;});});}
function sync_forceRims(){tiles.forEach(t=>t.key=null);sync();}
